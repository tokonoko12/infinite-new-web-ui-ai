import React, { useState, useRef, useEffect } from 'react';
import type { BitrateInfo, MediaInfo } from 'dashjs';

interface PlayerControlsProps {
    isLoading: boolean;
    isFinished: boolean;
    progress: number;
    onSeekChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSeekCommit: () => void;
    onPlayPause: () => void;
    isPlaying: boolean;
    onSkipBack: () => void;
    onSkipForward: () => void;
    duration: number;
    currentTime: number;
    onClose: () => void;
    mainTitle: string;
    subtitle: string;
    isVisible: boolean;
    buffer: number;
    volume: number;
    isMuted: boolean;
    onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onMuteToggle: () => void;
    playbackRate: number;
    onPlaybackRateChange: (rate: number) => void;
    availablePlaybackRates: number[];
    qualities: BitrateInfo[];
    currentQuality: number;
    onQualityChange: (index: number) => void;
    textTracks: MediaInfo[];
    currentTextTrack: MediaInfo | null;
    onTextTrackChange: (track: MediaInfo | null) => void;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
    audioLanguages: Record<string, string> | null;
    selectedAudioLanguage: string;
    onAudioLanguageChange: (langKey: string) => void;
}

const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    
    const minutesStr = String(minutes).padStart(2, '0');
    const secondsStr = String(seconds).padStart(2, '0');

    if (hours > 0) {
        return `${String(hours)}:${minutesStr}:${secondsStr}`;
    }
    return `${minutesStr}:${secondsStr}`;
};

