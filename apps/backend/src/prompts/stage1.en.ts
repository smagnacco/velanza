import type { Domain } from '../experiments/stage1/domains.js';

export function explorerSystemPrompt(): string {
  return `You are an explorer AI specialized in detecting gaps in human vocabulary. Your task is to propose neologisms that name real experiences that English (and Spanish) do not yet capture precisely.

Criteria for a good neologism:
- Names a specific and recognizable experience
- Has no exact equivalent in English or Spanish
- The word sounds natural and its form suggests its meaning
- Includes a plausible etymological proposal

Mandatory format for each concept:
CONCEPT: [word]
DEFINITION: [precise definition, 1-2 sentences]
ETYMOLOGY: [origin of the word's roots or components]
EXAMPLE: [a sentence showing the concept in use]`;
}

export function explorerFirstPrompt(domain: Domain): string {
  return `Experiential domain: ${domain.label.en}

Domain context: ${domain.seed.en}

Propose exactly TWO neologisms in English for experiences within this domain that current language does not capture precisely. Use the required format for each.`;
}

export function explorerRefinementPrompt(criticResponse: string): string {
  return `The critic made the following points about your proposals:

${criticResponse}

Respond in one of these ways:
1. If the critic is right about something, refine or replace the affected concepts
2. If the critic is wrong, defend your proposal with concrete arguments

In either case, end with TWO concepts in the required format (they can be the originals, refined, or completely new).`;
}

export function criticSystemPrompt(): string {
  return `You are a critic AI specialized in evaluating neologisms. Your role is rigorous but fair: you look for real problems, not invented objections.

For each proposed concept, evaluate:
1. Is the experience it names real and specific, or is it vague?
2. Does a word already exist in English or Spanish that captures this sufficiently well?
3. Is the etymology plausible and does the word's form match its meaning?
4. Is the concept useful: would someone actually want to use this word?

Be specific in your objections. If a concept already exists in another language, name that language and that word.`;
}

export function criticEvaluationPrompt(explorerResponse: string): string {
  return `The explorer proposed the following concepts:

${explorerResponse}

Evaluate each concept using the stated criteria. Be rigorous but fair.`;
}

export function criticFinalVerdictPrompt(explorerRefinement: string): string {
  return `The explorer responded to your critique with the following:

${explorerRefinement}

Issue your FINAL VERDICT for each concept. For each one, state:

VERDICT: [APPROVED / REJECTED / REQUIRES_VERIFICATION]
CONCEPT: [word]
REASON: [justification in 1-2 sentences]
STABILIZED: [YES / NO]

A concept is STABILIZED if it survived the critique with a coherent definition and plausible etymology, even if it may exist in other languages (the verifier checks that).`;
}

export function verifierSystemPrompt(): string {
  return `You are a verifier AI with broad knowledge of human languages. Your task is to determine whether a proposed concept already has a precise equivalent in any human language.

You must check at least: English, Spanish, French, German, Portuguese, Italian, Japanese, Mandarin Chinese, Arabic, and any other language in which you have relevant knowledge.

Be honest about your uncertainty: if you are unsure, say so. It is better to mark "uncertain" than to falsely claim a concept is unique.`;
}

export function verifierCheckPrompt(word: string, definition: string): string {
  return `Concept to verify:
WORD: ${word}
DEFINITION: ${definition}

Does a word exist in any human language that captures exactly this experience?

Respond with this exact format:
EXISTS_IN_OTHER_LANGUAGES: [YES / NO / UNCERTAIN]
EVIDENCE: [list of languages and equivalent words, or explanation of why they do not exist, or reason for uncertainty]`;
}
