
import React, { useState, useEffect } from 'react';
import type { DetailedContent, CastMember, Content, Episode, SeasonSummary, StreamCollection, Stream, StreamApiResponse, PlayableContent, PlayableStreamResponse } from '../types';
import { API_KEY, BASE_URL, IMAGE_BASE_URL, BACKDROP_BASE_URL, GENRE_MAP, STREAM_BASE_URL } from '../constants';
import CastSection from './CastSection';
import GenreRow from './GenreRow';
import EpisodesSection from './EpisodesSection';
import StreamSelectorModal from './StreamSelectorModal';
import LoadingIndicator from './LoadingIndicator';
import { ContentDetailSkeleton } from './SkeletonLoader';

interface ContentDetailProps {
  contentId: number;
  contentType: 'movie' | 'tv';
  onBack: () => void;
  onContentSelect: (id: number, type: 'movie' | 'tv') => void;
  onPlay: (content: PlayableContent) => void;
}

// --- Download Modal Component ---
const getQualityRankModal = (quality: string): number => {
    const q = quality.toLowerCase();
    if (q.includes('4k') || q.includes('2160')) return 1;
    if (q.includes('1080')) return 2;
    if (q.includes('720')) return 3;
    const numericPart = parseInt(q, 10);
    if (!isNaN(numericPart)) {
        return 1000 - numericPart;
    }
    return 1000;
};

interface DownloadSelectorModalProps {
    streams: StreamCollection;
    onClose: () => void;
    onSelect: (stream: Stream) => void;
    contentTitle: string;
}

