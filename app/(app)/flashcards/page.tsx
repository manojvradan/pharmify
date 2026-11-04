import type { Metadata } from "next";
import { FlashcardDeck } from "@/components/FlashcardDeck";

export const metadata: Metadata = { title: "Code of Ethics flashcards" };

export default function FlashcardsPage() {
  return <FlashcardDeck />;
}
