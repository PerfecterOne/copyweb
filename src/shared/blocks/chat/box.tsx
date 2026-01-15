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
  const { chat, setChat, resultCode } = useChatContext();
  const [showPanel, setShowPanel] = useState(false);

  // create chat instance
  const chatInstance = useChat({
    id: initialChat?.id,
    messages: initialMessages,

    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest({ messages, id, body }) {
        const extraBody = body ?? {};
        return {
          body: {
            chatId: id,
            message: messages[messages.length - 1],
            ...extraBody,
          },
        };
      },
    }),
  });

  useEffect(() => {
    if (initialChat) {
      setChat(initialChat);
    }
  }, [initialChat]);

  // Auto-show panel when result code is available
  useEffect(() => {
    if (resultCode) {
      setShowPanel(true);
    }
  }, [resultCode]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Chat Area */}
      <div
        className={cn(
          'flex h-full flex-1 flex-col overflow-hidden transition-all duration-300',
          showPanel && 'lg:w-[30%]'
        )}
      >
        <ChatHeader>
          {!showPanel && resultCode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPanel(true)}
            >
              <PanelRight className="h-4 w-4" />
            </Button>
          )}
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

      {/* Result Panel */}
      {showPanel && (
        <ResultPanel
          className="hidden w-[70%] lg:flex"
          onClose={() => setShowPanel(false)}
        />
      )}
    </div>
  );
}
