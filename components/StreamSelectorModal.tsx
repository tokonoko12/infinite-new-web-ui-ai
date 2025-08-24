
import React, { useState } from 'react';
import type { Stream, StreamCollection } from '../types';

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

interface StreamSelectorModalProps {
    streams: StreamCollection;
    currentStream: Stream | null;
    onClose: () => void;
    onSelect: (stream: Stream) => void;
}

const StreamSelectorModal: React.FC<StreamSelectorModalProps> = ({ streams, currentStream, onClose, onSelect }) => {
    const availableQualities = Object.keys(streams)
        .filter(q => streams[q] && streams[q].length > 0)
        .sort((a, b) => getQualityRank(a) - getQualityRank(b));
    
    const findInitialQuality = () => {
        if (currentStream) {
            for (const quality of availableQualities) {
                if (streams[quality].some(s => s.url === currentStream.url)) {
                    return quality;
                }
            }
        }
        return availableQualities[0] || null;
    };
    
    const [selectedQuality, setSelectedQuality] = useState<string | null>(findInitialQuality());

    return (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="relative w-full max-w-xl h-auto max-h-[65vh] bg-gray-900/95 backdrop-blur-lg rounded-lg shadow-2xl flex flex-col transition-all duration-300 ease-in-out" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                    <h1 className="text-lg font-semibold text-white">Change Source</h1>
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
                                            onClick={() => onSelect(s)} 
                                            className={`w-full text-left p-3 rounded-md transition-colors text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white ${currentStream?.url === s.url ? 'bg-white/20' : 'bg-gray-800 hover:bg-white/10'}`}
                                        >
                                            <p className="text-sm font-medium whitespace-pre-wrap">{s.title}</p>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400 text-center pt-4">Select a quality to see available streams.</p>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StreamSelectorModal;
