'use client';

import { useMemo } from 'react';
import { cn } from '@/shared/lib/utils';

interface HtmlPreviewProps {
  code?: string;
  files?: Record<string, string>;
  className?: string;
}

/**
 * HTML+CSS 预览组件
 * 使用 iframe + srcDoc 实现完全隔离的预览
 * 自动注入 Tailwind CDN 支持
 */
export function HtmlPreview({ code, files, className }: HtmlPreviewProps) {
  const html = useMemo(() => {
    // 优先使用 code 参数
    let htmlContent = code || '';
    
    // 如果 code 为空，尝试从 files 中查找 HTML 文件
    if (!htmlContent && files) {
      // 查找 index.html 或任何 .html 文件
      const htmlFile = files['/index.html'] || 
                       files['index.html'] || 
                       Object.entries(files).find(([path]) => path.endsWith('.html'))?.[1];
      
      if (htmlFile) {
        htmlContent = htmlFile;
      }
    }
    
    if (!htmlContent) return '';
    
    // 如果代码已经包含完整的 HTML 结构
    if (htmlContent.includes('<head>')) {
      // 注入 Tailwind CDN 到 head 中
      return htmlContent.replace(
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
${htmlContent}
</body>
</html>`;
  }, [code, files]);

  if (!html) {
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
