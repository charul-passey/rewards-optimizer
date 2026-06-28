import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

// memegen.link templates — no auth required
const TEMPLATES: Record<string, { id: string; name: string; lines: number }> = {
  drake:       { id: "drake",    name: "Drake Pointing",      lines: 2 },
  distracted:  { id: "db",      name: "Distracted Boyfriend", lines: 3 },
  "two-buttons": { id: "2b",    name: "Two Buttons",          lines: 2 },
  "change-mind": { id: "cmm",   name: "Change My Mind",       lines: 1 },
  "this-fine":  { id: "fine",   name: "This Is Fine",         lines: 2 },
  "brain":     { id: "brain",   name: "Expanding Brain",      lines: 4 },
  success:     { id: "success", name: "Success Kid",          lines: 2 },
  "one-does-not": { id: "mordor", name: "One Does Not Simply", lines: 2 },
  "gru-plan":  { id: "gru",     name: "Gru's Plan",           lines: 4 },
  doge:        { id: "doge",    name: "Doge",                 lines: 2 },
};

function encodeText(text: string): string {
  return encodeURIComponent(
    text
      .replace(/-/g, "--")
      .replace(/_/g, "__")
      .replace(/\s+/g, "_")
      .replace(/[?]/g, "~q")
      .replace(/[%]/g, "~p")
      .replace(/[#]/g, "~h")
      .replace(/[/]/g, "~s")
      .replace(/\\/g, "~b")
      .replace(/</g, "~l")
      .replace(/>/g, "~g")
      .replace(/"/g, "''")
  );
}

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();
    if (!topic) return NextResponse.json({ error: "Topic required" }, { status: 400 });

    const templateList = Object.entries(TEMPLATES)
      .map(([key, t]) => `${key}: "${t.name}" (${t.lines} text panel${t.lines > 1 ? "s" : ""})`)
      .join("\n");

    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: `Create a funny meme about: "${topic}"

Available templates:
${templateList}

Pick the best template and write short, punchy text for each panel.

Respond ONLY with valid JSON (no markdown fences):
{
  "template": "<key from list>",
  "texts": ["panel 1 text", "panel 2 text"],
  "explanation": "<one sentence why this is funny>"
}`
      }]
    });

    const raw = (msg.content[0] as { type: string; text: string }).text.trim()
      .replace(/^```json\s*/i, "").replace(/\s*```$/, "");

    const json = JSON.parse(raw);
    const template = TEMPLATES[json.template];
    if (!template) return NextResponse.json({ error: "Claude picked an unknown template" }, { status: 400 });

    // Pad or trim texts to match template line count
    const texts: string[] = json.texts || [];
    while (texts.length < template.lines) texts.push("...");
    const panels = texts.slice(0, template.lines).map(encodeText).join("/");

    const imageUrl = `https://api.memegen.link/images/${template.id}/${panels}.png?width=600`;

    // Verify the image URL is reachable
    const check = await fetch(imageUrl, { method: "HEAD" });
    if (!check.ok) {
      return NextResponse.json({ error: `memegen.link returned ${check.status}` }, { status: 500 });
    }

    return NextResponse.json({
      url: imageUrl,
      template: template.name,
      texts: json.texts,
      explanation: json.explanation,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
