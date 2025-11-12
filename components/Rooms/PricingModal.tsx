"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { trpc } from "@/app/_trpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { useRoomPricing } from "@/hooks/useRoomPricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { X, Euro, Plus, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type AgeRangeType = {
  id: string;
  name: string;
  minAge: number | null;
  maxAge: number | null;
  order: number;
};

type SubPeriod = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  order: number;
};

type Stay = {
  id: string;
  name: string;
  subPeriods: SubPeriod[];
};

type CustomAgeRange = {
  id: string;
  minAge: number;
  maxAge: number;
  isCustom: true;
};

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomIds: string[];
  ageRanges: AgeRangeType[];
  hotelId: string;
  onSuccess: () => void;
}

export function PricingModal({
  isOpen,
  onClose,
  roomIds,
  ageRanges,
  hotelId,
  onSuccess,
}: PricingModalProps) {
  const t = useTranslations("Rooms");
  const queryClient = useQueryClient();

  // États locaux en premier
  const [customAgeRanges, setCustomAgeRanges] = useState<CustomAgeRange[]>([]);
  const [showAddAgeRange, setShowAddAgeRange] = useState(false);
  const [newMinAge, setNewMinAge] = useState("");
  const [newMaxAge, setNewMaxAge] = useState("");
  const [selectedSubPeriodId, setSelectedSubPeriodId] = useState<string | null>(
    null
  );
  const [stays, setStays] = useState<Stay[]>([]);
  const [loadingStays, setLoadingStays] = useState(false);

  // État local pour les modifications de l'utilisateur
  const [localPrices, setLocalPrices] = useState<Record<string, number>>({});

  // Charger les prix existants avec le hook
  const { data: pricingData, isLoading: loadingPrices } = useRoomPricing({
    roomIds,
    enabled: isOpen,
  });
  console.log("pricingData", pricingData, ageRanges);
  // Prix existants pour la sous-période sélectionnée
  const existingPrices = useMemo(() => {
    if (!pricingData) return {};
    const key = selectedSubPeriodId || "global";
    return pricingData[key] || {};
  }, [pricingData, selectedSubPeriodId]);

  // Merger les prix existants avec les modifications locales
  const prices = useMemo(
    () => ({
      ...existingPrices,
      ...localPrices,
    }),
    [existingPrices, localPrices]
  );

  // Réinitialiser les prix locaux quand on change de sous-période
  useEffect(() => {
    setLocalPrices({});
  }, [selectedSubPeriodId]);

  const updatePricing = trpc.rooms.updateMultiplePricing.useMutation({
    onSuccess: () => {
      toast({
        title: t("pricingUpdateSuccess"),
        description: t("pricingUpdateSuccessDesc"),
      });
    },
    onError: () => {
      toast({
        title: t("pricingUpdateError"),
        description: t("pricingUpdateErrorDesc"),
        variant: "destructive",
      });
    },
  });

  const createAgeRange = trpc.ageRanges.create.useMutation();

  // Charger les séjours actifs de l'hôtel avec leurs sous-périodes
  useEffect(() => {
    if (isOpen && hotelId) {
      fetchStaysWithSubPeriods();
    }
  }, [isOpen, hotelId]);

  const fetchStaysWithSubPeriods = async () => {
    setLoadingStays(true);
    try {
      // Récupérer les séjours actifs de l'hôtel
      const staysResponse = await fetch(`/api/hotels/${hotelId}/stays`, {
        credentials: 'include' // Inclure les cookies si nécessaire
      });
      if (!staysResponse.ok) {
        // Fallback: essayer avec tRPC si l'endpoint n'existe pas encore
        return;
      }
      const staysData = await staysResponse.json();

      // Pour chaque séjour, récupérer ses sous-périodes
      const staysWithSubPeriods = await Promise.all(
        staysData.data.map(async (stay: { id: string; name: string }) => {
          const subPeriodsResponse = await fetch(
            `/api/stays/${stay.id}/sub-periods`,
            { credentials: 'include' } // Inclure les cookies si nécessaire
          );
          if (subPeriodsResponse.ok) {
            const subPeriodsData = await subPeriodsResponse.json();
            return {
              ...stay,
              subPeriods: subPeriodsData.data || [],
            };
          }
          return { ...stay, subPeriods: [] };
        })
      );

      setStays(staysWithSubPeriods);
    } catch (error) {
      console.error("Error loading stays:", error);
    } finally {
      setLoadingStays(false);
    }
  };

  const handleAddAgeRange = () => {
    if (newMinAge && newMaxAge) {
      const newRange: CustomAgeRange = {
        id: `custom-${Date.now()}`,
        minAge: parseInt(newMinAge),
        maxAge: parseInt(newMaxAge),
        isCustom: true,
      };
      setCustomAgeRanges([...customAgeRanges, newRange]);
      setNewMinAge("");
      setNewMaxAge("");
      setShowAddAgeRange(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Invalider le cache React Query après les mises à jour
      const invalidateCache = () => {
        queryClient.invalidateQueries({ queryKey: ["room-pricing", roomIds] });
      };

      // Pour les tranches d'âge existantes avec l'API REST
      const existingRangeUpdates = Object.entries(prices)
        .filter(([id]) => !id.startsWith("custom-"))
        .flatMap(([ageRangeId, price]) =>
          // Pour chaque chambre, mettre à jour le prix
          roomIds.map(async (roomId) => {
            const response = await fetch(`/api/rooms/${roomId}/pricing`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include", // Inclure les cookies pour l'authentification
              body: JSON.stringify({
                ageRangeId,
                subPeriodId: selectedSubPeriodId,
                price,
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(
                error.error || "Erreur lors de la mise à jour des prix"
              );
            }
            return response.json();
          })
        );

      // Pour les tranches personnalisées, créer d'abord puis définir les prix
      const customRangeUpdates = customAgeRanges
        .filter((range) => prices[range.id])
        .flatMap(async (range) => {
          // Créer la tranche d'âge
          const newAgeRange = await createAgeRange.mutateAsync({
            name: `${range.minAge}-${range.maxAge} ans`,
            minAge: range.minAge,
            maxAge: range.maxAge,
            order: 999,
          });

          // Puis définir les prix pour chaque chambre via l'API REST
          const updates = roomIds.map(async (roomId) => {
            const response = await fetch(`/api/rooms/${roomId}/pricing`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include", // Inclure les cookies pour l'authentification
              body: JSON.stringify({
                ageRangeId: newAgeRange.id,
                subPeriodId: selectedSubPeriodId,
                price: prices[range.id],
              }),
            });

            if (!response.ok) {
              throw new Error("Erreur lors de la mise à jour des prix");
            }
            return response.json();
          });

          return Promise.all(updates);
        });

      await Promise.all([...existingRangeUpdates, ...customRangeUpdates]);

      // Invalider le cache après toutes les mises à jour
      invalidateCache();

      toast({
        title: t("pricingUpdateSuccess"),
        description: selectedSubPeriodId
          ? "Les prix ont été définis pour la sous-période sélectionnée"
          : "Les prix ont été définis pour le séjour complet",
      });

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: t("pricingUpdateError"),
        description:
          error instanceof Error ? error.message : t("pricingUpdateErrorDesc"),
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  // Récupérer toutes les sous-périodes de tous les séjours
  const allSubPeriods = stays.flatMap((stay) =>
    stay.subPeriods.map((sp) => ({
      ...sp,
      stayName: stay.name,
    }))
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t("setPricesTitle")}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {t("setPricesFor")} {roomIds.length} {t("rooms")}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Sélecteur de sous-période si disponible */}
          {allSubPeriods.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <Label className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Période de tarification
              </Label>

              <div className="space-y-2">
                <label className="flex items-center gap-3 p-2 rounded hover:bg-white cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="subPeriod"
                    checked={selectedSubPeriodId === null}
                    onChange={() => setSelectedSubPeriodId(null)}
                    className="text-blue-600"
                  />
                  <div>
                    <span className="font-medium">Séjour complet</span>
                    <p className="text-xs text-gray-500">
                      Prix unique pour toute la durée du séjour
                    </p>
                  </div>
                </label>

                {allSubPeriods.map((subPeriod) => (
                  <label
                    key={subPeriod.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-white cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="subPeriod"
                      value={subPeriod.id}
                      checked={selectedSubPeriodId === subPeriod.id}
                      onChange={() => setSelectedSubPeriodId(subPeriod.id)}
                      className="text-blue-600"
                    />
                    <div className="flex-1">
                      <span className="font-medium">{subPeriod.name}</span>
                      <p className="text-xs text-gray-500">
                        {format(new Date(subPeriod.startDate), "dd MMM", {
                          locale: fr,
                        })}{" "}
                        -{" "}
                        {format(new Date(subPeriod.endDate), "dd MMM yyyy", {
                          locale: fr,
                        })}
                        {" · "}
                        {subPeriod.stayName}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {selectedSubPeriodId && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <p className="text-xs text-blue-800">
                      Les prix seront définis uniquement pour cette
                      sous-période. Répétez l'opération pour définir les prix
                      des autres sous-périodes.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4 mb-6">
            <p className="text-sm text-gray-600">{t("pricingHelp")}</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Important :</strong> Les prix saisis correspondent au
                prix total par personne
                {selectedSubPeriodId
                  ? " pour cette sous-période"
                  : " pour le séjour complet"}
                , pas au prix par nuit.
              </p>
            </div>

            {/* Tranches d'âge existantes */}
            {ageRanges.map((ageRange) => (
              <div key={ageRange.id} className="relative">
                <Label
                  htmlFor={`price-${ageRange.id}`}
                  className="text-sm font-medium text-gray-700 mb-1 block"
                >
                  {ageRange.name}
                  {ageRange.minAge !== null && ageRange.maxAge !== null && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({ageRange.minAge}-{ageRange.maxAge} ans)
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id={`price-${ageRange.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={prices[ageRange.id] || ""}
                    onChange={(e) =>
                      setLocalPrices((prev) => ({
                        ...prev,
                        [ageRange.id]: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0.00"
                    className="pl-10"
                  />
                </div>
              </div>
            ))}

            {/* Tranches d'âge personnalisées */}
            {customAgeRanges.map((range) => (
              <div
                key={range.id}
                className="relative bg-blue-50 p-3 rounded-lg"
              >
                <Label
                  htmlFor={`price-${range.id}`}
                  className="text-sm font-medium text-gray-700 mb-1 block"
                >
                  {range.minAge}-{range.maxAge} ans
                  <span className="text-xs text-blue-600 ml-2">
                    (Nouvelle tranche)
                  </span>
                </Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id={`price-${range.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={prices[range.id] || ""}
                    onChange={(e) =>
                      setLocalPrices((prev) => ({
                        ...prev,
                        [range.id]: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0.00"
                    className="pl-10"
                  />
                </div>
              </div>
            ))}

            {/* Formulaire d'ajout de tranche d'âge */}
            {showAddAgeRange ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="minAge" className="text-xs text-gray-600">
                      Âge min
                    </Label>
                    <Input
                      id="minAge"
                      type="number"
                      min="0"
                      value={newMinAge}
                      onChange={(e) => setNewMinAge(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <span className="text-gray-500">à</span>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="maxAge" className="text-xs text-gray-600">
                      Âge max
                    </Label>
                    <Input
                      id="maxAge"
                      type="number"
                      min="0"
                      value={newMaxAge}
                      onChange={(e) => setNewMaxAge(e.target.value)}
                      placeholder="99"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddAgeRange}
                    disabled={!newMinAge || !newMaxAge}
                    className="flex-1"
                  >
                    Ajouter
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowAddAgeRange(false);
                      setNewMinAge("");
                      setNewMaxAge("");
                    }}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddAgeRange(true)}
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une tranche d'âge
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={
                Object.keys(prices).length === 0 || updatePricing.isPending
              }
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {updatePricing.isPending ? t("saving") : t("applyPrices")}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={updatePricing.isPending}
              className="flex-1 border-2"
            >
              {t("cancel")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
