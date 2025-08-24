
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Content } from '../types';
import { API_KEY, BASE_URL, IMAGE_BASE_URL, BACKDROP_BASE_URL, GENRE_MAP } from '../constants';
import ContentCard from './ContentCard';
import LoadingIndicator from './LoadingIndicator';

interface SearchOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onContentSelect: (id: number, type: 'movie' | 'tv') => void;
  region: string;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ isVisible, onClose, onContentSelect, region }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filter states
  const [mediaType, setMediaType] = useState<'multi' | 'movie' | 'tv'>('multi');
  const [year, setYear] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Observer for infinite scroll
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
      if (isLoading || isLoadingMore || !hasMore) return;
      if (observer.current) observer.current.disconnect();
      
      const handleIntersect = (entries: IntersectionObserverEntry[]) => {
          if (entries[0]?.isIntersecting) {
              setPage(prevPage => prevPage + 1);
          }
      };

      observer.current = new IntersectionObserver(handleIntersect);
      if (node) observer.current.observe(node);
  }, [isLoading, isLoadingMore, hasMore]);

  // Reset and clear results on visibility change
  useEffect(() => {
    if (isVisible) {
      inputRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      // Reset everything on close
      setQuery('');
      setResults([]);
      setError(null);
      setPage(1);
      setHasMore(true);
      setMediaType('multi');
      setYear('');
    }
    return () => {
        document.body.style.overflow = 'auto';
    };
  }, [isVisible]);

  // Effect to fetch data based on query, filters, and page
  useEffect(() => {
    const fetchSearchResults = async () => {
        if (!query.trim()) {
            setResults([]);
            setIsLoading(false);
            setIsLoadingMore(false);
            return;
        }

        if (page === 1) {
            setIsLoading(true);
            setResults([]); // Clear results for new search
        } else {
            setIsLoadingMore(true);
        }
        setError(null);
        
        try {
            let url = `${BASE_URL}/search/${mediaType}?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=${page}&include_adult=false&region=${region}`;
            
            const yearRegex = /^\d{4}$/;
            if (year && yearRegex.test(year) && mediaType !== 'multi') {
                const yearParam = mediaType === 'movie' ? 'primary_release_year' : 'first_air_date_year';
                url += `&${yearParam}=${year}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Search request failed. Please try again.');
            }
            const data = await response.json();
            
            const newResults: Content[] = data.results
                .filter((item: any) => item.poster_path && (mediaType === 'multi' ? (item.media_type === 'movie' || item.media_type === 'tv') : true))
                .map((item: any) => ({
                    id: item.id,
                    type: mediaType === 'multi' ? item.media_type : mediaType,
                    title: item.title || item.name,
                    posterUrl: `${IMAGE_BASE_URL}${item.poster_path}`,
                    backdropUrl: item.backdrop_path ? `${BACKDROP_BASE_URL}${item.backdrop_path}` : `${IMAGE_BASE_URL}${item.poster_path}`,
                    year: (item.release_date || item.first_air_date)?.substring(0, 4) || 'N/A',
                    genreString: item.genre_ids?.map((id: number) => GENRE_MAP.get(id)).filter(Boolean).join(' / ') || '',
                    description: item.overview,
                }));

            setResults(prev => page === 1 ? newResults : [...prev, ...newResults]);
            setHasMore(data.page < data.total_pages && newResults.length > 0);

        } catch (err) {
            if (err instanceof Error) { setError(err.message); } 
            else { setError('An unknown search error occurred.'); }
            setResults([]);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };
    
    const debounceMs = page === 1 ? 300 : 0;
    const handler = setTimeout(() => {
        fetchSearchResults();
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [query, mediaType, year, page, region]);
  
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setPage(1);
    setHasMore(true);
  };
  
  const handleMediaTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMediaType(e.target.value as 'multi' | 'movie' | 'tv');
    setPage(1);
    setHasMore(true);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYear(e.target.value);
    setPage(1);
    setHasMore(true);
  }

  const handleContentClick = (id: number, type: 'movie' | 'tv') => {
    onContentSelect(id, type);
  };
  
  const transitionClasses = isVisible
    ? 'opacity-100'
    : 'opacity-0 pointer-events-none';

  const isInitialLoad = isLoading && page === 1;

  return (
    <div 
        className={`fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex flex-col p-4 sm:p-8 overflow-y-auto transition-opacity duration-300 ${transitionClasses}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-heading"
        onClick={onClose}
    >
      <div className="w-full max-w-7xl mx-auto flex flex-col flex-grow" onClick={(e) => e.stopPropagation()}>
        {/* Search Input and Close button */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative flex-grow">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <input
                ref={inputRef}
                type="text"
                placeholder="Search movies or TV shows..."
                value={query}
                onChange={handleQueryChange}
                className="bg-gray-900/70 text-white placeholder-gray-500 border-2 border-gray-800 rounded-full py-3 pl-12 pr-6 w-full focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-colors duration-300 text-lg"
                aria-label="Search for movies or TV shows"
            />
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-2 rounded-full bg-gray-900/50 hover:bg-gray-800/70"
            aria-label="Close search overlay"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm mb-6 px-1 text-gray-300">
            <div className="flex items-center gap-2">
                <label htmlFor="media_type" className="font-semibold">Type:</label>
                <select id="media_type" value={mediaType} onChange={handleMediaTypeChange} className="bg-gray-800 border-gray-700 rounded-md py-1 px-2 focus:ring-1 focus:ring-white focus:outline-none">
                    <option value="multi">All</option>
                    <option value="movie">Movies</option>
                    <option value="tv">TV Shows</option>
                </select>
            </div>
            <div className="flex items-center gap-2">
                 <label htmlFor="search_year" className="font-semibold">Year:</label>
                 <input 
                    type="number" 
                    id="search_year" 
                    placeholder="e.g. 2023" 
                    value={year} 
                    onChange={handleYearChange} 
                    disabled={mediaType === 'multi'}
                    className="bg-gray-800 border-gray-700 rounded-md py-1 px-2 w-24 focus:ring-1 focus:ring-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed" 
                    title={mediaType === 'multi' ? 'Select a type to filter by year' : ''}
                  />
            </div>
        </div>


        <div className="flex-grow min-h-0 overflow-y-auto no-scrollbar">
          {isInitialLoad && (
            <div className="flex justify-center items-center text-lg text-gray-400 pt-10 gap-4">
                <LoadingIndicator size="small" />
                <span>Searching...</span>
            </div>
          )}
          {error && (
            <p className="text-center text-red-400 pt-10">{error}</p>
          )}
          {!isLoading && !error && query.trim() && (
            <>
              <h2 id="search-heading" className="text-xl sm:text-2xl font-bold text-white mb-6 px-1">
                {results.length > 0 ? `Results for "${query}"` : `No results found for "${query}"`}
              </h2>
              {results.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {results.map((item, index) => (
                    <div ref={index === results.length - 1 ? lastElementRef : null} key={`${item.type}-${item.id}-${index}`}>
                      <ContentCard item={item} onContentSelect={handleContentClick} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 pt-10">
                    <p>Try searching for something else.</p>
                </div>
              )}
            </>
          )}
           {!isLoading && !query.trim() && (
              <div className="text-center text-gray-400 pt-10 flex flex-col items-center justify-center h-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-lg">Find your next favorite movie or show.</p>
              </div>
           )}
           <div className="h-24 flex items-center justify-center">
              {isLoadingMore && <LoadingIndicator size="small" message="Loading more..." />}
              {!isLoadingMore && !hasMore && results.length > 0 && <p className="text-gray-500">You've reached the end.</p>}
           </div>
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;
