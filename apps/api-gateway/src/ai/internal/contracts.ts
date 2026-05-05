// =======================
// ANALYZE DOMAIN
// =======================
export interface AnalyzeDomainInput {
  prompt: string;
  locale?: string;
}

export interface AnalyzeDomainOutput {
  project: {
    name: string;
    description?: string;
  };
  boards: Array<{
    title: string;
    type: string;
  }>;
  columns: Array<{
    title: string;
  }>;
  cards: Array<{
    title: string;
    description?: string;
  }>;
  cardDetails: {
    checklist?: string[];
    labels?: string[];
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    deadline?: string;
  };
}

// =======================
// BUILD PROJECT
// =======================
export interface BuildProjectInput {
  prompt: string;
  ownerId: string;
  locale?: string;
}

export interface BuildProjectOutput {
  status: 'BOARD_READY';
  project: {
    id: string;
    name: string;
    description?: string;
  };
  board: {
    id: string;
    title: string;
    type: string;
  };
}
