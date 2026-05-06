import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ScraperService } from './scraper.service';
import { LlmService } from '../../project/internal/llm/llm.service';

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

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().match(/\b\w{3,}\b/g) || [];
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'to', 'of', 'and', 'in', 'on', 'for', 'with', 'as', 'at', 'by', 'this', 'that', 'it', 'news', 'tin', 'tức', 'mới']);
    return [...new Set(words.filter(w => !stopWords.has(w) && w.length > 3))].slice(0, 5);
  }

  /**
   * Use LLM to get high-quality English search terms for Unsplash/Pexels from VN content
   */
  private async refineSearchTerms(title: string, content: string): Promise<string[]> {
    try {
      const prompt = `Analyze this news title and summary, then provide exactly 3-5 highly relevant English search keywords for finding a high-quality stock photo on Unsplash. 
      The keywords should be specific to the visual topic and optimized for image search.
      
      Title: "${title}"
      Summary: "${content.substring(0, 300)}..."
      
      Return ONLY the keywords separated by commas. No other text.`;
      
      const res = await this.llm.completeText(prompt);
      const text = res.content.trim();
      if (!text || text.length < 3) return [];
      
      return text.split(/[,\n]+/)
        .map(k => k.replace(/[^a-zA-Z0-9\s]/g, '').trim())
        .filter(k => k.length > 0)
        .slice(0, 5);
    } catch (err: any) {
      this.logger.warn(`Failed to refine search terms: ${err.message}`);
      return [];
    }
  }

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
      // Use AI to refine keywords from title/content for better results
      const refined = await this.refineSearchTerms(title, content);
      searchTerms = refined.length > 0 ? refined : this.extractKeywords(title);
    }
    
    // Add variations (first term + original title)
    if (searchTerms.length > 0) {
      searchTerms.push(title.substring(0, 60)); 
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

    // 3. Rank and Validate candidates
    this.logger.log(`Ranking ${candidates.length} candidate images...`);
    
    const scoredCandidates = [];
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
        try {
          const textEmbedding = await this.llm.getEmbeddings(targetText);
          if (textEmbedding.length > 0) {
            const sim = this.cosineSimilarity(articleEmbedding, textEmbedding);
            cand.score += sim * 10; 
          }
        } catch {}
      }
      
      // Bonus for high-quality sources
      if (cand.source === 'unsplash') matchScore += 2;
      if (cand.source === 'pexels') matchScore += 1.5;

      // Add small randomness to avoid picking the same image every time for the same topic
      cand.score += matchScore + (Math.random() * 2); 
      scoredCandidates.push(cand);
    }

    // Sort by score
    const sorted = scoredCandidates.sort((a, b) => b.score - a.score);
    
    // Pick and VALIDATE top 15 candidates
    const topCount = Math.min(15, sorted.length);
    const pool = sorted.slice(0, topCount);
    
    // Shuffle the pool for randomness
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    for (const best of pool) {
      if (await this.isUrlAccessible(best.url)) {
        this.logger.log(`Selected accessible image: ${best.url} (Score: ${best.score.toFixed(2)})`);
        return best.url;
      }
      this.logger.warn(`Skipping dead image link: ${best.url}`);
    }
    
    return pool[0]?.url || null; // Fallback to first even if validation failed if all else fails
  }

  /**
   * Quick check if image URL is actually reachable
   */
  async isUrlAccessible(url: string): Promise<boolean> {
    try {
      if (!url || !url.startsWith('http')) return false;
      // Use a more realistic browser User-Agent
      const headers = { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      };
      
      const res = await axios.head(url, { timeout: 3000, headers });
      return res.status >= 200 && res.status < 400;
    } catch (err) {
      // Some servers block HEAD (like Wikipedia or some CDNs), try a minimal GET
      try {
        const res = await axios.get(url, { 
          timeout: 2000, 
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          responseType: 'stream' // Don't download full body
        });
        res.data.destroy(); // Close stream immediately
        return res.status >= 200 && res.status < 400;
      } catch {
        return false;
      }
    }
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
    const result = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return isNaN(result) ? 0 : result;
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
}
