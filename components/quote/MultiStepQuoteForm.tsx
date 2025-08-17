"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { format } from "date-fns";
import { trpc } from "@/app/_trpc/client";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ArrowRight } from "lucide-react";

// Components
import { ParticipantsStep } from "./steps/ParticipantsStep";
import { RoomsStep } from "./steps/RoomsStep";
import { AssignmentStep } from "./steps/AssignmentStep";
import {
  PersonalInfoSection,
  StayDatesSection,
  SpecialRequestsSection,
} from "../public/QuoteFormV2";

// Hooks
import { useMultiStepQuoteForm } from "@/hooks/useMultiStepQuoteForm";

// Types
import type { Stay, QuoteFormData } from "@/types/quote";
import type { FormStep } from "@/types/multi-step-form";

interface MultiStepQuoteFormProps {
  stay: Stay;
}

// Zod schema
const quoteFormSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(1, "Le téléphone est requis"),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide"),
  specialRequests: z.string().optional(),
});

// Step indicator component
const StepIndicator: React.FC<{
  currentStep: FormStep;
  canGoToStep: (step: FormStep) => boolean;
  onStepClick: (step: FormStep) => void;
}> = ({ currentStep, canGoToStep, onStepClick }) => {
  const steps: { id: FormStep; label: string; number: number }[] = [
    { id: "participants", label: "Participants", number: 1 },
    { id: "rooms", label: "Chambres", number: 2 },
    { id: "assignment", label: "Répartition", number: 3 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center gap-4">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = index < currentStepIndex;
          const canNavigate = canGoToStep(step.id);

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => canNavigate && onStepClick(step.id)}
                disabled={!canNavigate}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105"
                    : isCompleted
                    ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                    isActive
                      ? "bg-white/20"
                      : isCompleted
                      ? "bg-green-600 text-white"
                      : "bg-gray-300"
                  }`}
                >
                  {isCompleted ? "✓" : step.number}
                </div>
                <span className="font-medium hidden sm:inline">
                  {step.label}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 ${
                    index < currentStepIndex ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export function MultiStepQuoteForm({ stay }: MultiStepQuoteFormProps) {
  const t = useTranslations("Public.QuoteForm");
  const locale = useLocale();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedQuoteId, setSubmittedQuoteId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const successScreenRef = useRef<HTMLDivElement>(null);

  // Extract age ranges
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

  // Multi-step form hook
  const {
    currentStep,
    participants,
    selectedRooms,
    roomAssignments,
    totalParticipants,
    totalCapacity,
    totalAssignedParticipants,
    nights,
    totalPrice,
    updateParticipantCount,
    updateRoomQuantity,
    updateRoomAssignment,
    getRemainingParticipants,
    validateStep,
    canGoNext,
    goToStep,
    goNext,
    goPrevious,
    calculatePriceBreakdown,
  } = useMultiStepQuoteForm({
    ageRanges,
    rooms: stay.hotel.rooms,
    checkIn,
    checkOut,
  });

  // API mutation
  const createQuote = trpc.quotes.createPublic.useMutation({
    onSuccess: (data) => {
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

  // Form submission
  const onSubmit = async (data: QuoteFormData) => {
    const validation = validateStep("assignment");
    if (!validation.isValid) {
      toast({
        title: t("errorTitle"),
        description: validation.errors[0],
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare rooms data with occupants
      const rooms = selectedRooms.map(({ roomId, room, quantity }) => {
        const roomAssignmentsForRoom = roomAssignments.filter(
          (ra) => ra.roomId === roomId
        );

        return {
          roomId,
          quantity,
          occupants: roomAssignmentsForRoom.flatMap((ra) =>
            Object.entries(ra.participants)
              .filter(([_, count]) => count > 0)
              .map(([ageRangeId, count]) => ({
                ageRangeId,
                count,
              }))
          ),
        };
      });

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

  // Check if can navigate to a step
  const canGoToStep = (step: FormStep): boolean => {
    if (step === "participants") return true;
    if (step === "rooms") return validateStep("participants").isValid;
    if (step === "assignment")
      return (
        validateStep("participants").isValid && validateStep("rooms").isValid
      );
    return false;
  };

  // Scroll to success screen when quote is submitted
  useEffect(() => {
    if (submittedQuoteId && successScreenRef.current) {
      successScreenRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [submittedQuoteId]);

  if (submittedQuoteId) {
    return (
      <div ref={successScreenRef}>
        <QuoteSuccessScreen
          quoteId={submittedQuoteId}
          locale={locale}
          onReset={() => {
            setSubmittedQuoteId(null);
            window.location.reload();
          }}
        />
      </div>
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

          {/* Special Requests */}
          <SpecialRequestsSection register={register} t={t} />

          {/* Button to open modal */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Sélectionnez vos chambres
              </h3>
              <p className="text-gray-600">
                Choisissez le nombre de participants et répartissez-les dans les
                chambres disponibles
              </p>
              <Button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="h-14 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-semibold shadow-xl rounded-2xl group"
              >
                <span>Sélectionner les chambres</span>
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>

              {/* Show summary if rooms are selected */}
              {selectedRooms.length > 0 && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-green-800 font-medium">
                    ✓ {selectedRooms.reduce((sum, r) => sum + r.quantity, 0)}{" "}
                    chambre(s) sélectionnée(s) - {totalPrice.toFixed(2)}€
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="text-green-600 underline text-sm mt-1"
                  >
                    Modifier la sélection
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button - Only show when rooms are selected and assigned */}
          {selectedRooms.length > 0 &&
            totalAssignedParticipants === totalParticipants &&
            totalParticipants > 0 && (
              <Button
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg font-semibold shadow-xl rounded-2xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    {t("submitting")}
                  </div>
                ) : (
                  <span>{t("submit")}</span>
                )}
              </Button>
            )}
        </form>

        {/* Modal for room selection */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          size="xl"
          title="Sélection des chambres"
          closeOnOverlayClick={false}
        >
          <div className="p-6">
            {/* Step Indicator */}
            <StepIndicator
              currentStep={currentStep}
              canGoToStep={canGoToStep}
              onStepClick={goToStep}
            />

            {/* Multi-step form container with animation */}
            <div className="mt-6">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  {currentStep === "participants" && (
                    <ParticipantsStep
                      participants={participants}
                      totalParticipants={totalParticipants}
                      onUpdateCount={updateParticipantCount}
                      canContinue={canGoNext}
                      onContinue={goNext}
                    />
                  )}

                  {currentStep === "rooms" && (
                    <RoomsStep
                      rooms={stay.hotel.rooms}
                      selectedRooms={selectedRooms}
                      totalParticipants={totalParticipants}
                      totalCapacity={totalCapacity}
                      onUpdateRoomQuantity={updateRoomQuantity}
                      canContinue={canGoNext}
                      onContinue={goNext}
                      onBack={goPrevious}
                    />
                  )}

                  {currentStep === "assignment" && (
                    <AssignmentStep
                      roomAssignments={roomAssignments}
                      participants={participants}
                      rooms={stay.hotel.rooms}
                      totalParticipants={totalParticipants}
                      totalAssignedParticipants={totalAssignedParticipants}
                      totalPrice={totalPrice}
                      onUpdateAssignment={updateRoomAssignment}
                      getRemainingParticipants={getRemainingParticipants}
                      canContinue={canGoNext}
                      onBack={goPrevious}
                      isSubmitting={false}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Close modal button when assignment is complete */}
            {currentStep === "assignment" && canGoNext && (
              <div className="mt-6 text-center">
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg"
                >
                  Valider la sélection
                </Button>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </section>
  );
}

// Success screen component
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
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
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
              <button
                onClick={() => router.push(`/${locale}/quotes/${quoteId}`)}
                className="px-6 py-3 bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-lg rounded-xl font-medium transition-all"
              >
                {t("viewQuote")}
              </button>

              <button
                onClick={() =>
                  window.open(`/api/quotes/${quoteId}/pdf`, "_blank")
                }
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg rounded-xl font-medium transition-all"
              >
                {t("downloadPDF")}
              </button>
            </div>

            <button
              onClick={onReset}
              className="text-gray-500 hover:text-gray-700 mt-6 font-medium"
            >
              {t("newQuote")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
