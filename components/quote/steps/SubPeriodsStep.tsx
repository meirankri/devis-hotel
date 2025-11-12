'use client';

import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import type { StaySubPeriod } from '@/types/quote';
import type { SelectedSubPeriod } from '@/types/multi-step-form';

interface SubPeriodsStepProps {
  subPeriods: StaySubPeriod[];
  selectedSubPeriods: SelectedSubPeriod[];
  allowPartialBooking: boolean;
  onUpdateSelection: (subPeriodId: string, selected: boolean) => void;
  canContinue: boolean;
  onContinue: () => void;
}

export function SubPeriodsStep({
  subPeriods,
  selectedSubPeriods,
  allowPartialBooking,
  onUpdateSelection,
  canContinue,
  onContinue
}: SubPeriodsStepProps) {
  // Si pas de sous-périodes ou réservation partielle non autorisée, sélectionner tout automatiquement
  useEffect(() => {
    if (!subPeriods || subPeriods.length === 0) {
      // Pas de sous-périodes, passer à l'étape suivante
      onContinue();
    } else if (!allowPartialBooking && selectedSubPeriods.length === 0) {
      // Sélectionner automatiquement toutes les sous-périodes
      subPeriods.forEach(sp => onUpdateSelection(sp.id, true));
      // Passer automatiquement à l'étape suivante
      setTimeout(onContinue, 100);
    }
  }, [subPeriods, allowPartialBooking, selectedSubPeriods.length]);

  // Si pas de sous-périodes, ne rien afficher
  if (!subPeriods || subPeriods.length === 0) {
    return null;
  }

  // Si réservation partielle non autorisée et tout est sélectionné, afficher un message
  if (!allowPartialBooking && selectedSubPeriods.length === subPeriods.length) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Séjour complet</h3>
          <p className="mt-2 text-sm text-gray-600">
            Ce séjour doit être réservé dans son intégralité
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Redirection automatique vers l'étape suivante...
          </p>
        </div>
      </div>
    );
  }

  const isSelected = (subPeriodId: string) =>
    selectedSubPeriods.some(sp => sp.id === subPeriodId);

  const handleToggle = (subPeriod: StaySubPeriod) => {
    onUpdateSelection(subPeriod.id, !isSelected(subPeriod.id));
  };

  const getDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} ${days > 1 ? 'nuits' : 'nuit'}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Sélectionnez vos périodes de séjour
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Choisissez une ou plusieurs périodes pour votre réservation
        </p>
      </div>

      <div className="space-y-3">
        {subPeriods.map((subPeriod) => {
          const selected = isSelected(subPeriod.id);

          return (
            <label
              key={subPeriod.id}
              className={`
                relative flex cursor-pointer items-center justify-between rounded-xl border-2 p-4
                transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/50
                ${selected
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 bg-white'
                }
              `}
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => handleToggle(subPeriod)}
                  className="sr-only"
                />
                <div
                  className={`
                    mr-4 flex h-5 w-5 items-center justify-center rounded border-2
                    transition-colors
                    ${selected
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300 bg-white'
                    }
                  `}
                >
                  {selected && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-semibold text-gray-900">
                      {subPeriod.name}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                    <span>
                      {format(new Date(subPeriod.startDate), 'd MMMM', { locale: fr })}
                    </span>
                    <span>→</span>
                    <span>
                      {format(new Date(subPeriod.endDate), 'd MMMM yyyy', { locale: fr })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {getDuration(subPeriod.startDate, subPeriod.endDate)}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {selectedSubPeriods.length === 0 && (
        <div className="rounded-lg bg-amber-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-amber-400" />
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                Veuillez sélectionner au moins une période pour continuer
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className={`
            rounded-lg px-6 py-3 font-medium transition-all duration-200
            ${canContinue
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          Continuer vers la sélection des participants
        </button>
      </div>
    </div>
  );
}