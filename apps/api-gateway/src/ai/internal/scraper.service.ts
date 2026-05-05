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
   * Search for links using DuckDuckGo Lite (simpler HTML, very resilient)
   */
  async searchLinks(query: string): Promise<string[]> {
    try {
      this.logger.log(`Searching for: ${query}`);
      // Lite version is even simpler than the html version
      const searchUrl = `https://duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      const html = response.data;
      const links: string[] = [];
      
      // DuckDuckGo Lite has links in <a class="result-link" href="...">
      const regex = /class="result-link"\s+href="([^"]+)"/g;
      let match;
      while ((match = regex.exec(html)) !== null) {
        let url = match[1];
        if (url.startsWith('//')) url = 'https:' + url;
        
        if (!url.includes('duckduckgo.com') && url.startsWith('http')) {
          links.push(url);
        }
        if (links.length >= 5) break; 
      }

      // Fallback 1: DuckDuckGo alternative regex
      if (links.length === 0) {
        const altRegex = /class="result__a"\s+href="([^"]+)"/g;
        let altMatch;
        while ((altMatch = altRegex.exec(html)) !== null) {
          let url = altMatch[1];
          if (!url.includes('duckduckgo.com') && url.startsWith('http')) {
            links.push(url);
          }
        }
      }

      // Fallback 2: Bing (if DDG fails)
      if (links.length === 0) {
        this.logger.log('DuckDuckGo returned 0 links, trying Bing fallback');
        try {
          const bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
          const bRes = await axios.get(bingUrl, {
             headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
             timeout: 5000
          });
          const bHtml = bRes.data;
          const bRegex = /<h2><a\s+href="([^"]+)"/g;
          let bMatch;
          while ((bMatch = bRegex.exec(bHtml)) !== null) {
            if (!bMatch[1].includes('bing.com') && bMatch[1].startsWith('http')) {
              links.push(bMatch[1]);
            }
            if (links.length >= 3) break;
          }
        } catch (err) {
           this.logger.warn(`Bing fallback failed: ${(err as any).message}`);
        }
      }

      this.logger.log(`Found ${links.length} links from DuckDuckGo search`);
      return links;
    } catch (error: any) {
      this.logger.warn(`Search failed: ${error.message}`);
      return [];
    }
  }

  async searchImages(query: string): Promise<string[]> {
    try {
      this.logger.log(`Performing image search for: ${query}`);
      
      // Strategy 1: Bing Images
      const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 8000
      });

      const html = response.data;
      const images: string[] = [];
      
      // Extract from Bing murl
      const murlRegex = /"murl":"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/gi;
      let match;
      while ((match = murlRegex.exec(html)) !== null) {
        images.push(match[1]);
        if (images.length >= 10) break;
      }

      // Strategy 2: Google Images Fallback (Strongest fallback)
      if (images.length === 0) {
        this.logger.log('Bing failed, trying Google Images Mobile...');
        try {
          const gUrl = `https://www.google.com.vn/search?q=${encodeURIComponent(query)}&tbm=isch&asearch=ichunk&async=_id:rg_s,_pms:s,_jsfs:FCH_1`;
          const gRes = await axios.get(gUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36'
            }
          });
          // Google JSON structure for images
          const gRegex = /"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp))",[0-9]+,[0-9]+/gi;
          let gMatch;
          while ((gMatch = gRegex.exec(gRes.data)) !== null) {
            if (!gMatch[1].includes('google.')) {
              images.push(gMatch[1]);
            }
            if (images.length >= 10) break;
          }
        } catch (e) {
          this.logger.warn(`Google fallback failed: ${(e as any).message}`);
        }
      }

      // Strategy 3: DuckDuckGo Lite (Images are sometimes in the source)
      if (images.length === 0) {
         this.logger.log('Google failed, trying DuckDuckGo fallback');
         const ddgUrl = `https://duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
         const ddgRes = await axios.get(ddgUrl);
         const imgRegex = /src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png))"/gi;
         let imgMatch;
         while ((imgMatch = imgRegex.exec(ddgRes.data)) !== null) {
            if (!imgMatch[1].includes('duckduckgo.com')) {
               images.push(imgMatch[1]);
            }
         }
      }

      // FINAL COMPACT FALLBACK: If absolutely nothing found, use high-quality neutral article images
      if (images.length === 0) {
         this.logger.warn('All scrapers failed. Using neutral placeholder fallback.');
         images.push(`https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80`); // News/Paper
         images.push(`https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80`); // Newspaper
      }

      this.logger.log(`Found ${images.length} candidate images total for: ${query}`);
      return [...new Set(images)];
    } catch (error: any) {
      this.logger.warn(`Image search failed: ${error.message}`);
      return [];
    }
  }
}
