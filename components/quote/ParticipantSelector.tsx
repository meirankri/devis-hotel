import React from "react";
import { Button } from "@/components/ui/button";
import { Users, Plus, Minus, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ParticipantSelection } from "@/types/quote";

interface ParticipantSelectorProps {
  participants: ParticipantSelection[];
  totalParticipants: number;
  currentStep: "participants" | "rooms";
  onUpdateCount: (ageRangeId: string, delta: number) => void;
  onContinue: () => void;
}

export const ParticipantSelector: React.FC<ParticipantSelectorProps> = ({
  participants,
  totalParticipants,
  currentStep,
  onUpdateCount,
  onContinue,
}) => {
  const t = useTranslations("Public.QuoteForm");

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
          <Users className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">
          {t("participants")}
        </h3>
      </div>

      <div className="grid gap-4">
        {participants.map((participant) => (
          <div
            key={participant.ageRangeId}
            className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200"
          >
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {participant.ageRange.name}
              </p>
              {participant.ageRange.minAge !== null &&
                participant.ageRange.maxAge !== null && (
                  <p className="text-sm text-gray-600">
                    {participant.ageRange.minAge}-{participant.ageRange.maxAge}{" "}
                    {t("years")}
                  </p>
                )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onUpdateCount(participant.ageRangeId, -1)}
                disabled={participant.count === 0 || currentStep === "rooms"}
                className="h-10 w-10 rounded-lg"
              >
                <Minus className="h-4 w-4" />
              </Button>

              <span className="w-12 text-center font-bold text-lg">
                {participant.count}
              </span>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onUpdateCount(participant.ageRangeId, 1)}
                disabled={currentStep === "rooms"}
                className="h-10 w-10 rounded-lg"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {totalParticipants > 0 && (
        <div className="mt-6  p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-center text-blue-900 font-semibold text-lg">
            {t("total")}: {totalParticipants} {t("persons")}
          </p>
        </div>
      )}

      {totalParticipants > 0 && currentStep === "participants" && (
        <div className="mt-6">
          <Button
            type="button"
            onClick={onContinue}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {t("continueToRooms")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
