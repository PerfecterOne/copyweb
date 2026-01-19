import { generateId } from 'ai';

import { respData, respErr } from '@/shared/lib/resp';
import { ChatStatus, createChat, NewChat } from '@/shared/models/chat';
import { getUserInfo } from '@/shared/models/user';

export async function POST(req: Request) {
  const startTime = Date.now();
  console.log('[API /chat/new] Request received at', new Date().toISOString());
  
  try {
    console.log('[API /chat/new] Parsing request body...');
    const { message, body } = await req.json();
    console.log('[API /chat/new] Request body parsed:', {
      hasMessage: !!message,
      hasText: !!message?.text,
      textLength: message?.text?.length,
      hasBody: !!body,
      model: body?.model,
      hasFiles: !!message?.files?.length,
      filesCount: message?.files?.length || 0
    });
    
    if (!message || !message.text) {
      console.error('[API /chat/new] Validation failed: message is required');
      throw new Error('message is required');
    }
    if (!body || !body.model) {
      console.error('[API /chat/new] Validation failed: model is required');
      throw new Error('please select a model');
    }

    console.log('[API /chat/new] Getting user info...');
    const user = await getUserInfo();
    console.log('[API /chat/new] User info retrieved:', { 
      userId: user?.id, 
      hasUser: !!user,
      userEmail: user?.email 
    });
    
    if (!user) {
      console.error('[API /chat/new] No user found');
      throw new Error('no auth, please sign in');
    }

    // todo: check user credits

    // todo: get provider from settings
    const provider = 'openrouter';

    // Generate title based on input type
    let title = message.text.substring(0, 100);
    
    // If this is from Hero form, generate a clean title based on input type
    if (body.isHeroInit && body.inputType) {
      const inputType = body.inputType;
      const titleMap: Record<string, string> = {
        'image': 'Image Design Analysis',
        'website': 'Website Design Analysis',
        'figma': 'Figma Design Analysis',
        'prompt': 'Prompt Design Analysis'
      };
      title = titleMap[inputType] || 'Design Analysis';
      console.log('[API /chat/new] Generated title from inputType:', inputType, '→', title);
    }

    const chatId = generateId().toLowerCase();
    const currentTime = new Date();

    console.log('[API /chat/new] Preparing chat object:', { 
      chatId, 
      userId: user.id, 
      model: body.model,
      provider,
      titleLength: title.length
    });

    const parts = [
      {
        type: 'text',
        text: message.text,
      },
    ];

    const chat: NewChat = {
      id: chatId,
      userId: user.id,
      status: ChatStatus.CREATED,
      createdAt: currentTime,
      updatedAt: currentTime,
      model: body.model,
      provider: provider,
      title: title,
      parts: '',
      // parts: JSON.stringify(parts),
      metadata: JSON.stringify(body),
      content: JSON.stringify(message),
    };

    console.log('[API /chat/new] Calling createChat...');
    await createChat(chat);
    
    const duration = Date.now() - startTime;
    console.log('[API /chat/new] Chat created successfully in', duration, 'ms');
    console.log('[API /chat/new] Returning response with chat ID:', chatId);

    return respData(chat);
  } catch (e: any) {
    const duration = Date.now() - startTime;
    console.error('[API /chat/new] Error after', duration, 'ms:', e.message);
    console.error('[API /chat/new] Error stack:', e.stack);
    console.error('[API /chat/new] Full error object:', e);
    return respErr(`new chat failed: ${e.message}`);
  }
}
