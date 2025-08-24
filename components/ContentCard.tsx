
import React, { useState } from 'react';
import type { Content } from '../types';

interface ContentCardProps {
  item: Content;
  onContentSelect: (id: number, type: 'movie' | 'tv') => void;
}

const ContentCard: React.FC<ContentCardProps> = ({ item, onContentSelect }) => {
    const [imageError, setImageError] = useState(false);

    const handleImageError = () => {
        setImageError(true);
    };

    return (
        <div 
          className="group relative aspect-[2/3] bg-gray-900 overflow-hidden transition-transform duration-300 ease-in-out hover:scale-105 border-2 border-transparent hover:border-white/50 cursor-pointer shadow-lg"
          aria-label={item.title}
          onClick={() => onContentSelect(item.id, item.type)}
        >
            {imageError ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 p-2 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-400 text-xs mt-2">{item.title}</p>
                </div>
            ) : (
                <img
                    src={item.posterUrl}
                    alt={`${item.title} poster`}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                    loading="lazy"
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out p-3 flex flex-col justify-end">
                <h3 className="text-white font-bold text-base leading-tight drop-shadow-md">{item.title}</h3>
                <p className="text-gray-300 text-xs mt-1 drop-shadow-md">{item.year}</p>
                <p className="text-gray-400 text-xs mt-2 overflow-hidden text-ellipsis drop-shadow-md" style={{ WebkitLineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical' }}>
                    {item.description}
                </p>
            </div>
        </div>
    );
};

export default ContentCard;