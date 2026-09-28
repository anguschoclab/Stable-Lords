
/**
 * Defines the shape of persona descriptor.
 */
export interface PersonaDescriptor {
  min: number;
  text: string;
}


/**
 * Defines the shape of persona skill.
 */
export interface PersonaSkill {
  high: PersonaDescriptor[];
  low: PersonaDescriptor[];
}


/**
 * Defines the shape of persona good.
 */
export interface PersonaGood {
  initiative: PersonaSkill;
  riposte: PersonaSkill;
  attack: PersonaSkill;
  parry: PersonaSkill;
  defense: PersonaSkill;
  endurance: PersonaSkill;
}


/**
 * Defines the shape of persona bad.
 */
export interface PersonaBad {
  initiative: PersonaSkill;
  attack: PersonaSkill;
}


/**
 * Defines the shape of persona descriptors.
 */
export interface PersonaDescriptors {
  coordination: Record<string, string>;
  activity: Record<string, string>;
}


/**
 * Defines the shape of persona.
 */
export interface Persona {
  good: PersonaGood;
  bad: PersonaBad;
  descriptors: PersonaDescriptors;
}

// ─── Strike Narratives ────────────────────────────────────────────────────