const SettingsMenu: React.FC<{
    playbackRate: number, onPlaybackRateChange: (r: number) => void, availablePlaybackRates: number[],
    textTracks: MediaInfo[], currentTextTrack: MediaInfo | null, onTextTrackChange: (t: MediaInfo | null) => void,
    audioLanguages: Record<string, string> | null, selectedAudioLanguage: string, onAudioLanguageChange: (langKey: string) => void
}> = ({ playbackRate, onPlaybackRateChange, availablePlaybackRates, textTracks, currentTextTrack, onTextTrackChange, audioLanguages, selectedAudioLanguage, onAudioLanguageChange }) => {
    const [activeMenu, setActiveMenu] = useState('main');

    const MainMenu = () => {
        return (
            <>
                <button onClick={() => setActiveMenu('speed')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10 rounded">Playback Speed <span className="text-gray-400 float-right">{playbackRate === 1 ? 'Normal' : `${playbackRate}x`} &gt;</span></button>
                {audioLanguages && Object.keys(audioLanguages).length > 1 && (
                   <button onClick={() => setActiveMenu('audio')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10 rounded">Audio <span className="text-gray-400 float-right">{audioLanguages[selectedAudioLanguage] || selectedAudioLanguage} &gt;</span></button>
                )}
                <button onClick={() => setActiveMenu('subtitles')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10 rounded">Subtitles/CC <span className="text-gray-400 float-right">{currentTextTrack ? currentTextTrack.lang : 'Off'} &gt;</span></button>
            </>
        );
    };

    const SubMenu: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
        <>
            <button onClick={() => setActiveMenu('main')} className="w-full text-left px-4 py-2 text-sm font-bold text-gray-200 hover:bg-white/10 rounded">&lt; {title}</button>
            <div className="border-t border-white/20 my-1 mx-2" />
            {children}
        </>
    );

    return (
        <div className="absolute top-full right-0 mt-2 bg-black/80 backdrop-blur-md rounded-lg shadow-lg p-2 min-w-[220px] pointer-events-auto">
            {activeMenu === 'main' && <MainMenu />}
            {activeMenu === 'speed' && <SubMenu title="Playback Speed">
                {availablePlaybackRates.map(r => <button key={r} onClick={() => { onPlaybackRateChange(r); setActiveMenu('main'); }} className={`w-full text-left px-4 py-2 text-sm rounded ${playbackRate === r ? 'text-white font-bold' : 'text-gray-200 hover:bg-white/10'}`}>{r === 1 ? 'Normal' : `${r}x`}</button>)}
            </SubMenu>}
             {activeMenu === 'audio' && <SubMenu title="Audio">
               {audioLanguages && Object.entries(audioLanguages).map(([key, name]) => (
                   <button key={key} onClick={() => { onAudioLanguageChange(key); setActiveMenu('main'); }} className={`w-full text-left px-4 py-2 text-sm rounded ${selectedAudioLanguage === key ? 'text-white font-bold' : 'text-gray-200 hover:bg-white/10'}`}>{name}</button>
               ))}
           </SubMenu>}
            {activeMenu === 'subtitles' && <SubMenu title="Subtitles/CC">
                <button onClick={() => { onTextTrackChange(null); setActiveMenu('main'); }} className={`w-full text-left px-4 py-2 text-sm rounded ${!currentTextTrack ? 'text-white font-bold' : 'text-gray-200 hover:bg-white/10'}`}>Off</button>
                {textTracks.map(t => <button key={t.id} onClick={() => { onTextTrackChange(t); setActiveMenu('main'); }} className={`w-full text-left px-4 py-2 text-sm rounded ${currentTextTrack?.id === t.id ? 'text-white font-bold' : 'text-gray-200 hover:bg-white/10'}`}>{t.lang}</button>)}
            </SubMenu>}
        </div>
    );
};

const PlayerControls: React.FC<PlayerControlsProps> = (props) => {
    const { isVisible, isLoading, mainTitle, subtitle, onClose, onPlayPause, isPlaying, onSkipBack, onSkipForward, progress, buffer, onSeekChange, onSeekCommit, currentTime, duration, volume, isMuted, onMuteToggle, onVolumeChange, onToggleFullscreen, isFullscreen } = props;
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const volumeButtonRef = useRef<HTMLDivElement>(null);
    const settingsButtonRef = useRef<HTMLDivElement>(null);
    
    return (
        <div className={`absolute inset-0 flex flex-col justify-between text-white transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Top Gradient */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/70 to-transparent pointer-events-auto" />
            {/* Bottom Gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-auto" />
            
            {/* Header */}
            <header className="relative z-10 p-4 sm:p-6 flex items-start justify-between gap-4 pointer-events-auto">
                 <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 bg-black/50 rounded-full hover:bg-white/20 transition-colors" aria-label="Go back">
                        <span className="material-symbols-outlined text-2xl">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold line-clamp-1">{mainTitle}</h1>
                        <p className="text-sm text-gray-300 line-clamp-1">{subtitle}</p>
                    </div>
                </div>
                <div className="relative" ref={settingsButtonRef}>
                    <button onClick={() => setIsSettingsOpen(o => !o)} disabled={isLoading} className="p-2 hover:bg-white/20 rounded-full disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Settings">
                        <span className="material-symbols-outlined text-2xl">settings</span>
                    </button>
                    {isSettingsOpen && <SettingsMenu {...props} />}
                </div>
            </header>
            
            {/* Center Controls */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-x-8 sm:gap-x-16 pointer-events-auto">
                <button onClick={onSkipBack} disabled={isLoading} className="p-2 bg-black/40 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Skip back 10 seconds">
                    <span className="material-symbols-outlined text-4xl sm:text-5xl">replay_10</span>
                </button>
                <div className="relative flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32">
                     {isLoading && (
                        <svg className="absolute animate-spin text-white w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <circle 
                                className="stroke-current opacity-20"
                                cx="50" cy="50" r="45" fill="none" strokeWidth="6"
                            />
                            <circle 
                                className="stroke-current"
                                cx="50" cy="50" r="45" fill="none" strokeWidth="6"
                                strokeDasharray="140, 283"
                                strokeLinecap="round"
                            />
                        </svg>
                    )}
                    <button 
                        onClick={onPlayPause} 
                        className="p-3 sm:p-4 bg-black/40 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm disabled:cursor-default flex items-center justify-center" 
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                        disabled={isLoading}
                    >
                        <span className="material-symbols-outlined text-5xl sm:text-6xl">{isPlaying ? 'pause' : 'play_arrow'}</span>
                    </button>
                </div>
                <button onClick={onSkipForward} disabled={isLoading} className="p-2 bg-black/40 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Skip forward 10 seconds">
                    <span className="material-symbols-outlined text-4xl sm:text-5xl">forward_10</span>
                </button>
            </div>


            {/* Bottom Controls */}
            <div className="relative z-10 p-2 sm:p-4 pointer-events-auto">
                {/* Progress Bar & Time */}
                <div className="w-full">
                    <div className="flex justify-between items-center text-sm font-mono text-gray-300 mb-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                    <div className="group relative h-1.5 group-hover:h-2 transition-all duration-200">
                        {/* Base track */}
                        <div className="absolute w-full h-full bg-white/30 rounded-full" />
                        {/* Buffer track */}
                        <div className="absolute h-full bg-white/50 rounded-full" style={{ width: `${buffer}%` }} />
                        {/* Progress/Seek track */}
                        <div className="absolute h-full bg-white rounded-full" style={{ width: `${progress}%` }} />
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={progress}
                            disabled={isLoading}
                            onChange={onSeekChange}
                            onMouseUp={onSeekCommit}
                            onTouchEnd={onSeekCommit}
                            className="absolute inset-0 w-full h-full progress-bar appearance-none bg-transparent cursor-pointer disabled:cursor-not-allowed z-10"
                        />
                    </div>
                </div>
                
                {/* Main Controls Row */}
                <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="group flex items-center gap-2" ref={volumeButtonRef}>
                             <button onClick={onMuteToggle} className="p-2 hover:bg-white/20 rounded-full" aria-label={isMuted ? 'Unmute' : 'Mute'}>
                                <span className="material-symbols-outlined text-2xl">
                                    {isMuted ? 'volume_off' : volume > 0.5 ? 'volume_up' : volume > 0 ? 'volume_down' : 'volume_off'}
                                </span>
                            </button>
                            <div className="w-0 group-hover:w-24 transition-all duration-300 overflow-hidden">
                                <div className="relative w-full h-3">
                                    <div className="absolute w-full h-1 bg-white/30 rounded-full top-1/2 -translate-y-1/2" />
                                    <div className="absolute h-1 bg-white rounded-full top-1/2 -translate-y-1/2" style={{ width: `${volume * 100}%` }} />
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={volume}
                                        onChange={onVolumeChange}
                                        className="absolute inset-0 w-full h-full volume-bar appearance-none bg-transparent cursor-pointer z-10"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <button onClick={onToggleFullscreen} className="p-2 hover:bg-white/20 rounded-full" aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
                            <span className="material-symbols-outlined text-2xl">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
                        </button>
                    </div>
                </div>
            </div>
             <style>{`
                .progress-bar, .volume-bar {
                    -webkit-appearance: none;
                    appearance: none;
                    background: transparent;
                    margin: 0;
                    padding: 0;
                }
                .progress-bar:focus, .volume-bar:focus {
                    outline: none;
                }
                
                /* Webkit (Chrome, Safari, Edge) */
                .progress-bar::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 16px;
                    width: 16px;
                    border-radius: 50%;
                    background: white;
                    margin-top: -5px;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .group:hover .progress-bar::-webkit-slider-thumb {
                    opacity: 1;
                }
                .progress-bar:disabled::-webkit-slider-thumb {
                    opacity: 0 !important;
                }

                .volume-bar::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 12px;
                    width: 12px;
                    border-radius: 50%;
                    background: white;
                }

                .progress-bar::-webkit-slider-runnable-track, 
                .volume-bar::-webkit-slider-runnable-track {
                    background: transparent;
                    border: none;
                }
                
                /* Firefox */
                .progress-bar::-moz-range-thumb {
                    height: 16px;
                    width: 16px;
                    border-radius: 50%;
                    background: white;
                    border: none;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .group:hover .progress-bar::-moz-range-thumb {
                    opacity: 1;
                }
                .progress-bar:disabled::-moz-range-thumb {
                    opacity: 0 !important;
                }

                .volume-bar::-moz-range-thumb {
                    height: 12px;
                    width: 12px;
                    border-radius: 50%;
                    background: white;
                    border: none;
                }

                .progress-bar::-moz-range-track, 
                .volume-bar::-moz-range-track {
                    background: transparent;
                    border: none;
                }
            `}</style>
        </div>
    );
};

export default PlayerControls;