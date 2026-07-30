"use client";

import { useState } from "react";
import { Star, CheckCircle2 } from "lucide-react";
import { Card, Button } from "@restoran/ui";
import { cn } from "@restoran/utils";
import { submitReview } from "@/lib/submit-review";

export function ReviewForm({ orderId }: { orderId: string }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setDone] = useState(false);

  async function handleSubmit() {
    if (rating === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitReview(orderId, rating, comment.trim() || undefined);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xəta baş verdi");
    } finally {
      setSubmitting(false);
    }
  }

  if (isDone) {
    return (
      <Card className="mt-4 text-center">
        <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-success" aria-hidden="true" />
        <p className="text-sm font-medium text-text-primary">Təşəkkür edirik!</p>
        <p className="text-xs text-text-secondary">Rəyiniz göndərildi</p>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <p className="mb-3 text-sm font-medium text-text-primary">Sifarişi necə qiymətləndirirsiniz?</p>
      <div className="mb-3 flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`${star} ulduz`}
            className="p-0.5"
          >
            <Star
              className={cn(
                "h-7 w-7 transition-colors",
                star <= (hoverRating || rating) ? "fill-accent text-accent" : "text-border-strong"
              )}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Rəyiniz (istəyə bağlı)"
        rows={2}
        className="w-full rounded-md border border-border-strong bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
      <Button onClick={handleSubmit} isLoading={isSubmitting} disabled={rating === 0} className="mt-3 w-full">
        Rəyi göndər
      </Button>
    </Card>
  );
}
