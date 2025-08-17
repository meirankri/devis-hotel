"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, Plus, Minus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ParticipantData } from '@/types/multi-step-form';

interface ParticipantsStepProps {
  participants: ParticipantData[];
  totalParticipants: number;
  onUpdateCount: (ageRangeId: string, count: number) => void;
  canContinue: boolean;
  onContinue: () => void;
}

export const ParticipantsStep: React.FC<ParticipantsStepProps> = ({
  participants,
  totalParticipants,
  onUpdateCount,
  canContinue,
  onContinue
}) => {
  const t = useTranslations('Public.QuoteForm');

  const handleIncrement = (ageRangeId: string, currentCount: number) => {
    onUpdateCount(ageRangeId, currentCount + 1);
  };

  const handleDecrement = (ageRangeId: string, currentCount: number) => {
    onUpdateCount(ageRangeId, Math.max(0, currentCount - 1));
  };

  const formatAgeRange = (ageRange: ParticipantData['ageRange']) => {
    if (ageRange.minAge !== null && ageRange.maxAge !== null) {
      return `${ageRange.minAge}-${ageRange.maxAge} ${t('years')}`;
    }
    if (ageRange.minAge !== null) {
      return `${ageRange.minAge}+ ${t('years')}`;
    }
    if (ageRange.maxAge !== null) {
      return `0-${ageRange.maxAge} ${t('years')}`;
    }
    return '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
          <Users className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{t('participants')}</h3>
          <p className="text-gray-600 mt-1">
            Sélectionnez le nombre de participants par tranche d'âge
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {participants.map((participant) => (
          <div
            key={participant.ageRangeId}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {participant.ageRange.name}
              </p>
              <p className="text-sm text-gray-600">
                {formatAgeRange(participant.ageRange)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                onClick={() => handleDecrement(participant.ageRangeId, participant.count)}
                disabled={participant.count === 0}
              >
                <Minus className="h-4 w-4" />
              </Button>

              <div className="w-16 text-center">
                <span className="text-2xl font-bold text-gray-900">
                  {participant.count}
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-2 hover:bg-green-50 hover:border-green-300 hover:text-green-600"
                onClick={() => handleIncrement(participant.ageRangeId, participant.count)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {totalParticipants > 0 && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200/50">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-gray-900">{t('total')}</p>
            <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              {totalParticipants} {totalParticipants === 1 ? 'personne' : t('persons')}
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="min-w-[200px] h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuer vers les chambres
        </Button>
      </div>
    </div>
  );
};