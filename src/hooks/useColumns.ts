import { useState, useEffect } from 'react';

export function useColumns(): 1 | 2 | 3 {
  const [columns, setColumns] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mdQuery = window.matchMedia('(min-width: 768px)');
    const lgQuery = window.matchMedia('(min-width: 1024px)');

    const update = () => {
      if (lgQuery.matches) {
        setColumns(3);
      } else if (mdQuery.matches) {
        setColumns(2);
      } else {
        setColumns(1);
      }
    };

    update();

    mdQuery.addEventListener('change', update);
    lgQuery.addEventListener('change', update);

    return () => {
      mdQuery.removeEventListener('change', update);
      lgQuery.removeEventListener('change', update);
    };
  }, []);

  return columns;
}
