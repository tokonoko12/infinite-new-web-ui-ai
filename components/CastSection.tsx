import React, { useState } from 'react';
import type { CastMember } from '../types';

interface CastSectionProps {
  cast: CastMember[];
}

const CastCard: React.FC<{ member: CastMember }> = ({ member }) => {
    const [imageError, setImageError] = useState(false);
    const handleImageError = () => { setImageError(true); };
    const placeholderUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=374151&color=fff&size=100`;

    return (
        <div className="flex flex-col items-center text-center gap-2 lg:flex-row lg:items-center lg:text-left lg:gap-4" role="listitem">
            <img
                src={imageError ? placeholderUrl : member.profileUrl}
                alt={member.name}
                className="w-14 h-14 rounded-full object-cover bg-gray-800 flex-shrink-0"
                onError={handleImageError}
                loading="lazy"
            />
            <div className="w-full lg:flex-grow lg:min-w-0">
                <p className="text-white font-semibold leading-tight text-sm lg:text-base break-words line-clamp-2 lg:line-clamp-none">{member.name}</p>
                <p className="text-gray-400 text-xs lg:text-sm break-words line-clamp-2 lg:line-clamp-none">{member.character}</p>
            </div>
        </div>
    );
};

const CastSection: React.FC<CastSectionProps> = ({ cast }) => {
  return (
    <section aria-labelledby="cast-heading" className="flex flex-col lg:absolute lg:inset-0">
      <h2 id="cast-heading" className="text-2xl font-bold text-white mb-4 flex-shrink-0">Cast</h2>
      <div 
        className="flex flex-row space-x-4 overflow-x-auto no-scrollbar pb-2 lg:flex-col lg:space-x-0 lg:space-y-4 lg:overflow-y-auto lg:pb-0 lg:pr-2 lg:max-h-[60vh] lg:max-h-none lg:flex-grow lg:min-h-0" 
        role="list"
      >
        {cast.map((member) => (
          <div key={member.id} className="w-24 flex-shrink-0 lg:w-auto">
            <CastCard member={member} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default CastSection;