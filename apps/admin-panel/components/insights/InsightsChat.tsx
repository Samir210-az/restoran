"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Sparkles, Send, AlertCircle, Bot, User } from "lucide-react";
import { Card, Textarea, Button } from "@restoran/ui";
import { askBusinessInsightAction } from "@/app/(dashboard)/ai-insights/actions";

const SUGGESTED_QUESTIONS = [
  "Bu ay ən çox satılan yemək hansıdır?",
  "Gəlirimiz əvvəlki dövrə nisbətən necədir?",
  "Anbarda hansı məhsullar bitmək üzrədir?",
  "Ən az satılan yeməkləri niyə menyudan çıxarmıram?",
];

interface ChatEntry {
  question: string;
  reply?: string;
  error?: string;
}

/**
 * Her sual MUSTEQIL sorgudur - AI-ye her defe TEZE snapshot (RPC-den)
 * gonderilir, evvelki mesajlar Groq-a YENIDEN otururulmur. Bu, token
 * sisirmesinin qarsisini alir ve her cavabin HEMISE EN GUNCEL reqemlere
 * esaslanmasini temin edir (30 deqiqe evvel sorulan sual ile indiki
 * arasinda menyu/sifaris deyise biler).
 */
export function InsightsChat() {
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [question, setQuestion] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isPending]);

  function submitQuestion(q: string) {
    const trimmed = q.trim();
    if (!trimmed || isPending) return;

    setQuestion("");
    setHistory((prev) => [...prev, { question: trimmed }]);

    startTransition(async () => {
      const result = await askBusinessInsightAction(trimmed);
      setHistory((prev) =>
        prev.map((entry, idx) =>
          idx === prev.length - 1
            ? "error" in result
              ? { ...entry, error: result.error }
              : { ...entry, reply: result.reply }
            : entry
        )
      );
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {history.length === 0 && (
        <Card className="border-dashed">
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Sparkles className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Restoranınız haqqında nə soruşmaq istəyirsiniz?</p>
              <p className="mt-1 text-sm text-text-secondary">Cavablar real sifariş/gəlir/anbar məlumatlarına əsaslanır</p>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => submitQuestion(q)}
                  className="rounded-full border border-border-strong px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {history.length > 0 && (
        <div className="flex flex-col gap-4">
          {history.map((entry, idx) => (
            <div key={idx} className="flex flex-col gap-3">
              <div className="flex items-start justify-end gap-2">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-accent px-4 py-2.5 text-sm text-white">
                  {entry.question}
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <User className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                  <Bot className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
                {entry.error ? (
                  <div className="flex max-w-[85%] items-center gap-2 rounded-2xl rounded-tl-sm border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {entry.error}
                  </div>
                ) : entry.reply ? (
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-bg-muted px-4 py-2.5 text-sm text-text-primary">
                    {entry.reply}
                  </div>
                ) : (
                  <div className="flex max-w-[85%] items-center gap-1.5 rounded-2xl rounded-tl-sm bg-bg-muted px-4 py-2.5 text-sm text-text-secondary">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted" />
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      <Card className="sticky bottom-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitQuestion(question);
          }}
          className="flex items-end gap-2"
        >
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitQuestion(question);
              }
            }}
            placeholder="Məsələn: Bu həftə ən çox gəlir gətirən yemək hansıdır?"
            rows={1}
            className="flex-1"
            disabled={isPending}
            maxLength={500}
          />
          <Button type="submit" disabled={isPending || !question.trim()} aria-label="Sual göndər">
            <Send className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
