
import React from 'react';

interface UpNextInfo {
    title: string;
    synopsis?: string;
    imageUrl: string;
}

interface UpNextOverlayProps {
    info: UpNextInfo;
    onPlay: () => void;
    onClose: () => void;
}

export const UpNextOverlay: React.FC<UpNextOverlayProps> = ({ info, onPlay, onClose }) => {
    return (
        <div 
            className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center p-4 cursor-default"
            onClick={e => e.stopPropagation()}
        >
            <div className="absolute top-4 right-4">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10" aria-label="Close up next overlay">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-8 max-w-4xl text-white">
                <img src={info.imageUrl} alt={info.title} className="w-48 h-72 object-cover shadow-lg" />
                <div className="max-w-md text-center md:text-left">
                    <p className="text-gray-400 font-semibold mb-2">Up Next</p>
                    <h2 className="text-3xl font-bold mb-3">{info.title}</h2>
                    {info.synopsis && (
                        <p className="text-gray-300 mb-6 text-sm max-h-24 overflow-y-auto no-scrollbar">
                            {info.synopsis}
                        </p>
                    )}
                    <button 
                        onClick={onPlay}
                        className="bg-white text-black font-bold py-3 px-8 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 w-full md:w-auto"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        <span>Play Next</span>
                    </button>
                </div>
            </div>
        </div>
    );
};