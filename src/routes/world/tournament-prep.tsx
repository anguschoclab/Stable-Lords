/**
 * World Hub - Tournament Prep Page
 * Pre-bracket readiness surface: entrants, eligibility, class status
 */
import { createFileRoute } from '@tanstack/react-router';
import TournamentPrep from '@/pages/TournamentPrep';

export const Route = createFileRoute('/world/tournament-prep')({
  component: TournamentPrep,
});
