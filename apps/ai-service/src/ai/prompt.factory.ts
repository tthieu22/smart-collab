import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptFactory {
  // ================= DOMAIN =================
  analyzeDomain(userPrompt: string, locale = 'vi') {
    return `
You are a senior product analyst.

User idea:
"${userPrompt}"

Return ONLY valid JSON:
{
  "domain": "",
  "subDomain": "",
  "description": "",
  "targetUsers": [],
  "mainGoals": []
}

Language: ${locale}
ONLY JSON.`;
  }

  // ================= PROJECT =================
  generateProject(domain: any, locale = 'vi') {
    return `
You are a project planner AI.

Domain info:
${JSON.stringify(domain)}

Return ONLY valid JSON:
{
  "name": "",
  "description": "",
  "visibility": "PRIVATE"
}

Language: ${locale}
ONLY JSON.`;
  }

  // ================= BOARDS =================
  generateBoards(project: any, locale = 'vi') {
    return `
You are a kanban system designer.

Project:
${JSON.stringify(project)}

Return ONLY valid JSON:
{
  "boards": [
    { "title": "", "order": 1 }
  ]
}

Language: ${locale}
ONLY JSON.`;
  }

  // ================= COLUMNS =================
  generateColumns(board: any, locale = 'vi') {
    return `
You are designing kanban columns.

Board:
${JSON.stringify(board)}

Return ONLY valid JSON:
{
  "columns": [
    { "title": "", "order": 1 }
  ]
}

Language: ${locale}
ONLY JSON.`;
  }

  // ================= CARDS =================
  generateCards(board: any, column: any, locale = 'vi') {
    return `
You are generating tasks (cards).

Board:
${JSON.stringify(board)}

Column:
${JSON.stringify(column)}

Return ONLY valid JSON:
{
  "cards": [
    {
      "title": "",
      "description": ""
    }
  ]
}

Language: ${locale}
ONLY JSON.`;
  }

  // ================= CARD DETAILS =================
  generateCardDetails(card: any, locale = 'vi') {
    return `
You are enriching a task card.

Card:
${JSON.stringify(card)}

Return ONLY valid JSON:
{
  "priority": 1,
  "deadline": "YYYY-MM-DD",
  "labels": [],
  "checklist": []
}

Language: ${locale}
ONLY JSON.`;
  }

  // ================= CARD VIEW =================
  generateCardView(card: any, locale = 'vi') {
    return `
You are generating UI metadata for a task card.

Card:
${JSON.stringify(card)}

Return ONLY valid JSON:
{
  "icon": "",
  "color": "",
  "coverImage": ""
}

Language: ${locale}
ONLY JSON.`;
  }
}
