'use client';

import { Code2, Sparkles, FileCode, CheckCircle2 } from 'lucide-react';
import { Loader } from './loader';
import { cn } from '@/shared/lib/utils';

export type LoadingPhase = 
  | 'initializing'      // 初始化聊天
  | 'preparing'         // 准备工作区
  | 'waiting'           // 等待 AI 响应
  | 'thinking'          // AI 思考中
  | 'generating'        // 生成代码中
  | 'rendering'         // 渲染预览中
  | 'complete';         // 完成

interface LoadingStateProps {
  phase: LoadingPhase;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const phaseConfig = {
  initializing: {
    icon: Loader,
    text: 'Initializing chat...',
    subtext: 'Setting up your workspace',
    color: 'text-muted-foreground',
  },
  preparing: {
    icon: Loader,
    text: 'Preparing workspace...',
    subtext: 'Getting ready for preview',
    color: 'text-muted-foreground',
  },
  waiting: {
    icon: Sparkles,
    text: 'AI is analyzing...',
    subtext: 'Processing your request',
    color: 'text-blue-500',
  },
  thinking: {
    icon: Sparkles,
    text: 'Thinking...',
    subtext: 'Analyzing design patterns',
    color: 'text-purple-500',
  },
  generating: {
    icon: Code2,
    text: 'Generating code...',
    subtext: 'Creating your components',
    color: 'text-green-500',
  },
  rendering: {
    icon: FileCode,
    text: 'Rendering preview...',
    subtext: 'Building your interface',
    color: 'text-orange-500',
  },
  complete: {
    icon: CheckCircle2,
    text: 'Complete!',
    subtext: 'Your code is ready',
    color: 'text-green-600',
  },
};

export function LoadingState({ phase, className, size = 'md' }: LoadingStateProps) {
  const config = phaseConfig[phase];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: { icon: 16, text: 'text-xs', subtext: 'text-xs' },
    md: { icon: 24, text: 'text-sm', subtext: 'text-xs' },
    lg: { icon: 32, text: 'text-base', subtext: 'text-sm' },
  };
  
  const sizes = sizeClasses[size];
  
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 text-center', className)}>
      <div className={cn('animate-pulse', config.color)}>
        {phase === 'initializing' || phase === 'preparing' || phase === 'waiting' ? (
          <Loader size={sizes.icon} />
        ) : phase === 'generating' ? (
          <div className="animate-spin">
            <Icon size={sizes.icon} />
          </div>
        ) : (
          <Icon size={sizes.icon} />
        )}
      </div>
      <div className="space-y-1">
        <p className={cn('font-medium', config.color, sizes.text)}>
          {config.text}
        </p>
        <p className={cn('text-muted-foreground', sizes.subtext)}>
          {config.subtext}
        </p>
      </div>
    </div>
  );
}

// 消息气泡骨架动画 - 更动态的等待状态
export function MessageSkeleton() {
  return (
    <div className="flex items-start gap-3 py-2 animate-in fade-in duration-300">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-primary/30"></div>
      </div>
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center gap-1">
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
          <span className="text-sm text-muted-foreground">Waiting for AI response...</span>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-muted/50 rounded animate-pulse w-3/4"></div>
          <div className="h-3 bg-muted/50 rounded animate-pulse w-1/2" style={{ animationDelay: '150ms' }}></div>
        </div>
      </div>
    </div>
  );
}
