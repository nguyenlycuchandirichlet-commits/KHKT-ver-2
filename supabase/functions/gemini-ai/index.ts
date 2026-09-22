import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

type GeminiPart = { text: string };
type GeminiContent = { parts: GeminiPart[]; role?: string };
type GeminiCandidate = { content?: GeminiContent; finishReason?: string };

function buildContents(prompt: string, systemInstruction?: string): {
  contents: GeminiContent[];
  systemInstruction?: { parts: GeminiPart[] };
} {
  const contents: GeminiContent[] = [{ parts: [{ text: prompt }], role: "user" }];
  const body: { contents: GeminiContent[]; systemInstruction?: { parts: GeminiPart[] } } = { contents };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }
  return body;
}

async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  const body = buildContents(prompt, systemInstruction);
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...body,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        candidateCount: 1,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const candidates: GeminiCandidate[] = data.candidates ?? [];
  if (candidates.length === 0) throw new Error("Gemini returned no candidates");
  const text = candidates[0].content?.parts?.map((p) => p.text).join("") ?? "";
  if (!text) throw new Error("Gemini returned empty response");
  return text;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { prompt, systemInstruction } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Missing prompt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = await callGemini(prompt, systemInstruction);
    return new Response(JSON.stringify({ response: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
