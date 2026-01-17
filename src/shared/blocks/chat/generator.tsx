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
  const { 
    chats, setChats, setChat, 
    resultCode, setResultCode, setResultFileName,
    setResultFiles, setOutputMode 
  } = useChatContext();

  const [status, setStatus] = useState<UseChatHelpers<UIMessage>['status']>();
  const [error, setError] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(true); // Default to show panel

  // TEST: Mock HTML+CSS response
  const handleTestHtml = () => {
    setResultCode(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hero Form</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #f5f5f5; padding: 2rem; }
    .container { max-width: 48rem; margin: 0 auto; }
    .tabs { display: flex; gap: 0.5rem; padding: 0.5rem; background: rgba(0,0,0,0.05); border-radius: 1rem; margin-bottom: 1rem; }
    .tab { padding: 0.5rem 1rem; border: none; background: transparent; border-radius: 0.75rem; cursor: pointer; }
    .tab.active { background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .input-area { background: white; border: 2px solid #e5e5e5; border-radius: 1.5rem; padding: 1.5rem; }
    textarea { width: 100%; min-height: 160px; border: none; resize: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="tabs">
      <button class="tab">📷 Image</button>
      <button class="tab active">💬 Prompt</button>
    </div>
    <div class="input-area">
      <textarea placeholder="Describe what you want..."></textarea>
    </div>
  </div>
</body>
</html>`);
    setResultFileName('index.html');
    setOutputMode('html-css');
    setResultFiles({});
    setShowPanel(true);
    toast.success('HTML+CSS preview loaded!');
  };

  // TEST: Mock React multi-file project
  const handleTestReact = () => {
    setResultFiles({
      '/App.js': `import React, { useState } from 'react';
import './styles.css';
import HeroForm from './components/HeroForm';

export default function App() {
  return (
    <div className="app">
      <h1>CopyWeb Demo</h1>
      <HeroForm />
    </div>
  );
}`,
      '/components/HeroForm.js': `import React, { useState } from 'react';

export default function HeroForm() {
  const [inputType, setInputType] = useState('prompt');
  const [text, setText] = useState('');

  const tabs = [
    { id: 'image', icon: '📷', label: 'Image' },
    { id: 'website', icon: '🌐', label: 'Website' },
    { id: 'figma', icon: '🎨', label: 'Figma' },
    { id: 'prompt', icon: '💬', label: 'Prompt' },
  ];

  return (
    <div className="hero-form">
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={\`tab \${inputType === tab.id ? 'active' : ''}\`}
            onClick={() => setInputType(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
      <div className="input-area">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe what you want to create..."
        />
        <div className="footer">
          <span>0 credits left</span>
          <button className="submit-btn">→</button>
        </div>
      </div>
    </div>
  );
}`,
      '/styles.css': `.app {
  font-family: system-ui, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #c4a574;
}

.hero-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(0,0,0,0.05);
  border-radius: 1rem;
}

.tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  border-radius: 0.75rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.tab.active {
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.input-area {
  background: white;
  border: 2px solid #e5e5e5;
  border-radius: 1.5rem;
  padding: 1.5rem;
}

textarea {
  width: 100%;
  min-height: 160px;
  border: none;
  resize: none;
  font-size: 1rem;
}

textarea:focus {
  outline: none;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e5e5e5;
  margin-top: 1rem;
}

.submit-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #c4a574;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.25rem;
}

.submit-btn:hover {
  background: #b39564;
}`,
    });
    setResultCode('');
    setResultFileName('');
    setOutputMode('react');
    setShowPanel(true);
    toast.success('React multi-file project loaded!');
  };

  // TEST: Mock Prototype multi-file project (Next.js App Router)
  const handleTestPrototype = () => {
    setResultFiles({
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
    generator: 'v0.app'
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
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`,
      '/components/hero-form.tsx': `"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
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
  const router = useRouter()
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
  }

  const handleFileInputClick = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = () => {
    router.push("/chat")
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
              onClick={handleSubmit}
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
    "build": "next build",
    "dev": "next dev",
    "lint": "eslint .",
    "start": "next start"
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
}`,
    });
    setResultCode('');
    setResultFileName('');
    setOutputMode('prototype');
    setShowPanel(true);
    toast.success('Next.js Prototype project loaded!');
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

          <div className="flex gap-2 mb-4 flex-wrap justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestHtml}
            >
              🧪 HTML+CSS
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestReact}
            >
              ⚛️ React
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestPrototype}
            >
              🚀 Prototype
            </Button>
          </div>

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
