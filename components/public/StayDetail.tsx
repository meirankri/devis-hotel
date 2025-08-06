"use client";

import { useTranslations } from "next-intl";
import { Calendar, MapPin, Users, Check, Coffee } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";

interface StayDetailProps {
  stay: any;
}

export function StayDetail({ stay }: StayDetailProps) {
  const t = useTranslations("Public.StayDetail");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? fr : enUS;

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-purple-800/80 to-indigo-900/90 z-10"></div>
        <div className="absolute inset-0 z-0">
          {stay.imageUrl ? (
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

        <div className="relative z-20 py-32 lg:py-40">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center text-white space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-purple-100 leading-tight">
                  {stay.name}
                </h1>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-lg">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3">
                  <MapPin className="h-6 w-6 text-blue-300" />
                  <span className="font-medium">{stay.hotel.name}</span>
                </div>

                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3">
                  <Calendar className="h-6 w-6 text-purple-300" />
                  <span className="font-medium">
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
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3">
                    <Users className="h-6 w-6 text-green-300" />
                    <span className="font-medium">{t("partialBooking")}</span>
                    {stay.minDays && (
                      <span className="text-sm">
                        ({t("min")} {stay.minDays} {t("days")})
                      </span>
                    )}
                    {stay.maxDays && (
                      <span className="text-sm">
                        ({t("max")} {stay.maxDays} {t("days")})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50 to-transparent z-15"></div>
      </section>

      <section className="py-20 -mt-12 relative">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-1 gap-16 items-start">
            <div className="space-y-8">
              {stay.description && (
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
                  <div className="space-y-6">
                    <div
                      className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: stay.description }}
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

            <div className="space-y-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                      <Coffee className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      {t("hotelFeatures")}
                    </h2>
                  </div>

                  {stay.hotel.description && (
                    <div
                      className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: stay.hotel.description,
                      }}
                    />
                  )}

                  {stay.hotel.address && (
                    <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
                      <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-blue-800 font-medium">
                        {stay.hotel.address}
                      </span>
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
