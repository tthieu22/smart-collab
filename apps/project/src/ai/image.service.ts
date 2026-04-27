import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ScraperService } from './scraper.service';
import { LlmService } from '../llm/llm.service';

interface ImageCandidate {
  url: string;
  source: string;
  description?: string;
  alt?: string;
  score: number;
}

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  constructor(
    private readonly scraper: ScraperService,
    private readonly llm: LlmService
  ) {}

  /**
   * Production-grade Semantic Image Search
   */
  async searchRelevantImage(params: {
    title: string;
    content: string;
    keywords?: string;
  }): Promise<string | null> {
    const { title, content, keywords } = params;
    this.logger.log(`Starting semantic image search for: ${title}`);

    // 1. Resolve keywords (use AI suggested if present, otherwise extract)
    let searchTerms: string[] = [];
    if (keywords && keywords.length > 5) {
      searchTerms = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    } else {
      searchTerms = this.extractKeywords(title);
    }
    
    // Add variations
    if (searchTerms.length > 0) {
      searchTerms.push(title.substring(0, 50)); 
    }

    const candidates: ImageCandidate[] = [];
    const articleEmbedding = await this.llm.getEmbeddings(title + " " + content.substring(0, 200));

    // 2. Gather candidates from multiple keywords across multiple providers
    for (const term of searchTerms.slice(0, 4)) {
      const providerResults = await Promise.all([
        this.searchUnsplashDetailed(term),
        this.searchPexelsDetailed(term),
        this.scraper.searchImages(term)
      ]);

      // Flatten and map to candidates
      const [unsplash, pexels, scraped] = providerResults;
      
      unsplash.forEach(img => candidates.push(img));
      pexels.forEach(img => candidates.push(img));
      scraped.forEach(url => candidates.push({
        url,
        source: 'web',
        score: searchTerms.indexOf(term) === 0 ? 0.8 : 0.5 // Base score for scraped
      }));
    }

    if (candidates.length === 0) return null;

    // 3. Rank candidates
    this.logger.log(`Ranking ${candidates.length} candidate images...`);
    
    for (const cand of candidates) {
      // Basic text matching
      const targetText = (cand.description || cand.alt || '').toLowerCase();
      let matchScore = 0;
      
      searchTerms.forEach(term => {
        const cleanTerm = term.toLowerCase().trim();
        if (targetText.includes(cleanTerm)) {
          matchScore += 3; // Direct keyword match is high value
        }
        
        // Partial match
        const parts = cleanTerm.split(' ');
        parts.forEach(p => {
          if (p.length > 3 && targetText.includes(p)) matchScore += 0.5;
        });
      });

      // Semantic matching fallback (only if Ollama is running)
      if (articleEmbedding && articleEmbedding.length > 0 && targetText.length > 10) {
        const textEmbedding = await this.llm.getEmbeddings(targetText);
        if (textEmbedding.length > 0) {
          const sim = this.cosineSimilarity(articleEmbedding, textEmbedding);
          cand.score += sim * 10; 
        }
      }
      
      // Bonus for high-quality sources
      if (cand.source === 'unsplash') matchScore += 2;
      if (cand.source === 'pexels') matchScore += 1.5;

      // Add small randomness to avoid picking the same image every time for the same topic
      cand.score += matchScore + (Math.random() * 2); 
    }

    // Sort by score
    const sorted = candidates.sort((a, b) => b.score - a.score);
    
    // Pick from top 3 to keep it fresh but relevant
    const topCount = Math.min(3, sorted.length);
    const randomIndex = Math.floor(Math.random() * topCount);
    const best = sorted[randomIndex];

    this.logger.log(`Selected image: ${best.url} (Rank: ${randomIndex + 1}, Score: ${best.score.toFixed(2)})`);
    
    return best.url;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private async searchUnsplashDetailed(query: string): Promise<ImageCandidate[]> {
    try {
      const accessKey = process.env.UNSPLASH_ACCESS_KEY;
      if (!accessKey) return [];

      const res = await axios.get(`https://api.unsplash.com/search/photos`, {
        params: { query, per_page: 5, orientation: 'landscape' },
        headers: { Authorization: `Client-ID ${accessKey}` }
      });

      return (res.data.results || []).map((img: any) => ({
        url: img.urls.regular,
        description: img.description || img.alt_description,
        source: 'unsplash',
        score: 1.0 // Unsplash usually higher quality
      }));
    } catch { return []; }
  }

  private async searchPexelsDetailed(query: string): Promise<ImageCandidate[]> {
    try {
      const apiKey = process.env.PEXELS_API_KEY;
      if (!apiKey) return [];

      const res = await axios.get(`https://api.pexels.com/v1/search`, {
        params: { query, per_page: 5, orientation: 'landscape' },
        headers: { Authorization: apiKey }
      });

      return (res.data.photos || []).map((img: any) => ({
        url: img.src.large,
        description: img.alt,
        source: 'pexels',
        score: 0.9
      }));
    } catch { return []; }
  }

  async searchImages(query: string): Promise<string[]> {
    // Keep backward compatibility for simple calls
    const res = await this.searchRelevantImage({ title: query, content: query });
    return res ? [res] : [];
  }

  private async searchUnsplash(query: string): Promise<string | null> {
    try {
      // For production, use process.env.UNSPLASH_ACCESS_KEY
      // If no key, we can try a high-quality placeholder or direct source link
      const accessKey = process.env.UNSPLASH_ACCESS_KEY;
      if (accessKey) {
        const res = await axios.get(`https://api.unsplash.com/search/photos`, {
          params: { query, per_page: 1, orientation: 'landscape' },
          headers: { Authorization: `Client-ID ${accessKey}` }
        });
        return res.data.results?.[0]?.urls?.regular || null;
      }
      
      // Fallback: None (moving to scraper which is more reliable)
      return null;
    } catch (error: any) {
      this.logger.warn(`Unsplash search failed: ${error.message}`);
      return null;
    }
  }

  private async searchPexels(query: string): Promise<string | null> {
    try {
      const apiKey = process.env.PEXELS_API_KEY;
      if (!apiKey) return null;

      const res = await axios.get(`https://api.pexels.com/v1/search`, {
        params: { query, per_page: 1, orientation: 'landscape' },
        headers: { Authorization: apiKey }
      });
      return res.data.photos?.[0]?.src?.large || null;
    } catch (error: any) {
      this.logger.warn(`Pexels search failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Generate keywords from a title using AI or simple extraction
   */
  extractKeywords(title: string): string[] {
    const commonWords = ['news', 'tin', 'tức', 'mới', 'nhat', 'về', 'trong', 'của', 'và', 'là'];
    return title.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word))
      .slice(0, 3);
  }
}
