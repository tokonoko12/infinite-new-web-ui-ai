
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Content } from '../types';
import { API_KEY, BASE_URL, IMAGE_BASE_URL, BACKDROP_BASE_URL, GENRE_MAP } from '../constants';
import ContentCard from './ContentCard';
import LoadingIndicator from './LoadingIndicator';

interface GenreGridPageProps {
  genreId: number;
  genreName: string;
  genreType: 'movie' | 'tv';
  onBack: () => void;
  onContentSelect: (id: number, type: 'movie' | 'tv') => void;
  region: string;
}

const GenreGridPage: React.FC<GenreGridPageProps> = ({ genreId, genreName, genreType, onBack, onContentSelect, region }) => {
    const [content, setContent] = useState<Content[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [sortBy, setSortBy] = useState('popularity.desc');
    const [releaseYear, setReleaseYear] = useState('');
    const [minRating, setMinRating] = useState('0');

    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback((node: Element | null) => {
        if (loading || loadingMore || !hasMore) return;
        if (observer.current) observer.current.disconnect();

        const handleIntersect = (entries: IntersectionObserverEntry[]) => {
            if (entries[0]?.isIntersecting) {
                setPage(prevPage => prevPage + 1);
            }
        };

        observer.current = new IntersectionObserver(handleIntersect);

        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore]);
    
    // Effect to reset and fetch when filters change
    useEffect(() => {
        const fetchContent = () => {
            if (page === 1) setLoading(true);
            else setLoadingMore(true);
            
            setError(null);

            let url = `${BASE_URL}/discover/${genreType}?api_key=${API_KEY}&with_genres=${genreId}&language=en-US&page=${page}&region=${region}`;
            url += `&sort_by=${sortBy}`;
            
            const yearRegex = /^\d{4}$/;
            if (releaseYear && yearRegex.test(releaseYear)) {
                const yearParam = genreType === 'movie' ? 'primary_release_year' : 'first_air_date_year';
                url += `&${yearParam}=${releaseYear}`;
            }

            if (parseFloat(minRating) > 0) {
                url += `&vote_average.gte=${minRating}`;
                url += '&vote_count.gte=100'; // Add a threshold to avoid obscure high-rated items
            }
            
            fetch(url)
                .then(res => {
                    if (!res.ok) throw new Error(`Failed to fetch content for ${genreName}.`);
                    return res.json();
                })
                .then(data => {
                    const newContent: Content[] = data.results.map((item: any) => ({
                        id: item.id,
                        type: genreType,
                        title: item.title || item.name,
                        posterUrl: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : `https://via.placeholder.com/500x750.png/1a202c/FFFFFF?text=${(item.title || item.name).replace(/\s+/g, '+')}`,
                        backdropUrl: item.backdrop_path ? `${BACKDROP_BASE_URL}${item.backdrop_path}` : item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : `https://via.placeholder.com/1280x720.png/1a202c/FFFFFF?text=${(item.title || item.name).replace(/\s+/g, '+')}`,
                        year: (item.release_date || item.first_air_date)?.substring(0, 4) || 'N/A',
                        genreString: item.genre_ids?.map((id: number) => GENRE_MAP.get(id)).filter(Boolean).join(' / ') || '',
                        description: item.overview,
                    }));
                    
                    if (page === 1) {
                        setContent(newContent);
                    } else {
                        setContent(prev => [...prev, ...newContent]);
                    }
                    
                    setHasMore(data.page < data.total_pages && newContent.length > 0);
                })
                .catch(err => {
                    if (err instanceof Error) setError(err.message);
                    else setError("An unknown error occurred.");
                    setContent([]);
                    setHasMore(false);
                })
                .finally(() => {
                    setLoading(false);
                    setLoadingMore(false);
                });
        };
        fetchContent();
    }, [page, genreId, genreType, genreName, sortBy, releaseYear, minRating, region]);
    
    const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setter(e.target.value);
        setPage(1); // Reset page to trigger a new search
        setContent([]); // Clear old content immediately for better UX
        setHasMore(true); // Reset hasMore for new filter
    };
    
    const resetFilters = () => {
        setSortBy('popularity.desc');
        setReleaseYear('');
        setMinRating('0');
        setPage(1);
        setContent([]);
        setHasMore(true);
    };

    const isInitialLoad = loading && page === 1 && content.length === 0;

    return (
        <main className="min-h-screen bg-black text-gray-300 animate-fade-in">
            <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-lg p-4 sm:p-6 flex items-center gap-4">
                <button onClick={onBack} className="p-2 bg-black/50 rounded-full hover:bg-white/20 transition-colors" aria-label="Go back">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">{genreName}</h1>
            </header>
            
            <div className="sticky top-[72px] sm:top-[88px] z-20 bg-black/90 backdrop-blur-md px-4 sm:px-8 py-3">
                <div className="w-full max-w-7xl mx-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    {/* Sort By */}
                    <div className="flex items-center gap-2">
                        <label htmlFor="sort_by" className="font-semibold text-gray-400">Sort by:</label>
                        <select id="sort_by" value={sortBy} onChange={handleFilterChange(setSortBy)} className="bg-gray-800 border-gray-700 rounded-md py-1 px-2 focus:ring-1 focus:ring-white focus:outline-none">
                            <option value="popularity.desc">Popularity Desc</option>
                            <option value="popularity.asc">Popularity Asc</option>
                            <option value="release_date.desc">Release Date Desc</option>
                            <option value="release_date.asc">Release Date Asc</option>
                            <option value="vote_average.desc">Rating Desc</option>
                            <option value="vote_average.asc">Rating Asc</option>
                        </select>
                    </div>
                    {/* Release Year */}
                    <div className="flex items-center gap-2">
                         <label htmlFor="release_year" className="font-semibold text-gray-400">Year:</label>
                         <input type="number" id="release_year" placeholder="e.g. 2023" value={releaseYear} onChange={handleFilterChange(setReleaseYear)} className="bg-gray-800 border-gray-700 rounded-md py-1 px-2 w-24 focus:ring-1 focus:ring-white focus:outline-none" />
                    </div>
                     {/* Min Rating */}
                    <div className="flex items-center gap-2">
                         <label htmlFor="min_rating" className="font-semibold text-gray-400">Rating:</label>
                         <select id="min_rating" value={minRating} onChange={handleFilterChange(setMinRating)} className="bg-gray-800 border-gray-700 rounded-md py-1 px-2 focus:ring-1 focus:ring-white focus:outline-none">
                            <option value="0">Any</option>
                            <option value="9">9+</option>
                            <option value="8">8+</option>
                            <option value="7">7+</option>
                            <option value="6">6+</option>
                         </select>
                    </div>
                    {/* Reset Button */}
                    <button onClick={resetFilters} className="text-gray-400 hover:text-white transition-colors ml-auto text-xs font-semibold uppercase tracking-wider">Reset</button>
                </div>
            </div>

            <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto">
                {isInitialLoad ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3">
                        {Array.from({ length: 16 }).map((_, index) => (
                           <div key={index} className="aspect-[2/3] bg-gray-900 animate-shimmer" />
                        ))}
                    </div>
                ) : content.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3">
                        {content.map((item, index) => (
                            <div ref={index === content.length - 1 ? lastElementRef : null} key={`${item.type}-${item.id}-${index}`}>
                                <ContentCard item={item} onContentSelect={onContentSelect} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-lg">{error || `No content found for the selected filters in ${genreName}.`}</p>
                    </div>
                )}
                
                <div className="h-24 flex items-center justify-center">
                    {loadingMore && <LoadingIndicator size="small" message="Loading more..." />}
                    {!loading && !hasMore && content.length > 0 && <p className="text-gray-500">You've reached the end.</p>}
                </div>
            </div>
        </main>
    );
};

export default GenreGridPage;
