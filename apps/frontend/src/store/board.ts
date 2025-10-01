// store/boardStore.ts
import { create } from "zustand";

interface BoardStore {
  colors: string[];
  images: string[];
}

export const useBoardStore = create<BoardStore>(() => ({
  colors: ["#0079BF", "#D29034", "#519839", "#B04632", "#89609E", "#CD5A91"],
  images: [
    "https://source.unsplash.com/200x100/?nature",
    "https://source.unsplash.com/200x100/?city",
    "https://source.unsplash.com/200x100/?tech",
  ],
}));
