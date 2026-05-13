import { describe, it, expect } from 'bun:test';
import {
  parseConcepts,
  parseVerdicts,
  parseVerification,
} from '../src/experiments/stage1/parser.js';

// ── Spanish parser tests ──────────────────────────────────────────────────────

describe('parseConcepts (es)', () => {
  it('parses two concepts from explorer output', () => {
    const text = `
CONCEPTO: velanza
DEFINICIÓN: Estado en que un pensamiento propio existe sin forma hasta que alguien más lo pronuncia.
ETIMOLOGÍA: Del latín "velum" (velo) + "stanza" (estancia en italiano), lugar velado.
EJEMPLO: Sentí velanza cuando ella describió exactamente lo que yo no podía articular.

CONCEPTO: entresí
DEFINICIÓN: La conversación silenciosa que ocurre entre dos personas que se conocen bien sin hablar.
ETIMOLOGÍA: Contracción de "entre sí mismos", el diálogo interior compartido.
EJEMPLO: Hubo entresí entre ellos durante toda la cena sin cruzar una palabra.
    `;

    const result = parseConcepts(text, 'es');
    expect(result).toHaveLength(2);
    expect(result[0]?.word).toBe('velanza');
    expect(result[0]?.definition).toContain('pensamiento propio');
    expect(result[0]?.etymology).toContain('latín');
    expect(result[0]?.example).toContain('velanza');
    expect(result[1]?.word).toBe('entresí');
  });

  it('handles missing example field gracefully', () => {
    const text = `
CONCEPTO: testword
DEFINICIÓN: Una definición de prueba.
ETIMOLOGÍA: Del latín test.
    `;
    const result = parseConcepts(text, 'es');
    expect(result).toHaveLength(1);
    expect(result[0]?.word).toBe('testword');
    expect(result[0]?.example).toBe('');
  });

  it('returns empty array for empty input', () => {
    expect(parseConcepts('', 'es')).toHaveLength(0);
  });

  it('handles extra whitespace and newlines', () => {
    const text = `\n\nCONCEPTO:   espejeo  \nDEFINICIÓN:  El efecto de verse reflejado en los gestos del otro.  \nETIMOLOGÍA: De espejo.\nEJEMPLO: Hubo espejeo.\n`;
    const result = parseConcepts(text, 'es');
    expect(result[0]?.word).toBe('espejeo');
    expect(result[0]?.definition).toBe('El efecto de verse reflejado en los gestos del otro.');
  });
});

describe('parseConcepts — markdown stripping', () => {
  it('strips bold markers from word', () => {
    const text = `CONCEPTO: **PREMORACIÓN**\nDEFINICIÓN: Una definición.\nETIMOLOGÍA: Del latín.\nEJEMPLO: Un ejemplo.`;
    const result = parseConcepts(text, 'es');
    expect(result[0]?.word).toBe('PREMORACIÓN');
  });

  it('strips bold markers from definition and etymology', () => {
    const text = `CONCEPTO: velanza\nDEFINICIÓN: Estado de **pensamiento** sin forma.\nETIMOLOGÍA: Del **latín** velum.\nEJEMPLO: Un ejemplo.`;
    const result = parseConcepts(text, 'es');
    expect(result[0]?.definition).toBe('Estado de pensamiento sin forma.');
    expect(result[0]?.etymology).toBe('Del latín velum.');
  });

  it('strips italic markers', () => {
    const text = `CONCEPTO: *velanza*\nDEFINICIÓN: Una *definición*.\nETIMOLOGÍA: Del latín.\nEJEMPLO: Un ejemplo.`;
    const result = parseConcepts(text, 'es');
    expect(result[0]?.word).toBe('velanza');
    expect(result[0]?.definition).toBe('Una definición.');
  });

  it('strips inline code markers', () => {
    const text =
      'CONCEPTO: `velanza`\nDEFINICIÓN: Una definición.\nETIMOLOGÍA: Del latín.\nEJEMPLO: Un ejemplo.';
    const result = parseConcepts(text, 'es');
    expect(result[0]?.word).toBe('velanza');
  });
});

describe('parseConcepts (en)', () => {
  it('parses two concepts from explorer output', () => {
    const text = `
CONCEPT: velanza
DEFINITION: The state in which one's own thought exists without form until someone else names it.
ETYMOLOGY: From Latin "velum" (veil) + "stanza" (room in Italian), a veiled place.
EXAMPLE: I felt velanza when she described exactly what I could not articulate.

CONCEPT: betweenness
DEFINITION: The silent conversation that happens between two people who know each other well.
ETYMOLOGY: From "between" + "-ness", the quality of being in between.
EXAMPLE: There was betweenness between them throughout the whole dinner.
    `;
    const result = parseConcepts(text, 'en');
    expect(result).toHaveLength(2);
    expect(result[0]?.word).toBe('velanza');
    expect(result[1]?.word).toBe('betweenness');
  });
});

// ── Verdict parser tests ──────────────────────────────────────────────────────

