'use client';

import { useMemo } from 'react';
import { 
  SandpackProvider, 
  SandpackPreview,
  SandpackLayout,
} from "@codesandbox/sandpack-react";
import { cn } from '@/shared/lib/utils';

interface ReactPreviewProps {
  files: Record<string, string>;
  className?: string;
}

/**
 * React 预览组件
 * 使用 Sandpack 实现完全隔离的 React 项目预览
 * 支持多文件项目结构和 npm 依赖
 */
export function ReactPreview({ files, className }: ReactPreviewProps) {
  // 转换文件格式：确保所有路径以 / 开头
  const normalizedFiles = useMemo(() => {
    const result: Record<string, string> = {};
    Object.entries(files).forEach(([path, content]) => {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      result[normalizedPath] = content;
    });
    return result;
  }, [files]);

  const hasFiles = Object.keys(normalizedFiles).length > 0;

  if (!hasFiles) {
    return (
      <div className={cn("flex items-center justify-center h-full bg-muted/20", className)}>
        <p className="text-muted-foreground text-sm">No React files to preview</p>
      </div>
    );
  }

  return (
    <div className={cn("h-full w-full", className)}>
      <SandpackProvider
        template="react"
        files={normalizedFiles}
        customSetup={{
          dependencies: {
            "lucide-react": "latest",
          }
        }}
        options={{
          externalResources: ["https://cdn.tailwindcss.com"],
          classes: {
            "sp-wrapper": "!h-full",
            "sp-layout": "!h-full !border-0 !rounded-none",
            "sp-stack": "!h-full",
            "sp-preview": "!h-full",
            "sp-preview-container": "!h-full",
          }
        }}
      >
        <SandpackLayout>
          <SandpackPreview 
            showOpenInCodeSandbox={false}
            showRefreshButton={true}
          />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}
