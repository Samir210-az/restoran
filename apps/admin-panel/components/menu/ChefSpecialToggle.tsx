"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChefHat } from "lucide-react";
import { cn } from "@restoran/utils";
import { toggleChefSpecialAction } from "@/app/(dashboard)/menu/actions";

export function ChefSpecialToggle({ itemId, tags }: { itemId: string; tags: string[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isSpecial = tags.includes("chef_special");

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await toggleChefSpecialAction(itemId, tags);
          router.refresh();
        })
      }
      aria-label={isSpecial ? "Aşpazın təklifindən çıxar" : "Aşpazın təklifi et"}
      title={isSpecial ? "Aşpazın təklifindən çıxar" : "Aşpazın təklifi kimi işarələ"}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:opacity-50",
        isSpecial ? "border-accent bg-accent-soft text-accent" : "border-border-strong text-text-muted hover:bg-bg-muted"
      )}
    >
      <ChefHat className="h-3.5 w-3.5" />
    </button>
  );
}
