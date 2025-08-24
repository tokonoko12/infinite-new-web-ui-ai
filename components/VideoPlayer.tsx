import React, { useState, useEffect, useRef } from 'react';
import dashjs from 'dashjs';
import type { 
  MediaPlayerClass,
  BitrateInfo,
  MediaInfo,
  QualityChangeRenderedEvent,
  ErrorEvent,
} from 'dashjs';
import PlayerControls from './PlayerControls';
import * as api from '../lib/api';
import { UpNextOverlay } from './UpNextOverlay';

interface UpNextInfo {
    title: string;
    synopsis?: string;
    imageUrl: string;
}
interface VideoPlayerProps {
  urlTemplate: string;
  audioLanguages: Record<string, string> | null;
  mainTitle: string;
  subtitle: string;
  totalDurationProp?: number;
  onBack: () => void;
  imdbId: string;
  mediaType: 'Movie' | 'TV Show';
  season?: number;
  episode?: number;
  initialSeekTime?: number;
  nextUpInfo: UpNextInfo | null;
  onPlayNext: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
    urlTemplate, audioLanguages, mainTitle, subtitle, totalDurationProp, onBack,
    imdbId, mediaType, season, episode, initialSeekTime = 0,
    nextUpInfo, onPlayNext
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<MediaPlayerClass | null>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const progressSaveIntervalRef = useRef<number | null>(null);
  const timeOffsetRef = useRef(initialSeekTime);
  
  const [selectedAudioLanguage, setSelectedAudioLanguage] = useState('en');

  const getUrlWithTime = (baseUrl: string, time: number) => {
    if (time > 1) {
        const [base] = baseUrl.split('?');
        return `${base}?t=${Math.round(time)}`;
    }
    return baseUrl;
  };

  const [streamInfo, setStreamInfo] = useState({ manifestUrl: '', seekTime: initialSeekTime });
  const [totalDuration, setTotalDuration] = useState(totalDurationProp || 0);

  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(initialSeekTime);
  const [buffer, setBuffer] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [lastVolume, setLastVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [qualities, setQualities] = useState<BitrateInfo[]>([]);
  const [textTracks, setTextTracks] = useState<MediaInfo[]>([]);
  const [currentTextTrack, setCurrentTextTrack] = useState<MediaInfo | null>(null);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);

  const isSeekingRef = useRef(isSeeking);
  useEffect(() => { isSeekingRef.current = isSeeking; }, [isSeeking]);
  
  const totalDurationRef = useRef(totalDuration);
  useEffect(() => { totalDurationRef.current = totalDuration; }, [totalDuration]);

