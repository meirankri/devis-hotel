"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import {
  Calendar,
  User,
  Mail,
  Phone,
  FileText,
  Check,
  ArrowRight,
  Download,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

// Custom hooks
import { useQuoteForm } from "@/hooks/useQuoteForm";
import { useRoomOccupancy } from "@/hooks/useRoomOccupancy";
import { usePriceCalculation } from "@/hooks/usePriceCalculation";

// Components
import { ParticipantSelector } from "@/components/quote/ParticipantSelector";
import { RoomSelector } from "@/components/quote/RoomSelector";

// Types
import type { Stay, QuoteFormData } from "@/types/quote";

interface QuoteFormProps {
  stay: Stay;
}

// Zod schema for form validation
const quoteFormSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(1, "Le téléphone est requis"),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide"),
  specialRequests: z.string().optional(),
});

/**
 * QuoteFormV2 Component
 * Main quote form component following SOLID principles
 */
export function QuoteFormV2({ stay }: QuoteFormProps) {
  const t = useTranslations("Public.QuoteForm");
  const locale = useLocale();

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedQuoteId, setSubmittedQuoteId] = useState<string | null>(null);

  // Extract age ranges from stay data
  const ageRanges = React.useMemo(() => {
    const uniqueAgeRanges = stay.hotel.rooms
      .flatMap((room) => room.roomPricings.map((rp) => rp.ageRange))
      .filter(
        (ar, index, self) => index === self.findIndex((a) => a.id === ar.id)
      )
      .filter((ar) => {
        return stay.hotel.rooms.some((room) =>
          room.roomPricings.some(
            (rp) => rp.ageRange.id === ar.id && rp.price > 0
          )
        );
      })
      .sort((a, b) => a.order - b.order);
    return uniqueAgeRanges;
  }, [stay.hotel.rooms]);

  // Custom hooks for business logic
  const {
    participants,
    selectedRooms,
    setSelectedRooms,
    currentStep,
    totalParticipants,
    availableRooms,
    totalAssignedParticipants,
    setCurrentStep,
    initializeParticipants,
    updateParticipantCount,
    addRoom,
    removeRoomInstance,
    getRemainingParticipants,
  } = useQuoteForm({
    ageRanges,
    rooms: stay.hotel.rooms,
  });

  const { getRoomInstanceOccupancy, updateRoomOccupants } = useRoomOccupancy(
    selectedRooms,
    setSelectedRooms,
    getRemainingParticipants
  );

  const { calculateRoomInstancePrice, totalPrice } =
    usePriceCalculation(selectedRooms);

  // Initialize participants on mount
  useEffect(() => {
    initializeParticipants();
  }, [initializeParticipants]);

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      checkIn: format(new Date(stay.startDate), "yyyy-MM-dd"),
      checkOut: format(new Date(stay.endDate), "yyyy-MM-dd"),
      specialRequests: "",
    },
  });

  const checkIn = watch("checkIn");
  const checkOut = watch("checkOut");

  // Calculate nights for display
  const nights = React.useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

  // API mutation
  const createQuote = trpc.quotes.createPublic.useMutation({
    onSuccess: (data) => {
      toast({
        title: t("successTitle"),
        description: t("successMessage"),
      });
      setSubmittedQuoteId(data?.id || null);
    },
    onError: (error) => {
      toast({
        title: t("errorTitle"),
        description: error.message || t("errorMessage"),
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = async (data: QuoteFormData) => {
    // Validation
    if (selectedRooms.length === 0) {
      toast({
        title: t("errorTitle"),
        description: "Veuillez sélectionner au moins une chambre",
        variant: "destructive",
      });
      return;
    }

    if (totalAssignedParticipants !== totalParticipants) {
      toast({
        title: t("errorTitle"),
        description: "Veuillez assigner tous les participants aux chambres",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare rooms data with occupants
      const rooms = selectedRooms.map(({ roomId, instances }) => ({
        roomId,
        quantity: instances.length,
        occupants: instances.flatMap((instance) =>
          Object.entries(instance.occupants)
            .filter(([_, count]) => count > 0)
            .map(([ageRangeId, count]) => ({
              ageRangeId,
              count,
            }))
        ),
      }));

      // Prepare participants data
      const participantsData = participants
        .filter((p) => p.count > 0)
        .map((p) => ({
          ageRangeId: p.ageRangeId,
          count: p.count,
        }));

      await createQuote.mutateAsync({
        ...data,
        stayId: stay.id,
        rooms,
        participants: participantsData,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen component
  if (submittedQuoteId) {
    return (
      <QuoteSuccessScreen
        quoteId={submittedQuoteId}
        locale={locale}
        onReset={() => {
          setSubmittedQuoteId(null);
          window.location.reload();
        }}
      />
    );
  }

  return (
    <section className="py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30"></div>
      <div className="container mx-auto px-4 max-w-6xl relative">
        <div className="text-center mb-16 space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-900 via-purple-800 to-indigo-900">
            {t("title")}
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Personal Information */}
          <PersonalInfoSection register={register} errors={errors} t={t} />

          {/* Stay Dates */}
          <StayDatesSection
            register={register}
            errors={errors}
            nights={nights}
            t={t}
          />

          {/* Participants Selection */}
          <ParticipantSelector
            participants={participants}
            totalParticipants={totalParticipants}
            currentStep={currentStep}
            onUpdateCount={updateParticipantCount}
            onContinue={() => setCurrentStep("rooms")}
          />

          {/* Room Selection */}
          {totalParticipants > 0 && currentStep === "rooms" && (
            <RoomSelector
              totalParticipants={totalParticipants}
              availableRooms={availableRooms}
              selectedRooms={selectedRooms}
              participants={participants}
              totalAssignedParticipants={totalAssignedParticipants}
              totalPrice={totalPrice}
              onAddRoom={addRoom}
              onRemoveRoomInstance={removeRoomInstance}
              onUpdateOccupants={updateRoomOccupants}
              getRemainingParticipants={getRemainingParticipants}
              getRoomInstanceOccupancy={getRoomInstanceOccupancy}
              calculateRoomInstancePrice={calculateRoomInstancePrice}
              onBack={() => setCurrentStep("participants")}
            />
          )}

          {/* Special Requests */}
          <SpecialRequestsSection register={register} t={t} />

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-14 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white text-lg font-semibold shadow-xl rounded-2xl group"
            disabled={
              isSubmitting ||
              totalParticipants === 0 ||
              selectedRooms.length === 0 ||
              totalAssignedParticipants !== totalParticipants
            }
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                {t("submitting")}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {t("submit")}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </Button>
        </form>
      </div>
    </section>
  );
}

// Sub-components for better organization

const PersonalInfoSection: React.FC<{
  register: any;
  errors: any;
  t: any;
}> = ({ register, errors, t }) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
        <User className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{t("personalInfo")}</h3>
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="firstName" className="text-gray-700 font-medium">
          {t("firstName")} *
        </Label>
        <Input
          id="firstName"
          {...register("firstName")}
          placeholder={t("firstNamePlaceholder")}
          className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl transition-colors"
        />
        {errors.firstName && (
          <p className="text-sm text-red-600 mt-1">
            {errors.firstName.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName" className="text-gray-700 font-medium">
          {t("lastName")} *
        </Label>
        <Input
          id="lastName"
          {...register("lastName")}
          placeholder={t("lastNamePlaceholder")}
          className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl transition-colors"
        />
        {errors.lastName && (
          <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-700 font-medium">
          {t("email")} *
        </Label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder={t("emailPlaceholder")}
            className="h-12 pl-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl transition-colors"
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-gray-700 font-medium">
          {t("phone")} *
        </Label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            id="phone"
            type="tel"
            {...register("phone")}
            placeholder={t("phonePlaceholder")}
            className="h-12 pl-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl transition-colors"
          />
        </div>
        {errors.phone && (
          <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
        )}
      </div>
    </div>
  </div>
);

const StayDatesSection: React.FC<{
  register: any;
  errors: any;
  nights: number;
  t: any;
}> = ({ register, errors, nights, t }) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
        <Calendar className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{t("stayDates")}</h3>
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="checkIn" className="text-gray-700 font-medium">
          {t("checkIn")} *
        </Label>
        <Input
          id="checkIn"
          type="date"
          {...register("checkIn")}
          disabled={true}
          className="h-12 border-2 border-gray-200 rounded-xl bg-gray-50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="checkOut" className="text-gray-700 font-medium">
          {t("checkOut")} *
        </Label>
        <Input
          id="checkOut"
          type="date"
          {...register("checkOut")}
          disabled={true}
          className="h-12 border-2 border-gray-200 rounded-xl bg-gray-50"
        />
      </div>
    </div>

    {nights > 0 && (
      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
        <p className="text-center text-blue-800 font-semibold">
          {nights} {t("nights")}
        </p>
      </div>
    )}
  </div>
);

const SpecialRequestsSection: React.FC<{
  register: any;
  t: any;
}> = ({ register, t }) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
        <FileText className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900">
        {t("specialRequests")}
      </h3>
    </div>

    <textarea
      id="specialRequests"
      {...register("specialRequests")}
      placeholder={t("specialRequestsPlaceholder")}
      rows={4}
      className="w-full p-4 border-2 border-gray-200 focus:border-blue-500 rounded-xl resize-none transition-colors"
    />
  </div>
);

const QuoteSuccessScreen: React.FC<{
  quoteId: string;
  locale: string;
  onReset: () => void;
}> = ({ quoteId, locale, onReset }) => {
  const t = useTranslations("Public.QuoteForm");
  const router = useRouter();

  return (
    <section className="py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50"></div>
      <div className="container mx-auto px-4 max-w-4xl relative">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-12">
          <div className="text-center space-y-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full opacity-20 animate-pulse"></div>
              <div className="relative p-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full inline-flex text-white">
                <Check className="w-12 h-12" />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
                {t("quoteSuccess")}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                {t("quoteSuccessDescription")}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
              <Button
                onClick={() => router.push(`/${locale}/quotes/${quoteId}`)}
                className="bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-lg group"
              >
                <Eye className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                {t("viewQuote")}
              </Button>

              <Button
                onClick={() =>
                  window.open(`/api/quotes/${quoteId}/pdf`, "_blank")
                }
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg group"
              >
                <Download className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                {t("downloadPDF")}
              </Button>
            </div>

            <Button
              variant="link"
              onClick={onReset}
              className="text-gray-500 hover:text-gray-700 mt-6"
            >
              {t("newQuote")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
