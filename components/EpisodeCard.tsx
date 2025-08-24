
import React, { useState } from 'react';
import type { Episode } from '../types';

interface EpisodeCardProps {
    episode: Episode;
    onSelect: (episode: Episode) => void;
    isSelected: boolean;
}

const EpisodeCard: React.FC<EpisodeCardProps> = ({ episode, onSelect, isSelected }) => {
    const [imageError, setImageError] = useState(false);
    
    const handleImageError = () => {
        setImageError(true);
    };

    return (
        <article 
            onClick={() => onSelect(episode)}
            className={`flex flex-col bg-gray-900/60 overflow-hidden transition-all duration-300 ease-in-out border-2 cursor-pointer
                ${isSelected ? 'border-white bg-gray-800/80 scale-105 shadow-lg' : 'border-transparent hover:border-gray-700 hover:bg-gray-800/80'} h-full group`}
            aria-label={`Episode ${episode.episodeNumber}: ${episode.name}`}
            aria-current={isSelected ? 'true' : 'false'}
        >
            <div className="aspect-video bg-gray-800 relative">
                {imageError ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 p-2 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500 text-xs mt-2">Still not available</p>
                    </div>
                ) : (
                    <img 
                        src={episode.stillUrl}
                        alt={`Still from ${episode.name}`}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                        loading="lazy"
                    />
                )}
                <span className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                    E{episode.episodeNumber}
                </span>
            </div>
            <div className="p-4 flex-grow flex flex-col">
                <h4 className="text-white font-bold text-base leading-tight mb-2">
                    {episode.name}
                </h4>
                <p className="text-gray-400 text-sm leading-relaxed overflow-hidden text-ellipsis" style={{ WebkitLineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical' }}>
                    {episode.overview || "No overview available for this episode."}
                </p>
            </div>
        </article>
    );
};

export default EpisodeCard;