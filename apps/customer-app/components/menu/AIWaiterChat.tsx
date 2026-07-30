"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Plus, Send } from "lucide-react";
import { Modal } from "@restoran/ui";
import { cn } from "@restoran/utils";
import { createSupabasePublicClient, type Json } from "@restoran/supabase-client";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ItemRow {
  id: string;
  category_id: string;
  name: Record<string, string>;
  description: Record<string, string>;
  price: number;
  image_url: string | null;
  tags: string[];
}

interface AIWaiterChatProps {
  restaurantId: string;
  items: ItemRow[];
  onAddToCart: (item: ItemRow) => void;
}

/**
 * AI cavabinda hansi menyu adlarinin kecdiyini tapir (sade substring
 * uyğunlugu - AI sistem prompt-unda YALNIZ real menyudan danisdigi ucun
 * bu, praktikada etibarlidir). Tapilan her yemek ucun "+ Sebete elave et"
 * chip-i gosterilir ki, musteri AI-nin tovsiyesini birbasa qebul ede bilsin.
 */
function findMentionedItems(text: string, items: ItemRow[]): ItemRow[] {
  const lowerText = text.toLowerCase();
  return items.filter((item) => {
    const name = item.name.az?.toLowerCase();
    return name && name.length > 2 && lowerText.includes(name);
  });
}

export function AIWaiterChat({ restaurantId, items, onAddToCart }: AIWaiterChatProps) {
  const [isOpen, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hörmətli müştəri, xoş gəlmisiniz! 😊 Mən sizin AI ofisiantınızam. Nə növ yemək istərdiniz — ət, toyuq, vegetarian? 🍽️" },
  ]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const [isSending, setSending] = useState(false);
  const conversationId = useRef<string>(crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function handleAdd(item: ItemRow) {
    onAddToCart(item);
    setAddedIds((prev) => new Set(prev).add(item.id));
  }

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

      createSupabasePublicClient()
        .rpc("save_ai_conversation", {
          _conversation_id: conversationId.current,
          _restaurant_id: restaurantId,
          _messages: finalMessages as unknown as Json,
        })
        .then(() => {});
    } catch {
      setMessages([...nextMessages, { role: "assistant", content: "Hörmətli müştəri, bağlantıda kiçik bir xəta oldu. Zəhmət olmasa yenidən cəhd edin. 🙏" }]);
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
          {messages.map((m, i) => {
            const mentioned = m.role === "assistant" ? findMentionedItems(m.content, items) : [];
            return (
              <div key={i} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    m.role === "user" ? "bg-accent text-accent-foreground" : "bg-bg-muted text-text-primary"
                  )}
                >
                  {m.content}
                </div>
                {mentioned.length > 0 && (
                  <div className="mt-1.5 flex max-w-[85%] flex-wrap gap-1.5">
                    {mentioned.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleAdd(item)}
                        disabled={addedIds.has(item.id)}
                        className={cn(
                          "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                          addedIds.has(item.id)
                            ? "border-success/40 bg-success/10 text-success"
                            : "border-accent/40 bg-accent-soft text-accent hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {addedIds.has(item.id) ? "Əlavə olundu ✓" : <Plus className="h-3 w-3" />}
                        {item.name.az} — {item.price.toFixed(2)} ₼
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
