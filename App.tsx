
import React, { useState, useEffect } from 'react';
import GenreRow from './components/GenreRow';
import HeroBanner from './components/HeroBanner';
import ContentDetail from './components/MovieDetail';
import type { Content, PlayableContent, AppConfig } from './types';
import { GENRE_MAP, API_KEY, BASE_URL, IMAGE_BASE_URL, BACKDROP_BASE_URL, APP_CONFIG_LS_KEY, DEFAULT_APP_CONFIG } from './constants';
import Header from './components/Header';
import SearchOverlay from './components/SearchOverlay';
import StreamPlayer from './components/StreamPlayer';
import LoadingIndicator from './components/LoadingIndicator';
import GenreGridPage from './components/GenreGridPage';
import SettingsPage from './components/SettingsPage';

interface GenreData {
    id: number;
    type: 'movie' | 'tv';
    items: Content[];
}

const App: React.FC = () => {
  const [contentByGenre, setContentByGenre] = useState<Record<string, GenreData>>({});
  const [heroContent, setHeroContent] = useState<Content[]>([]);
  const [selectedContent, setSelectedContent] = useState<{ id: number; type: 'movie' | 'tv' } | null>(null);
  const [playingContent, setPlayingContent] = useState<PlayableContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearchOverlayVisible, setIsSearchOverlayVisible] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<{ id: number; name: string; type: 'movie' | 'tv' } | null>(null);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [appConfig, setAppConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [configVersion, setConfigVersion] = useState(0); // To trigger refetch

  useEffect(() => {
    // Load config from localStorage on initial mount
    try {
        const storedConfig = localStorage.getItem(APP_CONFIG_LS_KEY);
        if (storedConfig) {
            const parsed = JSON.parse(storedConfig);
            // Migration for old format (just an array)
            if (Array.isArray(parsed)) {
                setAppConfig({ homeRows: parsed, region: 'US' });
            } else if (typeof parsed === 'object' && parsed !== null && 'homeRows' in parsed && 'region' in parsed) {
                setAppConfig(parsed);
            } else {
                 setAppConfig(DEFAULT_APP_CONFIG);
            }
        } else {
            setAppConfig(DEFAULT_APP_CONFIG);
        }
    } catch (e) {
        console.error("Failed to load app config from localStorage", e);
        setAppConfig(DEFAULT_APP_CONFIG);
    }
  }, []);

  useEffect(() => {
    const fetchAllContent = async () => {
      if (appConfig.homeRows.length === 0) {
        setLoading(false);
        setContentByGenre({});
        setHeroContent([]);
        return;
      }
      setLoading(true);
      setError(null);

      try {
        const promises = appConfig.homeRows.map(async (configItem) => {
          const response = await fetch(`${BASE_URL}/discover/${configItem.type}?api_key=${API_KEY}&with_genres=${configItem.id}&sort_by=popularity.desc&language=en-US&page=1&region=${appConfig.region}`);
          if (!response.ok) throw new Error(`Failed to fetch content for genre: ${configItem.name}`);
          const data = await response.json();
          
          const items: Content[] = data.results.slice(0, 10).map((item: any) => ({
            id: item.id,
            type: configItem.type,
            title: item.title || item.name,
            posterUrl: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : `https://via.placeholder.com/500x750.png/1a202c/FFFFFF?text=${(item.title || item.name).replace(/\s+/g, '+')}`,
            backdropUrl: item.backdrop_path ? `${BACKDROP_BASE_URL}${item.backdrop_path}` : item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : `https://via.placeholder.com/1280x720.png/1a202c/FFFFFF?text=${(item.title || item.name).replace(/\s+/g, '+')}`,
            year: (item.release_date || item.first_air_date)?.substring(0, 4) || 'N/A',
            genreString: item.genre_ids.map((id: number) => GENRE_MAP.get(id)).filter(Boolean).join(' / '),
            description: item.overview,
          }));

          return { genreName: configItem.name, genreId: configItem.id, genreType: configItem.type, items };
        });

        const results = await Promise.all(promises);

        const contentData = results.reduce((acc, result) => {
          if (result.items.length > 0) {
            acc[result.genreName] = {
              id: result.genreId,
              type: result.genreType,
              items: result.items,
            };
          }
          return acc;
        }, {} as Record<string, GenreData>);
        
        const firstGenreWithContent = results.find(r => r.items.length > 0);
        if (firstGenreWithContent) {
            setHeroContent(firstGenreWithContent.items.slice(0, 5));
        } else {
            setHeroContent([]);
        }

        setContentByGenre(contentData);

      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("An unknown error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAllContent();
  }, [appConfig, configVersion]);
  
  const handleSelectContent = (id: number, type: 'movie' | 'tv') => {
    setSelectedContent({ id, type });
    window.scrollTo(0, 0);
  };
  
  const handleSelectContentFromSearch = (id: number, type: 'movie' | 'tv') => {
    setIsSearchOverlayVisible(false); // Close overlay
    handleSelectContent(id, type); // Navigate
  };


  const handleBackToHome = () => {
    setSelectedContent(null);
  };
  
  const handleGenreSelect = (id: number, name: string, type: 'movie' | 'tv') => {
    setSelectedGenre({ id, name, type });
    window.scrollTo(0, 0);
  };

  const handleSaveSettings = (newConfig: AppConfig) => {
    setAppConfig(newConfig);
    try {
        localStorage.setItem(APP_CONFIG_LS_KEY, JSON.stringify(newConfig));
    } catch (e) {
        console.error("Failed to save app config to localStorage", e);
    }
    setIsSettingsVisible(false);
    setConfigVersion(v => v + 1);
    window.scrollTo(0, 0);
  };


  if (loading) {
    return (
        <div className="fixed inset-0 z-[110] bg-black flex flex-col justify-center items-center h-full text-center p-4">
            <LoadingIndicator message="Curating Your Next Watch..." />
        </div>
    );
  }

  if (error) {
    return (
        <div className="min-h-screen bg-black flex flex-col justify-center items-center text-center p-4">
            <div className="bg-red-900/20 border border-red-500/30 p-8 rounded-lg max-w-lg">
                <h1 className="text-red-400 text-3xl font-bold mb-3">Oops! Something went wrong.</h1>
                <p className="text-red-300/80">{error}</p>
                 <p className="text-gray-400 text-sm mt-6">This could be due to a network issue or an invalid TMDb API key. Please check your connection and configuration.</p>
            </div>
        </div>
    );
  }

  if (playingContent) {
    return <StreamPlayer content={playingContent} onClose={() => setPlayingContent(null)} />;
  }
  
  if (isSettingsVisible) {
    return <SettingsPage currentConfig={appConfig} onClose={() => setIsSettingsVisible(false)} onSave={handleSaveSettings} />;
  }

  if (selectedContent) {
    return <ContentDetail contentId={selectedContent.id} contentType={selectedContent.type} onBack={handleBackToHome} onContentSelect={handleSelectContent} onPlay={setPlayingContent} />;
  }
  
  if (selectedGenre) {
    return <GenreGridPage 
        genreId={selectedGenre.id} 
        genreName={selectedGenre.name} 
        genreType={selectedGenre.type} 
        onBack={() => setSelectedGenre(null)} 
        onContentSelect={handleSelectContent}
        region={appConfig.region}
    />
  }

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans flex flex-col">
      <Header onSearchClick={() => setIsSearchOverlayVisible(true)} onSettingsClick={() => setIsSettingsVisible(true)} />

      <SearchOverlay 
        isVisible={isSearchOverlayVisible} 
        onClose={() => setIsSearchOverlayVisible(false)}
        onContentSelect={handleSelectContentFromSearch}
        region={appConfig.region}
      />
      
      <div className="flex-grow">
          <>
            {heroContent.length > 0 && <HeroBanner items={heroContent} onContentSelect={handleSelectContent} />}
            <main className="w-full max-w-7xl mx-auto flex-grow space-y-16 py-12 px-4 sm:px-8">
              {Object.entries(contentByGenre).length > 0 ? (
                Object.entries(contentByGenre).map(([title, data]) => (
                    <GenreRow 
                        key={title} 
                        title={title} 
                        items={data.items} 
                        onContentSelect={handleSelectContent}
                        genreId={data.id}
                        genreType={data.type}
                        onGenreSelect={handleGenreSelect} 
                    />
                ))
              ) : (
                <div className="text-center py-20">
                  <h2 className="text-2xl font-bold text-white mb-4">Your Home Screen is Empty</h2>
                  <p className="text-gray-400 mb-6">Click the settings icon to add some genre rows and customize your experience.</p>
                  <button onClick={() => setIsSettingsVisible(true)} className="bg-white text-black font-bold py-2 px-6 rounded-md hover:bg-gray-200 transition-colors">
                    Go to Settings
                  </button>
                </div>
              )}
            </main>
            <footer className="w-full max-w-7xl mx-auto text-center text-gray-500 py-6 px-4 sm:px-8">
              <p>Content data provided by <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">TMDb</a>.</p>
            </footer>
          </>
      </div>
    </div>
  );
};

export default App;
