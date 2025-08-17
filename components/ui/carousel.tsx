"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarouselImage {
  id: string;
  url: string;
  alt?: string;
}

interface CarouselProps {
  images: CarouselImage[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showThumbnails?: boolean;
  className?: string;
  aspectRatio?: "square" | "video" | "wide" | "portrait";
  onImageClick?: (index: number) => void;
}

export function Carousel({
  images,
  autoPlay = false,
  autoPlayInterval = 5000,
  showThumbnails = false,
  className,
  aspectRatio = "wide",
  onImageClick,
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);

  // Navigation functions
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying || images.length <= 1) return;

    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isAutoPlaying, goToNext, images.length, autoPlayInterval]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext]);

  // Touch handling for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  if (!images || images.length === 0) return null;

  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-video",
    wide: "aspect-[21/9]",
    portrait: "aspect-[3/4]",
  };

  return (
    <div className={cn("relative group h-full", className)}>
      {/* Main carousel */}
      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-gray-100 h-full",
          aspectRatio === "square" ||
            aspectRatio === "video" ||
            aspectRatio === "portrait"
            ? aspectRatioClasses[aspectRatio]
            : ""
        )}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Images */}
        {images.map((image, index) => (
          <div
            key={image.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-500",
              index === currentIndex ? "opacity-100" : "opacity-0"
            )}
            onClick={() => onImageClick?.(index)}
          >
            <Image
              src={image.url}
              alt={image.alt || `Slide ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
              sizes="100vw"
            />
          </div>
        ))}

        {/* Navigation buttons - only show if more than 1 image */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all backdrop-blur-sm border border-white/20 shadow-lg opacity-0 group-hover:opacity-100 md:opacity-100 focus:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            <button
              onClick={goToNext}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all backdrop-blur-sm border border-white/20 shadow-lg opacity-0 group-hover:opacity-100 md:opacity-100 focus:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            {/* Dots indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "transition-all duration-300",
                    currentIndex === index
                      ? "w-8 h-2 bg-white rounded-full"
                      : "w-2 h-2 bg-white/60 rounded-full hover:bg-white/80"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Auto-play toggle */}
        {autoPlay && images.length > 1 && (
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all backdrop-blur-sm border border-white/20 shadow-lg text-xs"
          >
            {isAutoPlaying ? "Pause" : "Play"}
          </button>
        )}
      </div>

      {/* Thumbnails */}
      {showThumbnails && images.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => goToSlide(index)}
              className={cn(
                "relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                currentIndex === index
                  ? "border-blue-500 shadow-lg"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={image.url}
                alt={image.alt || `Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Lightbox component for full-screen viewing
interface LightboxProps {
  images: CarouselImage[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function CarouselLightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, goToPrevious, goToNext]);

  // Touch handling for mobile
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchEndY(null);
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStartX || !touchStartY || !touchEndX || !touchEndY) return;

    const distanceX = touchStartX - touchEndX;
    const distanceY = touchStartY - touchEndY;

    // Check for horizontal swipe
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      const isLeftSwipe = distanceX > minSwipeDistance;
      const isRightSwipe = distanceX < -minSwipeDistance;

      if (isLeftSwipe) {
        goToNext();
      } else if (isRightSwipe) {
        goToPrevious();
      }
    }
    // Check for vertical swipe down to close
    else if (distanceY < -minSwipeDistance) {
      console.log("Swipe down detected - closing");
      onClose();
    }
  };

  if (!isOpen || !images || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Clickable background overlay */}
      <div
        className="absolute inset-0 bg-black/95 backdrop-blur-md animate-in fade-in duration-200"
        onClick={() => {
          console.log("Background overlay clicked - closing");
          onClose();
        }}
        onTouchEnd={(e) => {
          // For mobile - check if it's a tap on the background
          if (e.target === e.currentTarget) {
            console.log("Background touched - closing");
            onClose();
          }
        }}
      />

      {/* Mobile tap zones to close - only on mobile */}
      <div
        className="absolute top-0 left-0 right-0 h-20 md:hidden"
        onClick={() => {
          console.log("Top zone tapped - closing");
          onClose();
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-20 md:hidden"
        onClick={() => {
          console.log("Bottom zone tapped - closing");
          onClose();
        }}
      />

      {/* Content layer - does not handle clicks */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Close button */}
        <button
          onClick={() => {
            console.log("Close button clicked");
            onClose();
          }}
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2 md:p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all backdrop-blur-sm border border-white/20 shadow-lg z-50 pointer-events-auto"
          aria-label="Close lightbox"
        >
          <X className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        {/* Main image container */}
        <div
          className="relative w-full h-full max-w-7xl max-h-[90vh] p-4 md:p-12 flex items-center justify-center pointer-events-auto"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <Image
            src={images[currentIndex].url}
            alt={images[currentIndex].alt || `Image ${currentIndex + 1}`}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>

        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => {
                console.log("Previous button clicked");
                goToPrevious();
              }}
              className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all backdrop-blur-sm border border-white/20 shadow-lg pointer-events-auto"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <button
              onClick={() => {
                console.log("Next button clicked");
                goToNext();
              }}
              className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all backdrop-blur-sm border border-white/20 shadow-lg pointer-events-auto"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            {/* Dots indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4 pointer-events-auto">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    console.log(`Dot ${index} clicked`);
                    setCurrentIndex(index);
                  }}
                  className={cn(
                    "transition-all duration-300 flex-shrink-0",
                    currentIndex === index
                      ? "w-8 h-2 bg-white rounded-full"
                      : "w-2 h-2 bg-white/60 rounded-full hover:bg-white/80"
                  )}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
