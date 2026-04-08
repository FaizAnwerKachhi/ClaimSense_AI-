import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// Rate limiting: 10 req/min per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

// Input schema
const ClaimInputSchema = z.object({
  patient_id: z.string().optional().default(""),
  dob: z.string().optional().default(""),
  member_id: z.string().optional().default(""),
  npi: z.string().optional().default(""),
  pos: z.string().optional().default(""),
  dos: z.string().optional().default(""),
  cpt: z.string().min(1, "CPT code is required"),
  icd: z.string().min(1, "ICD-10 code is required"),
  icd2: z.string().optional().default(""),
  modifier: z.string().optional().default(""),
  units: z.string().optional().default("1"),
  billed_amount: z.string().optional().default("0"),
  payer: z.string().optional().default(""),
  prior_auth: z.string().optional().default(""),
  clinical_notes: z.string().optional().default(""),
});

// Output schema
const PatchSchema = z.object({
  op: z.literal("set"),
  field: z.enum(["cpt","icd","icd2","modifier","units","billed_amount","pos","dos","payer","prior_auth","clinical_notes","npi","patient_id","member_id","dob"]),
  value: z.string(),
});

const FixSchema = z.object({
  action: z.string(),
  explanation: z.string(),
  confidence: z.number().min(0).max(100),
  patch: z.array(PatchSchema).default([]),
});

const ErrorSchema = z.object({
  id: z.string(),
  severity: z.enum(["High", "Medium", "Low"]),
  type: z.string(),
  field: z.string(),
  description: z.string(),
  fixes: z.array(FixSchema),
});

const AnalysisResultSchema = z.object({
  claim_id: z.string(),
  risk_level: z.enum(["High", "Medium", "Low"]),
  risk_score: z.number().min(0).max(100),
  risk_summary: z.string(),
  errors: z.array(ErrorSchema),
  overall_assessment: z.string(),
  avg_confidence: z.number().min(0).max(100),
});

function dobToAge(dob: string): string {
  if (!dob) return "unknown";
  try {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return `${age} years`;
  } catch {
    return "unknown";
  }
}

function obfuscateMemberId(mid: string): string {
  if (!mid || mid.length <= 4) return "****";
  return "****" + mid.slice(-4);
}

function buildSystemPrompt(): string {
  return `You are ClaimSense AI, an expert medical billing validation system. Analyze medical claims for errors that cause insurance denials.

You MUST respond with valid JSON only. No markdown, no preamble. Use this EXACT structure:
{
  "claim_id": "CS-XXXX (generate random 4-digit)",
  "risk_level": "High" | "Medium" | "Low",
  "risk_score": <integer 0-100>,
  "risk_summary": "<1-2 sentence risk summary>",
  "errors": [
    {
      "id": "E1",
      "severity": "High" | "Medium" | "Low",
      "type": "<error category>",
      "field": "<field name>",
      "description": "<what is wrong and why it causes denial>",
      "fixes": [
        {
          "action": "<short specific fix action>",
          "explanation": "<why this fix resolves the issue>",
          "confidence": <integer 0-100>,
          "patch": [
            { "op": "set", "field": "<fieldname>", "value": "<new value>" }
          ]
        }
      ]
    }
  ],
  "overall_assessment": "<3-4 sentence expert billing advice>",
  "avg_confidence": <integer 0-100>
}

Valid patch field names: cpt, icd, icd2, modifier, units, billed_amount, pos, dos, payer, prior_auth, clinical_notes, npi, patient_id, member_id, dob

Rules:
- Check: ICD-CPT compatibility, modifier requirements, POS appropriateness, medical necessity, payer-specific rules, prior auth requirements, documentation requirements
- Provide 1-3 fixes per error with specific patch operations
- Each fix must include patch array with the exact field changes needed
- If claim looks clean, return empty errors array with Low risk score (0-25)
- Be specific with code names in descriptions`;
}

function buildUserPrompt(claim: z.infer<typeof ClaimInputSchema>): string {
  const age = dobToAge(claim.dob);
  const memberId = obfuscateMemberId(claim.member_id);

  return `Analyze this medical claim:

CPT Code: ${claim.cpt}
Primary ICD-10: ${claim.icd}
Secondary ICD-10: ${claim.icd2 || "None"}
Modifier: ${claim.modifier || "None"}
Units: ${claim.units}
Billed Amount: $${claim.billed_amount}
Place of Service: ${claim.pos || "Not specified"}
Date of Service: ${claim.dos || "Not specified"}
Payer: ${claim.payer || "Not specified"}
Provider NPI: ${claim.npi || "Not specified"}
Patient Age: ${age}
Member ID: ${memberId}
Prior Auth: ${claim.prior_auth || "None"}
Clinical Notes: ${claim.clinical_notes || "None"}

Check for all billing compliance issues, denial risks, and provide actionable fix suggestions with specific patch operations.`;
}

async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 2000,
  });
  return response.choices[0]?.message?.content ?? "{}";
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded. Max 10 requests per minute." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ClaimInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  const claim = parsed.data;
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(claim);

  try {
    let rawJson = await callOpenAI(systemPrompt, userPrompt);
    let jsonData: unknown;
    try {
      jsonData = JSON.parse(rawJson);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 502 });
    }

    let validated = AnalysisResultSchema.safeParse(jsonData);

    if (!validated.success) {
      const repairPrompt = `The previous response had schema issues: ${JSON.stringify(validated.error.flatten())}.
Please provide the corrected JSON following the exact schema. Original claim data: ${userPrompt}`;
      rawJson = await callOpenAI(systemPrompt, repairPrompt);
      try {
        jsonData = JSON.parse(rawJson);
      } catch {
        return NextResponse.json({ error: "AI returned invalid JSON after retry" }, { status: 502 });
      }
      validated = AnalysisResultSchema.safeParse(jsonData);
    }

    if (!validated.success) {
      return NextResponse.json(
        { error: "AI response failed schema validation", details: validated.error.flatten() },
        { status: 502 }
      );
    }

    return NextResponse.json(validated.data);
  } catch (err) {
    console.error("OpenAI API error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "AI service error", message }, { status: 503 });
  }
}
