
import React from 'react';

interface HeaderProps {
    onSearchClick: () => void;
    onSettingsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearchClick, onSettingsClick }) => {
    // The header has been simplified to be a single floating search button
    // for a more minimal and modern UI, removing the full-width bar.
    return (
        <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
            <button
                onClick={onSearchClick}
                className="flex items-center justify-center p-3 rounded-full text-gray-200 bg-black/50 backdrop-blur-md border border-white/20 hover:text-white hover:bg-white/20 transition-colors"
                aria-label="Open search"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </button>
            <button
                onClick={onSettingsClick}
                className="flex items-center justify-center p-3 rounded-full text-gray-200 bg-black/50 backdrop-blur-md border border-white/20 hover:text-white hover:bg-white/20 transition-colors"
                aria-label="Open settings"
            >
                <span className="material-symbols-outlined">settings</span>
            </button>
        </div>
    );
};

export default Header;
