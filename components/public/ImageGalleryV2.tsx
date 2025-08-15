"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { CarouselLightbox } from "@/components/ui/carousel";

interface ImageGalleryProps {
  images: Array<{
    id: string;
    url: string;
    order: number;
    isMain: boolean;
  }>;
  stayName: string;
}

export function ImageGalleryV2({ images, stayName }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  // Sort images by isMain and order
  const sortedImages = [...images].sort((a, b) => {
    if (a.isMain && !b.isMain) return -1;
    if (!a.isMain && b.isMain) return 1;
    return a.order - b.order;
  });

  const mainImage = sortedImages[0];
  const displayImages = sortedImages.slice(0, 5);
  const remainingCount = images.length - 5;

  // Determine grid layout based on number of images
  const getGridClass = () => {
    if (images.length === 1) return "grid-cols-1";
    if (images.length === 2) return "grid-cols-2 gap-2 md:gap-4";
    if (images.length === 3) return "grid-cols-2 md:grid-cols-3 gap-2 md:gap-4";
    return "grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4";
  };

  const getImageContainerClass = (index: number, total: number) => {
    if (total === 1) return "col-span-1";
    if (total === 2) return "col-span-1";
    if (total === 3) {
      return index === 0 ? "col-span-2 md:col-span-1 row-span-1" : "col-span-1";
    }
    // For 4+ images
    return index === 0 ? "col-span-2 lg:col-span-2 row-span-2" : "col-span-1";
  };

  return (
    <>
      <div className="relative">
        {images.length === 1 ? (
          // Single image layout
          <div
            className="relative h-[300px] md:h-[500px] lg:h-[600px] rounded-xl md:rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => openLightbox(0)}
          >
            <Image
              src={mainImage.url}
              alt={`${stayName} - Photo principale`}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 flex items-center gap-3 text-white opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
              <ZoomIn className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-xs md:text-sm font-light tracking-wide">
                Cliquer pour agrandir
              </span>
            </div>
          </div>
        ) : (
          // Multiple images grid
          <div
            className={cn(
              "grid",
              getGridClass(),
              "h-[400px] md:h-[500px] lg:h-[600px]"
            )}
          >
            {displayImages.map((image, index) => (
              <div
                key={image.id}
                className={cn(
                  "relative overflow-hidden rounded-lg md:rounded-xl cursor-pointer group",
                  getImageContainerClass(index, displayImages.length)
                )}
                onClick={() => openLightbox(index)}
              >
                <Image
                  src={image.url}
                  alt={`${stayName} - Photo ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes={
                    index === 0 && images.length > 3
                      ? "(max-width: 768px) 100vw, 66vw"
                      : "(max-width: 768px) 50vw, 33vw"
                  }
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Show remaining count on last image if there are more */}
                {index === displayImages.length - 1 && remainingCount > 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center group-hover:bg-black/70 transition-colors">
                    <div className="text-center text-white">
                      <div className="text-2xl md:text-3xl font-light">
                        +{remainingCount}
                      </div>
                      <div className="text-xs md:text-sm mt-1">Photos</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <CarouselLightbox
        images={sortedImages.map((img, index) => ({
          id: img.id,
          url: img.url,
          alt: `${stayName} - Photo ${index + 1}`,
        }))}
        initialIndex={selectedIndex}
        isOpen={lightboxOpen}
        onClose={() => {
          console.log("onClose");
          setLightboxOpen(false);
        }}
      />
    </>
  );
}
