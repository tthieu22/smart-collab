import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptFactory {
  // ================= DOMAIN ANALYSIS =================
  analyzeDomain(userPrompt: string, locale = 'vi') {
    return `
You are a senior product analyst and Kanban expert.

User idea:
"${userPrompt}"

Analyze the idea and return **ONLY valid JSON**. No explanation, no markdown, no extra text.

Required structure:
{
  "domain": "Tên domain chính (ngắn gọn)",
  "subDomain": "Tên subdomain nếu có",
  "description": "Mô tả chi tiết dự án bằng tiếng ${locale}",
  "targetUsers": ["Người dùng 1", "Người dùng 2", ...],
  "mainGoals": ["Mục tiêu chính 1", "Mục tiêu chính 2", ...]
}

Yêu cầu:
- Language: ${locale}
- CHỈ TRẢ VỀ JSON HỢP LỆ, KHÔNG CÓ CHỮ NÀO KHÁC.
`;
  }

  // ================= PROJECT =================
  generateProject(domain: any, locale = 'vi') {
    return `
You are a project planner AI.

Domain info:
${JSON.stringify(domain, null, 2)}

Return ONLY valid JSON:
{
  "name": "Tên dự án ngắn gọn, hấp dẫn",
  "description": "Mô tả chi tiết dự án bằng tiếng ${locale}",
  "visibility": "PRIVATE"
}

Language: ${locale}
ONLY JSON. No extra text.
`;
  }

  // ================= BOARDS =================
  // (Hiện tại bạn dùng default board, nên prompt này có thể không dùng nữa)
  // Nhưng giữ lại để sau này nếu muốn AI sinh nhiều board
  generateBoards(project: any, locale = 'vi') {
    return `
You are a Kanban system designer.

Project:
${JSON.stringify(project, null, 2)}

Return ONLY valid JSON:
{
  "boards": [
    { "title": "Tên board chính (ví dụ: Main Board)", "order": 1 },
    { "title": "Tên board phụ nếu cần", "order": 2 }
  ]
}

Language: ${locale}
ONLY JSON. Nếu chỉ cần 1 board thì trả mảng có 1 phần tử.
`;
  }

  // ================= COLUMNS =================
  // Prompt này sẽ được gọi sau khi board đã tồn tại thực tế
  generateColumns(board: any, project: any, domain: any, locale = 'vi') {
    return `
You are a Kanban board designer expert.

Project: ${JSON.stringify(project, null, 2)}
Board: ${JSON.stringify(board, null, 2)}
Domain analysis: ${JSON.stringify(domain, null, 2)}

Design a suitable set of columns for this Kanban board based on the project and domain.

Return ONLY valid JSON:
{
  "columns": [
    {
      "title": "Tên cột (ví dụ: Backlog, To Do, In Progress, Review, Done)",
      "description": "Mô tả ngắn gọn về cột này (tùy chọn)",
      "position": số thứ tự (bắt đầu từ 0)
    },
    ...
  ]
}

Yêu cầu:
- Ít nhất 3–5 cột phù hợp với dự án.
- Tên cột bằng tiếng ${locale} nếu phù hợp.
- Language: ${locale}
- CHỈ TRẢ VỀ JSON HỢP LỆ. Không có text ngoài JSON.
`;
  }

  // ================= CARDS =================
  generateCards(board: any, column: any, domain: any, locale = 'vi') {
    return `
You are a task generator for Kanban.

Project context: ${JSON.stringify({ board, domain }, null, 2)}
Column: ${JSON.stringify(column, null, 2)}

Generate realistic tasks (cards) for this column.

Return ONLY valid JSON:
{
  "cards": [
    {
      "title": "Tên công việc rõ ràng",
      "description": "Mô tả chi tiết (tùy chọn)",
      "position": số thứ tự (bắt đầu từ 0)
    },
    ...
  ]
}

Yêu cầu:
- Tạo 3–10 card phù hợp với cột và dự án.
- Title bằng tiếng ${locale} nếu phù hợp.
- Language: ${locale}
- CHỈ TRẢ VỀ JSON HỢP LỆ.
`;
  }

  // ================= CARD DETAILS =================
  generateCardDetails(card: any, locale = 'vi') {
    return `
You are enriching a Kanban task card.

Card: ${JSON.stringify(card, null, 2)}

Return ONLY valid JSON with realistic details:
{
  "priority": "Low" | "Medium" | "High" | "Urgent",
  "deadline": "YYYY-MM-DD" hoặc null,
  "labels": ["Bug", "Feature", "Design", ...],
  "checklist": [
    {"item": "Công việc con 1", "completed": false},
    {"item": "Công việc con 2", "completed": false}
  ]
}

Yêu cầu:
- Phù hợp với card và dự án.
- Language: ${locale}
- CHỈ TRẢ VỀ JSON.
`;
  }

  // ================= CARD VIEW =================
  generateCardView(card: any, locale = 'vi') {
    return `
You are generating UI metadata for a Kanban card.

Card: ${JSON.stringify(card, null, 2)}

Return ONLY valid JSON:
{
  "icon": "emoji hoặc tên icon (ví dụ: 📅, ⚙️)",
  "color": "màu hex (ví dụ: #4CAF50)",
  "coverImage": "mô tả ngắn hoặc url placeholder nếu có"
}

Language: ${locale}
ONLY JSON.
`;
  }
}