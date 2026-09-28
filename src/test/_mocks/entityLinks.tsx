/** Shared flat mock for @/components/EntityLink — testid'd spans. */
export const WarriorLink = ({ name, className }: { name: string; className?: string }) => (
  <span
    data-testid="warrior-link"
    data-name={name}
    className={className}
    aria-label={`Open details for warrior ${name}`}
  >
    {name}
  </span>
);
/** Stable Link. */
export const StableLink = ({ name, className }: { name: string; className?: string }) => (
  <span
    data-testid="stable-link"
    data-name={name}
    className={className}
    aria-label={`Open details for stable ${name}`}
  >
    {name}
  </span>
);
