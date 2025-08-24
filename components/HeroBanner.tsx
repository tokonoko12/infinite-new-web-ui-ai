import React, { useState, useEffect, useRef } from 'react';
import type { Content } from '../types';

interface HeroBannerProps {
  items: Content[];
  onContentSelect: (id: number, type: 'movie' | 'tv') => void;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ items, onContentSelect }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  
  // Drag to change slide state
  const isDragging = useRef(false);
  const startX = useRef(0);

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };
  
  const startAutoplay = () => {
    if (items.length <= 1) return;
    resetTimeout();
    timeoutRef.current = setTimeout(
      () =>
        setCurrentIndex((prevIndex) =>
          prevIndex === items.length - 1 ? 0 : prevIndex + 1
        ),
      5000 // Change slide every 5 seconds
    );
  };

  useEffect(() => {
    startAutoplay();
    return () => {
      resetTimeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, items.length]);

  if (items.length === 0) {
    return null;
  }

  const goToSlide = (slideIndex: number) => {
    setCurrentIndex(slideIndex);
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (items.length <= 1) return;
    
    isDragging.current = true;
    startX.current = 'touches' in e ? e.touches[0].pageX : e.pageX;
    
    const banner = bannerRef.current;
    if (banner) {
        banner.style.cursor = 'grabbing';
        banner.style.userSelect = 'none';
    }
    
    resetTimeout();

    const handleDragMove = (ev: MouseEvent | TouchEvent) => {
        if (!isDragging.current) return;
        ev.preventDefault();
    };

    const handleDragEnd = (ev: MouseEvent | TouchEvent) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        
        const endX = 'changedTouches' in ev ? ev.changedTouches[0].pageX : ev.pageX;
        const diff = startX.current - endX;
        const threshold = 50;

        if (diff > threshold) {
            // Swiped left
            setCurrentIndex(prev => prev === items.length - 1 ? 0 : prev + 1);
        } else if (diff < -threshold) {
            // Swiped right
            setCurrentIndex(prev => prev === 0 ? items.length - 1 : prev - 1);
        }
        
        if (banner) {
            banner.style.cursor = 'grab';
            banner.style.userSelect = 'auto';
        }
        
        startAutoplay();

        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
    };

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove);
    window.addEventListener('touchend', handleDragEnd);
  };

  const item = items[currentIndex];

  return (
    <div
      ref={bannerRef}
      className="w-full h-[70vh] sm:h-[80vh] md:h-[90vh] relative text-white select-none"
      style={{
        backgroundImage: `url(${item.backdropUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        transition: 'background-image 1s ease-in-out',
        cursor: items.length > 1 ? 'grab' : 'default',
      }}
      role="banner"
      aria-labelledby="hero-movie-title"
      onMouseEnter={resetTimeout}
      onMouseLeave={() => {
          if (!isDragging.current) {
              startAutoplay();
          }
      }}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Gradients for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" aria-hidden="true" />
      
      {/* Content Container */}
      <div className="relative h-full flex flex-col justify-end items-start w-full max-w-7xl mx-auto p-4 sm:p-8 md:p-12 pb-12 sm:pb-16 md:pb-20">
        {/* Use key to subtly re-animate content on slide change */}
        <div key={currentIndex} className="max-w-md md:max-w-2xl">
            <h1 id="hero-movie-title" className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-3 sm:mb-4" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.8)'}}>
              {item.title}
            </h1>
            <div className="flex items-center space-x-4 text-gray-300 mb-4 sm:mb-6 font-medium text-sm sm:text-base">
                <span>{item.year}</span>
                <span className="border-l border-gray-500 h-4"></span>
                <span>{item.genreString.split(' / ')[0]}</span>
            </div>
            <p 
                className="text-sm sm:text-base text-gray-200 mb-6 sm:mb-8 max-w-xl overflow-hidden" 
                style={{
                    textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 3,
                }}
            >
              {item.description}
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <button
                onClick={() => onContentSelect(item.id, item.type)}
                className="flex items-center justify-center bg-white text-black font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-md hover:bg-gray-200 transition-colors duration-300 text-sm sm:text-base">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Play
              </button>
            </div>
        </div>
      </div>

      {/* Navigation */}
      {items.length > 1 && (
        <>
            {/* Image Preview Navigation for Desktop */}
            <div className="absolute bottom-5 right-5 p-2 bg-black/40 backdrop-blur-sm rounded-lg hidden md:block">
              <div className="flex space-x-2">
                {items.map((previewItem, slideIndex) => (
                  <button
                    key={previewItem.id}
                    onClick={() => goToSlide(slideIndex)}
                    className={`w-16 h-24 rounded-md overflow-hidden transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-white/80
                      ${currentIndex === slideIndex ? 'border-2 border-white opacity-100 scale-105' : 'border-2 border-transparent opacity-60 hover:opacity-90'}`}
                    aria-label={`Go to slide ${slideIndex + 1}: ${previewItem.title}`}
                    aria-current={currentIndex === slideIndex ? 'true' : 'false'}
                  >
                    <img
                      src={previewItem.posterUrl}
                      alt={`Poster for ${previewItem.title}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Rectangular Bar Navigation for Mobile/Portrait */}
            <div className="absolute bottom-5 right-5 flex space-x-2 md:hidden">
              {items.map((_, slideIndex) => (
                <button
                  key={`dot-${slideIndex}`}
                  onClick={() => goToSlide(slideIndex)}
                  className={`h-1 rounded-full transition-all duration-500 ease-in-out ${
                    currentIndex === slideIndex ? 'w-6 bg-white' : 'w-3 bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to slide ${slideIndex + 1}`}
                  aria-current={currentIndex === slideIndex ? 'true' : 'false'}
                />
              ))}
            </div>
        </>
      )}
    </div>
  );
};

export default HeroBanner;