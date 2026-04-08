import { z } from "zod";

export const PatchSchema = z.object({
  op: z.literal("set"),
  field: z.enum(["cpt","icd","icd2","modifier","units","billed_amount","pos","dos","payer","prior_auth","clinical_notes","npi","patient_id","member_id","dob"]),
  value: z.string(),
});

export const FixSchema = z.object({
  action: z.string(),
  explanation: z.string(),
  confidence: z.number().min(0).max(100),
  patch: z.array(PatchSchema).default([]),
});

export const ErrorItemSchema = z.object({
  id: z.string(),
  severity: z.enum(["High", "Medium", "Low"]),
  type: z.string(),
  field: z.string(),
  description: z.string(),
  fixes: z.array(FixSchema),
});

export const AnalysisResultSchema = z.object({
  claim_id: z.string(),
  risk_level: z.enum(["High", "Medium", "Low"]),
  risk_score: z.number().min(0).max(100),
  risk_summary: z.string(),
  errors: z.array(ErrorItemSchema),
  overall_assessment: z.string(),
  avg_confidence: z.number().min(0).max(100),
});

export type PatchOp = z.infer<typeof PatchSchema>;
export type Fix = z.infer<typeof FixSchema>;
export type ErrorItem = z.infer<typeof ErrorItemSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export const ClaimDataSchema = z.object({
  patient_id: z.string().default(""),
  dob: z.string().default(""),
  member_id: z.string().default(""),
  npi: z.string().default(""),
  pos: z.string().default(""),
  dos: z.string().default(""),
  cpt: z.string().default(""),
  icd: z.string().default(""),
  icd2: z.string().default(""),
  modifier: z.string().default(""),
  units: z.string().default("1"),
  billed_amount: z.string().default("0"),
  payer: z.string().default("bcbs"),
  prior_auth: z.string().default(""),
  clinical_notes: z.string().default(""),
});

export type ClaimData = z.infer<typeof ClaimDataSchema>;
