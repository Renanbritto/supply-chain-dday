"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Send, Sparkles, Bot, User, CornerDownLeft, RotateCcw } from "lucide-react";
import { sendCopilotChat } from "@/lib/api";

interface Message {
  id: string;
  sender: "user" | "copilot";
  content: string;
  timestamp: string;
}

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialSkuToDiagnose?: string | null;
}

export function CopilotDrawer({
  isOpen,
  onClose,
  initialSkuToDiagnose,
}: CopilotDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "copilot",
      content: `### RN Intelligence Copilot Ativo

Sou o assistente de inteligencia contextual do ecossistema de Supply Chain.

Posso diagnosticar causas de ruptura, simular cenarios what-if, consolidar pedidos de compra por fornecedor e analisar o historico de SLA da operacao.

Selecione uma das sugestoes rapidas abaixo ou digite sua consulta.`,
      timestamp: "Agora",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para a ultima mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Se receber um SKU via clique da tabela, dispara o diagnostico automaticamente
  useEffect(() => {
    if (initialSkuToDiagnose && isOpen) {
      handleSendMessage(`diagnosticar ${initialSkuToDiagnose}`);
    }
  }, [initialSkuToDiagnose, isOpen]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage("");
    setIsLoading(true);

    try {
      const response = await sendCopilotChat(textToSend);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "copilot",
        content: response.content || "Sem resposta analitica gerada.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "copilot",
        content: "Falha ao conectar com o motor de inteligencia do backend.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const presetQueries = [
    "Quais itens entram em ruptura esta semana?",
    "Diagnosticar SKU-1006",
    "Gerar minutas de pedidos de compra",
    "Qual o OTIF e risco de fornecedores?",
    "Simular atraso de 7 dias no fornecedor",
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-lg h-full obsidian-drawer flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                RN Intelligence
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Copilot Analitico de Decisao
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sugestões Rápidas (Chips) */}
        <div className="p-3 border-b border-white/5 bg-obsidian-950/40 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          {presetQueries.map((query, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(query)}
              disabled={isLoading}
              className="whitespace-nowrap px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03] text-slate-300 hover:text-cyan-300 hover:border-cyan-500/30 hover:bg-cyan-500/10 transition-colors disabled:opacity-50"
            >
              {query}
            </button>
          ))}
        </div>

        {/* Histórico de Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "copilot" && (
                <div className="h-7 w-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl p-3.5 leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-cyan-600/20 border border-cyan-500/30 text-white"
                    : "bg-obsidian-850/80 border border-white/10 text-slate-200"
                }`}
              >
                <div className="whitespace-pre-wrap font-sans text-xs">
                  {msg.content}
                </div>
                <div className="text-[10px] text-slate-500 mt-2 font-mono text-right">
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === "user" && (
                <div className="h-7 w-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 text-xs justify-start items-center text-slate-400">
              <div className="h-7 w-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Bot className="h-4 w-4 animate-spin" />
              </div>
              <div className="bg-obsidian-850 p-3 rounded-xl border border-white/10 text-slate-400 font-mono text-[11px] animate-pulse">
                RN Intelligence processando matriz de decisao...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-white/10 bg-obsidian-950/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Pergunte ao RN Intelligence..."
              disabled={isLoading}
              className="flex-1 bg-obsidian-850 text-xs text-white placeholder-slate-500 border border-white/10 rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-500/50"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-mono px-1">
            <span>Consultas conectadas ao DuckDB OLAP</span>
            <span>Enter para enviar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
