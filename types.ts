
export interface Content {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  posterUrl: string;
  backdropUrl: string;
  year: string;
  genreString: string;
  description: string;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  stillUrl: string;
  episodeNumber: number;
  seasonNumber: number;
}

export interface SeasonSummary {
  id: number;
  name: string;
  seasonNumber: number;
  episodeCount: number;
}

export interface DetailedContent extends Omit<Content, 'genreString'> {
  tagline?: string;
  runtime?: number;
  voteAverage: number;
  genres: { id: number; name: string }[];
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  seasons?: SeasonSummary[];
  imdb_id?: string;
}

export interface CastMember {
  id: string;
  name: string;
  character: string;
  profileUrl: string;
}

export interface Stream {
  quality: string;
  title: string;
  url: string;
}

export interface StreamCollection {
  [quality: string]: Stream[];
}

export interface StreamApiResponse {
  streams: StreamCollection;
}

export interface PlayableStreamResponse {
    audio_lang: Record<string, string>;
    duration: number;
    size: number;
    streams: {
        Original?: string; // This is the MPD manifest for playback
        main?: string;     // This is likely the source video file
    }
}

export interface PlayableContent {
  imdbId: string;
  type: 'movie' | 'tv';
  title: string;
  season?: number;
  episode?: number;
  initialStream?: Stream;
}

export interface HomeConfigItem {
  id: number;
  name: string;
  type: 'movie' | 'tv';
}

export interface Country {
  iso_3166_1: string;
  english_name: string;
}

export interface AppConfig {
  homeRows: HomeConfigItem[];
  region: string; // ISO 3166-1 country code
}
