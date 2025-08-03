"use client";

import React, { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createQuoteRequestSchema,
  type CreateQuoteRequestDto,
} from "@/application/dto/quote.dto";
import { Calendar, Users, Plus, Minus, Mail, Phone, User } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { toast } from "@/components/ui/use-toast";

interface QuoteFormProps {
  stay: any;
}

export function QuoteForm({ stay }: QuoteFormProps) {
  const t = useTranslations("Public.QuoteForm");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? fr : enUS;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ageRanges = useMemo(
    () =>
      stay.hotel.rooms
        .flatMap((room: any) => room.roomPricings.map((rp: any) => rp.ageRange))
        .filter(
          (ar: any, index: number, self: any[]) =>
            index === self.findIndex((a) => a.id === ar.id)
        )
        .sort((a: any, b: any) => a.order - b.order),
    [stay.hotel.rooms]
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateQuoteRequestDto>({
    resolver: zodResolver(createQuoteRequestSchema),
    defaultValues: {
      stayId: stay.id,
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      checkIn: format(new Date(stay.startDate), "yyyy-MM-dd"),
      checkOut: format(new Date(stay.endDate), "yyyy-MM-dd"),
      participants: ageRanges.map((ar: any) => ({
        ageRangeId: ar.id,
        count: 0,
      })),
      specialRequests: "",
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "participants",
  });

  const participants = watch("participants");
  const totalParticipants = participants.reduce(
    (sum: number, p: any) => sum + p.count,
    0
  );

  const createQuote = trpc.quotes.createPublic.useMutation({
    onSuccess: () => {
      toast({
        title: t("successTitle"),
        description: t("successMessage"),
      });
      // Reset form ou redirect
    },
    onError: (error) => {
      toast({
        title: t("errorTitle"),
        description: error.message || t("errorMessage"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CreateQuoteRequestDto) => {
    setIsSubmitting(true);
    try {
      await createQuote.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateParticipantCount = (index: number, delta: number) => {
    const currentCount = participants[index].count;
    const newCount = Math.max(0, currentCount + delta);
    const newParticipants = [...participants];
    newParticipants[index] = { ...newParticipants[index], count: newCount };
    // Update form value
    const event = {
      target: {
        name: `participants.${index}.count`,
        value: newCount,
      },
    };
    register(`participants.${index}.count`).onChange(event);
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {t("title")}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Informations personnelles */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5" />
                {t("personalInfo")}
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">{t("firstName")} *</Label>
                  <Input
                    id="firstName"
                    {...register("firstName")}
                    placeholder={t("firstNamePlaceholder")}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">{t("lastName")} *</Label>
                  <Input
                    id="lastName"
                    {...register("lastName")}
                    placeholder={t("lastNamePlaceholder")}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">{t("email")} *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder={t("emailPlaceholder")}
                      className="pl-10"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">{t("phone")} *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      {...register("phone")}
                      placeholder={t("phonePlaceholder")}
                      className="pl-10"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Dates de séjour */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t("stayDates")}
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="checkIn">{t("checkIn")} *</Label>
                  <Input
                    id="checkIn"
                    type="date"
                    {...register("checkIn")}
                    min={format(new Date(stay.startDate), "yyyy-MM-dd")}
                    max={format(new Date(stay.endDate), "yyyy-MM-dd")}
                  />
                  {errors.checkIn && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.checkIn.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="checkOut">{t("checkOut")} *</Label>
                  <Input
                    id="checkOut"
                    type="date"
                    {...register("checkOut")}
                    min={format(new Date(stay.startDate), "yyyy-MM-dd")}
                    max={format(new Date(stay.endDate), "yyyy-MM-dd")}
                  />
                  {errors.checkOut && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.checkOut.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("participants")}
              </h3>

              <div className="space-y-3">
                {fields.map((field, index) => {
                  const ageRange = ageRanges[index];
                  return (
                    <div
                      key={field.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {ageRange.name}
                        </p>
                        {ageRange.minAge !== null &&
                          ageRange.maxAge !== null && (
                            <p className="text-sm text-gray-600">
                              {ageRange.minAge}-{ageRange.maxAge} {t("years")}
                            </p>
                          )}
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => updateParticipantCount(index, -1)}
                          disabled={participants[index].count === 0}
                          aria-label={`Reduce ${ageRange.name} count`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>

                        <input
                          type="hidden"
                          {...register(`participants.${index}.ageRangeId`)}
                          value={ageRange.id}
                        />
                        <Input
                          type="number"
                          {...register(`participants.${index}.count`, {
                            valueAsNumber: true,
                          })}
                          className="w-16 text-center"
                          min="0"
                          readOnly
                        />

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => updateParticipantCount(index, 1)}
                          aria-label={`Increase ${ageRange.name} count`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalParticipants > 0 && (
                <p className="text-sm text-gray-600 text-center">
                  {t("total")}: {totalParticipants} {t("persons")}
                </p>
              )}
            </div>

            {/* Demandes spéciales */}
            <div className="space-y-4">
              <Label htmlFor="specialRequests">{t("specialRequests")}</Label>
              <textarea
                id="specialRequests"
                {...register("specialRequests")}
                placeholder={t("specialRequestsPlaceholder")}
                rows={4}
                className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={isSubmitting || totalParticipants === 0}
            >
              {isSubmitting ? t("submitting") : t("submit")}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
