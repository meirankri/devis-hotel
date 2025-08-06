"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  Users,
  Plus,
  Minus,
  Mail,
  Phone,
  User,
  Home,
  FileText,
  Check,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { calculatePriceFromRoomSelections } from "@/utils/priceCalculator";

interface QuoteFormProps {
  stay: any;
}

// Types pour la gestion des chambres
interface RoomSelection {
  roomId: string;
  room: any;
  instances: RoomInstance[];
}

interface RoomInstance {
  id: string;
  occupants: { [ageRangeId: string]: number };
}

// Schéma de validation
const quoteFormSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(1, "Le téléphone est requis"),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide"),
  specialRequests: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteFormSchema>;

export function QuoteFormV2({ stay }: QuoteFormProps) {
  const t = useTranslations("Public.QuoteForm");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? fr : enUS;
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedQuoteId, setSubmittedQuoteId] = useState<string | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<RoomSelection[]>([]);
  const [showRoomSelector, setShowRoomSelector] = useState(false);

  // Extraire les tranches d'âge disponibles
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

  // Calculer le nombre de nuits
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

  // Ajouter une chambre
  const addRoom = (room: any) => {
    const existingRoom = selectedRooms.find((r) => r.roomId === room.id);

    if (existingRoom) {
      // Ajouter une nouvelle instance de cette chambre
      setSelectedRooms((prev) =>
        prev.map((r) =>
          r.roomId === room.id
            ? {
                ...r,
                instances: [
                  ...r.instances,
                  {
                    id: `${room.id}-${Date.now()}`,
                    occupants: {},
                  },
                ],
              }
            : r
        )
      );
    } else {
      // Ajouter une nouvelle chambre
      setSelectedRooms((prev) => [
        ...prev,
        {
          roomId: room.id,
          room,
          instances: [
            {
              id: `${room.id}-${Date.now()}`,
              occupants: {},
            },
          ],
        },
      ]);
    }
  };

  // Supprimer une instance de chambre
  const removeRoomInstance = (roomId: string, instanceId: string) => {
    setSelectedRooms((prev) => {
      const updated = prev
        .map((r) => {
          if (r.roomId === roomId) {
            const newInstances = r.instances.filter((i) => i.id !== instanceId);
            return newInstances.length > 0
              ? { ...r, instances: newInstances }
              : null;
          }
          return r;
        })
        .filter(Boolean) as RoomSelection[];

      return updated;
    });
  };

  // Mettre à jour les occupants d'une instance
  const updateOccupants = (
    roomId: string,
    instanceId: string,
    ageRangeId: string,
    count: number
  ) => {
    setSelectedRooms((prev) =>
      prev.map((r) => {
        if (r.roomId === roomId) {
          return {
            ...r,
            instances: r.instances.map((i) =>
              i.id === instanceId
                ? { ...i, occupants: { ...i.occupants, [ageRangeId]: count } }
                : i
            ),
          };
        }
        return r;
      })
    );
  };

  // Calculer le nombre total d'occupants pour une instance
  const getTotalOccupants = (instance: RoomInstance): number => {
    return Object.values(instance.occupants).reduce(
      (sum, count) => sum + count,
      0
    );
  };

  // Calculer le prix total
  const calculateTotalPrice = (): number => {
    return calculatePriceFromRoomSelections(selectedRooms);
  };

  const totalPrice = calculateTotalPrice();

  // Compter le total de participants
  const totalParticipants = useMemo(() => {
    return selectedRooms.reduce(
      (sum, { instances }) =>
        sum +
        instances.reduce(
          (instSum, inst) => instSum + getTotalOccupants(inst),
          0
        ),
      0
    );
  }, [selectedRooms]);

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

  const onSubmit = async (data: QuoteFormData) => {
    if (selectedRooms.length === 0) {
      toast({
        title: t("errorTitle"),
        description: "Veuillez sélectionner au moins une chambre",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Préparer les données pour l'API
      const rooms = selectedRooms.flatMap(({ roomId, instances }) =>
        instances.map(() => ({ roomId, quantity: 1 }))
      );

      // Calculer les participants totaux par tranche d'âge
      const participantsByAge: { [ageRangeId: string]: number } = {};
      selectedRooms.forEach(({ instances }) => {
        instances.forEach((instance) => {
          Object.entries(instance.occupants).forEach(([ageRangeId, count]) => {
            participantsByAge[ageRangeId] =
              (participantsByAge[ageRangeId] || 0) + count;
          });
        });
      });

      const participants = Object.entries(participantsByAge)
        .filter(([_, count]) => count > 0)
        .map(([ageRangeId, count]) => ({ ageRangeId, count }));

      await createQuote.mutateAsync({
        ...data,
        stayId: stay.id,
        rooms,
        participants,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si un devis a été soumis avec succès
  if (submittedQuoteId) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center space-y-6">
              <div className="text-green-600 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>

              <h2 className="text-3xl font-bold text-gray-900">
                {t("quoteSuccess")}
              </h2>

              <p className="text-lg text-gray-600">
                {t("quoteSuccessDescription")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/${locale}/quotes/${submittedQuoteId}`)
                  }
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {t("viewQuote")}
                </Button>

                <Button
                  onClick={() =>
                    window.open(`/api/quotes/${submittedQuoteId}/pdf`, "_blank")
                  }
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {t("downloadPDF")}
                </Button>
              </div>

              <Button
                variant="link"
                onClick={() => {
                  setSubmittedQuoteId(null);
                  window.location.reload();
                }}
                className="mt-4"
              >
                {t("newQuote")}
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-4xl">
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
                    disabled={true}
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
                    disabled={true}
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

              {nights > 0 && (
                <p className="text-sm text-gray-600 text-center">
                  {nights} {t("nights")}
                </p>
              )}
            </div>

            {/* Sélection et configuration des chambres */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  {t("roomSelection")}
                </h3>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRoomSelector(!showRoomSelector)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t("addRoom")}
                </Button>
              </div>

              {/* Sélecteur de chambres */}
              {showRoomSelector && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <p className="text-sm text-gray-600 mb-3">
                    {t("selectRoomToAdd")}
                  </p>
                  {stay.hotel.rooms.map((room: any) => (
                    <Button
                      key={room.id}
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => {
                        addRoom(room);
                        setShowRoomSelector(false);
                      }}
                    >
                      <span>{room.name}</span>
                      <span className="text-sm text-gray-600">
                        {t("capacity")}: {room.capacity}
                      </span>
                    </Button>
                  ))}
                </div>
              )}

              {/* Chambres sélectionnées */}
              {selectedRooms.length > 0 ? (
                <div className="space-y-4">
                  {selectedRooms.map(({ roomId, room, instances }) => (
                    <div
                      key={roomId}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <h4 className="font-semibold text-gray-900">
                        {room.name}
                      </h4>

                      {instances.map((instance, index) => {
                        const totalOccupants = getTotalOccupants(instance);
                        const isOverCapacity = totalOccupants > room.capacity;

                        return (
                          <div
                            key={instance.id}
                            className={`p-3 bg-gray-50 rounded-lg space-y-3 ${
                              isOverCapacity ? "border-2 border-red-500" : ""
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">
                                {room.name} #{index + 1}
                              </span>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-sm ${
                                    isOverCapacity
                                      ? "text-red-600 font-bold"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {totalOccupants}/{room.capacity}{" "}
                                  {t("persons")}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeRoomInstance(roomId, instance.id)
                                  }
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {isOverCapacity && (
                              <p className="text-sm text-red-600">
                                ⚠️ {t("overCapacityWarning")}
                              </p>
                            )}

                            <div className="space-y-2">
                              {ageRanges.map((ageRange: any) => {
                                const count =
                                  instance.occupants[ageRange.id] || 0;
                                const pricing = room.roomPricings.find(
                                  (rp: any) => rp.ageRangeId === ageRange.id
                                );

                                return (
                                  <div
                                    key={ageRange.id}
                                    className="flex items-center justify-between"
                                  >
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">
                                        {ageRange.name}
                                      </p>
                                      {pricing && (
                                        <p className="text-xs text-gray-600">
                                          {pricing.price}€ {t("perStay")}
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() =>
                                          updateOccupants(
                                            roomId,
                                            instance.id,
                                            ageRange.id,
                                            Math.max(0, count - 1)
                                          )
                                        }
                                        disabled={count === 0}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>

                                      <span className="w-8 text-center">
                                        {count}
                                      </span>

                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() =>
                                          updateOccupants(
                                            roomId,
                                            instance.id,
                                            ageRange.id,
                                            count + 1
                                          )
                                        }
                                        disabled={
                                          totalOccupants >= room.capacity
                                        }
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Prix pour cette instance */}
                            {getTotalOccupants(instance) > 0 && (
                              <div className="pt-2 border-t text-sm text-right">
                                <span className="text-gray-600">
                                  {t("subtotal")}:{" "}
                                </span>
                                <span className="font-semibold">
                                  {Object.entries(instance.occupants)
                                    .reduce((sum, [ageRangeId, count]) => {
                                      const pricing = room.roomPricings.find(
                                        (rp: any) =>
                                          rp.ageRangeId === ageRangeId
                                      );
                                      return (
                                        sum +
                                        (pricing ? pricing.price * count : 0)
                                      );
                                    }, 0)
                                    .toFixed(2)}
                                  €
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addRoom(room)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {t("addAnotherRoom", { roomName: room.name })}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Home className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>{t("noRoomsSelected")}</p>
                </div>
              )}

              {/* Résumé */}
              {selectedRooms.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">
                        {selectedRooms.reduce(
                          (sum, r) => sum + r.instances.length,
                          0
                        )}{" "}
                        {t("rooms")}, {totalParticipants} {t("persons")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{t("totalPrice")}</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {totalPrice.toFixed(2)}€
                      </p>
                      <p className="text-xs text-gray-500">
                        {t("forEntireStay")}
                      </p>
                    </div>
                  </div>
                </div>
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
              disabled={
                isSubmitting ||
                selectedRooms.length === 0 ||
                totalParticipants === 0
              }
            >
              {isSubmitting ? t("submitting") : t("submit")}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
