"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Show } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { generateCardsAction } from "@/actions/cards";

interface GenerateCardsButtonProps {
  deckId: number;
  hasDescription: boolean;
}

export function GenerateCardsButton({
  deckId,
  hasDescription,
}: GenerateCardsButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      try {
        await generateCardsAction({ deckId });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to generate cards. Please try again.",
        );
      }
    });
  }

  return (
    <Show
      when={{ feature: "ai_flashcard_generation" }}
      fallback={
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/pricing")}
                className="gap-1.5"
              />
            }
          >
            <Sparkles className="size-4" />
            Generate with AI
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-56 text-center">
            AI card generation is a Pro feature. Click to upgrade your plan.
          </TooltipContent>
        </Tooltip>
      }
    >
      {hasDescription ? (
        <div className="flex flex-col items-end gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isPending}
            className="gap-1.5"
          >
            <Sparkles className="size-4" />
            {isPending ? "Generating…" : "Generate with AI"}
          </Button>
          {error && (
            <p className="text-destructive max-w-56 text-right text-xs">{error}</p>
          )}
        </div>
      ) : (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                aria-disabled="true"
                onClick={(e) => e.preventDefault()}
                className="gap-1.5 cursor-not-allowed opacity-50"
              />
            }
          >
            <Sparkles className="size-4" />
            Generate with AI
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-56 text-center">
            Add a description to this deck first. Click &ldquo;Edit Deck&rdquo; to add one.
          </TooltipContent>
        </Tooltip>
      )}
    </Show>
  );
}
