import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { spending, creditScore, preferences } = await req.json();

    const totalSpend = Object.values(spending as Record<string, string>)
      .reduce((sum, v) => sum + (parseFloat(String(v)) || 0), 0);

    const spendingSummary = Object.entries(spending as Record<string, string>)
      .filter(([, v]) => parseFloat(String(v)) > 0)
      .map(([cat, v]) => `${cat}: $${v}/month`)
      .join(", ");

    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2500,
      messages: [{
        role: "user",
        content: `You are a credit card rewards expert. Recommend the best 3 credit cards for this person.

MONTHLY SPENDING: ${spendingSummary || "Not specified"}
TOTAL MONTHLY SPEND: $${totalSpend.toFixed(0)}
CREDIT SCORE: ${creditScore}
PREFERENCES: ${preferences.join(", ")}

Recommend 3 real, current credit cards. Calculate realistic annual rewards based on actual card reward rates. Be specific with dollar amounts.

Respond with valid JSON only (no markdown fences):
{
  "topCards": [
    {
      "name": "Chase Sapphire Preferred",
      "annualFee": 95,
      "estimatedAnnualRewards": 847,
      "netValue": 752,
      "rewardsByCategory": {
        "dining": 312,
        "travel": 280,
        "groceries": 145,
        "other": 110
      },
      "bestFeature": "3x on dining and 2x on travel, 25% bonus when redeeming through Chase portal",
      "signupBonus": "$750 after $4,000 spend in first 3 months",
      "whyThisCard": "Your high dining spend makes the 3x category extremely valuable"
    }
  ],
  "cardsToAvoid": [
    { "name": "Card name", "reason": "Why this card is a poor fit for their spending profile" }
  ],
  "totalSpend": ${totalSpend.toFixed(0)}
}

Only include categories in rewardsByCategory where rewards > 0. Make the math realistic and accurate.`
      }]
    });

    const raw = (msg.content[0] as { type: string; text: string }).text.trim()
      .replace(/^```json\s*/i, "").replace(/\s*```$/, "");
    return NextResponse.json(JSON.parse(raw));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
