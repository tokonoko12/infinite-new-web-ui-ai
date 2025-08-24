import React from 'react';

interface LoadingIndicatorProps {
  size?: 'small' | 'large';
  message?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ size = 'large', message }) => {
  const sizeClasses = size === 'large' ? 'w-16 h-16' : 'w-6 h-6';
  
  return (
    <div className="flex flex-col justify-center items-center gap-4" role="status" aria-label={message || "Loading"}>
      <div className={`relative ${sizeClasses} flex items-center justify-center`}>
        <div className={`absolute inset-0 border-2 border-white/80 animate-pulse-square`}></div>
        <div className={`absolute inset-2 border-2 border-white/60 animate-pulse-square [animation-delay:-0.2s]`}></div>
        <div className={`absolute inset-4 border-2 border-white/40 animate-pulse-square [animation-delay:-0.4s]`}></div>
      </div>
      {message && <p className="text-white text-lg font-light tracking-wider mt-2">{message}</p>}
    </div>
  );
};

export default LoadingIndicator;