describe('parseVerdicts (es)', () => {
  it('parses approved and rejected verdicts', () => {
    const text = `
VEREDICTO: APROBADO
CONCEPTO: velanza
RAZÓN: El concepto es específico, no tiene equivalente claro en español.
ESTABILIZADO: SÍ

VEREDICTO: RECHAZADO
CONCEPTO: entresí
RAZÓN: Ya existe "telepatía" que cubre este significado.
ESTABILIZADO: NO
    `;

    const result = parseVerdicts(text, 'es');
    expect(result).toHaveLength(2);
    expect(result[0]?.verdict).toBe('approved');
    expect(result[0]?.word).toBe('velanza');
    expect(result[0]?.stabilized).toBe(true);
    expect(result[1]?.verdict).toBe('rejected');
    expect(result[1]?.stabilized).toBe(false);
  });

  it('parses requires_verification verdict', () => {
    const text = `
VEREDICTO: REQUIERE_VERIFICACIÓN
CONCEPTO: espejeo
RAZÓN: Posible equivalente en japonés, el verificador debe chequear.
ESTABILIZADO: SÍ
    `;
    const result = parseVerdicts(text, 'es');
    expect(result[0]?.verdict).toBe('requires_verification');
    expect(result[0]?.stabilized).toBe(true);
  });

  it('returns empty array for no verdicts', () => {
    expect(parseVerdicts('sin veredictos aquí', 'es')).toHaveLength(0);
  });
});

describe('parseVerdicts — markdown stripping', () => {
  it('strips bold from word and reason', () => {
    const text = `VEREDICTO: APROBADO\nCONCEPTO: **PREMORACIÓN**\nRAZÓN: Concepto **único** sin equivalente.\nESTABILIZADO: SÍ`;
    const result = parseVerdicts(text, 'es');
    expect(result[0]?.word).toBe('PREMORACIÓN');
    expect(result[0]?.reason).toBe('Concepto único sin equivalente.');
  });

  it('strips bold from verdict value when model wraps it', () => {
    const text = `VEREDICTO: **APROBADO**\nCONCEPTO: velanza\nRAZÓN: Válido.\nESTABILIZADO: SÍ`;
    const result = parseVerdicts(text, 'es');
    expect(result[0]?.verdict).toBe('approved');
  });
});

describe('parseVerdicts (en)', () => {
  it('parses english verdicts correctly', () => {
    const text = `
VERDICT: APPROVED
CONCEPT: velanza
REASON: The concept is specific and has no clear English equivalent.
STABILIZED: YES

VERDICT: REJECTED
CONCEPT: betweenness
REASON: Already covered by "rapport".
STABILIZED: NO
    `;
    const result = parseVerdicts(text, 'en');
    expect(result[0]?.verdict).toBe('approved');
    expect(result[0]?.stabilized).toBe(true);
    expect(result[1]?.verdict).toBe('rejected');
    expect(result[1]?.stabilized).toBe(false);
  });
});

// ── Verification parser tests ─────────────────────────────────────────────────

describe('parseVerification (es)', () => {
  it('parses SÍ as true', () => {
    const text = `EXISTE_EN_OTRAS_LENGUAS: SÍ\nEVIDENCIA: En japonés existe "amae" que cubre este concepto.`;
    const result = parseVerification(text, 'es');
    expect(result.existsInOtherLanguages).toBe('true');
    expect(result.evidence).toContain('amae');
  });

  it('parses NO as false', () => {
    const text = `EXISTE_EN_OTRAS_LENGUAS: NO\nEVIDENCIA: Revisé 10 lenguas y no encontré equivalente.`;
    const result = parseVerification(text, 'es');
    expect(result.existsInOtherLanguages).toBe('false');
  });

  it('parses INCIERTO as uncertain', () => {
    const text = `EXISTE_EN_OTRAS_LENGUAS: INCIERTO\nEVIDENCIA: No tengo suficiente información.`;
    const result = parseVerification(text, 'es');
    expect(result.existsInOtherLanguages).toBe('uncertain');
  });
});

describe('parseVerification — markdown stripping', () => {
  it('strips bold from evidence', () => {
    const text = `EXISTE_EN_OTRAS_LENGUAS: SÍ\nEVIDENCIA: En japonés **amae** cubre este concepto.`;
    const result = parseVerification(text, 'es');
    expect(result.evidence).toBe('En japonés amae cubre este concepto.');
  });
});

describe('parseVerification (en)', () => {
  it('parses YES as true', () => {
    const text = `EXISTS_IN_OTHER_LANGUAGES: YES\nEVIDENCE: In Japanese, "amae" covers this concept.`;
    const result = parseVerification(text, 'en');
    expect(result.existsInOtherLanguages).toBe('true');
    expect(result.evidence).toContain('amae');
  });

  it('parses NO as false', () => {
    const text = `EXISTS_IN_OTHER_LANGUAGES: NO\nEVIDENCE: No equivalent found in any language checked.`;
    const result = parseVerification(text, 'en');
    expect(result.existsInOtherLanguages).toBe('false');
  });

  it('parses UNCERTAIN as uncertain', () => {
    const text = `EXISTS_IN_OTHER_LANGUAGES: UNCERTAIN\nEVIDENCE: Not enough data to determine.`;
    const result = parseVerification(text, 'en');
    expect(result.existsInOtherLanguages).toBe('uncertain');
  });
});
