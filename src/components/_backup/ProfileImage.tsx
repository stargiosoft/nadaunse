import { useState } from 'react';
import { Skeleton } from './ui/skeleton';

interface ProfileImageProps {
  src: string;
  alt: string;
}

export function ProfileImage({ src, alt }: ProfileImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="pointer-events-none relative rounded-[12px] shrink-0 size-[72px]">
      {!isLoaded && (
        <Skeleton className="absolute inset-0 rounded-[12px] size-full bg-gray-200" />
      )}
      <img
        alt={alt}
        className={`absolute inset-0 max-w-none object-cover rounded-[12px] size-full transition-opacity duration-500 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        src={src}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
      />
      <div aria-hidden="true" className="absolute border border-[#f8f8f8] border-solid inset-0 rounded-[12px]" />
    </div>
  );
}
