'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Copy,
  Download,
  Maximize2,
  Monitor,
  Smartphone,
  PanelRightClose,
  FileCode,
  Minimize2,
  FolderOpen,
  File,
  ChevronRight,
  ChevronDown,
  Check,
} from 'lucide-react';

import { useChatContext, SandpackFiles } from '@/shared/contexts/chat';
import { Button } from '@/shared/components/ui/button';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import { cn } from '@/shared/lib/utils';
import { PreviewPanel, OutputMode } from './preview';

type ViewMode = 'desktop' | 'mobile';
type ActiveTab = 'preview' | 'code';

// ============================================
// 文件树组件
// ============================================
interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
}

function buildFileTree(files: SandpackFiles): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  Object.keys(files).forEach((filePath) => {
    const parts = filePath.split('/').filter(Boolean);
    let current = root;
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      let node = current.find((n) => n.name === part);
      if (!node) {
        node = {
          name: part,
          path: '/' + parts.slice(0, index + 1).join('/'),
          type: isFile ? 'file' : 'directory',
          children: isFile ? undefined : [],
        };
        current.push(node);
      }
      if (!isFile && node.children) {
        current = node.children;
      }
    });
  });
  return root;
}

function FileTree({
  nodes,
  selectedFile,
  onSelectFile,
  level = 0,
}: {
  nodes: FileTreeNode[];
  selectedFile: string;
  onSelectFile: (path: string) => void;
  level?: number;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['/app', '/components']));

  const toggleExpand = (path: string) => {
    const next = new Set(expanded);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    setExpanded(next);
  };

  return (
    <div className="text-sm">
      {nodes.map((node) => (
        <div key={node.path}>
          <button
            className={cn(
              'flex items-center gap-1 w-full px-2 py-1 hover:bg-muted/50 rounded text-left transition-colors',
              selectedFile === node.path && 'bg-primary/10 text-primary font-medium'
            )}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={() => {
              if (node.type === 'directory') {
                toggleExpand(node.path);
              } else {
                onSelectFile(node.path);
              }
            }}
          >
            {node.type === 'directory' ? (
              <>
                {expanded.has(node.path) ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
                <FolderOpen className="h-4 w-4 text-amber-500 fill-amber-500/20" />
              </>
            ) : (
              <>
                <span className="w-3" />
                <File className="h-4 w-4 text-blue-500" />
              </>
            )}
            <span className="truncate">{node.name}</span>
          </button>
          {node.type === 'directory' && expanded.has(node.path) && node.children && (
            <FileTree
              nodes={node.children}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              level={level + 1}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// 主组件: ResultPanel
// ============================================
export function ResultPanel({
  className,
  onClose,
}: {
  className?: string;
  onClose?: () => void;
}) {
  const t = useTranslations('ai.chat.resultPanel');
  const { resultCode, resultFileName, resultFiles, outputMode } = useChatContext();
  const [activeTab, setActiveTab] = useState<ActiveTab>('preview');
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // 合并文件数据
  const files: SandpackFiles = useMemo(() => {
    return Object.keys(resultFiles).length > 0
      ? resultFiles
      : resultCode
        ? { [`/${resultFileName || 'index.html'}`]: resultCode }
        : {};
  }, [resultFiles, resultCode, resultFileName]);

  const hasFiles = Object.keys(files).length > 0;
  const fileTree = useMemo(() => buildFileTree(files), [files]);

  // 自动选择第一个文件
  React.useEffect(() => {
    if (hasFiles && !selectedFile) {
      const firstFile = Object.keys(files)[0];
      setSelectedFile(firstFile);
    }
  }, [hasFiles, files, selectedFile]);

  const getFileContent = useCallback((path: string): string => {
    const file = files[path];
    if (!file) return '';
    return typeof file === 'string' ? file : (file.code || '');
  }, [files]);

  // 复制代码
  const handleCopy = async () => {
    const content = selectedFile ? getFileContent(selectedFile) : '';
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 下载所有代码
  const handleDownload = () => {
    const allCode = Object.entries(files)
      .map(([path, content]) => {
        const code = typeof content === 'string' ? content : content.code;
        return `// ${path}\n${code}`;
      })
      .join('\n\n');
    const blob = new Blob([allCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={cn(
        'flex h-full flex-col border-l bg-background',
        isFullscreen && 'fixed inset-0 z-50 w-full border-0',
        !isFullscreen && className
      )}
    >
      {/* 顶部 Tabs */}
      <div className="flex items-center justify-between border-b px-2 py-1">
        <div className="flex items-center gap-2">
          {onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <PanelRightClose className="h-4 w-4" />
            </Button>
          )}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as ActiveTab)}
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

      {/* 工具栏 */}
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
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={t('fullscreenTooltip')}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {Object.keys(files).length} {t('files') || 'files'}
            </span>
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
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleDownload}
              title={t('downloadTooltip')}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden flex">
        {hasFiles ? (
          activeTab === 'preview' ? (
            <div className={cn('h-full w-full bg-muted/20', viewMode === 'mobile' && 'flex items-center justify-center bg-muted/50')}>
              <div className={cn('h-full bg-white shadow-lg transition-all duration-300 overflow-hidden', viewMode === 'desktop' ? 'w-full' : 'w-[375px] rounded-lg')}>
                {/* 使用新的隔离预览组件 */}
                <PreviewPanel
                  outputMode={outputMode as OutputMode}
                  code={resultCode}
                  files={Object.fromEntries(
                    Object.entries(files).map(([k, v]) => [k, typeof v === 'string' ? v : v.code || ''])
                  )}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full w-full">
              {/* 文件树 */}
              <div className="w-56 border-r overflow-auto bg-muted/10 shrink-0">
                <div className="p-2.5 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('fileExplorer') || 'Files'}
                </div>
                <FileTree nodes={fileTree} selectedFile={selectedFile} onSelectFile={setSelectedFile} />
              </div>
              {/* 代码查看 */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {selectedFile ? (
                  <>
                    <div className="px-4 py-2 border-b text-xs font-mono text-muted-foreground bg-muted/20 flex items-center gap-2">
                      <File className="h-3.5 w-3.5" />
                      {selectedFile}
                    </div>
                    <pre className="p-4 text-sm font-mono overflow-auto flex-1 scrollbar-thin">
                      <code className="block leading-relaxed">{getFileContent(selectedFile)}</code>
                    </pre>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                    {t('selectFile') || 'Select a file to view'}
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center opacity-50">
              <FileCode className="h-12 w-12 mx-auto mb-4" />
              <p className="text-sm">{activeTab === 'preview' ? t('emptyPreview') : t('emptyCode')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
