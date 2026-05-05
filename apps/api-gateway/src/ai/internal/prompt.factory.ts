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

  // ================= CARD TITLE / DESCRIPTION / COMMENT =================
  generateCardTitle(card: any, locale = 'vi') {
    return `
You are improving a Kanban card title.

Card context:
${JSON.stringify(card, null, 2)}

Return ONLY valid JSON:
{ "content": "A clearer, shorter title in ${locale}" }

Rules:
- Language: ${locale}
- Max 80 characters if possible
- No markdown, ONLY JSON
`;
  }

  generateCardDescription(card: any, locale = 'vi') {
    return `
You are writing a helpful Kanban card description.

Card context:
${JSON.stringify(card, null, 2)}

Return ONLY valid JSON:
{ "content": "A concise description in ${locale}" }

Rules:
- Language: ${locale}
- 2–6 bullet-like sentences, plain text (no markdown)
- ONLY JSON
`;
  }

  generateCardComment(card: any, locale = 'vi') {
    return `
You are generating a short activity comment for a Kanban card.

Card context:
${JSON.stringify(card, null, 2)}

Return ONLY valid JSON:
{ "content": "A short comment in ${locale}" }

Rules:
- Language: ${locale}
- 1–2 sentences, plain text
- ONLY JSON
`;
  }

  generateNewsPost(processedTemplate: string, context: Record<string, unknown>, locale = 'vi') {
  const angle = context.angle || 'tin tức tổng hợp';
  return `
You are a high-end creative news editor for a premium tech platform.
Topic: "${processedTemplate}"
Angle: ${angle}

STRATEGY:
- Combine data from RSS/Web sources with your deep knowledge.
- Do NOT just summarize; rewrite with a unique "angle" (e.g., deep analysis, beginner guide, perspective 2026).
- Make it sound human-written, professional, and SEO-friendly.

PROVIDED WEB DATA (primary source):
${context.scraped_web_data || 'Use your general knowledge and real-world tech trends.'}

IMAGE CANDIDATES:
${context.scraped_images && (context.scraped_images as string[]).length > 0 
? (context.scraped_images as string[]).join('\n') 
: 'No direct image links found.'}

Rules for Vietnamese (if locale=vi):
- Use natural, professional yet engaging vocabulary (e.g., "Đột phá", "Tầm nhìn", "Thực hư chuyện", "Góc nhìn chuyên gia").
- Structure: Clear intro, 2-3 body paragraphs with insights, engaging conclusion.

Return ONLY valid JSON: { 
    "title": "Stunning catchy title",
    "content": "Professional unique article content. Must be DETAILED and at least 300-400 words. IMPORTANT: Use \\n for newlines inside this string. Do NOT use actual line breaks.", 
    "imageUrl": "Pick ONE best DIRECT image link from candidates OR leave empty for search",
    "linkUrl": "Source link",
    "imageKeywords": "3 search keywords in English specifically related to the ARTICLE TOPIC (e.g. if topic is 'food', use 'vietnamese cuisine, street food'). DO NOT use generic 'technology' keywords unless relevant."
 }
`;
}

  // ================= BOARD ANALYSIS / SUMMARY =================
  analyzeBoard(boardInfo: any, locale = 'vi') {
    return `
You are a senior project manager and data analyst.
Analyze the following Kanban board data and provide a concise summary, key insights, and recommendations.

Board Data:
${JSON.stringify(boardInfo, null, 2)}

Return ONLY valid JSON:
{
  "summary": "Tóm tắt ngắn gọn tình trạng dự án (2-3 câu)",
  "insights": [
    "Phân tích về khối lượng công việc của thành viên",
    "Phân tích về các công việc quá hạn hoặc ưu tiên cao",
    "Nhận xét về tiến độ hoàn thành"
  ],
  "recommendations": [
    "Gợi ý hành động 1",
    "Gợi ý hành động 2"
  ]
}

Rules:
- Language: ${locale}
- CHỈ TRẢ VỀ JSON HỢP LỆ.
- Focus on productivity and identifying bottlenecks.
`;
  }

  // ================= ASKING QUESTIONS ABOUT BOARD =================
  askBoard(context: any, locale = 'vi') {
    return `
You are an AI Project Assistant for Smart Collab. 
MANDATORY: ALWAYS RESPOND IN VIETNAMESE (TIẾNG VIỆT).

Your goal is to provide a helpful, human-like, and professional response to the user's question in ${locale === 'vi' ? 'Vietnamese' : locale}.

CRITICAL INSTRUCTIONS:
1. **DO NOT RETURN JSON**. ALWAYS respond in plain text with Markdown formatting.
2. Provide a natural language answer in TIẾNG VIỆT (Vietnamese) using Markdown format (bold, bullet points, titles).
3. Be conversational but professional. Focus on practical insights from the project data.
4. Use the provided BOARD DATA SUMMARY as your source of truth.
5. If the data shows overdue tasks or high priority items, point them out proactively.
6. If the user asks for a summary, give a structured breakdown.
7. If the question is about specific tasks, ALWAYS mention who is assigned (the "assignees" field).

CONTEXT:
Project: ${context.project.name} (${context.project.description})
Board: ${context.boardTitle}
User Question: "${context.query}"

BOARD DATA SUMMARY:
${JSON.stringify(context.data, null, 2)}

Answer (Natural Language Markdown ONLY):
`;
  }

  // ================= TASK BREAKDOWN =================
  generateSubtasks(card: any, locale = 'vi') {
    return `
You are a task management expert. 
Break down the following task into a detailed checklist of actionable subtasks.

Task Title: "${card.title}"
Task Description: "${card.description || 'No description provided'}"

Return ONLY valid JSON:
{
  "subtasks": [
    { "title": "Công việc con 1", "done": false },
    { "title": "Công việc con 2", "done": false }
  ]
}

Rules:
- Generate 4-8 subtasks.
- Language: ${locale}
- ONLY JSON.
`;
  }

  // ================= SMART SCHEDULING =================
  predictTimeline(card: any, locale = 'vi') {
    return `
You are a project scheduling expert. 
Based on the task details, suggest an optimized start date and deadline.
Assume today is ${new Date().toISOString().split('T')[0]}.

Task Title: "${card.title}"
Priority: ${card.priority || 'Medium'}

Return ONLY valid JSON:
{
  "startDate": "YYYY-MM-DD",
  "deadline": "YYYY-MM-DD",
  "reasoning": "Giải thích ngắn gọn tại sao chọn ngày này"
}

Rules:
- Language: ${locale}
- ONLY JSON.
`;
  }

  // ================= PROJECT HEALTH =================
  analyzeProjectHealth(projectInfo: any, locale = 'vi') {
    return `
You are a senior project controller. 
Analyze the project statistics and determine the overall health status.

Project Name: "${projectInfo.name}"
Total Tasks: ${projectInfo.totalTasks}
Completed Tasks: ${projectInfo.completedTasks}
Overdue Tasks: ${projectInfo.overdueTasks}

Return ONLY valid JSON:
{
  "status": "ON_TRACK" | "AT_RISK" | "DELAYED",
  "score": 0-100,
  "summary": "Tóm tắt tình trạng sức khỏe dự án"
}

Rules:
- Language: ${locale}
- ONLY JSON.
`;
  }

  // ================= SENTIMENT ANALYSIS =================
  analyzeSentiment(comments: any[], locale = 'vi') {
    return `
You are a team morale analyst. 
Analyze the following comments and determine the overall sentiment and emotional tone of the team.

Comments:
${JSON.stringify(comments, null, 2)}

Return ONLY valid JSON:
{
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "score": 0-100,
  "summary": "Tóm tắt tâm trạng của team",
  "flags": ["Căng thẳng", "Hào hứng", "Thất vọng"]
}

Rules:
- Language: ${locale}
- ONLY JSON.
`;
  }
}
