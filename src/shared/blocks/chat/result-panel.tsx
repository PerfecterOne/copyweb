'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Copy,
  Download,
  Maximize2,
  Monitor,
  Smartphone,
  PanelRightClose,
  FileCode,
} from 'lucide-react';

import { useChatContext } from '@/shared/contexts/chat';
import { Button } from '@/shared/components/ui/button';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import { cn } from '@/shared/lib/utils';

type ViewMode = 'desktop' | 'mobile';

export function ResultPanel({
  className,
  onClose,
}: {
  className?: string;
  onClose?: () => void;
}) {
  const t = useTranslations('ai.chat.resultPanel');
  const { resultCode, resultFileName } = useChatContext();
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(resultCode);
  };

  const handleDownload = () => {
    const blob = new Blob([resultCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultFileName || 'code.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const fileName = resultFileName || 'code.html';

  return (
    <div
      className={cn(
        'flex h-full flex-col border-l bg-background',
        isFullscreen && 'fixed inset-0 z-50 w-full border-0',
        !isFullscreen && className
      )}
    >
      {/* Header with Tabs */}
      <div className="flex items-center justify-between border-b px-2 py-1">
        <div className="flex items-center gap-2">
          {onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <PanelRightClose className="h-4 w-4" />
            </Button>
          )}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'preview' | 'code')}
          >
            <TabsList className="h-8">
              <TabsTrigger value="preview" className="text-xs px-3 py-1 gap-1">
                <Monitor className="h-3 w-3" />
                {t('preview')}
              </TabsTrigger>
              <TabsTrigger value="code" className="text-xs px-3 py-1 gap-1">
                <FileCode className="h-3 w-3" />
                {t('code')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Toolbar - different for each tab */}
      <div className="flex items-center justify-between border-b px-3 py-1.5 bg-muted/30">
        {activeTab === 'preview' ? (
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === 'desktop' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode('desktop')}
              title={t('desktopTooltip')}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'mobile' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode('mobile')}
              title={t('mobileTooltip')}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={toggleFullscreen}
              title={t('fullscreenTooltip')}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{fileName}</span>
          </div>
        )}

        {activeTab === 'code' && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleCopy}
              title={t('copyTooltip')}
              disabled={!resultCode}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleDownload}
              title={t('downloadTooltip')}
              disabled={!resultCode}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'preview' ? (
          <div
            className={cn(
              'h-full w-full flex items-center justify-center bg-muted/20 p-4',
              viewMode === 'mobile' && 'bg-muted/50'
            )}
          >
            {resultCode ? (
              <iframe
                srcDoc={resultCode}
                title="Preview"
                className={cn(
                  'h-full border-0 bg-white shadow-lg transition-all duration-300',
                  viewMode === 'desktop' ? 'w-full' : 'w-[375px] rounded-lg'
                )}
                sandbox="allow-scripts"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{t('emptyPreview')}</p>
            )}
          </div>
        ) : (
          <div className="h-full overflow-auto">
            {resultCode ? (
              <pre className="p-4 text-sm overflow-x-auto">
                <code>{resultCode}</code>
              </pre>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">{t('emptyCode')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

