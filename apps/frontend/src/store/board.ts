// store/boardStore.ts
import { create } from "zustand";

interface BoardStore {
  colors: string[];
  images: string[];
  theme: "light" | "dark" | "system";
  setTheme: (t: "light" | "dark") => void;
}

export const useBoardStore = create<BoardStore>((set) => ({
  colors: [
    "rgb(0, 121, 191)",   // xanh dương
    "rgb(210, 144, 52)",  // cam
    "rgb(81, 152, 57)",   // xanh lá
    "rgb(176, 70, 50)",   // đỏ gạch
    "rgb(137, 96, 158)",  // tím nhạt
    "rgb(205, 90, 145)",  // hồng
    "rgb(255, 204, 102)", // vàng nhạt
    "rgb(102, 204, 255)", // xanh da trời
  ],
  images: [
    "/backgrounds/muaxuan2.png",
    "/backgrounds/muahe2.png",
    "/backgrounds/muathu2.png",
    "/backgrounds/thiennhien.png",
    "/backgrounds/muaxuan.png",
  ],
  
  theme: "light",
  setTheme: (theme) => set({ theme }),
}));
