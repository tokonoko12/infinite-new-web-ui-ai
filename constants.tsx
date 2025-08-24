
import type { HomeConfigItem, Country, AppConfig } from './types';

// NOTE: In a production environment, API keys should be stored securely as environment variables
// and not hardcoded. This is for demonstration purposes only.
export const API_KEY = '82d9278fff477f3708641f31d2e2d65d';
export const BASE_URL = 'https://api.themoviedb.org/3';
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
export const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';
export const STREAM_BASE_URL = 'https://stream.mitserve.space';


// Full list of TMDb movie genres
export const MOVIE_GENRES: { id: number; name:string }[] = [
    { id: 28, name: "Action" },
    { id: 12, name: "Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 14, name: "Fantasy" },
    { id: 36, name: "History" },
    { id: 27, name: "Horror" },
    { id: 10402, name: "Music" },
    { id: 9648, name: "Mystery" },
    { id: 10749, name: "Romance" },
    { id: 878, name: "Science Fiction" },
    { id: 10770, name: "TV Movie" },
    { id: 53, name: "Thriller" },
    { id: 10752, name: "War" },
    { id: 37, name: "Western" },
];

export const TV_GENRES: { id: number; name:string }[] = [
    { id: 10759, name: "Action & Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 10762, name: "Kids" },
    { id: 9648, name: "Mystery" },
    { id: 10763, name: "News" },
    { id: 10764, name: "Reality" },
    { id: 10765, name: "Sci-Fi & Fantasy" },
    { id: 10766, name: "Soap" },
    { id: 10767, name: "Talk" },
    { id: 10768, name: "War & Politics" },
    { id: 37, name: "Western" },
];


// A map for quick lookup of genre ID to genre name
// Merged for simplicity in the app
export const GENRE_MAP = new Map<number, string>(
  [...MOVIE_GENRES, ...TV_GENRES].map(g => [g.id, g.name])
);

export const APP_CONFIG_LS_KEY = 'app_config';

const DEFAULT_HOME_ROWS: HomeConfigItem[] = [
    { id: 28, name: "Action", type: 'movie' },
    { id: 10765, name: "Sci-Fi & Fantasy", type: 'tv' },
    { id: 35, name: "Comedy", type: 'movie' },
    { id: 18, name: "Drama", type: 'tv' },
    { id: 27, name: "Horror", type: 'movie' },
    { id: 99, name: "Documentary", type: 'tv' },
    { id: 878, name: "Science Fiction", type: 'movie' },
    { id: 10759, name: "Action & Adventure", type: 'tv' },
    { id: 53, name: "Thriller", type: 'movie' },
    { id: 35, name: "Comedy Shows", type: 'tv' },
];

export const DEFAULT_APP_CONFIG: AppConfig = {
    homeRows: DEFAULT_HOME_ROWS,
    region: 'US',
};

export const SUPPORTED_COUNTRIES: Country[] = [
  { iso_3166_1: 'US', english_name: 'United States' },
  { iso_3166_1: 'GB', english_name: 'United Kingdom' },
  { iso_3166_1: 'CA', english_name: 'Canada' },
  { iso_3166_1: 'AU', english_name: 'Australia' },
  { iso_3166_1: 'DE', english_name: 'Germany' },
  { iso_3166_1: 'FR', english_name: 'France' },
  { iso_3166_1: 'ES', english_name: 'Spain' },
  { iso_3166_1: 'IT', english_name: 'Italy' },
  { iso_3166_1: 'JP', english_name: 'Japan' },
  { iso_3166_1: 'KR', english_name: 'South Korea' },
  { iso_3166_1: 'BR', english_name: 'Brazil' },
  { iso_3166_1: 'MX', english_name: 'Mexico' },
  { iso_3166_1: 'IN', english_name: 'India' },
];
