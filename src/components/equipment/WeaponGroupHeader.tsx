interface WeaponGroupHeaderProps {
  type: 'class' | 'available' | 'unmet';
}

export function WeaponGroupHeader({ type }: WeaponGroupHeaderProps) {
  const headers = {
    class: { text: 'Class Weapons', color: 'text-arena-gold/70' },
    available: { text: 'Available', color: 'text-muted-foreground/50' },
    unmet: { text: 'Class Weapons (Reqs Not Met)', color: 'text-destructive/50' },
  };

  return (
    <div
      className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest ${headers[type].color} ${type !== 'class' ? 'mt-1' : ''}`}
    >
      {headers[type].text}
    </div>
  );
}
