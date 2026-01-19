'use client';

import { useEffect, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import { PanelRight } from 'lucide-react';

import { useChatContext } from '@/shared/contexts/chat';
import { Chat } from '@/shared/types/chat';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

import { FollowUp } from './follow-up';
import { ChatHeader } from './header';
import { ChatMessages } from './messages';
import { ResultPanel } from './result-panel';

export function ChatBox({
  initialChat,
  initialMessages,
}: {
  initialChat?: Chat;
  initialMessages?: UIMessage[];
}) {
  const { chat, setChat } = useChatContext();
  const [hasAutoSent, setHasAutoSent] = useState(false); // Track if auto-send has been triggered

  // create chat instance
  const chatInstance = useChat({
    id: initialChat?.id,
    messages: initialMessages,

    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest({ messages, id, body }) {
        const extraBody = body ?? {};
        console.log('[ChatBox] prepareSendMessagesRequest called:', {
          messagesCount: messages.length,
          id,
          body: extraBody,
        });
        return {
          body: {
            chatId: id,
            message: messages[messages.length - 1],
            ...extraBody,
          },
        };
      },
    }),

    onResponse: (response) => {
      console.log('[ChatBox] onResponse:', response.status, response.statusText);
    },

    onFinish: (message) => {
      console.log('[ChatBox] onFinish:', message);
    },

    onError: (error) => {
      console.error('[ChatBox] onError:', error);
    },
  });

  const { sendMessage, messages: chatMessages, status } = chatInstance;

  // Debug logging for chat instance state
  useEffect(() => {
    console.log('[ChatBox] Chat instance state:', {
      messagesCount: chatMessages.length,
      status,
      hasInitialMessages: !!initialMessages,
      initialMessagesLength: initialMessages?.length,
    });
  }, [chatMessages, status, initialMessages]);

  useEffect(() => {
    if (initialChat) {
      setChat(initialChat);
    }
  }, [initialChat, setChat]);

  // Auto-send first message if this is a hero-initialized chat
  useEffect(() => {
    console.log('[ChatBox] Auto-send check:', {
      hasInitialChat: !!initialChat,
      hasInitialMessages: !!initialMessages,
      messagesLength: initialMessages?.length,
      hasAutoSent,
      isHeroInit: initialChat?.metadata?.isHeroInit,
      hasContent: !!initialChat?.content,
    });

    if (
      initialChat &&
      initialMessages &&
      initialMessages.length === 0 &&
      !hasAutoSent &&
      initialChat.metadata?.isHeroInit &&
      initialChat.content
    ) {
      setHasAutoSent(true);
      
      console.log('[ChatBox] Auto-sending first message...');
      console.log('[ChatBox] Chat content:', initialChat.content);
      console.log('[ChatBox] Chat metadata:', initialChat.metadata);
      
      // Extract message content and files from chat metadata
      const { text, files } = initialChat.content;
      const { model, systemPrompt } = initialChat.metadata;
      
      console.log('[ChatBox] Extracted:', { text: text?.substring(0, 100), filesCount: files?.length, model, hasSystemPrompt: !!systemPrompt });
      
      try {
        // Auto-send the message using sendMessage
        const messageToSend = {
          text: text || 'Generate code',
          files: files || [],
        };
        
        const options = {
          body: {
            model,
            systemPrompt,
            isHeroInit: true, // Mark this as hero-init message to hide in UI
          },
        };
        
        console.log('[ChatBox] Calling sendMessage with:', { messageToSend, options });
        sendMessage(messageToSend, options);
        console.log('[ChatBox] sendMessage called successfully');
      } catch (error) {
        console.error('[ChatBox] Error calling sendMessage:', error);
      }
    }
  }, [initialChat, initialMessages, hasAutoSent, sendMessage]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Chat Area - Fixed 30% width */}
      <div className="flex h-full w-[30%] flex-col overflow-hidden">
        <ChatHeader>
          {/* Panel always visible in chat pages - no toggle button */}
        </ChatHeader>
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full px-4 py-6 md:max-w-3xl">
            <ChatMessages chatInstance={chatInstance} />
          </div>
        </div>
        <div className="mx-auto w-full px-4 pb-4 md:max-w-3xl">
          <FollowUp chatInstance={chatInstance} />
        </div>
      </div>

      {/* Result Panel - Fixed 70% width, always visible */}
      <ResultPanel
        className="flex w-[70%]"
        onClose={() => {}} // No-op: panel cannot be closed in chat pages
        chatStatus={status}
        isStreaming={status === 'streaming'}
      />
    </div>
  );
}
