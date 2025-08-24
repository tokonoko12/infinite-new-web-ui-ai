interface WatchProgressData {
    imdb_id: string;
    media_type: 'movie' | 'series';
    current_time: number;
    is_finished: boolean;
    season?: number;
    episode?: number;
}

const getProgressKey = (imdb_id: string, media_type: 'movie' | 'series', season?: number, episode?: number) => {
    let key = `progress:${imdb_id}:${media_type}`;
    if (media_type === 'series' && season !== undefined && episode !== undefined) {
        key += `:${season}:${episode}`;
    }
    return key;
}

export const saveWatchProgress = async (progressData: WatchProgressData): Promise<void> => {
    console.log("Saving watch progress:", progressData);
    try {
        const key = getProgressKey(progressData.imdb_id, progressData.media_type, progressData.season, progressData.episode);
        const data = {
            current_time: progressData.current_time,
            is_finished: progressData.is_finished,
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("Failed to save progress to localStorage", e);
    }
    return Promise.resolve();
};

export const getWatchProgress = async (imdb_id: string, media_type: 'movie' | 'series', season?: number, episode?: number): Promise<{current_time: number} | null> => {
    console.log("Getting watch progress for:", { imdb_id, media_type, season, episode });
    try {
        const key = getProgressKey(imdb_id, media_type, season, episode);
        const data = localStorage.getItem(key);
        if (data) {
            const parsed = JSON.parse(data);
            if (parsed.is_finished) return { current_time: 0 }; // Start from beginning if finished
            return { current_time: parsed.current_time };
        }
    } catch (e) {
        console.error("Failed to get progress from localStorage", e);
    }
    return Promise.resolve(null);
}