const DownloadSelectorModal: React.FC<DownloadSelectorModalProps> = ({ streams, onClose, onSelect, contentTitle }) => {
    const availableQualities = Object.keys(streams)
        .filter(q => streams[q] && streams[q].length > 0)
        .sort((a, b) => getQualityRankModal(a) - getQualityRankModal(b));
    
    const [selectedQuality, setSelectedQuality] = useState<string | null>(availableQualities[0] || null);

    return (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="relative w-full max-w-xl h-auto max-h-[65vh] bg-gray-900/95 backdrop-blur-lg rounded-lg shadow-2xl flex flex-col transition-all duration-300 ease-in-out" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                    <div>
                        <h1 className="text-lg font-semibold text-white">Select Download Source</h1>
                        <p className="text-sm text-gray-400 truncate max-w-sm">{contentTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10" aria-label="Close selection">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="p-4 sm:p-6 flex flex-col flex-grow min-h-0">
                    <div className="flex border-b border-gray-700 mb-4 flex-shrink-0 overflow-x-auto no-scrollbar">
                        {availableQualities.map(q => (
                            <button 
                                key={q}
                                onClick={() => setSelectedQuality(q)}
                                className={`px-4 py-2 font-semibold transition-colors focus:outline-none flex-shrink-0 ${selectedQuality === q ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white border-b-2 border-transparent'}`}
                                aria-pressed={selectedQuality === q}
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                    <div className="flex-grow overflow-y-auto no-scrollbar">
                        {selectedQuality && streams[selectedQuality] ? (
                            <ul className="space-y-2 pr-2">
                                {streams[selectedQuality].map((s, index) => (
                                    <li key={`${selectedQuality}-${index}`}>
                                        <button 
                                            onClick={() => onSelect({...s, quality: selectedQuality})} 
                                            className="w-full text-left p-3 rounded-md transition-colors text-gray-300 bg-gray-800 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white flex items-center gap-3"
                                        >
                                            <span className="material-symbols-outlined text-gray-400">download</span>
                                            <span className="text-sm font-medium whitespace-pre-wrap flex-grow">{s.title}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400 text-center pt-4">Select a quality to see available download links.</p>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};


const getQualityRank = (quality: string): number => {
    const q = quality.toLowerCase();
    if (q.includes('4k') || q.includes('2160')) return 1;
    if (q.includes('1080')) return 2;
    if (q.includes('720')) return 3;
    const numericPart = parseInt(q, 10);
    if (!isNaN(numericPart)) {
        return 1000 - numericPart;
    }
    return 1000;
};

const ContentDetail: React.FC<ContentDetailProps> = ({ contentId, contentType, onBack, onContentSelect, onPlay }) => {
  const [content, setContent] = useState<DetailedContent | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [recommended, setRecommended] = useState<Content[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [streams, setStreams] = useState<StreamCollection | null>(null);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [loadingStreams, setLoadingStreams] = useState(false);
  const [isStreamSelectorVisible, setIsStreamSelectorVisible] = useState(false);
  const [isDownloadSelectorVisible, setIsDownloadSelectorVisible] = useState(false);
  const [isPreparingDownload, setIsPreparingDownload] = useState(false);


  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      // Reset state for new content
      setStreams(null);
      setSelectedStream(null);
      setEpisodes([]);
      setSelectedEpisode(null);

      try {
        const detailsUrl = `${BASE_URL}/${contentType}/${contentId}?api_key=${API_KEY}&language=en-US${contentType === 'tv' ? '&append_to_response=external_ids' : ''}`;
        const creditsUrl = `${BASE_URL}/${contentType}/${contentId}/credits?api_key=${API_KEY}&language=en-US`;
        const recsUrl = `${BASE_URL}/${contentType}/${contentId}/recommendations?api_key=${API_KEY}&language=en-US&page=1`;
        const videosUrl = `${BASE_URL}/${contentType}/${contentId}/videos?api_key=${API_KEY}&language=en-US`;

        const [detailsRes, creditsRes, recsRes, videosRes] = await Promise.all([
          fetch(detailsUrl),
          fetch(creditsUrl),
          fetch(recsUrl),
          fetch(videosUrl),
        ]);

        if (!detailsRes.ok) throw new Error(`Failed to fetch content details.`);
        const detailsData = await detailsRes.json();
        
        const imdbId = contentType === 'tv' ? detailsData.external_ids?.imdb_id : detailsData.imdb_id;

        const year = detailsData.release_date?.substring(0, 4) || detailsData.first_air_date?.substring(0, 4) || 'N/A';
        setContent({
          id: detailsData.id,
          type: contentType,
          title: detailsData.title || detailsData.name,
          posterUrl: detailsData.poster_path ? `${IMAGE_BASE_URL}${detailsData.poster_path}` : `https://via.placeholder.com/500x750.png/1a202c/FFFFFF?text=${(detailsData.title || detailsData.name).replace(/\s+/g, '+')}`,
          backdropUrl: detailsData.backdrop_path ? `${BACKDROP_BASE_URL}${detailsData.backdrop_path}` : `https://via.placeholder.com/1280x720.png/1a202c/FFFFFF?text=${(detailsData.title || detailsData.name).replace(/\s+/g, '+')}`,
          year,
          description: detailsData.overview,
          tagline: detailsData.tagline,
          runtime: detailsData.runtime || (detailsData.episode_run_time && detailsData.episode_run_time[0]),
          voteAverage: detailsData.vote_average,
          genres: detailsData.genres,
          numberOfSeasons: detailsData.number_of_seasons,
          numberOfEpisodes: detailsData.number_of_episodes,
          seasons: detailsData.seasons?.filter((s: any) => s.season_number > 0).map((s: any) => ({ id: s.id, name: s.name, seasonNumber: s.season_number, episodeCount: s.episode_count })),
          imdb_id: imdbId,
        });

        // Process other responses safely
        if (creditsRes.ok) {
            const creditsData = await creditsRes.json();
            setCast(creditsData.cast.slice(0, 20).map((c: any) => ({ id: c.cast_id, name: c.name, character: c.character, profileUrl: c.profile_path ? `${IMAGE_BASE_URL}${c.profile_path}` : '' })));
        }
        
        if (recsRes.ok) {
            const recsData = await recsRes.json();
            setRecommended(recsData.results.slice(0, 10).map((r: any) => ({
              id: r.id,
              type: r.media_type || contentType,
              title: r.title || r.name,
              posterUrl: r.poster_path ? `${IMAGE_BASE_URL}${r.poster_path}` : `https://via.placeholder.com/500x750.png/1a202c/FFFFFF?text=${(r.title || r.name).replace(/\s+/g, '+')}`,
              backdropUrl: r.backdrop_path ? `${BACKDROP_BASE_URL}${r.backdrop_path}` : `https://via.placeholder.com/1280x720.png/1a202c/FFFFFF?text=${(r.title || r.name).replace(/\s+/g, '+')}`,
              year: r.release_date?.substring(0, 4) || r.first_air_date?.substring(0, 4) || 'N/A',
              genreString: r.genre_ids.map((id: number) => GENRE_MAP.get(id)).filter(Boolean).join(' / '),
              description: r.overview,
            })));
        }
        
        if (videosRes.ok) {
            const videosData = await videosRes.json();
            const trailer = videosData.results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
            setTrailerKey(trailer?.key || null);
        }

      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError("An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [contentId, contentType]);

  // Fetch episodes for TV shows when season changes
  useEffect(() => {
    if (contentType === 'tv' && content?.id) {
      setLoadingEpisodes(true);
      const url = `${BASE_URL}/tv/${content.id}/season/${selectedSeason}?api_key=${API_KEY}&language=en-US`;
      fetch(url)
        .then(res => res.json())
        .then(data => {
          const fetchedEpisodes: Episode[] = data.episodes.map((ep: any) => ({
            id: ep.id,
            name: ep.name,
            overview: ep.overview,
            stillUrl: ep.still_path ? `${BACKDROP_BASE_URL}${ep.still_path}` : `https://via.placeholder.com/1280x720.png/1a202c/FFFFFF?text=${encodeURIComponent(ep.name)}`,
            episodeNumber: ep.episode_number,
            seasonNumber: ep.season_number,
          }));
          setEpisodes(fetchedEpisodes);
          if (fetchedEpisodes.length > 0) {
            setSelectedEpisode(fetchedEpisodes[0]); // Auto-select first episode
          } else {
            setSelectedEpisode(null);
          }
        })
        .catch(() => {
            setEpisodes([]);
            setSelectedEpisode(null);
        })
        .finally(() => setLoadingEpisodes(false));
    }
  }, [contentType, content?.id, selectedSeason]);
  
  // Fetch streams for movies or selected TV episodes
  useEffect(() => {
    const fetchContentStreams = async () => {
        if (!content?.imdb_id) return;

        let url: string | null = null;
        if (contentType === 'movie') {
            url = `${STREAM_BASE_URL}/movies/${content.imdb_id}`;
        } else if (contentType === 'tv' && selectedEpisode) {
            url = `${STREAM_BASE_URL}/series/${content.imdb_id}/${selectedEpisode.seasonNumber}/${selectedEpisode.episodeNumber}`;
        } else {
            // Don't fetch for TV if no episode is selected
            setStreams(null);
            setSelectedStream(null);
            return;
        }

        setLoadingStreams(true);
        setStreams(null);
        setSelectedStream(null);
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch streams');
            const data: StreamApiResponse = await res.json();
            
            if (data.streams && Object.keys(data.streams).length > 0) {
                const availableQualities = Object.keys(data.streams)
                    .filter(q => data.streams[q] && data.streams[q].length > 0)
                    .sort((a, b) => getQualityRank(a) - getQualityRank(b));
                
                if (availableQualities.length > 0) {
                    setStreams(data.streams);
                    const bestQuality = availableQualities[0];
                    const bestStreamSource = data.streams[bestQuality][0];
                    setSelectedStream({ ...bestStreamSource, quality: bestQuality });
                } else {
                    setStreams(null);
                    setSelectedStream(null);
                }
            } else {
                setStreams(null);
                setSelectedStream(null);
            }
        } catch (err) {
            setStreams(null);
            setSelectedStream(null);
        } finally {
            setLoadingStreams(false);
        }
    };

    fetchContentStreams();
  }, [content?.imdb_id, contentType, selectedEpisode]);

  const handleWatchNow = () => {
    if (!content?.imdb_id || !selectedStream) return;

    if (contentType === 'movie') {
        onPlay({
            imdbId: content.imdb_id,
            type: 'movie',
            title: content.title,
            initialStream: selectedStream,
        });
    } else if (contentType === 'tv' && selectedEpisode) {
        onPlay({
            imdbId: content.imdb_id,
            type: 'tv',
            title: content.title,
            season: selectedEpisode.seasonNumber,
            episode: selectedEpisode.episodeNumber,
            initialStream: selectedStream,
        });
    }
  };

  const handleStreamSelect = (stream: Stream) => {
    setSelectedStream(stream);
    setIsStreamSelectorVisible(false);
  };
  
  const handleDownloadSelect = async (stream: Stream) => {
    if (!content) return;

    setIsPreparingDownload(true);
    setIsDownloadSelectorVisible(false); // Close modal immediately

    try {
        const res = await fetch(`${STREAM_BASE_URL}/stream?url=${encodeURIComponent(stream.url)}`);
        if (!res.ok) throw new Error(`Server error: ${res.statusText}`);
        
        const data: PlayableStreamResponse = await res.json();
        
        const downloadUrl = data.streams?.main;
        if (!downloadUrl) {
            throw new Error('No direct download link was found for this source.');
        }

        const link = document.createElement('a');
        link.href = downloadUrl;

        // Sanitize title for filename
        let filename = content.title.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '.');
        if (contentType === 'tv' && selectedEpisode) {
            const season = String(selectedEpisode.seasonNumber).padStart(2, '0');
            const episode = String(selectedEpisode.episodeNumber).padStart(2, '0');
            filename += `.S${season}E${episode}`;
        }
        filename += `.${stream.quality || '720p'}.mp4`;

        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        // Using alert for simplicity as there's no toast component
        alert(`Download Failed\n\n${errorMessage}`);
    } finally {
        setIsPreparingDownload(false);
    }
  };

  const handleEpisodeSelect = (episode: Episode) => {
      setSelectedEpisode(episode);
  };

  if (loading) {
    return <ContentDetailSkeleton />;
  }
  
  if (isPreparingDownload) {
    return (
        <div className="fixed inset-0 z-[110] bg-black/80 flex flex-col justify-center items-center h-full text-center p-4">
            <LoadingIndicator message="Preparing download..." />
        </div>
    );
  }

  if (error || !content) {
    return <div className="min-h-screen bg-black flex justify-center items-center text-red-400">{error || 'Content not found.'}</div>;
  }
  
  const renderRuntime = (runtime?: number) => {
      if (!runtime) return null;
      const hours = Math.floor(runtime / 60);
      const minutes = runtime % 60;
      return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
  };
  
  const PlayControls = ({contentType}: {contentType: 'movie' | 'tv'}) => (
      <div className="flex flex-col sm:flex-row items-stretch gap-4">
          {loadingStreams ? (
               <div className="flex items-center gap-2 text-gray-400">
                  <LoadingIndicator size="small" />
                  <span>Searching for streams...</span>
              </div>
          ) : selectedStream ? (
              <>
                  <button
                      onClick={handleWatchNow}
                      className="bg-white/20 text-white font-bold py-3 px-6 rounded-md backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-colors flex items-center justify-center gap-2 text-lg whitespace-nowrap"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                      <span>Play Now</span>
                  </button>
                  <button
                      onClick={() => setIsStreamSelectorVisible(true)}
                      className="flex-grow sm:flex-grow-0 sm:w-64 text-left bg-white/10 p-3 rounded-md border border-gray-700/50 hover:bg-white/20 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white flex justify-between items-center"
                      aria-label="Change streaming source"
                  >
                      <div>
                          <p className="text-white font-semibold text-base">Change Source</p>
                          <p className="text-gray-400 text-xs font-medium uppercase truncate" title={selectedStream.title}>
                              Current: {selectedStream.quality}
                          </p>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                  </button>
                  <button
                      onClick={() => setIsDownloadSelectorVisible(true)}
                      className="bg-white/10 text-white font-bold py-3 px-4 rounded-md backdrop-blur-sm border border-white/30 hover:bg-white/20 transition-colors flex items-center justify-center"
                      title="Download"
                      aria-label="Download content"
                  >
                      <span className="material-symbols-outlined">download</span>
                  </button>
              </>
          ) : (
               <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg">
                  <p className="text-yellow-300/80">No streams could be found for this {contentType}.</p>
              </div>
          )}
      </div>
  );

  return (
    <main className="bg-black text-gray-300 animate-fade-in">
        <div className="w-full relative">
            <div className="w-full h-[50vh] md:h-[60vh] lg:h-[70vh] relative" style={{ backgroundImage: `url(${content.backdropUrl})`, backgroundSize: 'cover', backgroundPosition: 'center 20%' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
                <button onClick={onBack} className="absolute top-4 left-4 z-20 p-2 bg-black/50 rounded-full hover:bg-white/20 transition-colors" aria-label="Go back">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
            </div>
        </div>

      <div className="w-full max-w-7xl mx-auto p-4 sm:p-8 relative -mt-32 md:-mt-48 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white break-words" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>{content.title}</h1>
                {content.tagline && <p className="text-lg text-gray-400 italic mt-1">{content.tagline}</p>}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm">
                    <span>{content.year}</span>
                    <span className="opacity-50">•</span>
                    <span>{content.genres.map(g => g.name).join(', ')}</span>
                    {content.runtime && <><span className="opacity-50">•</span><span>{renderRuntime(content.runtime)}</span></>}
                    <span className="opacity-50">•</span>
                    <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        <span>{content.voteAverage.toFixed(1)}</span>
                    </div>
                </div>

                <p className="mt-6 max-w-3xl text-gray-300 leading-relaxed">{content.description}</p>
                
                {contentType === 'movie' && <div className="mt-8"><PlayControls contentType="movie" /></div>}

                {contentType === 'tv' && content.seasons && (
                    <>
                    {selectedEpisode ? (
                        <div className="mt-8">
                            <h3 className="text-lg font-bold text-white mb-4" aria-live="polite">
                                Selected: <span className="text-white font-semibold">S{selectedEpisode.seasonNumber} E{selectedEpisode.episodeNumber}</span> - {selectedEpisode.name}
                            </h3>
                            <PlayControls contentType="tv" />
                        </div>
                    ) : !loadingEpisodes && <p className="mt-8 text-gray-400">Select an episode to begin.</p>}

                    <EpisodesSection
                        seasons={content.seasons}
                        episodes={episodes}
                        selectedSeason={selectedSeason}
                        onSeasonChange={setSelectedSeason}
                        isLoading={loadingEpisodes}
                        tvId={content.id}
                        onEpisodeSelect={handleEpisodeSelect}
                        selectedEpisodeId={selectedEpisode?.id}
                    />
                    </>
                )}
            </div>
            <aside className="lg:col-span-1 relative">
                <CastSection cast={cast} />
            </aside>
        </div>

        {recommended.length > 0 && (
          <div className="mt-16">
            <GenreRow title="You Might Also Like" items={recommended} onContentSelect={onContentSelect} />
          </div>
        )}
      </div>
       {isStreamSelectorVisible && streams && (
          <StreamSelectorModal
              streams={streams}
              currentStream={selectedStream}
              onClose={() => setIsStreamSelectorVisible(false)}
              onSelect={handleStreamSelect}
          />
      )}
      {isDownloadSelectorVisible && streams && (
          <DownloadSelectorModal
              streams={streams}
              onClose={() => setIsDownloadSelectorVisible(false)}
              onSelect={handleDownloadSelect}
              contentTitle={content.title}
          />
      )}
    </main>
  );
};

export default ContentDetail;