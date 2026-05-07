import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

async function ask(prompt: string, retries = 2): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    const is503 = msg.includes("503") || msg.includes("Service Unavailable");
    const is429 = msg.includes("429") || msg.includes("Too Many Requests");
    if ((is503 || is429) && retries > 0) {
      await new Promise((r) => setTimeout(r, 3000));
      return ask(prompt, retries - 1);
    }
    throw err;
  }
}

function extractJSON<T>(text: string, fallback: T): T {
  const arrMatch = text.match(/\[[\s\S]*\]/);
  const objMatch = text.match(/\{[\s\S]*\}/);
  const raw = arrMatch?.[0] ?? objMatch?.[0];
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/* ── Focus plan ──────────────────────────────────────────────────── */
export interface FocusBlock {
  title: string;
  estimatedMinutes: number;
  category: string;
  order: number;
}

export async function generateFocusPlan(
  rawInput: string,
  dailyGoalHours: number,
  role: string,
): Promise<FocusBlock[]> {
  const text = await ask(`You are a focus and productivity expert. A ${role} has given you their tasks for today.

Tasks:
${rawInput}

Daily focus goal: ${dailyGoalHours} hours

Create a structured focus plan. Return ONLY a valid JSON array — no markdown fences, no explanation.

Format:
[
  {
    "title": "Task name (clear and actionable)",
    "estimatedMinutes": 45,
    "category": "coding|writing|learning|design|meeting|admin|other",
    "order": 1
  }
]

Rules:
- Break large tasks into focused 25–90 minute blocks
- Most important / hardest tasks first
- Realistic time estimates
- 4–8 blocks maximum
- Total time close to ${dailyGoalHours * 60} minutes`);

  const blocks = extractJSON<FocusBlock[]>(text, []);
  if (!blocks.length) throw new Error("Could not parse focus plan from AI response");
  return blocks;
}

/* ── Analytics insights ─────────────────────────────────────────── */
export async function generateAnalyticsInsights(data: {
  totalSessions: number;
  avgDailyHours: number;
  avgMood: number;
  peakHour: number;
  morningAvg: number;
  afternoonAvg: number;
  eveningAvg: number;
  streakDays: number;
  topCategory: string;
}): Promise<string[]> {
  const text = await ask(`Based on this focus session data, generate exactly 3 insightful observations.

Data:
- Total sessions: ${data.totalSessions}
- Average daily focus: ${data.avgDailyHours.toFixed(1)} hours
- Average mood: ${data.avgMood.toFixed(1)}/5
- Peak productive hour: ${data.peakHour}:00
- Morning sessions avg: ${data.morningAvg.toFixed(0)} min
- Afternoon sessions avg: ${data.afternoonAvg.toFixed(0)} min
- Evening sessions avg: ${data.eveningAvg.toFixed(0)} min
- Current streak: ${data.streakDays} days
- Top task category: ${data.topCategory}

Return ONLY a JSON array of 3 strings. Each is 1–2 sentences: insight + specific recommendation.
Example: ["You focus 40% better before noon. Schedule your hardest tasks between 9–11am.", "...", "..."]`);

  return extractJSON<string[]>(text, [
    "Complete more sessions to unlock personalized insights.",
    "Track your mood after each session to see patterns.",
    "Consistency is key — aim for sessions every day.",
  ]);
}

/* ── Weekly report ──────────────────────────────────────────────── */
export async function generateWeeklyReport(data: {
  userName: string;
  role: string;
  weekStart: string;
  weekEnd: string;
  totalHours: number;
  totalSessions: number;
  avgMood: number;
  bestDay: string;
  worstDay: string;
  peakHour: number;
  topCategories: string[];
  dailyBreakdown: { day: string; hours: number; sessions: number }[];
  previousWeekHours: number;
}): Promise<{ reportText: string; score: number; actionItems: string[] }> {
  const text = await ask(`You are an expert productivity coach. Generate a weekly focus report for ${data.userName}, a ${data.role}.

Week: ${data.weekStart} to ${data.weekEnd}
Total focus hours: ${data.totalHours.toFixed(1)}h (previous week: ${data.previousWeekHours.toFixed(1)}h)
Total sessions: ${data.totalSessions}
Average mood: ${data.avgMood.toFixed(1)}/5
Best day: ${data.bestDay} | Worst day: ${data.worstDay}
Peak productive hour: ${data.peakHour}:00
Top task categories: ${data.topCategories.join(", ")}
Daily breakdown: ${JSON.stringify(data.dailyBreakdown)}

Return ONLY valid JSON — no markdown fences:
{
  "score": <number 1-100 based on consistency, volume, and mood>,
  "reportText": "<full markdown report with these sections: ## This Week's Wins, ## Your Pattern Report, ## What Held You Back, ## 3 Action Items for Next Week, ## Your Focus Mantra>",
  "actionItems": ["<specific action 1>", "<specific action 2>", "<specific action 3>"]
}`);

  return extractJSON(text, {
    score: 50,
    reportText: "Unable to generate report at this time. Please try again.",
    actionItems: [],
  });
}
