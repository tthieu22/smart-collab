import { create } from "zustand";

export interface Card {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  containerId: string;
}

export interface Column {
  id: string;
  title: string;
  containerId: string;
  position: number;
  cardIds: string[];
}

export interface Container {
  id: string;
  title: string;
  type: "board" | "inbox" | "calendar";
  columnIds: string[];
}

interface BoardStore {
  // Giao diện kéo thả
  containers: Container[];
  columns: Record<string, Column>;
  cards: Record<string, Card>;
  moveCard: (cardId: string, destColumnId: string, destContainerId: string, index: number) => void;
  moveColumn: (columnId: string, destContainerId: string, index: number) => void;
  addColumn: (containerId: string, title: string) => void;
  addCard: (columnId: string, title: string) => void;

  // Cấu hình UI
  colors: string[];
  images: string[];
  theme: "light" | "dark" | "system";
  setTheme: (t: "light" | "dark") => void;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  // --- DỮ LIỆU BAN ĐẦU ---
  containers: [
    { id: "board", title: "Board", type: "board", columnIds: ["col-1", "col-2"] },
    { id: "inbox", title: "Inbox", type: "inbox", columnIds: ["col-3"] },
    { id: "calendar", title: "Calendar", type: "calendar", columnIds: ["col-4"] },
  ],
  columns: {
    "col-1": { id: "col-1", title: "To Do", containerId: "board", position: 0, cardIds: ["c-1"] },
    "col-2": { id: "col-2", title: "In Progress", containerId: "board", position: 1, cardIds: ["c-2"] },
    "col-3": { id: "col-3", title: "Inbox", containerId: "inbox", position: 0, cardIds: ["c-3"] },
    "col-4": { id: "col-4", title: "Calendar", containerId: "calendar", position: 0, cardIds: ["c-4"] },
  },
  cards: {
    "c-1": { id: "c-1", title: "Task 1", columnId: "col-1", containerId: "board" },
    "c-2": { id: "c-2", title: "Task 2", columnId: "col-2", containerId: "board" },
    "c-3": { id: "c-3", title: "Inbox Task", columnId: "col-3", containerId: "inbox" },
    "c-4": { id: "c-4", title: "Calendar Event", columnId: "col-4", containerId: "calendar" },
  },

  // --- HÀNH VI KÉO THẢ ---
  moveCard: (cardId, destColumnId, destContainerId, index) => {
    const { cards, columns } = get();
    const card = cards[cardId];
    if (!card) return;

    const srcCol = columns[card.columnId];
    const destCol = columns[destColumnId];
    srcCol.cardIds = srcCol.cardIds.filter(id => id !== cardId);
    destCol.cardIds.splice(index, 0, cardId);
    card.columnId = destColumnId;
    card.containerId = destContainerId;

    set({ columns: { ...columns }, cards: { ...cards } });
  },

  moveColumn: (columnId, destContainerId, index) => {
    const { containers, columns } = get();
    const column = columns[columnId];
    const src = containers.find(c => c.id === column.containerId)!;
    const dest = containers.find(c => c.id === destContainerId)!;
    src.columnIds = src.columnIds.filter(id => id !== columnId);
    dest.columnIds.splice(index, 0, columnId);
    column.containerId = destContainerId;
    set({ containers: [...containers], columns: { ...columns } });
  },

  addColumn: (containerId, title) => {
    const id = "col-" + Math.random().toString(36).substring(2, 9);
    const { containers, columns } = get();
    const container = containers.find(c => c.id === containerId)!;
    const newCol: Column = { id, title, containerId, position: 0, cardIds: [] };
    container.columnIds.push(id);
    set({ columns: { ...columns, [id]: newCol }, containers: [...containers] });
  },

  addCard: (columnId, title) => {
    const id = "c-" + Math.random().toString(36).substring(2, 9);
    const { cards, columns } = get();
    const col = columns[columnId];
    const newCard: Card = { id, title, columnId, containerId: col.containerId };
    col.cardIds.push(id);
    set({ cards: { ...cards, [id]: newCard }, columns: { ...columns } });
  },

  // --- MÀU, ẢNH, THEME ---
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
  theme: "light",
  setTheme: (theme) => set({ theme }),
}));
