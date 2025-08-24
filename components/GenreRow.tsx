
import React, { useRef, useState, useEffect } from 'react';
import type { Content } from '../types';
import ContentCard from './ContentCard';

interface GenreRowProps {
  title: string;
  items: Content[];
  onContentSelect: (id: number, type: 'movie' | 'tv') => void;
  genreId?: number;
  genreType?: 'movie' | 'tv';
  onGenreSelect?: (id: number, name: string, type: 'movie' | 'tv') => void;
}

const GenreRow: React.FC<GenreRowProps> = ({ title, items, onContentSelect, genreId, genreType, onGenreSelect }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const isClickable = genreId !== undefined && genreType && onGenreSelect;

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
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = el.clientWidth * 0.8;
      el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };
  
  return (
    <section className="space-y-4">
      {isClickable ? (
        <div
          onClick={() => onGenreSelect(genreId, title, genreType)}
          className="flex items-center gap-2 cursor-pointer group w-fit px-4 sm:px-0"
          aria-label={`View all content in the ${title} category`}
        >
          <h2 className="text-2xl font-bold text-white group-hover:text-gray-300 transition-colors">{title}</h2>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      ) : (
        <h2 className="text-2xl font-bold text-white px-4 sm:px-0">{title}</h2>
      )}
      <div className="relative group">
        <div 
          ref={scrollContainerRef}
          className="flex space-x-4 overflow-x-auto overflow-y-hidden p-4 sm:p-0 -m-4 sm:m-0 no-scrollbar scroll-smooth"
        >
          {items.map((item) => (
            <div key={`${item.type}-${item.id}`} className="w-40 md:w-48 flex-shrink-0">
              <ContentCard item={item} onContentSelect={onContentSelect} />
            </div>
          ))}
        </div>

        {canScrollLeft && (
          <button 
            onClick={(e) => { e.stopPropagation(); scroll('left'); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/60 rounded-full hover:bg-white/20 backdrop-blur-sm transition-all"
            aria-label="Scroll left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
        )}

        {canScrollRight && (
          <button 
            onClick={(e) => { e.stopPropagation(); scroll('right'); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/60 rounded-full hover:bg-white/20 backdrop-blur-sm transition-all"
            aria-label="Scroll right"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        )}
      </div>
    </section>
  );
};

export default GenreRow;
