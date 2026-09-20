// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DoctrineIntelligenceSection } from '@/components/scouting/components/DoctrineIntelligenceSection';
import { META_RECRUIT_QUOTES } from '@/data/ownerData';
import { makeOwner, makeRival } from '@/test/_fixtures/factories';

describe('DoctrineIntelligenceSection — recruit doctrine quotes (C4)', () => {
  it('surfaces the owner meta-adaptation recruit quote from META_RECRUIT_QUOTES', () => {
    const rivalA = makeRival({
      owner: makeOwner({ metaAdaptation: 'Innovator' }),
    });
    const rivalB = makeRival({
      owner: makeOwner({ metaAdaptation: 'Traditionalist' }),
    });
    render(
      <DoctrineIntelligenceSection
        rivalA={rivalA}
        rivalB={rivalB}
        modsA={{}}
        modsB={{}}
        clashes={false}
        grudge={null}
      />
    );
    expect(screen.getByText(META_RECRUIT_QUOTES.Innovator)).toBeInTheDocument();
    expect(screen.getByText(META_RECRUIT_QUOTES.Traditionalist)).toBeInTheDocument();
  });
});
