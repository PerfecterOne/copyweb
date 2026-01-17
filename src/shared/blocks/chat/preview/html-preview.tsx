'use client';

import { useMemo } from 'react';
import { cn } from '@/shared/lib/utils';

interface HtmlPreviewProps {
  code: string;
  className?: string;
}

/**
 * HTML+CSS 预览组件
 * 使用 iframe + srcDoc 实现完全隔离的预览
 * 自动注入 Tailwind CDN 支持
 */
export function HtmlPreview({ code, className }: HtmlPreviewProps) {
  const html = useMemo(() => {
    if (!code) return '';
    
    // 如果代码已经包含完整的 HTML 结构
    if (code.includes('<head>')) {
      // 注入 Tailwind CDN 到 head 中
      return code.replace(
        '</head>',
        '<script src="https://cdn.tailwindcss.com"></script></head>'
      );
    }
    
    // 如果只是 HTML 片段，包装成完整文档
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
${code}
</body>
</html>`;
  }, [code]);

  if (!code) {
    return (
      <div className={cn("flex items-center justify-center h-full bg-muted/20", className)}>
        <p className="text-muted-foreground text-sm">No HTML content to preview</p>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={html}
      sandbox="allow-scripts allow-same-origin"
      className={cn("w-full h-full border-0 bg-white", className)}
      title="HTML Preview"
    />
  );
}
