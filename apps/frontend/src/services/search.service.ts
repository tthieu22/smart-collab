import { autoRequest } from "./auto.request";

export interface SearchResults {
  projects: any[];
  news: any[];
  posts: any[];
}

class SearchService {
  async search(query: string): Promise<SearchResults> {
    try {
      const res = await autoRequest<SearchResults>(`/search`, {
        params: { q: query }
      });
      return res;
    } catch (err: any) {
      console.error("Search failed:", err);
      return { projects: [], news: [], posts: [] };
    }
  }
}

export const searchService = new SearchService();
