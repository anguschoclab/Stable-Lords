/**
 * Stable Lords — Onboarding Coach System
 * Non-blocking toast-based contextual tips keyed by page/state.
 */
import { useEffect } from "react";
import { useGame } from "@/state/GameContext";
import { toast } from "sonner";

export interface CoachTip {
  id: string;
  message: string;
  /** Only show if this returns true */
  condition?: (state: any) => boolean;
}

const COACH_TIPS: Record<string, CoachTip[]> = {
  "/": [
    {
      id: "hub-welcome",
      message: "👋 Welcome to the Arena Hub! This is your command center. Check your roster, track crowd mood, and read the Gazette.",
    },
    {
      id: "hub-run-round",
      message: "⚔️ Ready for action? Head to 'Run Round' to send your warriors into the arena.",
      condition: (s) => s.roster.length >= 2 && s.arenaHistory.length === 1,
    },
  ],
  "/run-round": [
    {
      id: "round-first",
      message: "⚡ Each round pairs your active warriors for bouts. Results affect fame, popularity, and can even be fatal!",
    },
  ],
  "/recruit": [
    {
      id: "recruit-tip",
      message: "🛡️ Allocate 70 attribute points carefully. High WT warriors learn faster. High ST hit harder. Balance is key.",
    },
  ],
  "/trainers": [
    {
      id: "trainers-first",
      message: "🎓 Trainers provide passive bonuses to your warriors. Hire up to 3 and choose focuses that complement your stable's style.",
    },
  ],
  "/tournaments": [
    {
      id: "tournament-tip",
      message: "🏆 Tournaments run each season. Win to earn titles and major fame boosts for your stable.",
      condition: (s) => s.roster.filter((w: any) => w.status === "Active").length >= 2,
    },
  ],
  "/hall-of-fights": [
    {
      id: "chronicle-tip",
      message: "📜 The Chronicle records every bout. Check Legends for fight-of-the-week awards and Style Stats for meta trends.",
    },
  ],
};

/**
 * Hook: shows a coach toast tip once per session for the given route.
 * Tips are dismissed permanently via game state.
 */
export function useCoachTip(pathname: string) {
  const { state, setState } = useGame();

  useEffect(() => {
    if (!state.ftueComplete) return;

    const tips = COACH_TIPS[pathname];
    if (!tips) return;

    const dismissed = state.coachDismissed ?? [];
    const tip = tips.find(
      (t) => !dismissed.includes(t.id) && (!t.condition || t.condition(state))
    );

    if (!tip) return;

    // Small delay so page renders first
    const timer = setTimeout(() => {
      toast(tip.message, {
        duration: 8000,
        action: {
          label: "Got it",
          onClick: () => {
            setState({
              ...state,
              coachDismissed: [...(state.coachDismissed ?? []), tip.id],
            });
          },
        },
      });
      // Also mark as dismissed after showing (non-blocking — don't require click)
      setState({
        ...state,
        coachDismissed: [...(state.coachDismissed ?? []), tip.id],
      });
    }, 1000);

    return () => clearTimeout(timer);
    // Only trigger on route change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, state.ftueComplete]);
}
