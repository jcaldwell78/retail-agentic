import { useState, useEffect, useRef } from 'react';
import { ImageOff } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  lazy?: boolean;
  blur?: boolean; // Show blur placeholder while loading
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean; // Don't lazy load if priority
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  objectFit = 'cover',
  lazy = true,
  blur = true,
  fallbackSrc,
  onLoad,
  onError,
  priority = false,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Load 50px before entering viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate srcset for responsive images
  const generateSrcSet = (baseSrc: string): string => {
    if (!baseSrc.startsWith('http')) return '';

    // In production, you would use a CDN or image optimization service
    // For now, just return the base image
    return `${baseSrc} 1x`;
  };

  const imageSrc = isInView ? (hasError && fallbackSrc ? fallbackSrc : src) : '';

  if (hasError && !fallbackSrc) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : '100%',
        }}
        data-testid="image-error"
      >
        <div className="text-center text-gray-400">
          <ImageOff className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Image not available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%',
      }}
    >
      {/* Blur placeholder */}
      {blur && !isLoaded && isInView && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          data-testid="image-placeholder"
        />
      )}

      {/* Actual image */}
      {isInView && (
        <img
          src={imageSrc}
          alt={alt}
          srcSet={generateSrcSet(imageSrc)}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          onLoad={handleLoad}
          onError={handleError}
          className={`${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-300 w-full h-full`}
          style={{ objectFit }}
          data-testid="optimized-image"
        />
      )}
    </div>
  );
}
