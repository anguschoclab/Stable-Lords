/**
 * Stable Lords — Promoter Directory
 * Browse all promoters in the realm with their personalities,
 * booking history, and current capacity.
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Building2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { BookmarkFilterToggle } from '@/components/bookmarks/BookmarkFilterToggle';
import { DirectoryStatsGrid, PersonalityGuide } from './promoterDirectory/sections';
import { PromoterCard } from './promoterDirectory/PromoterCard';
import { usePromoterDirectory } from './promoterDirectory/usePromoterDirectory';

/** Header actions: bookmark filter + Booking Office link. */
function DirectoryActions({
  showBookmarkedOnly,
  onToggle,
  bookmarkedCount,
}: {
  showBookmarkedOnly: boolean;
  onToggle: () => void;
  bookmarkedCount: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <BookmarkFilterToggle
        active={showBookmarkedOnly}
        onToggle={onToggle}
        count={bookmarkedCount}
      />
      <Button
        asChild
        variant="outline"
        className="h-9 text-[11px] uppercase font-black tracking-widest gap-2"
      >
        <Link to="/stable/bouts">
          <Calendar className="h-3.5 w-3.5" />
          Booking Office
        </Link>
      </Button>
    </div>
  );
}

/**
 * Promoter directory.
 */
export default function PromoterDirectory() {
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const { boutOffers, week, absoluteWeek, sortedPromoters, stats, bookmarkedCount } =
    usePromoterDirectory(showBookmarkedOnly);

  return (
    <PageFrame maxWidth="lg">
      <PageHeader
        icon={Building2}
        title="Promoter Directory"
        subtitle={`OPS · PROMOTERS · WEEK ${week}`}
        actions={
          <DirectoryActions
            showBookmarkedOnly={showBookmarkedOnly}
            onToggle={() => setShowBookmarkedOnly((v) => !v)}
            bookmarkedCount={bookmarkedCount}
          />
        }
      />

      {/* Stats Overview */}
      <DirectoryStatsGrid stats={stats} />

      {/* Legend */}
      <PersonalityGuide />

      {/* Promoter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedPromoters.map((promoter) => (
          <PromoterCard
            key={promoter.id}
            promoter={promoter}
            offers={boutOffers ?? {}}
            currentWeek={absoluteWeek}
          />
        ))}
      </div>

      {/* Empty State */}
      {sortedPromoters.length === 0 && (
        <Card className="p-8 text-center">
          <CardContent className="space-y-4">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-lg font-bold uppercase tracking-wider">No Promoters Available</p>
            <p className="text-[11px] text-muted-foreground">
              Promoters will appear here as the season progresses.
            </p>
          </CardContent>
        </Card>
      )}
    </PageFrame>
  );
}
