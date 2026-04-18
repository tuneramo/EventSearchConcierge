import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Loader2, Calendar, Search, Sparkles, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatWithConcierge } from '../lib/gemini';

interface Message {
  role: 'user' | 'model';
  content: string;
}

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all active:scale-95 flex-shrink-0 shadow-sm"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'URLをコピーする'}
    </button>
  );
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: 'こんにちは！イベント検索コンシェルジュです。あなたにぴったりのセミナーやイベントを見つけるお手伝いをさせていただきます。\n\nまずは、どのような分野やテーマのイベントに興味がありますか？（例：AI、マーケティング、キャリア、趣味など）また、そのイベントを探している目的も教えていただけると嬉しいです。'
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await chatWithConcierge(newMessages);
      if (response) {
        setMessages([...newMessages, { role: 'model', content: response }]);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      setMessages([...newMessages, { role: 'model', content: '申し訳ありません。エラーが発生しました。もう一度お試しください。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 md:p-8 font-sans">
      <div className="w-full max-w-5xl h-[85vh] flex flex-col bg-glass-bg backdrop-blur-[20px] border border-glass-border rounded-[32px] shadow-2xl overflow-hidden relative">
        {/* Header */}
        <header className="px-8 py-6 flex items-center justify-between border-b border-glass-border bg-white/10">
          <div className="flex items-center gap-4">
            <div className="bg-accent w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
              C
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight font-display">Event Concierge</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Consultant Online</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/40 rounded-full border border-white/20">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-slate-600">Active</span>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 relative">
          <div className="relative z-0 space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-4 rounded-[20px] text-sm leading-relaxed shadow-sm markdown-content ${
                    msg.role === 'user' 
                      ? 'bg-accent text-white rounded-br-none' 
                      : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                  }`}>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                        td: ({ node, children, ...props }) => {
                          // Simple detection: if the text in the cell looks like a URL
                          const getCellText = (nodes: any): string => {
                            if (typeof nodes === 'string') return nodes;
                            if (Array.isArray(nodes)) return nodes.map(getCellText).join('');
                            if (nodes && nodes.props && nodes.props.children) return getCellText(nodes.props.children);
                            return '';
                          };
                          
                          const textContent = getCellText(children).trim();
                          const isUrl = textContent.startsWith('http');

                          return (
                            <td {...props}>
                              <div className={isUrl ? "flex flex-col md:flex-row md:items-center gap-2" : ""}>
                                <div className="flex-1 break-all">{children}</div>
                                {isUrl && <CopyButton text={textContent} />}
                              </div>
                            </td>
                          );
                        }
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex gap-3 items-center text-slate-500 bg-white/60 backdrop-blur-md border border-white/40 p-4 rounded-[20px] rounded-tl-none shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-accent" />
                  <span className="text-xs font-medium italic">Searching events...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input Area */}
        <footer className="p-6 md:p-8 bg-white/10 border-t border-glass-border">
          <form onSubmit={handleSubmit} className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="メッセージを入力してください..."
              className="w-full bg-white/50 backdrop-blur-sm border border-glass-border rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-slate-800 placeholder:text-slate-400 shadow-inner"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-accent text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              <Send size={20} />
            </button>
          </form>
          <div className="flex justify-center items-center gap-2 mt-4">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
              Concierge is online
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
