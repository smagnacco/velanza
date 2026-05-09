import type { Language } from '@velanza/shared';

export interface Domain {
  id: string;
  label: Record<Language, string>;
  seed: Record<Language, string>;
}

export const DEFAULT_DOMAINS: Domain[] = [
  {
    id: 'social_awkwardness',
    label: { es: 'Incomodidad social', en: 'Social awkwardness' },
    seed: {
      es: 'experiencias de incomodidad, vergüenza ajena, o tensión en interacciones sociales',
      en: 'experiences of awkwardness, secondhand embarrassment, or tension in social interactions',
    },
  },
  {
    id: 'temporal_perception',
    label: { es: 'Percepción del tiempo', en: 'Temporal perception' },
    seed: {
      es: 'experiencias subjetivas del paso del tiempo, nostalgia, anticipación, o distorsión temporal',
      en: 'subjective experiences of time passing, nostalgia, anticipation, or temporal distortion',
    },
  },
  {
    id: 'identity_transition',
    label: { es: 'Transición de identidad', en: 'Identity transition' },
    seed: {
      es: 'experiencias de cambio de identidad, reconocerse diferente al pasado, o no reconocerse en una foto antigua',
      en: 'experiences of identity change, recognizing oneself as different from the past, or not recognizing oneself in an old photo',
    },
  },
  {
    id: 'collective_mood',
    label: { es: 'Estado de ánimo colectivo', en: 'Collective mood' },
    seed: {
      es: 'experiencias de estados emocionales compartidos sin comunicación verbal, tensión grupal, o euforia colectiva',
      en: 'experiences of shared emotional states without verbal communication, group tension, or collective euphoria',
    },
  },
  {
    id: 'digital_presence',
    label: { es: 'Presencia digital', en: 'Digital presence' },
    seed: {
      es: 'experiencias propias de la era digital: ser visto sin ser visto, existir en múltiples contextos simultáneos, dejar rastros sin querer',
      en: 'experiences unique to the digital age: being seen without seeing, existing in multiple contexts simultaneously, leaving traces unintentionally',
    },
  },
  {
    id: 'creative_block',
    label: { es: 'Bloqueo creativo', en: 'Creative block' },
    seed: {
      es: 'estados mentales específicos durante la creación: el casi-tener-la-idea, el saber-que-está-mal-sin-saber-por-qué, o la claridad repentina',
      en: 'specific mental states during creation: almost-having-the-idea, knowing-it-is-wrong-without-knowing-why, or sudden clarity',
    },
  },
  {
    id: 'interpersonal_distance',
    label: { es: 'Distancia interpersonal', en: 'Interpersonal distance' },
    seed: {
      es: 'la distancia emocional que existe entre personas cercanas, el extrañamiento gradual, o la intimidad con desconocidos',
      en: 'emotional distance between close people, gradual estrangement, or intimacy with strangers',
    },
  },
  {
    id: 'aesthetic_experience',
    label: { es: 'Experiencia estética', en: 'Aesthetic experience' },
    seed: {
      es: 'experiencias de belleza o significado difíciles de articular: lo que produce cierta música en cierto momento, o la melancolía de lo hermoso',
      en: 'experiences of beauty or meaning hard to articulate: what certain music produces at a certain moment, or the melancholy of the beautiful',
    },
  },
];

export function getDomainById(id: string): Domain | undefined {
  return DEFAULT_DOMAINS.find((d) => d.id === id);
}
