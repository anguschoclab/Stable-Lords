/** Shared flat stubs for EntityLink's dependencies (button + dossier panels). */
export const button = {
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
};

export const warriorDossier = {
  WarriorDossier: () => <div>Warrior Dossier</div>,
};

export const stableDossier = {
  StableDossier: () => <div>Stable Dossier</div>,
};
