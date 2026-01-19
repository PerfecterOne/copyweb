'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { LoadingState, LoadingPhase } from '@/shared/components/ai-elements/loading-state';
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
  chatStatus,
  isStreaming,
}: {
  className?: string;
  onClose?: () => void;
  chatStatus?: 'ready' | 'submitted' | 'streaming' | 'error';
  isStreaming?: boolean;
}) {
  const t = useTranslations('ai.chat.resultPanel');
  const { resultCode, resultFileName, resultFiles, outputMode, setResultFiles, setOutputMode } = useChatContext();
  const [activeTab, setActiveTab] = useState<ActiveTab>('preview');
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('waiting');

  // 合并文件数据
  const files: SandpackFiles = useMemo(() => {
    return Object.keys(resultFiles).length > 0
      ? resultFiles
      : resultCode
        ? { [`/${resultFileName || 'index.html'}`]: resultCode }
        : {};
  }, [resultFiles, resultCode, resultFileName]);

  const hasFiles = useMemo(() => Object.keys(files).length > 0, [files]);
  const fileTree = useMemo(() => buildFileTree(files), [files]);

  // Determine loading phase based on chat status and files
  useEffect(() => {
    if (hasFiles) {
      setLoadingPhase('complete');
    } else if (chatStatus === 'streaming' || isStreaming) {
      setLoadingPhase('generating');
    } else if (chatStatus === 'submitted') {
      setLoadingPhase('waiting');
    } else {
      setLoadingPhase('waiting');
    }
  }, [chatStatus, isStreaming, hasFiles]);

  // Add Ctrl+M hotkey to load prototype test data
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+M (Windows/Linux) or Cmd+M (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        console.log('[ResultPanel] Ctrl+M pressed - Loading prototype test data from test folder');
        
        // Load prototype test files from test folder
        const prototypeFiles = {
          '/app/page.tsx': `import HeroForm from "@/components/hero-form"

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10 pointer-events-none" />

      <div className="relative">
        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-12">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-balance mb-4">Create with AI</h1>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Transform your ideas into reality with our intelligent design assistant
            </p>
          </div>

          {/* Hero Form */}
          <HeroForm />
        </div>
      </div>
    </main>
  )
}`,
          '/app/layout.tsx': `import type { Metadata } from "next";
import { Oxanium, Merriweather, Fira_Code } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

const _oxanium = Oxanium({ subsets: ["latin"] });
const _merriweather = Merriweather({ subsets: ["latin"] });
const _firaCode = Fira_Code({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="font-sans">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}`,
          '/app/globals.css': `@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --font-sans: Oxanium, Oxanium Fallback;
  --font-mono: Fira Code, Fira Code Fallback;
  --font-serif: Merriweather, Merriweather Fallback;
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
  --radius-4xl: calc(var(--radius) + 16px);
}

:root {
  --background: oklch(0.9885 0.0057 84.5659);
  --foreground: oklch(0.366 0.0251 49.6085);
  --card: oklch(0.9686 0.0091 78.2818);
  --card-foreground: oklch(0.366 0.0251 49.6085);
  --popover: oklch(0.9686 0.0091 78.2818);
  --popover-foreground: oklch(0.366 0.0251 49.6085);
  --primary: oklch(0.5553 0.1455 48.9975);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.8276 0.0752 74.44);
  --secondary-foreground: oklch(0.4444 0.0096 73.639);
  --muted: oklch(0.9363 0.0218 83.2637);
  --muted-foreground: oklch(0.5534 0.0116 58.0708);
  --accent: oklch(0.9 0.05 74.9889);
  --accent-foreground: oklch(0.4444 0.0096 73.639);
  --destructive: oklch(0.4437 0.1613 26.8994);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0.8866 0.0404 89.6994);
  --input: oklch(0.8866 0.0404 89.6994);
  --ring: oklch(0.5553 0.1455 48.9975);
  --chart-1: oklch(0.5553 0.1455 48.9975);
  --chart-2: oklch(0.5534 0.0116 58.0708);
  --chart-3: oklch(0.5538 0.1207 66.4416);
  --chart-4: oklch(0.5534 0.0116 58.0708);
  --chart-5: oklch(0.6806 0.1423 75.834);
  --radius: 0.3rem;
  --sidebar: oklch(0.9363 0.0218 83.2637);
  --sidebar-foreground: oklch(0.366 0.0251 49.6085);
  --sidebar-primary: oklch(0.5553 0.1455 48.9975);
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent: oklch(0.5538 0.1207 66.4416);
  --sidebar-accent-foreground: oklch(1 0 0);
  --sidebar-border: oklch(0.8866 0.0404 89.6994);
  --sidebar-ring: oklch(0.5553 0.1455 48.9975);
  --shadow-2xs: 0px 2px 3px 0px hsl(28 18% 25% / 0.09);
  --shadow-xs: 0px 2px 3px 0px hsl(28 18% 25% / 0.09);
  --shadow-sm: 0px 2px 3px 0px hsl(28 18% 25% / 0.18), 0px 1px 2px -1px hsl(28 18% 25% / 0.18);
  --shadow: 0px 2px 3px 0px hsl(28 18% 25% / 0.18), 0px 1px 2px -1px hsl(28 18% 25% / 0.18);
  --shadow-md: 0px 2px 3px 0px hsl(28 18% 25% / 0.18), 0px 2px 4px -1px hsl(28 18% 25% / 0.18);
  --shadow-lg: 0px 2px 3px 0px hsl(28 18% 25% / 0.18), 0px 4px 6px -1px hsl(28 18% 25% / 0.18);
  --shadow-xl: 0px 2px 3px 0px hsl(28 18% 25% / 0.18), 0px 8px 10px -1px hsl(28 18% 25% / 0.18);
  --shadow-2xl: 0px 2px 3px 0px hsl(28 18% 25% / 0.45);
}

.dark {
  --background: oklch(0.2161 0.0061 56.0434);
  --foreground: oklch(0.9699 0.0013 106.4238);
  --card: oklch(0.2685 0.0063 34.2976);
  --card-foreground: oklch(0.9699 0.0013 106.4238);
  --popover: oklch(0.2685 0.0063 34.2976);
  --popover-foreground: oklch(0.9699 0.0013 106.4238);
  --primary: oklch(0.7049 0.1867 47.6044);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.4444 0.0096 73.639);
  --secondary-foreground: oklch(0.9232 0.0026 48.7171);
  --muted: oklch(0.233 0.0073 67.4563);
  --muted-foreground: oklch(0.7161 0.0091 56.259);
  --accent: oklch(0.3598 0.0497 229.3202);
  --accent-foreground: oklch(0.9232 0.0026 48.7171);
  --destructive: oklch(0.5771 0.2152 27.325);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0.3741 0.0087 67.5582);
  --input: oklch(0.3741 0.0087 67.5582);
  --ring: oklch(0.7049 0.1867 47.6044);
  --chart-1: oklch(0.7049 0.1867 47.6044);
  --chart-2: oklch(0.6847 0.1479 237.3225);
  --chart-3: oklch(0.7952 0.1617 86.0468);
  --chart-4: oklch(0.7161 0.0091 56.259);
  --chart-5: oklch(0.5534 0.0116 58.0708);
  --radius: 0.3rem;
  --sidebar: oklch(0.2685 0.0063 34.2976);
  --sidebar-foreground: oklch(0.9699 0.0013 106.4238);
  --sidebar-primary: oklch(0.7049 0.1867 47.6044);
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent: oklch(0.6847 0.1479 237.3225);
  --sidebar-accent-foreground: oklch(0.2839 0.0734 254.5378);
  --sidebar-border: oklch(0.3741 0.0087 67.5582);
  --sidebar-ring: oklch(0.7049 0.1867 47.6044);
  --shadow-2xs: 0px 2px 3px 0px hsl(0 0% 5% / 0.09);
  --shadow-xs: 0px 2px 3px 0px hsl(0 0% 5% / 0.09);
  --shadow-sm: 0px 2px 3px 0px hsl(0 0% 5% / 0.18), 0px 1px 2px -1px hsl(0 0% 5% / 0.18);
  --shadow: 0px 2px 3px 0px hsl(0 0% 5% / 0.18), 0px 1px 2px -1px hsl(0 0% 5% / 0.18);
  --shadow-md: 0px 2px 3px 0px hsl(0 0% 5% / 0.18), 0px 2px 4px -1px hsl(0 0% 5% / 0.18);
  --shadow-lg: 0px 2px 3px 0px hsl(0 0% 5% / 0.18), 0px 4px 6px -1px hsl(0 0% 5% / 0.18);
  --shadow-xl: 0px 2px 3px 0px hsl(0 0% 5% / 0.18), 0px 8px 10px -1px hsl(0 0% 5% / 0.18);
  --shadow-2xl: 0px 2px 3px 0px hsl(0 0% 5% / 0.45);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}

@layer utilities {
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}`,
          '/components/hero-form.tsx': `"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, ImageIcon, Globe, Figma, MessageSquare, Upload, LinkIcon, Code } from "lucide-react"

type InputType = "prompt" | "image" | "website" | "figma"
type OutputFormat = "html-css" | "react" | "prototype"

const INPUT_TYPES = [
  { id: "image" as InputType, icon: ImageIcon, label: "Image" },
  { id: "website" as InputType, icon: Globe, label: "Website" },
  { id: "figma" as InputType, icon: Figma, label: "Figma" },
  { id: "prompt" as InputType, icon: MessageSquare, label: "Prompt" },
]

const OUTPUT_FORMATS = [
  { id: "html-css" as OutputFormat, label: "HTML + CSS" },
  { id: "react" as OutputFormat, label: "React Component" },
  { id: "prototype" as OutputFormat, label: "Prototype" },
]

export default function HeroForm() {
  const [inputType, setInputType] = useState<InputType>("prompt")
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("html-css")
  const [textValue, setTextValue] = useState("")
  const [isDragActive, setIsDragActive] = useState(false)
  const [showOutputDropdown, setShowOutputDropdown] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    // Handle file drop logic here
  }

  const handleFileInputClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 px-4 sm:px-0">
      {/* Input Type Tabs */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2 p-1.5 sm:p-2 bg-muted/50 backdrop-blur-sm rounded-2xl border border-border/50 min-w-max sm:min-w-0 sm:justify-center">
          {INPUT_TYPES.map((type) => {
            const Icon = type.icon
            const isActive = inputType === type.id
            return (
              <button
                key={type.id}
                onClick={() => setInputType(type.id)}
                className={\`
                  flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap
                  \${
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }
                \`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{type.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Input Area */}
      <div
        className={\`
          relative rounded-2xl sm:rounded-3xl border-2 transition-all duration-200
          \${isDragActive ? "border-primary bg-primary/5" : "border-border/50 bg-card/50 backdrop-blur-sm"}
        \`}
        onDragEnter={handleDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-4 sm:p-6">
          {inputType === "prompt" && (
            <textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder="Describe what you want to create..."
              className="w-full min-h-[160px] sm:min-h-[200px] bg-transparent resize-none text-foreground placeholder:text-muted-foreground focus:outline-none text-sm sm:text-base leading-relaxed"
            />
          )}

          {inputType === "image" && (
            <div
              onClick={handleFileInputClick}
              className="flex flex-col items-center justify-center min-h-[160px] sm:min-h-[200px] cursor-pointer group"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-muted/80 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-muted transition-colors">
                <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
              </div>
              <p className="text-sm sm:text-base text-foreground mb-2 text-center px-4">
                <span className="font-medium">drag, paste</span> or{" "}
                <span className="text-primary font-medium">click to upload</span>
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground text-center px-4">
                supported: PNG, JPG, JPEG, WEBP, up to 2.5MB
              </p>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" />
            </div>
          )}

          {inputType === "website" && (
            <div className="min-h-[160px] sm:min-h-[200px] flex items-start">
              <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground mr-2 sm:mr-3 mt-1 flex-shrink-0" />
              <input
                type="text"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder="Input website url here"
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm sm:text-base"
              />
            </div>
          )}

          {inputType === "figma" && (
            <div className="min-h-[160px] sm:min-h-[200px] flex items-start">
              <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground mr-2 sm:mr-3 mt-1 flex-shrink-0" />
              <input
                type="text"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder="Input figma url here"
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm sm:text-base"
              />
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-border/50">
          {/* Output Format Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowOutputDropdown(!showOutputDropdown)}
              className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-2 px-3 py-2 sm:py-1.5 rounded-lg text-sm hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span className="font-medium">{OUTPUT_FORMATS.find((f) => f.id === outputFormat)?.label}</span>
              </div>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showOutputDropdown && (
              <div className="absolute top-full left-0 mt-2 w-full sm:w-56 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-10">
                {OUTPUT_FORMATS.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => {
                      setOutputFormat(format.id)
                      setShowOutputDropdown(false)
                    }}
                    className={\`
                      w-full text-left px-4 py-2.5 text-sm transition-colors
                      \${
                        outputFormat === format.id
                          ? "bg-accent text-accent-foreground"
                          : "text-popover-foreground hover:bg-accent/50"
                      }
                    \`}
                  >
                    {outputFormat === format.id && <span className="mr-2">✓</span>}
                    {format.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Credits & Submit */}
          <div className="flex items-center justify-between sm:justify-end gap-4">
            <span className="text-sm text-muted-foreground">0 credits left</span>
            <Button
              size="icon"
              className="rounded-full w-10 h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}`,
          '/package.json': `{
  "name": "my-v0-project",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint ."
  },
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "1.2.2",
    "@radix-ui/react-alert-dialog": "1.1.4",
    "@radix-ui/react-aspect-ratio": "1.1.1",
    "@radix-ui/react-avatar": "1.1.2",
    "@radix-ui/react-checkbox": "1.1.3",
    "@radix-ui/react-collapsible": "1.1.2",
    "@radix-ui/react-context-menu": "2.2.4",
    "@radix-ui/react-dialog": "1.1.4",
    "@radix-ui/react-dropdown-menu": "2.1.4",
    "@radix-ui/react-hover-card": "1.1.4",
    "@radix-ui/react-label": "2.1.1",
    "@radix-ui/react-menubar": "1.1.4",
    "@radix-ui/react-navigation-menu": "1.2.3",
    "@radix-ui/react-popover": "1.1.4",
    "@radix-ui/react-progress": "1.1.1",
    "@radix-ui/react-radio-group": "1.2.2",
    "@radix-ui/react-scroll-area": "1.2.2",
    "@radix-ui/react-select": "2.1.4",
    "@radix-ui/react-separator": "1.1.1",
    "@radix-ui/react-slider": "1.2.2",
    "@radix-ui/react-slot": "1.1.1",
    "@radix-ui/react-switch": "1.1.2",
    "@radix-ui/react-tabs": "1.1.2",
    "@radix-ui/react-toast": "1.2.4",
    "@radix-ui/react-toggle": "1.1.1",
    "@radix-ui/react-toggle-group": "1.1.1",
    "@radix-ui/react-tooltip": "1.1.6",
    "@vercel/analytics": "1.3.1",
    "autoprefixer": "^10.4.20",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "1.0.4",
    "date-fns": "4.1.0",
    "embla-carousel-react": "8.5.1",
    "input-otp": "1.4.1",
    "lucide-react": "^0.454.0",
    "next": "16.0.10",
    "next-themes": "^0.4.6",
    "react": "19.2.0",
    "react-day-picker": "9.8.0",
    "react-dom": "19.2.0",
    "react-hook-form": "^7.60.0",
    "react-resizable-panels": "^2.1.7",
    "recharts": "2.15.4",
    "sonner": "^1.7.4",
    "tailwind-merge": "^3.3.1",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^1.1.2",
    "zod": "3.25.76"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.9",
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "postcss": "^8.5",
    "tailwindcss": "^4.1.9",
    "tw-animate-css": "1.3.3",
    "typescript": "^5"
  }
}`
        };
        
        setResultFiles(prototypeFiles);
        setOutputMode('prototype');
        
        // Switch to code tab to show the file structure
        setActiveTab('code');
        
        console.log('[ResultPanel] Prototype test data loaded');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setResultFiles, setOutputMode]);

  // 自动选择第一个文件
  useEffect(() => {
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
        {activeTab === 'preview' ? (
          <div className={cn('h-full w-full bg-muted/20', viewMode === 'mobile' && 'flex items-center justify-center bg-muted/50')}>
            {hasFiles ? (
              <div className={cn('h-full bg-white shadow-lg transition-all duration-300 overflow-hidden animate-in fade-in', viewMode === 'desktop' ? 'w-full' : 'w-[375px] rounded-lg')}>
                {/* 使用新的隔离预览组件 - 只在有文件时渲染 */}
                <PreviewPanel
                  outputMode={outputMode as OutputMode}
                  code={resultCode}
                  files={Object.fromEntries(
                    Object.entries(files).map(([k, v]) => [k, typeof v === 'string' ? v : v.code || ''])
                  )}
                />
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <LoadingState phase={loadingPhase} size="lg" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full w-full">
            {hasFiles ? (
              <>
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
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <div className="text-center opacity-50">
                  <FileCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{t('emptyCode')}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
