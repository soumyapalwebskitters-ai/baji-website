'use client';
import { createContext, useContext, type ReactNode } from 'react';
import { defaultWebContent, type WebContent } from '@/data/web-content';
const Context = createContext<WebContent>(defaultWebContent);
export function WebContentProvider({content, children}: {content: WebContent; children: ReactNode}) {
  return <Context.Provider value={content}>{children}</Context.Provider>;
}
export function useWebContent() {
  const content = useContext(Context);
  return { content, copy: (key: string) => content.copy[key] ?? defaultWebContent.copy[key] ?? '' };
}
