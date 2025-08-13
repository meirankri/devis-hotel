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
  Bed,
  Crown,
  ArrowRight,
  Download,
  Eye,
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

interface RoomSelection {
  roomId: string;
  room: any;
  instances: RoomInstance[];
}

interface RoomInstance {
  id: string;
  occupants: { [ageRangeId: string]: number };
}

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

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

  const addRoom = (room: any) => {
    const existingRoom = selectedRooms.find((r) => r.roomId === room.id);

    if (existingRoom) {
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

  const getTotalOccupants = (instance: RoomInstance): number => {
    return Object.values(instance.occupants).reduce(
      (sum, count) => sum + count,
      0
    );
  };

  const calculateTotalPrice = (): number => {
    return calculatePriceFromRoomSelections(selectedRooms);
  };

  const totalPrice = calculateTotalPrice();

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
      const rooms = selectedRooms.flatMap(({ roomId, instances }) =>
        instances.map(() => ({ roomId, quantity: 1 }))
      );

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

  if (submittedQuoteId) {
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
                  onClick={() =>
                    router.push(`/${locale}/quotes/${submittedQuoteId}`)
                  }
                  className="bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-lg group"
                >
                  <Eye className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                  {t("viewQuote")}
                </Button>

                <Button
                  onClick={() =>
                    window.open(`/api/quotes/${submittedQuoteId}/pdf`, "_blank")
                  }
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg group"
                >
                  <Download className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                  {t("downloadPDF")}
                </Button>
              </div>

              <Button
                variant="link"
                onClick={() => {
                  setSubmittedQuoteId(null);
                  window.location.reload();
                }}
                className="text-gray-500 hover:text-gray-700 mt-6"
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
    <section className="py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30"></div>
      <div className="container mx-auto px-4 max-w-6xl relative">
        <div className="text-center mb-16 space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-900 via-purple-800 to-indigo-900">
            {t("title")}
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                <User className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {t("personalInfo")}
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="firstName"
                  className="text-gray-700 font-medium"
                >
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
                  <p className="text-sm text-red-600 mt-1">
                    {errors.lastName.message}
                  </p>
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
                  <p className="text-sm text-red-600 mt-1">
                    {errors.email.message}
                  </p>
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
                  <p className="text-sm text-red-600 mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {t("stayDates")}
              </h3>
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
                  min={format(new Date(stay.startDate), "yyyy-MM-dd")}
                  max={format(new Date(stay.endDate), "yyyy-MM-dd")}
                />
                {errors.checkIn && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.checkIn.message}
                  </p>
                )}
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
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
                <p className="text-center text-blue-800 font-semibold">
                  {nights} {t("nights")}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                  <Home className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {t("roomSelection")}
                </h3>
              </div>

              <Button
                type="button"
                onClick={() => setShowRoomSelector(!showRoomSelector)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                {t("addRoom")}
              </Button>
            </div>

            {showRoomSelector && (
              <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200/50">
                <p className="text-gray-700 font-medium mb-4">
                  {t("selectRoomToAdd")}
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stay.hotel.rooms.map((room: any) => (
                    <div
                      key={room.id}
                      onClick={() => {
                        addRoom(room);
                        setShowRoomSelector(false);
                      }}
                      className="bg-white rounded-xl shadow-md border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
                    >
                      {room.imageUrl && (
                        <div className="h-32 w-full overflow-hidden">
                          <img
                            src={room.imageUrl}
                            alt={room.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Bed className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                          <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {room.name}
                          </span>
                        </div>
                        {room.description && (
                          <div 
                            className="text-sm text-gray-600 mb-2 line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: room.description }}
                          />
                        )}
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{t("capacity")}:</span>{" "}
                          {room.capacity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedRooms.length > 0 ? (
              <div className="space-y-6">
                {selectedRooms.map(({ roomId, room, instances }) => (
                  <div
                    key={roomId}
                    className="bg-gradient-to-r from-white to-blue-50 rounded-2xl border-2 border-blue-100 shadow-lg overflow-hidden"
                  >
                    {room.imageUrl && (
                      <div className="h-48 w-full overflow-hidden">
                        <img
                          src={room.imageUrl}
                          alt={room.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                          <Crown className="h-5 w-5 text-white" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">
                          {room.name}
                        </h4>
                      </div>
                      {room.description && (
                        <div 
                          className="text-sm text-gray-600 mb-4 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: room.description }}
                        />
                      )}

                    {instances.map((instance, index) => {
                      const totalOccupants = getTotalOccupants(instance);
                      const isOverCapacity = totalOccupants > room.capacity;

                      return (
                        <div
                          key={instance.id}
                          className={`p-4 bg-white rounded-xl border-2 mb-4 ${
                            isOverCapacity
                              ? "border-red-300 bg-red-50"
                              : "border-gray-200"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-4">
                            <span className="font-semibold text-gray-900">
                              {room.name} #{index + 1}
                            </span>
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  isOverCapacity
                                    ? "bg-red-100 text-red-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {totalOccupants}/{room.capacity} {t("persons")}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  removeRoomInstance(roomId, instance.id)
                                }
                                className="text-red-600 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {isOverCapacity && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm text-red-700 font-medium">
                                ⚠️ {t("overCapacityWarning")}
                              </p>
                            </div>
                          )}

                          <div className="grid gap-4">
                            {ageRanges.map((ageRange: any) => {
                              const count =
                                instance.occupants[ageRange.id] || 0;
                              const pricing = room.roomPricings.find(
                                (rp: any) => rp.ageRangeId === ageRange.id
                              );

                              return (
                                <div
                                  key={ageRange.id}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                      {ageRange.name}
                                    </p>
                                    {pricing && (
                                      <p className="text-sm text-blue-600 font-medium">
                                        {pricing.price}€ {t("perStay")}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0"
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

                                    <span className="w-8 text-center font-semibold">
                                      {count}
                                    </span>

                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() =>
                                        updateOccupants(
                                          roomId,
                                          instance.id,
                                          ageRange.id,
                                          count + 1
                                        )
                                      }
                                      disabled={totalOccupants >= room.capacity}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {getTotalOccupants(instance) > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 font-medium">
                                  {t("subtotal")}:
                                </span>
                                <span className="text-xl font-bold text-blue-600">
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
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addRoom(room)}
                      className="w-full mt-2 border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("addAnotherRoom", { roomName: room.name })}
                    </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="p-6 bg-gray-100 rounded-full inline-flex mb-4">
                  <Home className="h-12 w-12 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">{t("noRoomsSelected")}</p>
              </div>
            )}

            {selectedRooms.length > 0 && (
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white shadow-xl">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-blue-100">
                      {selectedRooms.reduce(
                        (sum, r) => sum + r.instances.length,
                        0
                      )}{" "}
                      {t("rooms")}, {totalParticipants} {t("persons")}
                    </p>
                    <p className="text-sm text-blue-200">
                      {t("forEntireStay")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-200">{t("totalPrice")}</p>
                    <p className="text-3xl font-bold">
                      {totalPrice.toFixed(2)}€
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

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

          <Button
            type="submit"
            className="w-full h-14 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white text-lg font-semibold shadow-xl rounded-2xl group"
            disabled={
              isSubmitting ||
              selectedRooms.length === 0 ||
              totalParticipants === 0
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
