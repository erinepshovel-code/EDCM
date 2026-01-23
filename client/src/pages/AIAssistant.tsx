import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ModeHeader } from '@/components/shared/ModeHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Plus, Trash2, Bot, User, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  messages?: Message[];
}

export default function AIAssistant() {
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: loadingConversations } = useQuery<Conversation[]>({
    queryKey: ['/api/chat-conversations'],
    queryFn: async () => {
      const res = await fetch('/api/chat-conversations');
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return res.json();
    },
  });

  const { data: currentConversation, isLoading: loadingMessages } = useQuery<Conversation>({
    queryKey: ['/api/chat-conversations', selectedConversation],
    queryFn: async () => {
      const res = await fetch(`/api/chat-conversations/${selectedConversation}`);
      if (!res.ok) throw new Error('Failed to fetch conversation');
      return res.json();
    },
    enabled: !!selectedConversation,
  });

  const createConversation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/chat-conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' }),
      });
      if (!res.ok) throw new Error('Failed to create conversation');
      return res.json();
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat-conversations'] });
      setSelectedConversation(newConversation.id);
    },
  });

  const deleteConversation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/chat-conversations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete conversation');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat-conversations'] });
      if (selectedConversation) setSelectedConversation(null);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages, streamingContent]);

  const sendMessage = async () => {
    if (!inputValue.trim() || !selectedConversation || isStreaming) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsStreaming(true);
    setStreamingContent('');

    queryClient.setQueryData<Conversation>(
      ['/api/chat-conversations', selectedConversation],
      (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: [
            ...(old.messages || []),
            {
              id: Date.now(),
              conversationId: selectedConversation,
              role: 'user' as const,
              content: userMessage,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      }
    );

    try {
      const response = await fetch(`/api/chat-conversations/${selectedConversation}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMessage }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
                setStreamingContent(fullContent);
              }
              if (data.done) {
                setIsStreaming(false);
                setStreamingContent('');
                queryClient.invalidateQueries({ queryKey: ['/api/chat-conversations', selectedConversation] });
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const messages = currentConversation?.messages || [];
  const allMessages = isStreaming && streamingContent
    ? [...messages, { id: -1, conversationId: selectedConversation!, role: 'assistant' as const, content: streamingContent, createdAt: '' }]
    : messages;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ModeHeader title="AI Assistant" subtitle="Chat with AI" />

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-border bg-card/50 flex flex-col">
          <div className="p-4 border-b border-border">
            <Button
              onClick={() => createConversation.mutate()}
              disabled={createConversation.isPending}
              className="w-full"
              data-testid="button-new-chat"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {loadingConversations ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No conversations yet
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      'group flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent transition-colors',
                      selectedConversation === conv.id && 'bg-accent'
                    )}
                    onClick={() => setSelectedConversation(conv.id)}
                    data-testid={`conversation-item-${conv.id}`}
                  >
                    <MessageSquare className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate text-sm">{conv.title}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation.mutate(conv.id);
                      }}
                      data-testid={`button-delete-conversation-${conv.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </aside>

        <main className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="max-w-3xl mx-auto space-y-4">
                  {loadingMessages ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : allMessages.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Start a conversation with the AI assistant</p>
                    </div>
                  ) : (
                    allMessages.map((msg, idx) => (
                      <div
                        key={msg.id || idx}
                        className={cn(
                          'flex gap-3',
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                        data-testid={`message-${msg.role}-${idx}`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <Card
                          className={cn(
                            'p-3 max-w-[80%]',
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-card'
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          {msg.id === -1 && (
                            <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                          )}
                        </Card>
                        {msg.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-border bg-background">
                <div className="max-w-3xl mx-auto flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    disabled={isStreaming}
                    className="flex-1"
                    data-testid="input-message"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || isStreaming}
                    data-testid="button-send"
                  >
                    {isStreaming ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h2 className="text-xl font-semibold mb-2">Welcome to AI Assistant</h2>
                <p className="text-muted-foreground mb-4">
                  Select a conversation or start a new one
                </p>
                <Button
                  onClick={() => createConversation.mutate()}
                  disabled={createConversation.isPending}
                  data-testid="button-start-new-chat"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Chat
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
