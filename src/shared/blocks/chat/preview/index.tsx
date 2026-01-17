'use client';

import { cn } from '@/shared/lib/utils';
import { HtmlPreview } from './html-preview';
import { ReactPreview } from './react-preview';
import { PrototypePreview } from './prototype-preview';

export type OutputMode = 'html-css' | 'react' | 'prototype';

interface PreviewPanelProps {
  outputMode: OutputMode;
  code?: string;
  files?: Record<string, string>;
  className?: string;
}

/**
 * 统一预览面板
 * 根据 outputMode 自动切换不同的预览组件
 * - html-css: 使用 iframe 预览纯 HTML+CSS
 * - react: 使用 Sandpack React 模板
 * - prototype: 使用服务端渲染 (/preview/[taskId])
 */
export function PreviewPanel({ outputMode, code, files, className }: PreviewPanelProps) {
  switch (outputMode) {
    case 'html-css':
      return <HtmlPreview code={code || ''} className={className} />;
    case 'react':
      return <ReactPreview files={files || {}} className={className} />;
    case 'prototype':
      // 使用服务端渲染方案
      return <PrototypePreview files={files || {}} className={className} />;
    default:
      return (
        <div className={cn("flex items-center justify-center h-full bg-muted/20", className)}>
          <p className="text-muted-foreground text-sm">Unknown preview mode</p>
        </div>
      );
  }
}

// 导出子组件供单独使用
export { HtmlPreview } from './html-preview';
export { ReactPreview } from './react-preview';
export { PrototypePreview } from './prototype-preview';
