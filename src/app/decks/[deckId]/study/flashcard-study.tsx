"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Shuffle,
  RefreshCw,
  CheckCircle,
  XCircle,
  RotateCcw,
  ArrowLeft,
  Trophy,
} from "lucide-react";


type CardData = {
  id: number;
  front: string;
  back: string;
};

interface FlashcardStudyProps {
  cards: CardData[];
  deckId: number;
  deckName: string;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function FlashcardStudy({ cards, deckId, deckName }: FlashcardStudyProps) {
  const router = useRouter();
  const [deck, setDeck] = useState<CardData[]>(cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);

  const total = deck.length;
  const currentCard = deck[currentIndex];
  const progressPercent = ((currentIndex + 1) / total) * 100;

  function handleFlip() {
    setIsFlipped((prev) => !prev);
  }

  function handlePrevious() {
    if (currentIndex === 0) return;
    setCurrentIndex((i) => i - 1);
    setIsFlipped(false);
  }

  function handleNext() {
    if (currentIndex === total - 1) return;
    setCurrentIndex((i) => i + 1);
    setIsFlipped(false);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === " ") {
        e.preventDefault();
        handleFlip();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, total]);

  function handleShuffle() {
    setDeck(shuffleArray(cards));
    setCurrentIndex(0);
    setIsFlipped(false);
  }

  function handleCorrect() {
    const newCorrect = correctCount + 1;
    setCorrectCount(newCorrect);
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
    } else {
      setSessionComplete(true);
    }
  }

  function handleIncorrect() {
    const newIncorrect = incorrectCount + 1;
    setIncorrectCount(newIncorrect);
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
    } else {
      setSessionComplete(true);
    }
  }

  function handleStudyAgain() {
    setDeck(cards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCorrectCount(0);
    setIncorrectCount(0);
    setSessionComplete(false);
  }

  if (sessionComplete) {
    const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <div className="w-full max-w-md flex flex-col items-center gap-6 rounded-2xl border bg-card p-10 shadow-md text-center">
          <div className="flex flex-col items-center gap-2">
            <Trophy className="h-12 w-12 text-yellow-500" />
            <h2 className="text-2xl font-bold tracking-tight">Session Complete!</h2>
            <p className="text-muted-foreground text-sm">{deckName}</p>
          </div>

          <div className="w-full flex flex-col gap-2">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>Score</span>
              <span className="font-semibold text-foreground">{scorePercent}%</span>
            </div>
            <Progress value={scorePercent} className="h-3" />
          </div>

          <div className="w-full grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center gap-1 rounded-xl border bg-emerald-500/10 border-emerald-500/20 py-4">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
              <span className="text-2xl font-bold text-emerald-500">{correctCount}</span>
              <span className="text-xs text-muted-foreground">Correct</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-xl border bg-rose-500/10 border-rose-500/20 py-4">
              <XCircle className="h-6 w-6 text-rose-500" />
              <span className="text-2xl font-bold text-rose-500">{incorrectCount}</span>
              <span className="text-xs text-muted-foreground">Incorrect</span>
            </div>
          </div>

          <p className="text-muted-foreground text-sm">
            {total} card{total !== 1 ? "s" : ""} studied
          </p>

          <div className="w-full flex flex-col gap-3">
            <Button size="lg" className="w-full gap-2" onClick={handleStudyAgain}>
              <RotateCcw className="h-4 w-4" />
              Study Again
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2"
              onClick={() => router.push(`/decks/${deckId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Deck
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-8">
      {/* Progress bar */}
      <div className="w-full max-w-2xl flex flex-col gap-2">
        {/* Deck title */}
        <h1 className="text-2xl font-bold tracking-tight">{deckName}</h1>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Card {currentIndex + 1} of {total}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto gap-1.5 px-2 py-0 text-sm text-muted-foreground hover:text-foreground"
            onClick={handleShuffle}
          >
            <Shuffle className="h-3.5 w-3.5" />
            Shuffle
          </Button>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <div className="flex items-center gap-4 mt-1">
          <div className="flex items-center gap-1.5 text-sm text-emerald-500">
            <CheckCircle className="h-4 w-4" />
            <span className="font-semibold">{correctCount}</span>
            <span className="text-muted-foreground">correct</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-rose-500">
            <XCircle className="h-4 w-4" />
            <span className="font-semibold">{incorrectCount}</span>
            <span className="text-muted-foreground">incorrect</span>
          </div>
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-muted-foreground text-sm">
        Use <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">←</kbd>{" "}
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">→</kbd>{" "}
        arrow keys to navigate and{" "}
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">Space</kbd>{" "}
        to flip
      </p>

      {/* Flashcard */}
      <div
        className="w-full max-w-2xl cursor-pointer select-none"
        style={{ perspective: "1200px" }}
        onClick={handleFlip}
        role="button"
        aria-label={isFlipped ? "Card back — click to flip" : "Card front — click to flip"}
      >
        <div
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 0.55s cubic-bezier(0.45, 0, 0.55, 1)",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            position: "relative",
            height: "320px",
          }}
        >
          {/* Front */}
          <div
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl border bg-card p-10 shadow-md"
          >
            <Badge variant="secondary" className="absolute top-4 left-4 text-xs">
              Front
            </Badge>
            <p className="text-center text-xl font-semibold leading-relaxed">
              {currentCard.front}
            </p>
            <p className="text-muted-foreground text-sm mt-2">Click to reveal answer</p>
          </div>

          {/* Back */}
          <div
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl border bg-card p-10 shadow-md"
          >
            <Badge variant="outline" className="absolute top-4 left-4 text-xs">
              Back
            </Badge>
            <p className="text-muted-foreground text-sm absolute top-4 right-4">
              Click to flip back
            </p>
            <p className="text-center text-xl font-semibold leading-relaxed">
              {currentCard.back}
            </p>
          </div>
        </div>
      </div>

      {/* Correct / Incorrect buttons — visible only on back side */}
      {isFlipped && (
        <div className="flex items-center gap-4">
          <Button
            size="lg"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleCorrect}
          >
            <CheckCircle className="h-5 w-5" />
            Correct
          </Button>
          <Button
            size="lg"
            variant="destructive"
            className="gap-2"
            onClick={handleIncorrect}
          >
            <XCircle className="h-5 w-5" />
            Incorrect
          </Button>
        </div>
      )}

      {/* Navigation controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="lg"
          className="gap-2"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <Button
          variant="secondary"
          size="lg"
          className="gap-2 min-w-28"
          onClick={handleFlip}
        >
          <RefreshCw className="h-4 w-4" />
          {isFlipped ? "Unflip" : "Flip"}
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="gap-2"
          onClick={handleNext}
          disabled={currentIndex === total - 1}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
