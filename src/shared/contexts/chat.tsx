'use client';

import { createContext, ReactNode, useContext, useState } from 'react';

import { Chat } from '@/shared/types/chat';

export interface ContextValue {
  chat: Chat | null;
  setChat: (chat: Chat | null) => void;
  chats: Chat[];
  setChats: (chats: Chat[]) => void;
  resultCode: string;
  setResultCode: (code: string) => void;
  resultFileName: string;
  setResultFileName: (name: string) => void;
}

const ChatContext = createContext({} as ContextValue);

export const useChatContext = () => useContext(ChatContext);

export const ChatContextProvider = ({ children }: { children: ReactNode }) => {
  // current chat
  const [chat, setChat] = useState<Chat | null>(null);

  // user chats
  const [chats, setChats] = useState<Chat[]>([]);

  // result code for preview panel
  const [resultCode, setResultCode] = useState<string>('');
  const [resultFileName, setResultFileName] = useState<string>('');

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
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
