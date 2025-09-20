import React, { useState, useEffect } from 'react';
import type { Stream, StreamApiResponse, PlayableStreamResponse } from '../types';
import { API_KEY, BASE_URL, IMAGE_BASE_URL, STREAM_BASE_URL } from '../constants';
import VideoPlayer from './VideoPlayer';
import * as api from '../lib/api';
import LoadingIndicator from './LoadingIndicator';

interface UpNextInfo {
    title: string;
    synopsis?: string;
    imageUrl: string;
}

interface StreamPlayerProps {
  content: {
    imdbId: string;
    type: 'movie' | 'tv';
    title: string;
    season?: number;
    episode?: number;
    initialStream?: Stream;
  };
  onClose: () => void;
}

const StreamPlayer: React.FC<StreamPlayerProps> = ({ content: initialContent, onClose }) => {
    const [currentContent, setCurrentContent] = useState(initialContent);
    const [urlTemplate, setUrlTemplate] = useState<string | null>(null);
    const [duration, setDuration] = useState<number | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [nextUpInfo, setNextUpInfo] = useState<UpNextInfo | null>(null);
    const [nextEpisode, setNextEpisode] = useState<{season: number, episode: number} | null>(null);
    const [initialSeekTime, setInitialSeekTime] = useState(0);
    const [audioLanguages, setAudioLanguages] = useState<Record<string, string> | null>(null);

    useEffect(() => {
        const fetchStreamsAndPrepare = async () => {
            setLoading(true);
            setError(null);
            setUrlTemplate(null);
            setAudioLanguages(null);
            setNextUpInfo(null);
            setNextEpisode(null);
            
            try {
                const progress = await api.getWatchProgress(
                    currentContent.imdbId, 
                    currentContent.type === 'movie' ? 'movie' : 'series', 
                    currentContent.season, 
                    currentContent.episode
                );
                if (progress && progress.current_time > 5) {
                    setInitialSeekTime(progress.current_time);
                } else {
                    setInitialSeekTime(0);
                }

                // 1. Get manifest URL template
                let urlTemplateToSet: string | null = null;
                let durationToSet: number | undefined = undefined;

                const getManifestFromStream = async (streamUrl: string) => {
                    const response = await fetch(`${STREAM_BASE_URL}/stream?url=${encodeURIComponent(streamUrl)}`);
                    if (!response.ok) throw new Error('Could not get playable stream URL.');
                    const data: PlayableStreamResponse = await response.json();
                    durationToSet = data.duration;
                    setAudioLanguages(data.audio_lang || null);
                    if (data.streams && data.streams.Original) {
                       return data.streams.Original;
                    }
                    // Per user instruction, only use the `Original` stream as it contains the MPD manifest.
                    return null;
                }

                if(currentContent.initialStream?.url) {
                    urlTemplateToSet = await getManifestFromStream(currentContent.initialStream.url);
                } else {
                    let url = currentContent.type === 'movie'
                        ? `${STREAM_BASE_URL}/movies/${currentContent.imdbId}`
                        : `${STREAM_BASE_URL}/series/${currentContent.imdbId}/${currentContent.season}/${currentContent.episode}`;
                    
                    const response = await fetch(url);
                    if (!response.ok) throw new Error('Could not fetch streaming links.');
                    const data: StreamApiResponse = await response.json();
                    
                    const streamUrl = data.streams?.['1080p']?.[0]?.url || data.streams?.['720p']?.[0]?.url || Object.values(data.streams || {})?.[0]?.[0]?.url;
                    if (!streamUrl) throw new Error('No streams found for this content.');

                    urlTemplateToSet = await getManifestFromStream(streamUrl);
                }

                if(!urlTemplateToSet) throw new Error('Failed to resolve a playable stream URL.');

                setUrlTemplate(urlTemplateToSet);
                setDuration(durationToSet);

                // 2. Get Next Up Info for TV shows
                if (currentContent.type === 'tv' && currentContent.season && currentContent.episode) {
                    const searchRes = await fetch(`${BASE_URL}/find/${currentContent.imdbId}?api_key=${API_KEY}&language=en-US&external_source=imdb_id`);
                    if(searchRes.ok) {
                        const searchData = await searchRes.json();
                        const tvResult = searchData.tv_results[0];
                        if(tvResult) {
                            const seasonDetailsUrl = `${BASE_URL}/tv/${tvResult.id}/season/${currentContent.season}?api_key=${API_KEY}&language=en-US`;
                            const seasonRes = await fetch(seasonDetailsUrl);
                            if(seasonRes.ok) {
                                const seasonData = await seasonRes.json();
                                const nextEpData = seasonData.episodes.find((e: any) => e.episode_number === currentContent.episode! + 1);
                                if(nextEpData) {
                                    setNextEpisode({ season: nextEpData.season_number, episode: nextEpData.episode_number });
                                    setNextUpInfo({
                                        title: `E${nextEpData.episode_number}: ${nextEpData.name}`,
                                        synopsis: nextEpData.overview,
                                        imageUrl: nextEpData.still_path ? `${IMAGE_BASE_URL}${nextEpData.still_path}` : tvResult.poster_path ? `${IMAGE_BASE_URL}${tvResult.poster_path}` : ''
                                    });
                                }
                            }
                        }
                    }
                }

            } catch (err) {
                if (err instanceof Error) setError(err.message);
                else setError('An unknown error occurred while preparing the stream.');
            } finally {
                setLoading(false);
            }
        };

        fetchStreamsAndPrepare();
    }, [currentContent]);

    const handlePlayNext = () => {
        if (currentContent.type === 'tv' && nextEpisode) {
            setCurrentContent(prev => ({
                ...prev,
                season: nextEpisode.season,
                episode: nextEpisode.episode,
                initialStream: undefined,
            }));
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-[110] bg-black flex flex-col justify-center items-center h-full text-center p-4">
                <LoadingIndicator message="Preparing your stream..." />
            </div>
        );
    }

    if (error) {
        return (
             <div className="fixed inset-0 z-[110] bg-black flex flex-col items-center justify-center text-center p-4">
                <div className="bg-red-900/20 border border-red-500/30 p-8 rounded-lg max-w-lg">
                    <h1 className="text-red-400 text-3xl font-bold mb-3">Error Preparing Stream</h1>
                    <p className="text-red-300/80">{error}</p>
                    <button onClick={onClose} className="mt-6 bg-red-600 px-6 py-2 rounded font-bold hover:bg-red-700 transition-colors">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }
    
    if (!urlTemplate) return null;

    const subtitle = currentContent.type === 'tv' 
        ? `Season ${currentContent.season} / Episode ${currentContent.episode}`
        : currentContent.title;

    return (
        <VideoPlayer 
            urlTemplate={urlTemplate}
            audioLanguages={audioLanguages}
            mainTitle={currentContent.title}
            subtitle={subtitle}
            totalDurationProp={duration}
            onBack={onClose}
            imdbId={currentContent.imdbId}
            mediaType={currentContent.type === 'movie' ? 'Movie' : 'TV Show'}
            season={currentContent.season}
            episode={currentContent.episode}
            initialSeekTime={initialSeekTime}
            nextUpInfo={nextUpInfo}
            onPlayNext={handlePlayNext}
        />
    );
};

export default StreamPlayer;