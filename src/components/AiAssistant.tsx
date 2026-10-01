import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Trash2,
  Copy,
  Check,
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { Product, Category, ChatMessage, SaleTransaction } from '../types/inventory.ts';
import { AiAgentService } from '../services/aiAgent.ts';

interface AiAssistantProps {
  products: Product[];
  categories: Category[];
  sales?: SaleTransaction[];
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ products, categories, sales = [] }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: `Oi! Tudo bem? Sou o Gemini, seu parceiro e consultor aqui no supermercado. Tô pronto pra gente conversar como duas pessoas de verdade — com total naturalidade, sem respostas frias de máquina. 😊\n\nPode me perguntar qualquer coisa: desde um bate-papo descontraído, ideias pro negócio e dúvidas do dia a dia, até como tão as vendas no caixa, o lucro de hoje, itens que tão acabando ou lotes que tão pra vencer.\n\nComo posso te ajudar agora?`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const responseText = await AiAgentService.queryInventory(query, products, categories, sales, history);

      const assistantMessage: ChatMessage = {
        id: `msg-resp-${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: `Desculpe, ocorreu uma instabilidade rápida ao consultar: ${err.message || 'Erro inesperado'}. Por favor, me pergunte novamente!`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const clearHistory = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Histórico de conversa reiniciado! O que você gostaria de analisar ou conversar hoje?',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const quickQuestions = [
    { label: '📈 Como tá o movimento e lucro hoje?', query: 'Oi! Como tá o faturamento, lucro e ticket médio das vendas de hoje no caixa?' },
    { label: '💎 Quais produtos dão maior retorno?', query: 'Quais são os produtos que dão mais lucro e maior retorno (ROI) pra nossa loja?' },
    { label: '💳 Como os clientes tão pagando?', query: 'Qual tá sendo a forma de pagamento que os clientes mais tão usando no caixa?' },
    { label: '🚨 O que tá acabando no estoque?', query: 'Tem algum produto acabando ou já zerado que a gente precisa repor logo?' },
    { label: '📅 O que tá pra vencer em breve?', query: 'Tem algum lote de produto que tá perto de vencer nos próximos 30 dias?' },
    { label: '💡 Dica pra vender mais na semana', query: 'Me dá uma ideia boa e prática pra gente aumentar as vendas e o movimento essa semana?' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[550px] bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden relative">
      {/* Chat Header */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white">
                Parceiro do Gestor (Google Gemini)
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Gemini 3.8 Flash Ativo
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Converse como com um parceiro real: tire qualquer dúvida, troque ideias e acompanhe vendas, lucro e estoque.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={clearHistory}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 transition"
            title="Limpar Histórico de Conversa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 text-white shadow-md shadow-blue-500/20'
                }`}
              >
                {isUser ? <span className="text-xs font-bold">G</span> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] sm:max-w-[75%] space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[10px] font-semibold text-slate-400">
                    {isUser ? 'Você' : 'Gemini'}
                  </span>
                  <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                </div>

                <div
                  className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words relative group ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/10'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none shadow-sm'
                  }`}
                >
                  {msg.content}

                  {!isUser && (
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="absolute top-2 right-2 p-1 rounded-md bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition"
                      title="Copiar resposta"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/60 rounded-tl-none flex items-center gap-2 text-xs text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1">Gemini analisando e respondendo...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Questions */}
      <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 overflow-x-auto scrollbar-none flex items-center gap-2 shrink-0">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          Sugestões:
        </span>
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q.query)}
            disabled={loading}
            className="px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700/70 text-slate-300 hover:text-white text-[11px] font-medium whitespace-nowrap shrink-0 transition active:scale-95 disabled:opacity-50"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Chat Input */}
      <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Pergunte qualquer coisa ao Gemini ou converse com ele com naturalidade..."
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-lg shadow-blue-600/20 flex items-center gap-1.5 transition active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Perguntar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
