import { create } from "zustand";

interface BoardStore {
  colors: string[];
  images: string[];
  theme: "light" | "dark" | "system";
  resolvedTheme: "light" | "dark"; // theme đã resolve từ system
  ready: boolean;
  setTheme: (t: "light" | "dark" | "system") => void;
}

export const useBoardStore = create<BoardStore>((set) => {
  let initialTheme: "light" | "dark" | "system" = "light";
  let resolved: "light" | "dark" = "light";

  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("theme");
    // Nếu không có trong storage hoặc storage bị lỗi, mặc định là light
    if (saved === "light" || saved === "dark" || saved === "system") {
      initialTheme = saved as "light" | "dark" | "system";
    } else {
      initialTheme = "light";
      localStorage.setItem("theme", "light");
    }

    if (initialTheme === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        const currentTheme = useBoardStore.getState().theme;
        if (currentTheme === "system") {
          set({ resolvedTheme: e.matches ? "dark" : "light" });
          document.documentElement.classList.toggle("dark", e.matches);
        }
      });
    } else {
      resolved = initialTheme;
    }

    // Đồng bộ class dark ngay khi khởi tạo ở client
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }

  return {
    colors: [
      "rgb(0, 121, 191)",
      "rgb(210, 144, 52)",
      "rgb(81, 152, 57)",
      "rgb(176, 70, 50)",
      "rgb(137, 96, 158)",
      "rgb(205, 90, 145)",
      "rgb(255, 204, 102)",
      "rgb(102, 204, 255)",
    ],
    images: [
      "/backgrounds/muaxuan2.png",
      "/backgrounds/muahe2.png",
      "/backgrounds/muathu2.png",
      "/backgrounds/thiennhien.png",
      "/backgrounds/muaxuan.png",
    ],
    theme: initialTheme,
    resolvedTheme: resolved,
    ready: true,
    setTheme: (theme) => {
      let newResolved: "light" | "dark" = theme === "system"
        ? (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light")
        : theme;

      set({ theme, resolvedTheme: newResolved });
      
      if (typeof window !== "undefined") {
        document.documentElement.classList.toggle("dark", newResolved === "dark");
        try {
          localStorage.setItem("theme", theme);
        } catch {}
      }
    },
  };
});
