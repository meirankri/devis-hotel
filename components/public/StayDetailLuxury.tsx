"use client";

import { useTranslations } from "next-intl";
import {
  Calendar,
  MapPin,
  Users,
  Check,
  Star,
  Sparkles,
  Clock,
  Coffee,
} from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { ImageGalleryV2 } from "./ImageGalleryV2";
import { Carousel } from "@/components/ui/carousel";
import {
  Hotel,
  Room,
  RoomPricing,
  AgeRange,
  Stay,
  StayImage,
  Organization,
} from "@prisma/client";
import { useState } from "react";
import { cleanTipTapHTML } from "@/lib/utils/html-cleaner";

interface SerializedRoomPricing {
  id: string;
  roomId: string;
  ageRangeId: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  ageRange: {
    id: string;
    name: string;
    minAge: number | null;
    maxAge: number | null;
    order: number;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface SerializedRoom {
  id: string;
  hotelId: string;
  name: string;
  description: string | null;
  capacity: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  roomPricings: SerializedRoomPricing[];
}

interface SerializedHotel {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  imageUrl: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  rooms: SerializedRoom[];
}

interface SerializedStayImage {
  id: string;
  stayId: string;
  url: string;
  order: number;
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SerializedOrganization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SerializedStay {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  startDate: string;
  endDate: string;
  hotelId: string;
  organizationId: string;
  allowPartialBooking: boolean;
  minDays: number | null;
  maxDays: number | null;
  isActive: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  hotel: SerializedHotel;
  organization: SerializedOrganization;
  images: SerializedStayImage[];
}

interface StayDetailProps {
  stay: SerializedStay;
}

export function StayDetailLuxury({ stay }: StayDetailProps) {
  const t = useTranslations("Public.StayDetail");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? fr : enUS;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const getDuration = () => {
    const start = new Date(stay.startDate);
    const end = new Date(stay.endDate);
    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  return (
    <>
      {/* Hero Section avec gradient coloré et carousel */}
      <section className="relative overflow-hidden h-[60vh] md:h-[70vh] lg:h-[80vh]">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-purple-800/80 to-indigo-900/90 z-10 pointer-events-none"></div>

        {/* Carousel automatique en arrière-plan */}
        <div className="absolute inset-0 z-0">
          {stay.images && stay.images.length > 0 ? (
            <div className="w-full h-full [&>div]:h-full [&_button]:hidden">
              <Carousel
                images={stay.images.map((img) => ({
                  id: img.id,
                  url: img.url,
                  alt: stay.name,
                }))}
                autoPlay={true}
                autoPlayInterval={5000}
                className="h-full [&>div]:!rounded-none"
              />
            </div>
          ) : stay.imageUrl ? (
            <Image
              src={stay.imageUrl}
              alt={stay.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
              <div className="absolute inset-0 opacity-30">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `repeating-linear-gradient(
                      0deg,
                      transparent,
                      transparent 20px,
                      rgba(255, 255, 255, 0.1) 20px,
                      rgba(255, 255, 255, 0.1) 21px
                    ),
                    repeating-linear-gradient(
                      90deg,
                      transparent,
                      transparent 20px,
                      rgba(255, 255, 255, 0.1) 20px,
                      rgba(255, 255, 255, 0.1) 21px
                    )`,
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="relative z-20 py-20 md:py-32 lg:py-40">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center text-white space-y-6 md:space-y-8">
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-purple-100 leading-tight px-2">
                  {stay.name}
                </h1>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 md:gap-6 text-sm md:text-lg">
                <div className="flex items-center gap-2 md:gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 md:px-6 py-2 md:py-3">
                  <MapPin className="h-5 w-5 md:h-6 md:w-6 text-blue-300 flex-shrink-0" />
                  <span className="font-medium truncate">
                    {stay.hotel.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 md:gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 md:px-6 py-2 md:py-3">
                  <Calendar className="h-5 w-5 md:h-6 md:w-6 text-purple-300 flex-shrink-0" />
                  <span className="font-medium whitespace-nowrap">
                    {format(new Date(stay.startDate), "dd MMM", {
                      locale: dateLocale,
                    })}{" "}
                    -{" "}
                    {format(new Date(stay.endDate), "dd MMM yyyy", {
                      locale: dateLocale,
                    })}
                  </span>
                </div>

                {stay.allowPartialBooking && (
                  <div className="flex items-center gap-2 md:gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 md:px-6 py-2 md:py-3">
                    <Users className="h-5 w-5 md:h-6 md:w-6 text-green-300 flex-shrink-0" />
                    <span className="font-medium">{t("partialBooking")}</span>
                    {stay.minDays && (
                      <span className="text-xs md:text-sm">
                        ({t("min")} {stay.minDays} {t("days")})
                      </span>
                    )}
                    {stay.maxDays && (
                      <span className="text-xs md:text-sm">
                        ({t("max")} {stay.maxDays} {t("days")})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent z-15"></div>
      </section>

      {/* Galerie d'images ou image unique */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          {stay.images && stay.images.length > 0 ? (
            <ImageGalleryV2 images={stay.images} stayName={stay.name} />
          ) : stay.imageUrl ? (
            // Image unique si pas de galerie mais une imageUrl
            <div className="relative h-[300px] md:h-[500px] lg:h-[600px] rounded-xl md:rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src={stay.imageUrl}
                alt={stay.name}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
          ) : null}
        </div>
      </section>

      {/* Description du séjour */}
      <section className="py-20 -mt-12 relative">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="space-y-8">
            {stay.description && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
                <div className="space-y-6">
                  <div
                    className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: cleanTipTapHTML(stay.description),
                    }}
                  />

                  <div className="grid gap-4">
                    {stay.allowPartialBooking && (
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
                        <div className="flex items-center gap-3">
                          <Check className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-800">
                            {t("partialBooking")}
                          </span>
                        </div>
                        <div className="text-sm text-green-600 font-medium">
                          {stay.minDays &&
                            `${t("min")}: ${stay.minDays} ${t("days")}`}
                          {stay.minDays && stay.maxDays && " • "}
                          {stay.maxDays &&
                            `${t("max")}: ${stay.maxDays} ${t("days")}`}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section Hôtel et Chambres sur toute la largeur */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20">
            <div className="space-y-6 md:space-y-8">
              {/* En-tête de la section */}
              <div className="flex items-center gap-3 pb-4 md:pb-6 border-b border-gray-200">
                <div className="p-2 md:p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg md:rounded-xl">
                  <Coffee className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {t("hotelFeatures")}
                </h2>
              </div>

              {/* Informations de l'hôtel */}
              <div className="grid lg:grid-cols-2 gap-6 md:gap-8 lg:items-stretch">
                <div className="space-y-4 md:space-y-6">
                  {stay.hotel.imageUrl && (
                    <div className="relative h-48 md:h-64 rounded-xl md:rounded-2xl overflow-hidden">
                      <Image
                        src={stay.hotel.imageUrl}
                        alt={stay.hotel.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>
                  )}

                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-xl md:text-2xl font-semibold text-gray-900">
                      {stay.hotel.name}
                    </h3>

                    {stay.hotel.description && (
                      <div
                        className="prose prose-sm md:prose-lg max-w-none text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: cleanTipTapHTML(stay.hotel.description),
                        }}
                      />
                    )}

                    {stay.hotel.address && (
                      <div className="flex items-start gap-2 md:gap-3 p-3 md:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg md:rounded-xl border border-blue-200/50">
                        <MapPin className="h-4 w-4 md:h-5 md:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm md:text-base text-blue-800 font-medium">
                          {stay.hotel.address}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chambres disponibles */}
                <div className="space-y-4 md:space-y-6 lg:h-full lg:flex lg:flex-col">
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 flex-shrink-0">
                    Chambres disponibles
                  </h3>

                  {stay.hotel.rooms && stay.hotel.rooms.length > 0 ? (
                    <div className="flex flex-col gap-2 md:gap-3 overflow-y-auto lg:flex-1">
                      {stay.hotel.rooms.map((room) => (
                        <div
                          key={room.id}
                          className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg md:rounded-xl border border-gray-200 hover:shadow-md transition-shadow overflow-hidden flex-shrink-0"
                        >
                          {room.imageUrl && (
                            <div className="w-full h-32 md:h-60 relative">
                              <Image
                                src={room.imageUrl}
                                alt={room.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                              />
                            </div>
                          )}
                          <div className="p-6">
                            <div className="flex items-center justify-between gap-2">
                              <div className="space-y-1 flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 text-sm md:text-base truncate">
                                  {room.name}
                                </h4>
                                {room.description && (
                                  <div
                                    className="text-xs md:text-sm text-gray-600 line-clamp-2"
                                    dangerouslySetInnerHTML={{
                                      __html: cleanTipTapHTML(room.description),
                                    }}
                                  />
                                )}
                              </div>
                              <div className="flex-shrink-0">
                                <div className="px-2 md:px-3 py-1 bg-blue-100 text-blue-700 rounded-md md:rounded-lg text-xs md:text-sm font-medium whitespace-nowrap">
                                  {room.capacity} pers.
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 italic text-sm md:text-base lg:flex-1 lg:flex lg:items-center">
                      Aucune chambre disponible
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
