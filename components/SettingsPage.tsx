
import React, { useState } from 'react';
import type { HomeConfigItem, AppConfig } from '../types';
import { DEFAULT_APP_CONFIG, SUPPORTED_COUNTRIES } from '../constants';
import AddGenreModal from './AddGenreModal';

interface SettingsPageProps {
    currentConfig: AppConfig;
    onClose: () => void;
    onSave: (newConfig: AppConfig) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ currentConfig, onClose, onSave }) => {
    const [config, setConfig] = useState<AppConfig>(currentConfig);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);

    // State for drag and drop
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleRemoveItem = (index: number) => {
        const newHomeRows = config.homeRows.filter((_, i) => i !== index);
        setConfig(prev => ({ ...prev, homeRows: newHomeRows }));
    };

    const handleAddItem = (item: HomeConfigItem) => {
        // Prevent duplicates
        if (!config.homeRows.some(c => c.id === item.id && c.type === item.type)) {
            const newHomeRows = [...config.homeRows, item];
            setConfig(prev => ({ ...prev, homeRows: newHomeRows }));
        }
    };
    
    const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setConfig(prev => ({ ...prev, region: e.target.value }));
    };

    const handleReset = () => {
        setConfig(DEFAULT_APP_CONFIG);
    };
    
    // --- Drag and Drop Handlers ---
    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (index: number) => {
        if (index !== draggedIndex) {
            setDragOverIndex(index);
        }
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const handleDrop = () => {
        if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
            return;
        }
        const newHomeRows = [...config.homeRows];
        const [reorderedItem] = newHomeRows.splice(draggedIndex, 1);
        newHomeRows.splice(dragOverIndex, 0, reorderedItem);
        setConfig(prev => ({...prev, homeRows: newHomeRows}));
    };

    const handleDragEnd = () => {
        handleDrop(); // Ensure drop logic runs
        setDraggedIndex(null);
        setDragOverIndex(null);
    };


    return (
        <div className="fixed inset-0 z-50 bg-black text-gray-200 flex flex-col animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="settings-heading">
            {isAddModalVisible && (
                <AddGenreModal
                    onClose={() => setIsAddModalVisible(false)}
                    onAdd={handleAddItem}
                    existingConfig={config.homeRows}
                />
            )}
            <header className="flex-shrink-0 bg-gray-900/80 backdrop-blur-lg p-4 flex items-center justify-between border-b border-gray-800">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full" aria-label="Close settings">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 id="settings-heading" className="text-xl font-bold text-white">Customize Home Screen</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleReset} className="text-sm font-semibold text-gray-400 hover:text-white px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors">
                        Reset to Default
                    </button>
                    <button onClick={() => onSave(config)} className="text-sm font-bold bg-white text-black px-4 py-1.5 rounded-md hover:bg-gray-200 transition-colors">
                        Save
                    </button>
                </div>
            </header>

            <main className="flex-grow p-4 sm:p-8 overflow-y-auto no-scrollbar">
                <div className="max-w-3xl mx-auto">
                    <p className="text-gray-400 mb-6 text-center">Customize your content region and add or remove genre rows. You can also drag and drop rows to reorder them. Changes will apply when you click "Save".</p>

                    <div className="mb-8">
                        <label htmlFor="region-select" className="block text-lg font-semibold text-white mb-2">Content Region</label>
                        <p className="text-gray-400 text-sm mb-3">Filters content based on regional popularity and availability.</p>
                        <select
                            id="region-select"
                            value={config.region}
                            onChange={handleRegionChange}
                            className="bg-gray-800 border border-gray-700 text-white text-base rounded-lg focus:ring-white focus:border-white block w-full p-2.5"
                        >
                            {SUPPORTED_COUNTRIES.map(country => (
                                <option key={country.iso_3166_1} value={country.iso_3166_1}>
                                    {country.english_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-white mb-3">Genre Rows</h2>
                         <ul className="space-y-3">
                            {config.homeRows.map((item, index) => {
                                const isDragging = draggedIndex === index;
                                const isDragTarget = dragOverIndex === index && draggedIndex !== index;
                                return (
                                    <li
                                        key={`${item.id}-${item.type}`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragEnter={() => handleDragEnter(index)}
                                        onDragOver={handleDragOver}
                                        onDragEnd={handleDragEnd}
                                        className={`bg-gray-900 rounded-lg p-4 flex items-center justify-between border-t-2 transition-all duration-200 ease-in-out
                                            ${isDragging ? 'opacity-30' : 'opacity-100'}
                                            ${isDragTarget ? 'border-sky-400' : 'border-transparent'}
                                        `}
                                    >
                                        <div className="flex items-center flex-grow cursor-grab">
                                            <span className="material-symbols-outlined text-gray-500 mr-4">drag_indicator</span>
                                            <div>
                                                <p className="font-semibold text-white">{item.name}</p>
                                                <p className="text-xs text-gray-500 uppercase">{item.type}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveItem(index)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-full transition-colors" aria-label={`Remove ${item.name}`}>
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                        <button onClick={() => setIsAddModalVisible(true)} className="mt-6 w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-white rounded-lg p-4 transition-colors">
                            <span className="material-symbols-outlined">add</span>
                            <span>Add Genre Row</span>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SettingsPage;
