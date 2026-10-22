/** Shared fragments of the '@/data/narrative/uiMeta.json' mock payload —
 *  the step labels, memorial tribute, and empty meta/persona tails pinned by
 *  the resolution-reveal specs. */
export const UI_META_STEPS = {
  step_gazette: 'The Gazette',
  step_infirmary: 'The Infirmary',
  step_bouts: 'The Bouts',
  step_steward: "Steward's Report",
  step_memorial: 'The Graveyard',
};

export const UI_META_MEMORIALS = {
  tributes: ['The arena grows colder with the loss of {{name}}.'],
};

export const UI_META_TAIL = {
  meta: { flair: {}, title: {}, injury: {}, status: {} },
  persona: { good: {}, bad: {}, descriptors: { coordination: {} } },
};
