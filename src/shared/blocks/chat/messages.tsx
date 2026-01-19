'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { UIMessage, UseChatHelpers } from '@ai-sdk/react';
import { CopyIcon, RefreshCcwIcon, ChevronRight, MoreHorizontal } from 'lucide-react';

import { Action, Actions } from '@/shared/components/ai-elements/actions';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/shared/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
} from '@/shared/components/ai-elements/message';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/shared/components/ai-elements/reasoning';
import { Response } from '@/shared/components/ai-elements/response';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/shared/components/ai-elements/sources';
import { MessageSkeleton } from '@/shared/components/ai-elements/loading-state';
import { cn } from '@/shared/lib/utils';
import { useChatContext } from '@/shared/contexts/chat';

// Utility to extract all code blocks (any format)
function extractAllCodeBlocks(text: string): Record<string, string> {
  const files: Record<string, string> = {};
  
  // Match any code block with optional language and optional path comment
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  
  let match;
  let fileIndex = 1;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const lang = match[1] || 'txt';
    let code = match[2] || '';
    
    // Try to extract path from first line comment
    const firstLineMatch = code.match(/^(?:\/\/|\/\*|#)\s*([^\n\*]+)(?:\s*\*\/)?\s*\n/);
    let path = firstLineMatch ? firstLineMatch[1].trim() : null;
    
    // If path was found in comment, remove the comment line from code
    if (path && firstLineMatch) {
      code = code.substring(firstLineMatch[0].length);
    }
    
    // If no path found, generate one based on language
    if (!path) {
      const ext = lang === 'typescript' || lang === 'tsx' ? 'tsx' :
                  lang === 'javascript' || lang === 'jsx' ? 'jsx' :
                  lang === 'css' ? 'css' :
                  lang === 'html' ? 'html' :
                  lang === 'json' ? 'json' : 'txt';
      path = `/file-${fileIndex}.${ext}`;
      fileIndex++;
    }
    
    // Ensure path starts with /
    const formattedPath = path.startsWith('/') ? path : `/${path}`;
    files[formattedPath] = code.trim();
  }
  
  console.log('[extractAllCodeBlocks] Found', Object.keys(files).length, 'code blocks');
  return files;
}

// Component to render code blocks as collapsible version cards
function CodeVersionCard({ files, versionNumber }: { files: Record<string, string>; versionNumber: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const fileCount = Object.keys(files).length;
  
  console.log('[CodeVersionCard] Rendering with', fileCount, 'files:', Object.keys(files));
  
  if (fileCount === 0) return null;
  
  return (
    <div className="my-4 rounded-lg border border-border bg-card">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
          <span className="font-medium">Updated code v{versionNumber}</span>
          <span className="text-sm text-muted-foreground">({fileCount} {fileCount === 1 ? 'file' : 'files'})</span>
        </div>
        <div className="p-1 hover:bg-accent rounded">
          <MoreHorizontal className="h-4 w-4" />
        </div>
      </div>
      
      {isExpanded && (
        <div className="border-t border-border px-4 py-3 space-y-2">
          {Object.keys(files).map((filePath) => {
            const fileName = filePath.split('/').pop() || filePath;
            const fileIcon = filePath.endsWith('.tsx') || filePath.endsWith('.ts') ? '⚛️' : 
                           filePath.endsWith('.css') ? '🎨' : 
                           filePath.endsWith('.json') ? '📦' : 
                           filePath.endsWith('.html') ? '🌐' : '📄';
            
            return (
              <div key={filePath} className="flex items-center gap-2 text-sm">
                <span>{fileIcon}</span>
                <span className="font-mono">{fileName}</span>
                <span className="text-muted-foreground">{filePath}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Remove ALL code blocks from text (any format)
function removeCodeBlocks(text: string): string {
  const cleaned = text.replace(/```\w*\n[\s\S]*?```/g, '').trim();
  console.log('[removeCodeBlocks] Original length:', text.length, 'Cleaned length:', cleaned.length);
  return cleaned;
}

// Split text at CODE_START marker and return only the thinking process part
function extractThinkingProcess(text: string): string {
  const codeStartMarker = '<!-- CODE_START -->';
  const markerIndex = text.indexOf(codeStartMarker);
  
  if (markerIndex !== -1) {
    // Found the marker, return everything before it
    const thinkingPart = text.substring(0, markerIndex).trim();
    console.log('[extractThinkingProcess] Found CODE_START marker at:', markerIndex);
    console.log('[extractThinkingProcess] Thinking part length:', thinkingPart.length);
    return thinkingPart;
  }
  
  // No marker found, return the full text (might still be streaming)
  console.log('[extractThinkingProcess] No CODE_START marker found, returning full text');
  return text;
}

// Extract code section (everything after CODE_START marker)
function extractCodeSection(text: string): string {
  const codeStartMarker = '<!-- CODE_START -->';
  const markerIndex = text.indexOf(codeStartMarker);
  
  if (markerIndex !== -1) {
    // Found the marker, return everything after it
    const codePart = text.substring(markerIndex + codeStartMarker.length).trim();
    console.log('[extractCodeSection] Found CODE_START marker, code section length:', codePart.length);
    return codePart;
  }
  
  // No marker found, return empty string
  return '';
}

export function ChatMessages({
  chatInstance,
}: {
  chatInstance: UseChatHelpers<UIMessage>;
}) {
  const { messages, status, regenerate } = chatInstance;
  const { setResultFiles, setOutputMode } = useChatContext();
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  // Find the last assistant message
  const lastAssistantMessage = messages.filter(m => m.role === 'assistant').at(-1);

  // Debug logging for streaming status
  useEffect(() => {
    console.log('[ChatMessages] Status changed:', status);
    console.log('[ChatMessages] Messages count:', messages.length);
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      console.log('[ChatMessages] Last message:', {
        id: lastMessage.id,
        role: lastMessage.role,
        partsCount: lastMessage.parts.length,
        parts: lastMessage.parts.map(p => ({ type: p.type, textLength: 'text' in p ? p.text.length : 0 }))
      });
    }
  }, [messages, status]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  // Extract code from all assistant messages to build the VFS
  useEffect(() => {
    const assistantMessages = messages.filter((m) => m.role === 'assistant');
    if (assistantMessages.length === 0) return;

    const allFiles: Record<string, string> = {};
    
    assistantMessages.forEach(msg => {
      const textPart = msg.parts.find((p) => p.type === 'text');
      if (textPart && 'text' in textPart) {
        const extracted = extractAllCodeBlocks(textPart.text);
        Object.assign(allFiles, extracted);
      }
    });

    if (Object.keys(allFiles).length > 0) {
      setResultFiles(allFiles);
      
      // Heuristic to set output mode if not already set or if it's a new batch
      if (allFiles['/app/page.tsx'] || allFiles['/app/layout.tsx']) {
        setOutputMode('prototype');
      } else if (allFiles['/App.tsx'] || allFiles['/App.js']) {
        setOutputMode('react');
      } else if (allFiles['/index.html']) {
        setOutputMode('html-css');
      }
    }
  }, [messages, setResultFiles, setOutputMode]);

  return (
    <Conversation className="h-full">
      <ConversationContent>
        {messages.map((message) => {
          const metadata =
            message.metadata && typeof message.metadata === 'object'
              ? (message.metadata as { type?: string; isHeroInit?: boolean })
              : undefined;
          
          console.log('[Messages] Message:', message.id, 'role:', message.role, 'metadata:', metadata);
          
          // Hide initial complex prompt from UI
          if (metadata?.isHeroInit) {
            console.log('[Messages] Hiding hero-init message:', message.id);
            return null;
          }
          
          // Also hide user messages that contain the system prompt patterns
          if (message.role === 'user') {
            const textPart = message.parts.find((p) => p.type === 'text');
            if (textPart && 'text' in textPart) {
              const text = textPart.text;
              // Check if this is a generated prompt (contains specific patterns)
              if (
                text.includes('Analysis Focus Points') ||
                text.includes('Carefully analyze this screenshot/image') ||
                text.includes('Overall layout structure (Flexbox/Grid arrangements)')
              ) {
                console.log('[Messages] Hiding generated prompt message:', message.id);
                return null;
              }
            }
          }

          const isAssistantError =
            message.role === 'assistant' && metadata?.type === 'error';
          
          // Check if this is the last assistant message
          const isLastAssistant = message.role === 'assistant' && message.id === lastAssistantMessage?.id;

          return (
            <div key={message.id}>
              {message.role === 'assistant' &&
                message.parts.filter((part) => part.type === 'source-url')
                  .length > 0 && (
                  <Sources>
                    <SourcesTrigger
                      count={
                        message.parts.filter(
                          (part) => part.type === 'source-url'
                        ).length
                      }
                    />
                    {message.parts
                      .filter((part) => part.type === 'source-url')
                      .map((part, i) => (
                        <SourcesContent key={`${message.id}-${i}`}>
                          <Source
                            key={`${message.id}-${i}`}
                            href={part.url}
                            title={part.url}
                          />
                        </SourcesContent>
                      ))}
                  </Sources>
                )}
              {message.parts.map((part, i) => {
                switch (part.type) {
                  case 'text':
                    // Split text into thinking process and code section using CODE_START marker
                    const thinkingText = extractThinkingProcess(part.text);
                    const codeSection = extractCodeSection(part.text);
                    
                    console.log('[Messages] Text part:', {
                      fullTextLength: part.text.length,
                      thinkingTextLength: thinkingText.length,
                      codeSectionLength: codeSection.length,
                      textPreview: part.text.substring(0, 100),
                    });
                    
                    // Extract code blocks from the code section only
                    const codeFiles = codeSection ? extractAllCodeBlocks(codeSection) : {};
                    const hasCodeBlocks = Object.keys(codeFiles).length > 0;
                    
                    // Check if currently streaming this message
                    const isCurrentlyStreaming = status === 'streaming' && 
                                                  i === message.parts.length - 1 && 
                                                  message.id === messages.at(-1)?.id;
                    
                    console.log('[Messages] Rendering conditions:', {
                      isCurrentlyStreaming,
                      hasThinkingText: !!thinkingText,
                      thinkingTextLength: thinkingText.length,
                      shouldShowLoader: isCurrentlyStreaming && !thinkingText,
                    });
                    
                    // Calculate version number based on how many assistant messages with code blocks came before this one
                    const assistantMessagesBeforeThis = messages
                      .slice(0, messages.indexOf(message))
                      .filter(m => m.role === 'assistant');
                    
                    let versionNumber = 1;
                    assistantMessagesBeforeThis.forEach(m => {
                      const textPart = m.parts.find(p => p.type === 'text');
                      if (textPart && 'text' in textPart) {
                        const msgCodeSection = extractCodeSection(textPart.text);
                        const files = msgCodeSection ? extractAllCodeBlocks(msgCodeSection) : {};
                        if (Object.keys(files).length > 0) {
                          versionNumber++;
                        }
                      }
                    });
                    
                    return (
                      <Fragment key={`${message.id}-${i}`}>
                        <Message from={message.role}>
                          <MessageContent>
                            {/* Show loading indicator when streaming and no thinking text yet - ONLY for last assistant */}
                            {isLastAssistant && isCurrentlyStreaming && !thinkingText && (
                              <div className="flex items-center gap-2 py-3 animate-in fade-in duration-300">
                                <div className="relative flex items-center gap-1">
                                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                                <span className="text-sm text-muted-foreground">AI is thinking...</span>
                              </div>
                            )}
                            {/* Always render the thinking process part */}
                            {thinkingText && (
                              <div className="space-y-3">
                                <Response
                                  className={cn(
                                    isAssistantError && 'text-destructive',
                                    'animate-in fade-in duration-300'
                                  )}
                                >
                                  {thinkingText}
                                </Response>
                              </div>
                            )}
                            {/* Render code version card - only show after streaming completes and code blocks exist */}
                            {hasCodeBlocks && !isCurrentlyStreaming && (
                              <div className="animate-in slide-in-from-bottom-4 duration-500">
                                <CodeVersionCard 
                                  files={codeFiles} 
                                  versionNumber={versionNumber} 
                                />
                              </div>
                            )}
                            {/* Global status indicator - ONLY for last assistant message */}
                            {isLastAssistant && (
                              <div className="mt-3">
                                {isCurrentlyStreaming && thinkingText && (
                                  <div className="flex items-center gap-2 text-muted-foreground/80 py-2 animate-in fade-in duration-300">
                                    <div className="relative flex items-center gap-1">
                                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                    <span className="text-sm">Thinking...</span>
                                  </div>
                                )}
                                {!isCurrentlyStreaming && hasCodeBlocks && (
                                  <div className="flex items-center gap-2 text-green-600 py-2 animate-in fade-in duration-300">
                                    <div className="relative w-4 h-4 flex items-center justify-center">
                                      <svg className="w-4 h-4 animate-spin" style={{ animationDuration: '2s' }} viewBox="0 0 24 24" fill="none">
                                        <path
                                          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10"
                                          stroke="currentColor"
                                          strokeWidth="2.5"
                                          strokeLinecap="round"
                                          className="opacity-30"
                                        />
                                        <path
                                          d="M12 2C17.52 2 22 6.48 22 12"
                                          stroke="currentColor"
                                          strokeWidth="2.5"
                                          strokeLinecap="round"
                                        />
                                      </svg>
                                      <span className="absolute text-[10px] font-bold">C</span>
                                    </div>
                                    <span className="text-sm font-medium">Finished</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </MessageContent>
                        </Message>
                        {message.role === 'assistant' &&
                          i === messages.length - 1 && (
                            <Actions className="mt-2">
                              <Action
                                onClick={() => regenerate()}
                                label="Retry"
                              >
                                <RefreshCcwIcon className="size-3" />
                              </Action>
                              <Action
                                onClick={() =>
                                  navigator.clipboard.writeText(part.text)
                                }
                                label="Copy"
                              >
                                <CopyIcon className="size-3" />
                              </Action>
                            </Actions>
                          )}
                      </Fragment>
                    );
                  case 'reasoning':
                    return (
                      <Reasoning
                        key={`${message.id}-${i}`}
                        className="w-full"
                        isStreaming={
                          status === 'streaming' &&
                          i === message.parts.length - 1 &&
                          message.id === messages.at(-1)?.id
                        }
                      >
                        <ReasoningTrigger />
                        <ReasoningContent>{part.text}</ReasoningContent>
                      </Reasoning>
                    );
                  default:
                    return null;
                }
              })}
            </div>
          );
        })}
        
        {/* Show waiting skeleton when submitted but no assistant response yet */}
        {status === 'submitted' && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="animate-in fade-in duration-300">
            <MessageSkeleton />
          </div>
        )}
        
        <div ref={endOfMessagesRef} />
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
