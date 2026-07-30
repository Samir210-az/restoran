"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send } from "lucide-react";
import { Modal } from "@restoran/ui";
import { cn } from "@restoran/utils";
import { createSupabasePublicClient, type Json } from "@restoran/supabase-client";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * AI Ofisiant chat pəncərəsi. Hər mesajda /api/ai-waiter route-una
 * fetch edir (öz origin-imiz - GROQ_API_KEY brauzerə heç vaxt gəlmir).
 * Söhbət `ai_conversations`-a asinxron saxlanılır (UI-nı bloklamır).
 */
export function AIWaiterChat({ restaurantId }: { restaurantId: string }) {
  const [isOpen, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Salam! 👋 Mən AI ofisiantınızam. Nə növ yemək istərdiniz — ət, toyuq, vegetarian?" },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setSending] = useState(false);
  const conversationId = useRef<string>(crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isSending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/ai-waiter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, messages: nextMessages }),
      });
      const data = await res.json();
      const reply: string = res.ok ? data.reply : "Üzr istəyirəm, hazırda cavab verə bilmirəm. Bir az sonra cəhd edin.";
      const finalMessages: ChatMessage[] = [...nextMessages, { role: "assistant", content: reply }];
      setMessages(finalMessages);

      // Arxa planda saxla - xetasi UI-ni bloklamir
      createSupabasePublicClient()
        .rpc("save_ai_conversation", {
          _conversation_id: conversationId.current,
          _restaurant_id: restaurantId,
          _messages: finalMessages as unknown as Json,
        })
        .then(() => {});
    } catch {
      setMessages([...nextMessages, { role: "assistant", content: "Bağlantı xətası oldu. Yenidən cəhd edin." }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-elevated hover:opacity-90"
        aria-label="AI Ofisiantla söhbət et"
      >
        <Sparkles className="h-5 w-5" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setOpen(false)} title="AI Ofisiant" className="flex h-[80vh] max-h-[600px] flex-col">
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto py-2">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  m.role === "user" ? "bg-accent text-accent-foreground" : "bg-bg-muted text-text-primary"
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-bg-muted px-3 py-2 text-sm text-text-muted">Yazır...</div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-border pt-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Sualınızı yazın..."
            className="h-10 flex-1 rounded-md border border-border-strong bg-bg px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            aria-label="Göndər"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </Modal>
    </>
  );
}
