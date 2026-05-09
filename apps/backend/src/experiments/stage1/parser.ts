import type { Language } from '@velanza/shared';

export interface ParsedConcept {
  word: string;
  definition: string;
  etymology: string;
  example: string;
}

export interface ParsedVerdict {
  word: string;
  verdict: 'approved' | 'rejected' | 'requires_verification';
  reason: string;
  stabilized: boolean;
}

export interface ParsedVerification {
  existsInOtherLanguages: 'true' | 'false' | 'uncertain';
  evidence: string;
}

const CONCEPT_PATTERNS: Record<Language, RegExp> = {
  es: /CONCEPTO:\s*(.+?)(?:\n|$)/gi,
  en: /CONCEPT:\s*(.+?)(?:\n|$)/gi,
};

const DEFINITION_PATTERNS: Record<Language, RegExp> = {
  es: /DEFINICIÓN:\s*([\s\S]+?)(?=ETIMOLOGÍA:|EJEMPLO:|CONCEPTO:|$)/gi,
  en: /DEFINITION:\s*([\s\S]+?)(?=ETYMOLOGY:|EXAMPLE:|CONCEPT:|$)/gi,
};

const ETYMOLOGY_PATTERNS: Record<Language, RegExp> = {
  es: /ETIMOLOGÍA:\s*([\s\S]+?)(?=EJEMPLO:|CONCEPTO:|DEFINICIÓN:|$)/gi,
  en: /ETYMOLOGY:\s*([\s\S]+?)(?=EXAMPLE:|CONCEPT:|DEFINITION:|$)/gi,
};

const EXAMPLE_PATTERNS: Record<Language, RegExp> = {
  es: /EJEMPLO:\s*([\s\S]+?)(?=CONCEPTO:|ETIMOLOGÍA:|DEFINICIÓN:|$)/gi,
  en: /EXAMPLE:\s*([\s\S]+?)(?=CONCEPT:|ETYMOLOGY:|DEFINITION:|$)/gi,
};

function extractAll(pattern: RegExp, text: string): string[] {
  const results: string[] = [];
  const re = new RegExp(pattern.source, pattern.flags);
  let match;
  while ((match = re.exec(text)) !== null) {
    const value = match[1]?.trim();
    if (value) results.push(value);
  }
  return results;
}

export function parseConcepts(text: string, lang: Language): ParsedConcept[] {
  const words = extractAll(CONCEPT_PATTERNS[lang], text);
  const definitions = extractAll(DEFINITION_PATTERNS[lang], text);
  const etymologies = extractAll(ETYMOLOGY_PATTERNS[lang], text);
  const examples = extractAll(EXAMPLE_PATTERNS[lang], text);

  return words.map((word, i) => ({
    word: word.trim(),
    definition: (definitions[i] ?? '').trim(),
    etymology: (etymologies[i] ?? '').trim(),
    example: (examples[i] ?? '').trim(),
  }));
}

const VERDICT_PATTERNS: Record<Language, RegExp> = {
  es: /VEREDICTO:\s*(APROBADO|RECHAZADO|REQUIERE_VERIFICACIÓN)/gi,
  en: /VERDICT:\s*(APPROVED|REJECTED|REQUIRES_VERIFICATION)/gi,
};

const VERDICT_CONCEPT_PATTERNS: Record<Language, RegExp> = {
  es: /CONCEPTO:\s*(.+?)(?:\n|$)/gi,
  en: /CONCEPT:\s*(.+?)(?:\n|$)/gi,
};

const REASON_PATTERNS: Record<Language, RegExp> = {
  es: /RAZÓN:\s*([\s\S]+?)(?=ESTABILIZADO:|VEREDICTO:|CONCEPTO:|$)/gi,
  en: /REASON:\s*([\s\S]+?)(?=STABILIZED:|VERDICT:|CONCEPT:|$)/gi,
};

const STABILIZED_PATTERNS: Record<Language, RegExp> = {
  es: /ESTABILIZADO:\s*(SÍ|NO)/gi,
  en: /STABILIZED:\s*(YES|NO)/gi,
};

function normalizeVerdict(
  raw: string,
  lang: Language
): 'approved' | 'rejected' | 'requires_verification' {
  const upper = raw.toUpperCase().trim();
  if (lang === 'es') {
    if (upper === 'APROBADO') return 'approved';
    if (upper === 'RECHAZADO') return 'rejected';
    return 'requires_verification';
  } else {
    if (upper === 'APPROVED') return 'approved';
    if (upper === 'REJECTED') return 'rejected';
    return 'requires_verification';
  }
}

function normalizeStabilized(raw: string, lang: Language): boolean {
  const upper = raw.toUpperCase().trim();
  if (lang === 'es') return upper === 'SÍ' || upper === 'SI';
  return upper === 'YES';
}

export function parseVerdicts(text: string, lang: Language): ParsedVerdict[] {
  const verdicts = extractAll(VERDICT_PATTERNS[lang], text);
  const words = extractAll(VERDICT_CONCEPT_PATTERNS[lang], text);
  const reasons = extractAll(REASON_PATTERNS[lang], text);
  const stabilizedRaw = extractAll(STABILIZED_PATTERNS[lang], text);

  return verdicts.map((v, i) => ({
    verdict: normalizeVerdict(v, lang),
    word: (words[i] ?? '').trim(),
    reason: (reasons[i] ?? '').trim(),
    stabilized: normalizeStabilized(stabilizedRaw[i] ?? '', lang),
  }));
}

const EXISTS_PATTERNS: Record<Language, RegExp> = {
  es: /EXISTE_EN_OTRAS_LENGUAS:\s*(SÍ|NO|INCIERTO)/gi,
  en: /EXISTS_IN_OTHER_LANGUAGES:\s*(YES|NO|UNCERTAIN)/gi,
};

const EVIDENCE_PATTERNS: Record<Language, RegExp> = {
  es: /EVIDENCIA:\s*([\s\S]+?)(?=EXISTE_EN_OTRAS_LENGUAS:|$)/gi,
  en: /EVIDENCE:\s*([\s\S]+?)(?=EXISTS_IN_OTHER_LANGUAGES:|$)/gi,
};

function normalizeExistence(raw: string, lang: Language): 'true' | 'false' | 'uncertain' {
  const upper = raw.toUpperCase().trim();
  if (lang === 'es') {
    if (upper === 'SÍ' || upper === 'SI') return 'true';
    if (upper === 'NO') return 'false';
    return 'uncertain';
  } else {
    if (upper === 'YES') return 'true';
    if (upper === 'NO') return 'false';
    return 'uncertain';
  }
}

export function parseVerification(text: string, lang: Language): ParsedVerification {
  const exists = extractAll(EXISTS_PATTERNS[lang], text);
  const evidence = extractAll(EVIDENCE_PATTERNS[lang], text);

  return {
    existsInOtherLanguages: normalizeExistence(exists[0] ?? '', lang),
    evidence: (evidence[0] ?? '').trim(),
  };
}
