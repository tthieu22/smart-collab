import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { AiHandler } from './internal/ai.handler';

@Injectable()
export class AiService {
  constructor(
    @Inject(forwardRef(() => AiHandler))
    private readonly handler: AiHandler
  ) {}

  async send(pattern: { cmd: string }, payload: any) {
    const { cmd } = pattern;
    switch (cmd) {
      case 'ai.build-project': return this.handler.buildProject(payload);
      case 'ai.generate-card': return this.handler.generateCard(payload);
      case 'ai.analyze-board': return this.handler.analyzeBoard(payload);
      case 'ai.ask-board': return this.handler.askBoard(payload);
      case 'ai.chat': return this.handler.chat(payload);
      case 'ai.optimize-post': return this.handler.optimizePost(payload);
      case 'ai.get-embeddings': return this.handler.getEmbeddings(payload);
      case 'ai.discover-content': return this.handler.discoverContent(payload);
      case 'ai.generate-news-post': return this.handler.generateNewsPost(payload);
      case 'ai.search-images': return this.handler.searchImages(payload);
      case 'ai.generate-subtasks': return this.handler.generateSubtasks(payload);
      case 'ai.analyze-project-health': return this.handler.analyzeProjectHealth(payload);
      case 'ai.analyze-sentiment': return this.handler.analyzeSentiment(payload);
      case 'ai.predict-timeline': return this.handler.predictTimeline(payload);
      default:
        throw new Error(`Unhandled AI command: ${cmd}`);
    }
  }
}
