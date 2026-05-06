import { autoRequest } from "./auto.request";

export interface SearchResults {
  projects: any[];
  news: any[];
  posts: any[];
}

class SearchService {
  async search(query: string): Promise<SearchResults> {
    try {
      const res = await autoRequest<any>(`/search`, {
        params: { q: query }
      });
      
      // Normalize response
      const data = res?.data || res || {};
      
      return {
        projects: Array.isArray(data.projects) ? data.projects : [],
        news: Array.isArray(data.news) ? data.news : [],
        posts: Array.isArray(data.posts) ? data.posts : []
      };
    } catch (err: any) {
      console.error("Search failed:", err);
      return { projects: [], news: [], posts: [] };
    }
  }
}

export const searchService = new SearchService();
