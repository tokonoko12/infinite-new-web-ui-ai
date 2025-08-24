
import React from 'react';
import { MOVIE_GENRES, TV_GENRES } from '../constants';
import type { HomeConfigItem } from '../types';

interface AddGenreModalProps {
    onClose: () => void;
    onAdd: (item: HomeConfigItem) => void;
    existingConfig: HomeConfigItem[];
}

const AddGenreModal: React.FC<AddGenreModalProps> = ({ onClose, onAdd, existingConfig }) => {

    const isGenreAdded = (id: number, type: 'movie' | 'tv') => {
        return existingConfig.some(item => item.id === id && item.type === type);
    };

    const handleAdd = (genre: { id: number; name: string }, type: 'movie' | 'tv') => {
        onAdd({ id: genre.id, name: genre.name, type });
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true" onClick={onClose}>
            <div
                className="relative w-full max-w-3xl h-auto max-h-[80vh] bg-gray-900/95 backdrop-blur-lg rounded-lg shadow-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                    <h1 className="text-lg font-semibold text-white">Add Genre Row</h1>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10" aria-label="Close add genre modal">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>
                <main className="p-4 sm:p-6 flex-grow min-h-0 overflow-y-auto no-scrollbar grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">Movie Genres</h2>
                        <div className="flex flex-wrap gap-2">
                            {MOVIE_GENRES.map(genre => {
                                const isDisabled = isGenreAdded(genre.id, 'movie');
                                return (
                                    <button
                                        key={`movie-${genre.id}`}
                                        onClick={() => handleAdd(genre, 'movie')}
                                        disabled={isDisabled}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                                            isDisabled
                                                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                                : 'bg-gray-700/70 text-gray-300 hover:bg-white/20 hover:text-white'
                                        }`}
                                    >
                                        {genre.name}
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">TV Show Genres</h2>
                        <div className="flex flex-wrap gap-2">
                            {TV_GENRES.map(genre => {
                                 const isDisabled = isGenreAdded(genre.id, 'tv');
                                 return (
                                    <button
                                        key={`tv-${genre.id}`}
                                        onClick={() => handleAdd(genre, 'tv')}
                                        disabled={isDisabled}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                                            isDisabled
                                                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                                : 'bg-gray-700/70 text-gray-300 hover:bg-white/20 hover:text-white'
                                        }`}
                                    >
                                        {genre.name}
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                </main>
                <footer className="p-4 border-t border-gray-800 flex-shrink-0 text-right">
                     <button onClick={onClose} className="text-sm font-bold bg-white text-black px-6 py-2 rounded-md hover:bg-gray-200 transition-colors">
                        Done
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AddGenreModal;
