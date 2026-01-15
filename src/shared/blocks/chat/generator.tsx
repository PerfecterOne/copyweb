'use client';

import { useEffect, useState } from 'react';
import { UIMessage, UseChatHelpers } from '@ai-sdk/react';
import { useLocale, useTranslations } from 'next-intl';
import { PanelRight } from 'lucide-react';
import { toast } from 'sonner';

import { useRouter } from '@/core/i18n/navigation';
import { LocaleSelector } from '@/shared/blocks/common';
import { PromptInputMessage } from '@/shared/components/ai-elements/prompt-input';
import { SidebarTrigger } from '@/shared/components/ui/sidebar';
import { Button } from '@/shared/components/ui/button';
import { useAppContext } from '@/shared/contexts/app';
import { useChatContext } from '@/shared/contexts/chat';
import { cn } from '@/shared/lib/utils';

import { ChatInput } from './input';
import { ResultPanel } from './result-panel';

export function ChatGenerator() {
  const router = useRouter();
  const locale = useLocale();

  const t = useTranslations('ai.chat.generator');

  const { user, setIsShowSignModal } = useAppContext();
  const { chats, setChats, setChat, resultCode, setResultCode, setResultFileName } = useChatContext();

  const [status, setStatus] = useState<UseChatHelpers<UIMessage>['status']>();
  const [error, setError] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(true); // Default to show panel

  // TEST: Mock AI response for testing preview flow
  const handleTestPreview = () => {
    const mockCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hero Form Component</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #f5f5f5; padding: 2rem; }
    .container { max-width: 48rem; margin: 0 auto; }
    .tabs { display: flex; gap: 0.5rem; padding: 0.5rem; background: rgba(0,0,0,0.05); border-radius: 1rem; margin-bottom: 1rem; }
    .tab { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border: none; background: transparent; border-radius: 0.75rem; cursor: pointer; font-size: 0.875rem; }
    .tab.active { background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .input-area { background: white; border: 2px solid #e5e5e5; border-radius: 1.5rem; padding: 1.5rem; min-height: 200px; }
    .input-area textarea { width: 100%; min-height: 160px; border: none; resize: none; font-size: 1rem; }
    .input-area textarea:focus { outline: none; }
    .footer { display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid #e5e5e5; margin-top: 1rem; }
    .submit-btn { width: 40px; height: 40px; border-radius: 50%; background: #c4a574; border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="tabs">
      <button class="tab">📷 Image</button>
      <button class="tab">🌐 Website</button>
      <button class="tab">🎨 Figma</button>
      <button class="tab active">💬 Prompt</button>
    </div>
    <div class="input-area">
      <textarea placeholder="Describe what you want to create..."></textarea>
      <div class="footer">
        <span style="color: #888; font-size: 0.875rem;">HTML + CSS</span>
        <div style="display: flex; align-items: center; gap: 1rem;">
          <span style="color: #888; font-size: 0.875rem;">0 credits left</span>
          <button class="submit-btn">→</button>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
    setResultCode(mockCode);
    setResultFileName('hero-form.html');
    setShowPanel(true);
    toast.success('Mock code loaded for preview!');
  };


  const fetchNewChat = async (
    msg: PromptInputMessage,
    body: Record<string, any>
  ) => {
    setStatus('submitted');
    setError(null);

    try {
      const resp: Response = await fetch('/api/chat/new', {
        method: 'POST',
        body: JSON.stringify({ message: msg, body: body }),
      });
      if (!resp.ok) {
        throw new Error(`request failed with status: ${resp.status}`);
      }
      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message);
      }

      const { id } = data;
      if (!id) {
        throw new Error('failed to create chat');
      }

      setChats([data, ...chats]);

      const path = `/chat/${id}`;
      router.push(path, {
        locale,
      });
      // setStatus(undefined);
      // setError(null);
    } catch (e: any) {
      const message =
        e instanceof Error ? e.message : 'request failed, please try again';
      setStatus('error');
      setError(message);
      toast.error(message);
      throw e instanceof Error ? e : new Error(message);
    }
  };

  const handleSubmit = async (
    message: PromptInputMessage,
    body: Record<string, any>
  ) => {
    // check user sign
    if (!user) {
      setIsShowSignModal(true);
      return;
    }

    // check user input
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) {
      return;
    }

    if (!body.model) {
      toast.error('please select a model');
      return;
    }

    await fetchNewChat(message, body);
  };

  useEffect(() => {
    setChat(null);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Chat Area */}
      <div
        className={cn(
          'flex h-full flex-1 flex-col overflow-hidden transition-all duration-300',
          showPanel && 'lg:w-[30%]'
        )}
      >
        <header className="bg-background sticky top-0 z-10 flex w-full items-center gap-2 px-4 py-3">
          <SidebarTrigger className="size-7" />
          <div className="flex-1"></div>
          {!showPanel && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPanel(true)}
            >
              <PanelRight className="h-4 w-4" />
            </Button>
          )}
        </header>
        <div className="mx-auto -mt-16 flex h-screen w-full flex-1 flex-col items-center justify-center px-4 pb-6 md:max-w-2xl">
          <h2 className="mb-4 text-center text-3xl font-bold">{t('title')}</h2>
          {/* TEST BUTTON - Remove after testing */}
          <Button
            variant="outline"
            size="sm"
            className="mb-4"
            onClick={handleTestPreview}
          >
            🧪 Test Preview (Mock AI Response)
          </Button>
          <ChatInput
            error={error}
            handleSubmit={handleSubmit}
            onInputChange={() => {
              if (status === 'error') {
                setStatus(undefined);
              }
              if (error) {
                setError(null);
              }
            }}
            status={status}
          />
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
