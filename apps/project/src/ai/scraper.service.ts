import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  /**
   * Simple scraper to get text content from a URL
   */
  async scrapeUrl(url: string): Promise<{ text: string; images: string[] }> {
    try {
      this.logger.log(`Scraping URL: ${url}`);
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const html = response.data;
      
      // Try to target main content areas first
      let contentArea = html;
      const articleMatch = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
      const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
      
      if (articleMatch) contentArea = articleMatch[1];
      else if (mainMatch) contentArea = mainMatch[1];

      // Extract images
      const images: string[] = [];
      
      // 1. Look for Open Graph images (usually the best ones)
      const ogMatch = html.match(/<meta\b[^>]*property="og:image"[^>]*content="([^"]+)"/i) || 
                      html.match(/<meta\b[^>]*content="([^"]+)"[^>]*property="og:image"/i);
      if (ogMatch) images.push(ogMatch[1]);

      // 2. Look for Twitter images
      const twitterMatch = html.match(/<meta\b[^>]*name="twitter:image"[^>]*content="([^"]+)"/i);
      if (twitterMatch) images.push(twitterMatch[1]);

      // 3. Look for regular images in content
      const imgRegex = /<img\b[^>]*src="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/gi;
      let imgMatch;
      while ((imgMatch = imgRegex.exec(contentArea)) !== null) {
        let imgUrl = imgMatch[1];
        if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
        if (imgUrl.startsWith('/')) {
           try {
             const origin = new URL(url).origin;
             imgUrl = origin + imgUrl;
           } catch {}
        }
        if (imgUrl.startsWith('http') && !images.includes(imgUrl)) {
          images.push(imgUrl);
        }
        if (images.length >= 10) break;
      }

      // Basic HTML stripping
      const text = contentArea
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, '')
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gmi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return { text: text.substring(0, 5000), images };
    } catch (error: any) {
      this.logger.warn(`Failed to scrape ${url}: ${error.message}`);
      return { text: '', images: [] };
    }
  }

  /**
   * Search google (via a simple search engine if possible, otherwise we use duckduckgo/bing if available)
   * Note: In a real production app, you'd use Google Search API (SerpApi).
   */
  async searchLinks(query: string): Promise<string[]> {
    try {
      this.logger.log(`Searching for: ${query}`);
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=nws`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const html = response.data;
      const links: string[] = [];
      
      // Simple regex to find external links in search results
      // This is a rough heuristic and would be replaced by a proper API in production
      const regex = /href="\/url\?q=(https?:\/\/[^"&]+)/g;
      let match;
      while ((match = regex.exec(html)) !== null) {
        const url = decodeURIComponent(match[1]);
        if (!url.includes('google.com') && !links.includes(url)) {
          links.push(url);
        }
        if (links.length >= 3) break; // Get top 3
      }

      this.logger.log(`Found ${links.length} links from search`);
      return links;
    } catch (error: any) {
      this.logger.warn(`Search failed: ${error.message}`);
      return [];
    }
  }
}
