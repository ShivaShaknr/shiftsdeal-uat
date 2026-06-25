'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot, Send, Minimize2, Maximize2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './Button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
}

export default function AIConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm the ShiftsDeal AI Concierge. I can help you find the perfect venue for your event. What are you looking for today?",
      suggestions: ['Training hall for 50 people', 'Conference room in Mumbai', 'Workshop space with projector'],
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send conversation history for context
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/ai/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: content, 
          context: {},
          history: conversationHistory 
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || "I'd be happy to help you find a venue. Could you tell me more about your requirements?",
        suggestions: data.suggestions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try searching directly or contact our support team.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-background flex items-center justify-center shadow-lg pulse-glow"
          >
            <Bot className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? 'auto' : '500px',
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-48px)] bg-background-card border border-border rounded-2xl shadow-2xl overflow-hidden ai-glow"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-background-light">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">AI Concierge</h3>
                  <p className="text-xs text-foreground-muted">Always here to help</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-background-card rounded-lg transition-colors"
                >
                  {isMinimized ? (
                    <Maximize2 className="w-4 h-4 text-foreground-muted" />
                  ) : (
                    <Minimize2 className="w-4 h-4 text-foreground-muted" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-background-card rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-foreground-muted" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="h-80 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'flex',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[80%] rounded-2xl px-4 py-2.5',
                          message.role === 'user'
                            ? 'bg-primary text-background rounded-br-md'
                            : 'bg-background-light text-foreground rounded-bl-md'
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.suggestions.map((suggestion, i) => (
                              <button
                                key={i}
                                onClick={() => sendMessage(suggestion)}
                                className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-background/50 hover:bg-background transition-colors text-foreground-muted hover:text-foreground"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-background-light rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-foreground-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-foreground-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-foreground-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-border">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage(input);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask me anything..."
                      className="flex-1 bg-background-light border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                    <Button type="submit" size="md" disabled={!input.trim() || isLoading}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
