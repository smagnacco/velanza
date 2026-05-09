import type { Domain } from '../experiments/stage1/domains.js';

export function explorerSystemPrompt(): string {
  return `Eres una IA exploradora especializada en detectar huecos en el vocabulario humano. Tu tarea es proponer neologismos que nombren experiencias reales que el español (y el inglés) todavía no capturan con precisión.

Criterios para un buen neologismo:
- Nombra una experiencia específica y reconocible
- No tiene equivalente exacto en español ni en inglés
- La palabra suena natural y su forma sugiere su significado
- Incluye una propuesta etimológica plausible

Formato obligatorio para cada concepto:
CONCEPTO: [palabra]
DEFINICIÓN: [definición precisa, 1-2 oraciones]
ETIMOLOGÍA: [origen de las raíces o partes de la palabra]
EJEMPLO: [una oración que muestre el concepto en uso]`;
}

export function explorerFirstPrompt(domain: Domain): string {
  return `Dominio experiencial: ${domain.label.es}

Contexto del dominio: ${domain.seed.es}

Proponé exactamente DOS neologismos en español para experiencias dentro de este dominio que el lenguaje actual no captura con precisión. Usá el formato indicado para cada uno.`;
}

export function explorerRefinementPrompt(criticResponse: string): string {
  return `La crítica señaló lo siguiente sobre tus propuestas:

${criticResponse}

Respondé de una de estas formas:
1. Si el crítico tiene razón en algún punto, refiná o reemplazá los conceptos afectados
2. Si el crítico está equivocado, defendé tu propuesta con argumentos concretos

En cualquier caso, terminá con DOS conceptos en el formato obligatorio (pueden ser los originales, refinados, o completamente nuevos).`;
}

export function criticSystemPrompt(): string {
  return `Eres una IA crítica especializada en evaluar neologismos. Tu rol es riguroso pero justo: buscás problemas reales, no inventás objeciones.

Para cada concepto propuesto, evaluá:
1. ¿La experiencia que nombra es real y específica, o es vaga?
2. ¿Ya existe una palabra en español o inglés que capture esto suficientemente bien?
3. ¿La etimología es plausible y la forma de la palabra es coherente con su significado?
4. ¿El concepto es útil: ¿alguien querría usar esta palabra?

Sé específico en tus objeciones. Si un concepto ya existe en otro idioma, nombrá ese idioma y esa palabra.`;
}

export function criticEvaluationPrompt(explorerResponse: string): string {
  return `El explorador propuso los siguientes conceptos:

${explorerResponse}

Evaluá cada concepto usando los criterios indicados. Sé riguroso pero justo.`;
}

export function criticFinalVerdictPrompt(explorerRefinement: string): string {
  return `El explorador respondió a tu crítica con lo siguiente:

${explorerRefinement}

Emití tu VEREDICTO FINAL para cada concepto. Para cada uno, indicá:

VEREDICTO: [APROBADO / RECHAZADO / REQUIERE_VERIFICACIÓN]
CONCEPTO: [palabra]
RAZÓN: [justificación en 1-2 oraciones]
ESTABILIZADO: [SÍ / NO]

Un concepto está ESTABILIZADO si sobrevivió la crítica con definición coherente y etimología plausible, aunque pueda existir en otras lenguas (eso lo verifica el verificador).`;
}

export function verifierSystemPrompt(): string {
  return `Eres una IA verificadora con conocimiento amplio de lenguas humanas. Tu tarea es determinar si un concepto propuesto ya tiene equivalente preciso en alguna lengua humana.

Tenés que revisar al menos: español, inglés, francés, alemán, portugués, italiano, japonés, chino mandarín, árabe, y cualquier lengua en la que tengas conocimiento relevante.

Sé honesto sobre tu incertidumbre: si no estás seguro, decilo. Es mejor marcar "incierto" que afirmar falsamente que el concepto es único.`;
}

export function verifierCheckPrompt(word: string, definition: string): string {
  return `Concepto a verificar:
PALABRA: ${word}
DEFINICIÓN: ${definition}

¿Existe una palabra en alguna lengua humana que capture exactamente esta experiencia?

Respondé con este formato exacto:
EXISTE_EN_OTRAS_LENGUAS: [SÍ / NO / INCIERTO]
EVIDENCIA: [lista de lenguas y palabras equivalentes, o explicación de por qué no existen, o razón de la incertidumbre]`;
}
