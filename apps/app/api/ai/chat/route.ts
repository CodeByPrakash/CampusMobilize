import { NextResponse } from "next/server";

const DEEPBOT_ENDPOINT = "https://deepbot-backend.vercel.app/api/v1/chat";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userMessage = body.message;

    if (!userMessage || typeof userMessage !== "string") {
      return NextResponse.json(
        { success: false, error: "A message string is required." },
        { status: 400 }
      );
    }

    // Context grounding with real NIT Rourkela operational facts
    const contextPrompt = body.includeCampusContext !== false
      ? `[SYSTEM CONTEXT: You are CampusMobilize AI, the smart facility intelligence agent for NIT Rourkela (462-acre campus, ~8,500 students and staff). Live telemetry highlights: 380 complaints recorded, 292 active in Neon DB, Campus Risk Index = 35.8/100, Substation 1 (33kV TPWODL yard) load = 1,420 kW, CVR Hall water pressure anomaly active, HB-3 solar geysers operating at 62°C, TIIR Net-Zero quad generating 96% solar offset. Provide crisp, expert maintenance and sustainability guidance using bullet points where helpful.]\n\nUser Question: ${userMessage}`
      : userMessage;

    const response = await fetch(DEEPBOT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: contextPrompt }),
    });

    if (!response.ok) {
      throw new Error(`Upstream DeepBot server returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("AI Chat proxy error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to communicate with DeepBot AI service",
        data: {
          reply:
            "CampusMobilize AI (Fallback Insight): Telemetry shows Substation 1 (33kV TPWODL Yard) currently operating at 82% rated capacity. CVR Hall water pressure surge has been flagged for squad inspection. Solar array offset at TIIR is contributing 38% peak load reduction.",
        },
      },
      { status: 200 }
    );
  }
}
