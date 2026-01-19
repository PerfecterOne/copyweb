import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import {
  convertToModelMessages,
  createIdGenerator,
  generateId,
  stepCountIs,
  streamText,
  TextUIPart,
  tool,
  UIMessage,
  validateUIMessages,
} from 'ai';
import { z } from 'zod';

import { findChatById } from '@/shared/models/chat';
import {
  ChatMessageStatus,
  createChatMessage,
  getChatMessages,
  NewChatMessage,
} from '@/shared/models/chat_message';
import { getAllConfigs } from '@/shared/models/config';
import { consumeCredits } from '@/shared/models/credit';
import { getUserInfo } from '@/shared/models/user';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('[Chat API] Received request body:', JSON.stringify(body, null, 2));
    
    const {
      chatId,
      message,
      model,
      webSearch,
      reasoning,
      isHeroInit,
    }: {
      chatId: string;
      message: UIMessage;
      model: string;
      webSearch: boolean;
      reasoning?: boolean;
      isHeroInit?: boolean;
    } = body;

    console.log('[Chat API] Parsed params:', { chatId, model, webSearch, reasoning, isHeroInit, hasMessage: !!message });

    if (!chatId || !model) {
      console.error('[Chat API] Missing required params:', { chatId, model });
      throw new Error('invalid params');
    }

    if (!message || !message.parts || message.parts.length === 0) {
      console.error('[Chat API] Invalid message:', message);
      throw new Error('invalid message');
    }

    // check user sign
    const user = await getUserInfo();
    if (!user) {
      throw new Error('no auth, please sign in');
    }

    // check chat
    const chat = await findChatById(chatId);
    if (!chat) {
      throw new Error('chat not found');
    }

    if (chat.userId !== user?.id) {
      throw new Error('no permission to access this chat');
    }

    const configs = await getAllConfigs();
    const openrouterApiKey = configs.openrouter_api_key;
    if (!openrouterApiKey) {
      throw new Error('openrouter_api_key is not set');
    }

    const openrouterBaseUrl = configs.openrouter_base_url;

    const currentTime = new Date();

    const metadata = {
      model,
      webSearch,
      reasoning,
      isHeroInit,
    };

    const provider = 'openrouter';

    // save user message to database
    const userMessage: NewChatMessage = {
      id: generateId().toLowerCase(),
      chatId,
      userId: user?.id,
      status: ChatMessageStatus.CREATED,
      createdAt: currentTime,
      updatedAt: currentTime,
      role: 'user',
      parts: JSON.stringify(message.parts),
      metadata: JSON.stringify(metadata),
      model: model,
      provider: provider,
    };
    await createChatMessage(userMessage);

    const openrouter = createOpenRouter({
      apiKey: openrouterApiKey,
      baseURL: openrouterBaseUrl ? openrouterBaseUrl : undefined,
    });

    // load previous messages from database
    const previousMessages = await getChatMessages({
      chatId,
      status: ChatMessageStatus.CREATED,
      page: 1,
      limit: 10,
    });

    let validatedMessages: UIMessage[] = [];
    if (previousMessages.length > 0) {
      validatedMessages = previousMessages.reverse().map((message) => ({
        id: message.id,
        role: message.role,
        parts: message.parts ? JSON.parse(message.parts) : [],
        metadata: message.metadata ? JSON.parse(message.metadata) : undefined,
      })) as UIMessage[];
    }

    // Inject system prompt from metadata if available
    const systemPrompt = chat.metadata ? JSON.parse(chat.metadata).systemPrompt : undefined;
    const modelMessages = convertToModelMessages(validatedMessages);
    
    if (systemPrompt) {
      modelMessages.unshift({
        role: 'system',
        content: systemPrompt,
      });
    }

    const result = streamText({
      model: openrouter.chat(model),
      messages: modelMessages,
    });

    console.log('[Chat API] Starting stream for chat:', chatId, 'model:', model);

    // send sources and reasoning back to the client
    return result.toUIMessageStreamResponse({
      sendSources: true,
      sendReasoning: Boolean(reasoning),
      originalMessages: validatedMessages,
      generateMessageId: createIdGenerator({
        size: 16,
      }),
      onFinish: async ({ messages, usage }) => {
        console.log('[Chat API] Stream finished, saving assistant message');
        console.log('[Chat API] Token usage:', usage);
        
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === 'assistant') {
          const assistantMessage: NewChatMessage = {
            id: generateId().toLowerCase(),
            chatId,
            userId: user?.id,
            status: ChatMessageStatus.CREATED,
            createdAt: currentTime,
            updatedAt: currentTime,
            model: model,
            provider: provider,
            parts: JSON.stringify(lastMessage.parts),
            role: 'assistant',
            metadata: JSON.stringify({
              usage: usage ? {
                promptTokens: usage.promptTokens,
                completionTokens: usage.completionTokens,
                totalTokens: usage.totalTokens,
              } : undefined,
            }),
          };
          await createChatMessage(assistantMessage);
          console.log('[Chat API] Assistant message saved:', assistantMessage.id);
          console.log('[Chat API] Tokens - Prompt:', usage?.promptTokens, 'Completion:', usage?.completionTokens, 'Total:', usage?.totalTokens);
          
          // Deduct credits based on token usage
          if (usage && usage.promptTokens && usage.completionTokens) {
            try {
              // Get token rate configs
              const inputRate = parseFloat(configs.credits_per_1k_input_tokens as string) || 1;
              const outputRate = parseFloat(configs.credits_per_1k_output_tokens as string) || 5;
              
              // Calculate credits to deduct
              // Formula: credits = (inputTokens/1000 * inputRate) + (outputTokens/1000 * outputRate)
              const inputCredits = Math.ceil((usage.promptTokens / 1000) * inputRate);
              const outputCredits = Math.ceil((usage.completionTokens / 1000) * outputRate);
              const totalCredits = inputCredits + outputCredits;
              
              console.log('[Chat API] Credit calculation:', {
                inputTokens: usage.promptTokens,
                outputTokens: usage.completionTokens,
                inputRate,
                outputRate,
                inputCredits,
                outputCredits,
                totalCredits,
              });
              
              // Deduct credits
              if (totalCredits > 0) {
                await consumeCredits({
                  userId: user.id,
                  credits: totalCredits,
                  scene: 'chat',
                  description: `Chat completion - Model: ${model}, Input: ${usage.promptTokens} tokens (${inputCredits} credits), Output: ${usage.completionTokens} tokens (${outputCredits} credits)`,
                  metadata: JSON.stringify({
                    chatId,
                    messageId: assistantMessage.id,
                    model,
                    inputTokens: usage.promptTokens,
                    outputTokens: usage.completionTokens,
                    totalTokens: usage.totalTokens,
                    inputCredits,
                    outputCredits,
                    totalCredits,
                  }),
                });
                console.log('[Chat API] Credits deducted successfully:', totalCredits);
              }
            } catch (error: any) {
              console.error('[Chat API] Failed to deduct credits:', error.message);
              // Don't throw error here to avoid breaking the chat flow
              // The message is already saved, just log the credit deduction failure
            }
          }
        }
      },
    });
  } catch (e: any) {
    console.log('chat failed:', e);
    return new Response(e.message, { status: 500 });
  }
}