  const currentTimeRef = useRef(currentTime);
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);

  useEffect(() => {
    const originalTitle = document.title;
    document.title = subtitle ? `${subtitle} | ${mainTitle}` : mainTitle;
    return () => { document.title = originalTitle; };
  }, [mainTitle, subtitle]);
  
  useEffect(() => {
    if (urlTemplate) {
        let lang = selectedAudioLanguage;
        if (audioLanguages) {
            lang = 'en' in audioLanguages ? 'en' : (Object.keys(audioLanguages)[0] || 'en');
            setSelectedAudioLanguage(lang);
        }
        setStreamInfo({ 
            manifestUrl: getUrlWithTime(urlTemplate.replace('{audio}', lang), initialSeekTime), 
            seekTime: initialSeekTime 
        });
    }
}, [urlTemplate, audioLanguages, initialSeekTime]);

  const saveProgress = async (isFinishedFlag = false, timeOverride?: number) => {
      if (!imdbId) return;
      if (mediaType === 'TV Show' && (season === undefined || episode === undefined)) return;

      const duration = totalDurationRef.current;
      const time = timeOverride ?? currentTimeRef.current;
      
      if (isFinishedFlag && duration > 0) {
        await api.saveWatchProgress({
            imdb_id: imdbId,
            media_type: mediaType === 'Movie' ? 'movie' : 'series',
            current_time: duration,
            is_finished: true,
            season: mediaType === 'TV Show' ? season : undefined,
            episode: mediaType === 'TV Show' ? episode : undefined,
        });
        return;
      }
      
      const shouldBeFinished = duration > 0 && Math.abs(duration - time) < 10;
      const timeToSave = shouldBeFinished ? duration : time;

      if (timeToSave <= 5 && !shouldBeFinished) return;

      const progressData: Parameters<typeof api.saveWatchProgress>[0] = {
          imdb_id: imdbId,
          media_type: mediaType === 'Movie' ? 'movie' : 'series',
          current_time: timeToSave,
          is_finished: shouldBeFinished,
          season: mediaType === 'TV Show' ? season : undefined,
          episode: mediaType === 'TV Show' ? episode : undefined,
      };
      try {
          await api.saveWatchProgress(progressData);
      } catch (e) {
          console.error("Failed to save watch progress", e);
      }
  };

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;

    if (!streamInfo.manifestUrl) {
      setIsLoading(false);
      return;
    }

    if (!streamInfo.manifestUrl.startsWith('http')) {
        const invalidUrlMessage = `The stream URL received is invalid and cannot be played. This may happen if the content is unavailable in your region or the provider is experiencing issues. URL received: "${streamInfo.manifestUrl}"`;
        setError(invalidUrlMessage);
        setIsLoading(false);
        return;
    }

    setError(null);
    setIsLoading(true);

    const videoElement = videoRef.current;
    const player = dashjs.MediaPlayer().create();
    playerRef.current = player;
    
    timeOffsetRef.current = streamInfo.seekTime;

    player.updateSettings({
        streaming: {
            buffer: {
                bufferToKeep: 30,
                bufferPruningInterval: 10
            },
        }
    });
    
    player.initialize(videoElement, streamInfo.manifestUrl, true);
    player.setVolume(isMuted ? 0 : volume);
    player.setPlaybackRate(playbackRate);
    
    const onPlaybackStarted = () => {
      setIsPlaying(true);
      if (progressSaveIntervalRef.current) clearInterval(progressSaveIntervalRef.current);
      progressSaveIntervalRef.current = window.setInterval(() => saveProgress(false), 15000);
    };
    const onPlaybackPaused = () => {
      setIsPlaying(false);
      if (progressSaveIntervalRef.current) clearInterval(progressSaveIntervalRef.current);
      saveProgress();
    };
    
    const onStreamInitialized = () => {
      const videoTrackInfo = player.getTracksFor('video')?.[0];
      if (videoTrackInfo?.bitrateList) {
          const qualityList: BitrateInfo[] = (videoTrackInfo.bitrateList as any[]).map((b, i) => ({
              bitrate: b.bandwidth,
              mediaType: 'video',
              qualityIndex: i,
              width: b.width,
              height: b.height,
              scanType: 'progressive',
          }));
          setQualities(qualityList);
      }
      
      player.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: true } } } });
      setCurrentQuality(-1); // -1 for Auto
      
      const tracks = player.getTracksFor('text');
      setTextTracks(tracks || []);
      if (tracks && tracks.length > 0) {
        let initialTrackIndex = tracks.findIndex((t: MediaInfo) => t.lang?.toLowerCase().startsWith('en'));
        if (initialTrackIndex === -1) initialTrackIndex = 0;
        player.setTextTrack(initialTrackIndex);
        setCurrentTextTrack(tracks[initialTrackIndex]);
      } else {
        setCurrentTextTrack(null);
      }
    };

    const onMetadataLoaded = () => {
        if (totalDurationRef.current > 0) return; 
        const playerDuration = player.duration();
        if (playerDuration > 0 && isFinite(playerDuration)) {
            setTotalDuration(playerDuration);
        }
    };
    
    const onQualityChange = (e: QualityChangeRenderedEvent) => {
        if (e.mediaType === 'video') {
            setCurrentQuality((e as any).newQuality);
        }
    };

    const onTimeUpdate = () => {
      if (isSeekingRef.current || !playerRef.current) return;
      const playerTime = playerRef.current.time();
      const durationForCalc = totalDurationRef.current;
      if (durationForCalc > 0 && !isNaN(playerTime)) {
        const absoluteTime = timeOffsetRef.current + playerTime;
        setCurrentTime(absoluteTime);
        setProgress((absoluteTime / durationForCalc) * 100);
      }
    };
    
    const onBufferLevelUpdated = () => {
      if (!playerRef.current) return;
      const dur = totalDurationRef.current;
      if(dur > 0) {
          const bufferLevel = playerRef.current.getBufferLength('video');
          const playerTime = playerRef.current.time();
          const bufferProgress = ((timeOffsetRef.current + playerTime + bufferLevel) / dur) * 100;
          setBuffer(bufferProgress);
      }
    };

    const onPlaybackEnded = () => {
      if (totalDurationRef.current > 0 && Math.abs(currentTimeRef.current - totalDurationRef.current) < 10) {
        setIsFinished(true);
        setIsPlaying(false);
        setIsControlsVisible(true);
        saveProgress(true);
      }
    };

    const onError = (e: ErrorEvent) => {
      if (e.error && typeof e.error === 'object' && 'code' in e.error && (e.error as any).code === 6001) return; // manifest update on seek
      if (e.error && typeof e.error === 'object' && 'message' in e.error) {
        setError(`Error: ${e.error.message} (code: ${'code' in e.error ? (e.error as any).code : 'N/A'})`);
      } else {
        const errorMessage = typeof e.error === 'string' ? `An unknown error occurred: ${e.error}` : 'An unknown error occurred while trying to play the video.';
        setError(errorMessage);
      }
      setIsLoading(false);
    };
    
    player.on(dashjs.MediaPlayer.events.PLAYBACK_STARTED, onPlaybackStarted);
    player.on(dashjs.MediaPlayer.events.PLAYBACK_PAUSED, onPlaybackPaused);
    player.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, onStreamInitialized);
    player.on(dashjs.MediaPlayer.events.PLAYBACK_METADATA_LOADED, onMetadataLoaded);
    player.on(dashjs.MediaPlayer.events.PLAYBACK_TIME_UPDATED, onTimeUpdate);
    player.on(dashjs.MediaPlayer.events.BUFFER_LEVEL_UPDATED, onBufferLevelUpdated);
    player.on(dashjs.MediaPlayer.events.PLAYBACK_ENDED, onPlaybackEnded);
    player.on(dashjs.MediaPlayer.events.QUALITY_CHANGE_RENDERED, onQualityChange);
    player.on(dashjs.MediaPlayer.events.ERROR, onError);

    // Show loading indicator during buffering
    player.on(dashjs.MediaPlayer.events.PLAYBACK_WAITING, () => setIsLoading(true));
    player.on(dashjs.MediaPlayer.events.PLAYBACK_PLAYING, () => setIsLoading(false));
    player.on(dashjs.MediaPlayer.events.CAN_PLAY, () => setIsLoading(false));

    return () => {
      if (progressSaveIntervalRef.current) clearInterval(progressSaveIntervalRef.current);
      saveProgress();
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      playerRef.current = null;
    };
  }, [streamInfo.manifestUrl]);

  const hideControls = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying && !isFinished) setIsControlsVisible(false);
    }, 3000);
  };

  const showControls = () => {
    setIsControlsVisible(true);
    hideControls();
  };

  useEffect(() => {
    if (isPlaying && !isFinished) hideControls();
    else {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      setIsControlsVisible(true);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, isFinished]);

  const handlePlayPause = () => {
    if (isFinished) {
      handleReplay();
      return;
    }
    if (playerRef.current) {
      if (isPlaying) playerRef.current.pause();
      else playerRef.current.play();
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (totalDuration <= 0) return;
    setIsSeeking(true);
    const newProgress = Number(e.target.value);
    setProgress(newProgress);
    const newTime = (newProgress / 100) * totalDuration;
    setCurrentTime(newTime);
  };

  const handleSeekCommit = () => {
    setIsSeeking(false);
    if (totalDuration <= 0) return;
    const newTime = (progress / 100) * totalDuration;
    
    timeOffsetRef.current = newTime;
    setStreamInfo({ manifestUrl: getUrlWithTime(urlTemplate.replace('{audio}', selectedAudioLanguage), newTime), seekTime: newTime });
    setCurrentTime(newTime);
    saveProgress(false, newTime);
  };

  const handleSkip = (amount: number) => {
    if (totalDuration > 0) {
      const newTime = Math.max(0, Math.min(totalDuration, currentTime + amount));
      timeOffsetRef.current = newTime;
      setStreamInfo({ manifestUrl: getUrlWithTime(urlTemplate.replace('{audio}', selectedAudioLanguage), newTime), seekTime: newTime });
      setCurrentTime(newTime);
      setProgress((newTime / totalDuration) * 100);
      saveProgress(false, newTime);
    }
  };

  const handleReplay = () => {
    setIsFinished(false);
    setIsLoading(true);
    setIsPlaying(true);
    timeOffsetRef.current = 0;
    setStreamInfo({ manifestUrl: getUrlWithTime(urlTemplate.replace('{audio}', selectedAudioLanguage), 0), seekTime: 0 });
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenEnabled) return;
    const elem = playerContainerRef.current;
    if (!elem) return;

    if (!document.fullscreenElement) {
        elem.requestFullscreen().catch(err => console.error(`Fullscreen Error: ${err.message}`));
    } else {
        document.exitFullscreen();
    }
  };
  
  const handleClose = () => {
    saveProgress().then(() => {
        if (document.fullscreenElement) {
            document.exitFullscreen().then(onBack).catch(onBack);
        } else {
            onBack();
        }
    });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (newVolume > 0) setLastVolume(newVolume);

    if (playerRef.current) {
      playerRef.current.setVolume(newVolume);
    }
  };

  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (playerRef.current) {
      if (newMutedState) {
          setLastVolume(volume);
          setVolume(0);
          playerRef.current.setVolume(0);
      } else {
          const newVolume = lastVolume > 0 ? lastVolume : 1;
          setVolume(newVolume);
          playerRef.current.setVolume(newVolume);
      }
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(rate);
      setPlaybackRate(rate);
    }
  };
  
  const handleQualityChange = (index: number) => {
    if (playerRef.current) {
        if (index === -1) {
             playerRef.current.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: true } } } });
        } else {
             playerRef.current.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: false } } } });
             (playerRef.current as any).setQualityFor('video', index, true);
        }
        setCurrentQuality(index);
    }
  };
  
  const handleTextTrackChange = (track: MediaInfo | null) => {
    if (playerRef.current) {
        if(track) {
            const trackIdx = textTracks.findIndex(t => t.id === track.id);
            if (trackIdx !== -1) {
                playerRef.current.setTextTrack(trackIdx);
                setCurrentTextTrack(track);
            }
        } else {
            playerRef.current.setTextTrack(-1);
            setCurrentTextTrack(null);
        }
    }
  };

  const handleAudioLanguageChange = (langKey: string) => {
    if (urlTemplate) {
        const newTime = currentTimeRef.current;
        setSelectedAudioLanguage(langKey);
        // Setting streamInfo will trigger the useEffect to re-initialize the player
        timeOffsetRef.current = newTime;
        setStreamInfo({ manifestUrl: getUrlWithTime(urlTemplate.replace('{audio}', langKey), newTime), seekTime: newTime });
    }
  };

  const upNextDisplayInfo = (() => {
    if (!isFinished || !nextUpInfo) return null;
    return <UpNextOverlay info={nextUpInfo} onPlay={onPlayNext} onClose={() => setIsFinished(false)} />;
  })();

  return (
    <div
      ref={playerContainerRef}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
      style={{ cursor: isControlsVisible ? 'default' : 'none' }}
      onMouseMove={showControls}
      onClick={showControls}
    >
      <video ref={videoRef} className="w-full h-full object-contain pointer-events-none" autoPlay />
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-30 text-white text-center p-4 cursor-default">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Playback Error</h2>
          <p className="mb-6 max-w-xl">{error}</p>
          <button onClick={handleClose} className="bg-red-600 px-6 py-2 rounded font-bold hover:bg-red-700 transition-colors">
            Go Back
          </button>
        </div>
      )}

      {upNextDisplayInfo || (isFinished && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 z-20" onClick={(e) => { e.stopPropagation(); handleReplay(); }}>
          <button className="flex flex-col items-center text-white hover:text-gray-300 transition-colors duration-200">
            <span className="material-symbols-outlined text-[4rem]">replay</span>
            <span className="mt-2 text-xl font-bold">Replay</span>
          </button>
        </div>
      ))}

      {!error && (
        <div onClick={e => e.stopPropagation()} className="w-full h-full absolute inset-0 cursor-default pointer-events-none">
          <PlayerControls
            isLoading={isLoading}
            isFinished={isFinished}
            progress={progress}
            onSeekChange={handleSeekChange}
            onSeekCommit={handleSeekCommit}
            onPlayPause={handlePlayPause}
            isPlaying={isPlaying}
            onSkipBack={() => handleSkip(-10)}
            onSkipForward={() => handleSkip(10)}
            duration={totalDuration}
            currentTime={currentTime}
            onClose={handleClose}
            mainTitle={mainTitle}
            subtitle={subtitle}
            isVisible={isControlsVisible && !upNextDisplayInfo}
            buffer={buffer}
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={handleVolumeChange}
            onMuteToggle={handleMuteToggle}
            playbackRate={playbackRate}
            onPlaybackRateChange={handlePlaybackRateChange}
            availablePlaybackRates={[0.5, 1, 1.25, 1.5, 2]}
            qualities={qualities}
            currentQuality={currentQuality}
            onQualityChange={handleQualityChange}
            textTracks={textTracks}
            currentTextTrack={currentTextTrack}
            onTextTrackChange={handleTextTrackChange}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            audioLanguages={audioLanguages}
            selectedAudioLanguage={selectedAudioLanguage}
            onAudioLanguageChange={handleAudioLanguageChange}
          />
        </div>
      )}
    </div>
  );
};
export default VideoPlayer;