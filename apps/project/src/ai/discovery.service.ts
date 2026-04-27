import { Injectable, Logger } from '@nestjs/common';
import Parser from 'rss-parser';

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);
  private readonly parser = new Parser();

  /**
   * Discover content from various sources
   */
  async discover(sources: string[]): Promise<any[]> {
    const results = [];
    
    for (const source of sources) {
      if (source.includes('rss') || source.endsWith('.xml') || source.includes('/feed')) {
        const items = await this.crawlRss(source);
        results.push(...items);
      }
    }

    return results;
  }

  /**
   * RSS Crawling
   */
  async crawlRss(url: string): Promise<any[]> {
    try {
      this.logger.log(`Crawling RSS: ${url}`);
      const feed = await this.parser.parseURL(url);
      return feed.items.map((item: any) => ({
        title: item.title,
        content: item.contentSnippet || item.content,
        link: item.link,
        source: feed.title || 'RSS'
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`RSS crawl failed for ${url}: ${message}`);
      return [];
    }
  }

  /**
   * Google Trends / Topic generation (Simulated or via API)
   */
  async getTrendingTopics(count: number = 5): Promise<string[]> {
    // In production, use a Google Trends API or scrape
    // For now, return some high-quality tech topics
    return [
      'AI in 2026',
      'Quantum Computing breakthrough',
      'Sustainable Tech trends',
      'The future of Web3',
      'Cybersecurity in the age of AI'
    ].slice(0, count);
  }
}
