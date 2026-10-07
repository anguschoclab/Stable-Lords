import { IconTabStrip } from '@/components/ui/IconTabStrip';
import { LayoutDashboard, Swords, FileText, Activity } from 'lucide-react';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'stats', label: 'Attributes', icon: Activity },
  { id: 'history', label: 'Fight Log', icon: Swords },
  { id: 'biography', label: 'History', icon: FileText },
];

/**
 * Warrior dossier tabs.
 * @param - { active tab, set active tab }.
 */
export default function WarriorDossierTabs({ activeTab, setActiveTab }: Props) {
  return <IconTabStrip tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />;
}
