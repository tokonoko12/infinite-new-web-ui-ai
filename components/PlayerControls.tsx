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
    isCasting: boolean;
    castState: any; 
    onCastClick: () => void;
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
    audioLanguages: Record<string, string> | null, selectedAudioLanguage: string, onAudioLanguageChange: (langKey: string) => void,
    isCasting: boolean
}> = ({ playbackRate, onPlaybackRateChange, availablePlaybackRates, textTracks, currentTextTrack, onTextTrackChange, audioLanguages, selectedAudioLanguage, onAudioLanguageChange, isCasting }) => {
    const [activeMenu, setActiveMenu] = useState('main');

    const MainMenu = () => {
        return (
            <>
                {!isCasting && <button onClick={() => setActiveMenu('speed')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10 rounded">Playback Speed <span className="text-gray-400 float-right">{playbackRate === 1 ? 'Normal' : `${playbackRate}x`} &gt;</span></button>}
                {!isCasting && audioLanguages && Object.keys(audioLanguages).length > 1 && (
                   <button onClick={() => setActiveMenu('audio')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10 rounded">Audio <span className="text-gray-400 float-right">{audioLanguages[selectedAudioLanguage] || selectedAudioLanguage} &gt;</span></button>
                )}
                {!isCasting && <button onClick={() => setActiveMenu('subtitles')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10 rounded">Subtitles/CC <span className="text-gray-400 float-right">{currentTextTrack ? currentTextTrack.lang : 'Off'} &gt;</span></button>}
                {isCasting && <p className="px-4 py-2 text-sm text-gray-400">Settings not available while casting.</p>}

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
    const { isVisible, isLoading, mainTitle, subtitle, onClose, onPlayPause, isPlaying, onSkipBack, onSkipForward, progress, buffer, onSeekChange, onSeekCommit, currentTime, duration, volume, isMuted, onMuteToggle, onVolumeChange, onToggleFullscreen, isFullscreen, isCasting, castState, onCastClick } = props;
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
                    <button onClick={() => setIsSettingsOpen(o => !o)} className="p-2 hover:bg-white/20 rounded-full" aria-label="Settings">
                        <span className="material-symbols-outlined text-2xl">settings</span>
                    </button>
                    {isSettingsOpen && <SettingsMenu {...props} />}
                </div>
            </header>
            
            {/* Center Controls */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-x-8 sm:gap-x-16 pointer-events-auto">
                <button onClick={onSkipBack} className="p-2 bg-black/40 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm" aria-label="Skip back 10 seconds">
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
                <button onClick={onSkipForward} className="p-2 bg-black/40 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm" aria-label="Skip forward 10 seconds">
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
                    <div className="group relative">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={onSeekChange}
                            onMouseUp={onSeekCommit}
                            onTouchEnd={onSeekCommit}
                            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer group-hover:h-2 transition-all duration-200"
                            style={{'--progress': `${progress}%`, '--buffer': `${buffer}%`} as React.CSSProperties}
                        />
                        <style>{`
                            input[type=range] { -webkit-appearance: none; background: transparent; }
                            input[type=range]::-webkit-slider-runnable-track {
                                height: 100%;
                                background: linear-gradient(to right, 
                                    white var(--progress), 
                                    rgba(255,255,255,0.4) var(--progress), 
                                    rgba(255,255,255,0.4) var(--buffer), 
                                    rgba(255,255,255,0.2) var(--buffer)
                                );
                                border-radius: 9999px;
                            }
                            input[type=range]::-webkit-slider-thumb {
                                -webkit-appearance: none;
                                height: 16px;
                                width: 16px;
                                border-radius: 50%;
                                background: white;
                                margin-top: -6px;
                                opacity: 0;
                                transition: opacity 0.2s;
                            }
                            .group:hover input[type=range]::-webkit-slider-thumb {
                                opacity: 1;
                            }
                        `}</style>
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
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={volume}
                                    onChange={onVolumeChange}
                                    className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {castState !== 'NO_DEVICES_AVAILABLE' && (
                            <button onClick={onCastClick} className={`p-2 hover:bg-white/20 rounded-full transition-colors ${isCasting ? 'text-sky-400' : ''}`} aria-label="Cast to device">
                                <span className="material-symbols-outlined text-2xl">cast</span>
                            </button>
                        )}
                        <button onClick={onToggleFullscreen} className="p-2 hover:bg-white/20 rounded-full" aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
                            <span className="material-symbols-outlined text-2xl">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerControls;