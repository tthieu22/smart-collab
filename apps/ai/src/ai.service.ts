import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  async processRequest(prompt: string) {
    return { prompt, response: 'AI response placeholder' };
  }
}
