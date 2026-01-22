import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptFactory {
  domain(prompt: string, locale = 'vi') {
    return `
You are a project planning AI.

User prompt:
"${prompt}"

Return JSON with structure:
{
  "project": { "name": "", "description": "" },
  "boards": [{ "title": "" }],
  "columns": [{ "title": "" }],
  "cards": [{ "title": "", "description": "" }],
  "cardDetails": {
    "priority": 1,
    "deadline": "2025-12-31",
    "labels": ["AI"],
    "checklist": ["Step 1", "Step 2"]
  }
}

Language: ${locale}
ONLY JSON.
`;
  }
}
