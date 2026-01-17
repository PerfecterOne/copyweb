'use client';

import { createContext, ReactNode, useContext, useState } from 'react';

import { Chat } from '@/shared/types/chat';

// Sandpack compatible file structure
export interface SandpackFile {
  code: string;
  hidden?: boolean;
  active?: boolean;
  readOnly?: boolean;
}

export type SandpackFiles = Record<string, SandpackFile | string>;

// Output mode types
export type OutputMode = 'html-css' | 'react' | 'prototype';

export interface ContextValue {
  chat: Chat | null;
  setChat: (chat: Chat | null) => void;
  chats: Chat[];
  setChats: (chats: Chat[]) => void;
  // Legacy single file support (for backward compatibility)
  resultCode: string;
  setResultCode: (code: string) => void;
  resultFileName: string;
  setResultFileName: (name: string) => void;
  // Multi-file support for Sandpack
  resultFiles: SandpackFiles;
  setResultFiles: (files: SandpackFiles) => void;
  outputMode: OutputMode;
  setOutputMode: (mode: OutputMode) => void;
}

const ChatContext = createContext({} as ContextValue);

export const useChatContext = () => useContext(ChatContext);

export const ChatContextProvider = ({ children }: { children: ReactNode }) => {
  // current chat
  const [chat, setChat] = useState<Chat | null>(null);

  // user chats
  const [chats, setChats] = useState<Chat[]>([]);

  // Legacy: single file result for simple preview
  const [resultCode, setResultCode] = useState<string>('');
  const [resultFileName, setResultFileName] = useState<string>('');

  // Multi-file result for Sandpack
  const [resultFiles, setResultFiles] = useState<SandpackFiles>({});
  const [outputMode, setOutputMode] = useState<OutputMode>('html-css');

  return (
    <ChatContext.Provider
      value={{
        chat,
        setChat,
        chats,
        setChats,
        resultCode,
        setResultCode,
        resultFileName,
        setResultFileName,
        resultFiles,
        setResultFiles,
        outputMode,
        setOutputMode,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

