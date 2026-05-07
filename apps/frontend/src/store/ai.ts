import { create } from 'zustand';

interface AIStore {
  isAIChatOpen: boolean;
  setIsAIChatOpen: (open: boolean) => void;
  toggleAIChat: () => void;
}

export const useAIStore = create<AIStore>((set) => ({
  isAIChatOpen: false,
  setIsAIChatOpen: (open) => set({ isAIChatOpen: open }),
  toggleAIChat: () => set((state) => ({ isAIChatOpen: !state.isAIChatOpen })),
}));
