import React from 'react';

export const EpisodeCardSkeleton: React.FC = () => {
    return (
        <article className="flex flex-col bg-gray-900/60 overflow-hidden h-full">
            <div className="aspect-video bg-gray-800 animate-shimmer" />
            <div className="p-4 flex-grow flex flex-col">
                <div className="h-5 bg-gray-800 w-3/4 mb-3 animate-shimmer" />
                <div className="h-4 bg-gray-800 w-full mb-2 animate-shimmer" />
                <div className="h-4 bg-gray-800 w-full mb-2 animate-shimmer" />
                <div className="h-4 bg-gray-800 w-1/2 animate-shimmer" />
            </div>
        </article>
    );
};

export const ContentDetailSkeleton: React.FC = () => {
    return (
        <main className="bg-black text-gray-300">
            {/* Backdrop Skeleton */}
            <div className="w-full h-[50vh] md:h-[60vh] lg:h-[70vh] bg-gray-900 animate-shimmer relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
                 <div className="absolute top-4 left-4 z-20 p-2 bg-black/50 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </div>
            </div>

            <div className="w-full max-w-7xl mx-auto p-4 sm:p-8 relative -mt-32 md:-mt-48 z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        {/* Title Skeleton */}
                        <div className="h-12 bg-gray-800 w-3/4 mb-3 animate-shimmer" />
                        {/* Tagline Skeleton */}
                        <div className="h-6 bg-gray-800 w-1/2 mb-6 animate-shimmer" />
                        
                        {/* Meta Info Skeleton */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm">
                            <div className="h-5 bg-gray-800 w-12 animate-shimmer" />
                            <span className="opacity-50">•</span>
                            <div className="h-5 bg-gray-800 w-32 animate-shimmer" />
                            <span className="opacity-50">•</span>
                            <div className="h-5 bg-gray-800 w-16 animate-shimmer" />
                        </div>
                        
                        {/* Description Skeleton */}
                        <div className="mt-6 space-y-2">
                            <div className="h-5 bg-gray-800 w-full animate-shimmer" />
                            <div className="h-5 bg-gray-800 w-full animate-shimmer" />
                            <div className="h-5 bg-gray-800 w-10/12 animate-shimmer" />
                        </div>

                         {/* Play Controls Skeleton */}
                        <div className="mt-8 flex gap-4">
                            <div className="h-14 w-40 bg-gray-800 animate-shimmer" />
                            <div className="h-14 w-64 bg-gray-800 animate-shimmer" />
                        </div>
                    </div>

                    <aside className="lg:col-span-1">
                        {/* Cast Skeleton */}
                        <div className="h-8 bg-gray-800 w-24 mb-4 animate-shimmer" />
                        <div className="space-y-4">
                             {Array.from({ length: 5 }).map((_, index) => (
                                <div key={index} className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-gray-800 animate-shimmer flex-shrink-0" />
                                    <div className="flex-grow space-y-2">
                                        <div className="h-4 bg-gray-800 w-3/4 animate-shimmer" />
                                        <div className="h-3 bg-gray-800 w-1/2 animate-shimmer" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
};
