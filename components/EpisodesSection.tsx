import React, { useRef, useState, useEffect } from 'react';
import type { SeasonSummary, Episode } from '../types';
import EpisodeCard from './EpisodeCard';
import { EpisodeCardSkeleton } from './SkeletonLoader';

interface EpisodesSectionProps {
  seasons: SeasonSummary[];
  episodes: Episode[];
  selectedSeason: number;
  onSeasonChange: (seasonNumber: number) => void;
  isLoading: boolean;
  tvId: number;
  onEpisodeSelect: (episode: Episode) => void;
  selectedEpisodeId?: number;
}

const EpisodesSection: React.FC<EpisodesSectionProps> = ({ seasons, episodes, selectedSeason, onSeasonChange, isLoading, tvId, onEpisodeSelect, selectedEpisodeId }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = () => {
    const el = scrollContainerRef.current;
    if (el) {
      const tolerance = 2;
      setCanScrollLeft(el.scrollLeft > tolerance);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - tolerance);
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      checkScrollability();
      const observer = new ResizeObserver(checkScrollability);
      observer.observe(el);

      el.addEventListener('scroll', checkScrollability, { passive: true });
      window.addEventListener('resize', checkScrollability);
      
      return () => {
        observer.disconnect();
        el.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, [episodes, isLoading]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = el.clientWidth * 0.8;
      el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="mt-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Episodes</h2>
        {seasons.length > 1 && (
          <div className="relative">
            <select
              value={selectedSeason}
              onChange={(e) => onSeasonChange(Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-white focus:border-white block w-full pl-3 pr-8 py-2 appearance-none"
              aria-label="Select a season"
            >
              {seasons.map(season => (
                <option key={season.id} value={season.seasonNumber}>
                  {season.name} ({season.episodeCount} Episodes)
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="w-64 md:w-72 flex-shrink-0">
                    <EpisodeCardSkeleton />
                </div>
            ))}
        </div>
      ) : episodes.length > 0 ? (
        <div className="relative group">
            <div ref={scrollContainerRef} className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar scroll-smooth">
              {episodes.map(episode => (
                <div key={`${tvId}-${episode.seasonNumber}-${episode.id}`} className="w-64 md:w-72 flex-shrink-0">
                    <EpisodeCard 
                        episode={episode} 
                        onSelect={onEpisodeSelect} 
                        isSelected={episode.id === selectedEpisodeId}
                    />
                </div>
              ))}
            </div>

            {canScrollLeft && (
                <button 
                    onClick={() => scroll('left')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/60 rounded-full hover:bg-white/20 backdrop-blur-sm transition-all"
                    aria-label="Scroll left"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
            )}

            {canScrollRight && (
                <button 
                    onClick={() => scroll('right')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/60 rounded-full hover:bg-white/20 backdrop-blur-sm transition-all"
                    aria-label="Scroll right"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            )}
        </div>
      ) : (
        <div className="flex justify-center items-center h-[260px] bg-white/5 rounded-lg">
            <p className="text-gray-400">No episodes found for this season.</p>
        </div>
      )}
    </div>
  );
};

export default EpisodesSection;