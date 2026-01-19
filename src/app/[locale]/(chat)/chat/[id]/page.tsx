'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { UIMessage } from 'ai';
import { toast } from 'sonner';

import { ChatBox } from '@/shared/blocks/chat/box';
import { LoadingState } from '@/shared/components/ai-elements/loading-state';
import { Chat } from '@/shared/types/chat';
import { ChatHeader } from '@/shared/blocks/chat/header';
import { MessageSkeleton } from '@/shared/components/ai-elements/loading-state';
import { useAppContext } from '@/shared/contexts/app';

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, setIsShowSignModal } = useAppContext();

  const [initialChat, setInitialChat] = useState<Chat | null>(null);
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const fetchChat = async (chatId: string) => {
    try {
      const resp = await fetch('/api/chat/info', {
        method: 'POST',
        body: JSON.stringify({ chatId }),
      });
      if (!resp.ok) {
        throw new Error(`request failed with status: ${resp.status}`);
      }
      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message);
      }

      setInitialChat({
        id: data.id,
        title: data.title,
        createdAt: data.createdAt,
        model: data.model,
        provider: data.provider,
        parts: data.parts ? JSON.parse(data.parts) : [],
        metadata: data.metadata ? JSON.parse(data.metadata) : undefined,
        content: data.content ? JSON.parse(data.content) : undefined,
      } as Chat);

      if (data.id) {
        fetchMessages(data.id);
      }
    } catch (e: any) {
      console.log('fetch chat failed:', e);
      setIsLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const resp = await fetch('/api/chat/messages', {
        method: 'POST',
        body: JSON.stringify({ chatId, page: 1, limit: 100 }),
      });
      if (!resp.ok) {
        throw new Error(`request failed with status: ${resp.status}`);
      }
      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message);
      }

      const { list } = data;
      setInitialMessages(
        list.map((item: any) => ({
          id: item.id,
          role: item.role,
          parts: item.parts ? JSON.parse(item.parts) : [],
          metadata: item.metadata ? JSON.parse(item.metadata) : undefined,
        })) as UIMessage[]
      );
      setIsLoading(false);
    } catch (e: any) {
      console.log('fetch messages failed:', e);
      setIsLoading(false);
    }
  };

  // Auto-create chat from Hero form parameters
  useEffect(() => {
    const inputType = searchParams.get('inputType');
    const outputFormat = searchParams.get('outputFormat');
    const content = searchParams.get('content') || '';
    
    // If we have URL parameters, this is a new chat from Hero form
    if (inputType && outputFormat && params.id === 'new') {
      console.log('[ChatPage] Auto-creating chat from Hero params:', { inputType, outputFormat });
      
      if (!user) {
        console.log('[ChatPage] User not logged in');
        setIsShowSignModal(true);
        toast.error('Please sign in to continue');
        setIsLoading(false);
        return;
      }
      
      setIsCreatingChat(true);
      
      const createChatFromParams = async () => {
        try {
          let finalContent = content;
          let files: any[] = [];

          // Handle image upload
          if (inputType === 'image') {
            const storedImage = sessionStorage.getItem('copyweb_image');
            const storedName = sessionStorage.getItem('copyweb_image_name') || 'upload.png';
            
            if (!storedImage) {
              toast.error('No image found. Please upload an image first.');
              setIsLoading(false);
              return;
            }
            
            console.log('[ChatPage] Processing image upload...');
            
            const response = await fetch(storedImage);
            const blob = await response.blob();
            const file = new File([blob], storedName, { type: blob.type || 'image/png' });
            
            const formData = new FormData();
            formData.append('files', file);
            
            const uploadResponse = await fetch('/api/storage/upload-image', {
              method: 'POST',
              body: formData,
            });
            
            const uploadResult = await uploadResponse.json();
            
            if (uploadResult.code === 0 && uploadResult.data?.urls?.length > 0) {
              const imageUrl = uploadResult.data.urls[0];
              console.log('[ChatPage] Image uploaded:', imageUrl);
              
              files = [{
                type: 'file',
                url: imageUrl,
                mediaType: blob.type || 'image/png',
                filename: storedName
              }];
              
              finalContent = content || 'Analyze this image and convert it to code';
              
              sessionStorage.removeItem('copyweb_image');
              sessionStorage.removeItem('copyweb_image_name');
            } else {
              console.error('[ChatPage] Upload failed:', uploadResult);
              toast.error('Failed to upload image');
              setIsLoading(false);
              return;
            }
          }

          // Build prompt
          const { buildPrompt } = await import('@/config/ai/prompt-builder');
          const promptResult = buildPrompt({
            inputType: inputType as any,
            outputFormat: outputFormat as any,
            userContent: finalContent,
          });

          console.log('[ChatPage] Creating chat...');
          
          // Create chat
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const resp = await fetch('/api/chat/new', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: { text: promptResult.userPrompt, files },
              body: {
                model: 'anthropic/claude-sonnet-4.5',
                systemPrompt: promptResult.systemPrompt,
                isHeroInit: true,
                inputType: inputType  // Pass inputType for title generation
              }
            }),
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (!resp.ok) {
            throw new Error(`Request failed: ${resp.status}`);
          }
          
          const { code, message, data } = await resp.json();
          
          if (code !== 0) {
            throw new Error(message);
          }

          const { id } = data;
          if (!id) {
            throw new Error('Failed to create chat');
          }

          console.log('[ChatPage] Chat created, redirecting to:', id);
          
          // Replace URL without parameters
          router.replace(`/chat/${id}`);
          
          // Fetch the newly created chat
          await fetchChat(id);
          
        } catch (e: any) {
          console.error('[ChatPage] Auto-create error:', e);
          let message = 'Failed to create chat';
          
          if (e.name === 'AbortError') {
            message = 'Request timed out. Please try again.';
          } else if (e instanceof Error) {
            message = e.message;
          }
          
          toast.error(message);
          setIsLoading(false);
          setIsCreatingChat(false);
        }
      };
      
      createChatFromParams();
    } else if (params.id && params.id !== 'new') {
      // Normal chat loading
      fetchChat(params.id as string);
    } else {
      setIsLoading(false);
    }
  }, [params.id, searchParams, user]);

  // Always render 3-column layout immediately - optimistic UI
  // Show the chat interface right away, even while loading
  if (initialChat && initialMessages && !isLoading) {
    return <ChatBox initialChat={initialChat} initialMessages={initialMessages} />;
  }

  // Optimistic loading state - show chat interface immediately with skeleton
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Chat Area - Fixed 30% width */}
      <div className="flex h-full w-[30%] flex-col overflow-hidden border-r bg-background">
        <ChatHeader />
        {/* Messages area - show optimistic skeleton */}
        <div className="flex-1 overflow-y-auto p-4">
          <MessageSkeleton />
        </div>
        {/* Input area - always visible */}
        <div className="border-t p-4">
          <div className="flex items-center gap-2 rounded-lg border bg-background px-4 py-2">
            <input
              type="text"
              placeholder="You can ask me anything"
              className="flex-1 bg-transparent text-sm outline-none"
              disabled
            />
            <button className="rounded-full bg-primary p-2 text-primary-foreground">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Result Panel - Fixed 70% width */}
      <div className="flex h-full w-[70%] flex-col border-l bg-background">
        <div className="flex items-center justify-between border-b px-2 py-1 h-10">
          <div className="flex items-center gap-2">
            <button className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-muted/10">
          <LoadingState phase="preparing" size="lg" />
        </div>
      </div>
    </div>
  );
}
