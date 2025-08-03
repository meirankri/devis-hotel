"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Users, Euro, Settings } from "lucide-react";
import { RoomForm } from "./RoomForm";
import { PricingModal } from "./PricingModal";
import { toast } from "@/components/ui/use-toast";
import Image from "next/image";
import { cn } from "@/lib/utils";
type RoomWithPricings = {
  id: string;
  hotelId: string;
  name: string;
  description: string | null;
  capacity: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  roomPricings: {
    id: string;
    roomId: string;
    ageRangeId: string;
    price: string;
    createdAt: string;
    updatedAt: string;
    ageRange: {
      id: string;
      name: string;
      minAge: number | null;
      maxAge: number | null;
      order: number;
      createdAt: string;
      updatedAt: string;
    };
  }[];
};

interface RoomsListProps {
  hotelId: string;
  hotelName: string;
}

export function RoomsList({ hotelId }: RoomsListProps) {
  const t = useTranslations("Rooms");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

  const {
    data: rooms,
    isLoading,
    refetch,
  } = trpc.rooms.getByHotelId.useQuery({ hotelId });
  const { data: ageRanges } = trpc.ageRanges.getAll.useQuery();

  const deleteRoom = trpc.rooms.delete.useMutation({
    onSuccess: () => {
      toast({
        title: t("deleteSuccess"),
        description: t("deleteSuccessDesc"),
      });
      refetch();
    },
    onError: () => {
      toast({
        title: t("deleteError"),
        description: t("deleteErrorDesc"),
        variant: "destructive",
      });
    },
  });

  const handleDelete = async (id: string) => {
    if (confirm(t("confirmDelete"))) {
      await deleteRoom.mutateAsync({ id });
    }
  };

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRoomIds.length === rooms?.length) {
      setSelectedRoomIds([]);
    } else {
      setSelectedRoomIds(rooms?.map((r: RoomWithPricings) => r.id) || []);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Actions Bar */}
      <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t("roomsTitle")} ({rooms?.length || 0})
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {t("roomsDescription")}
            </p>
          </div>

          <div className="flex gap-3">
            {selectedRoomIds.length > 0 && (
              <Button
                onClick={() => setPricingModalOpen(true)}
                variant="outline"
                className="border-2"
              >
                <Euro className="mr-2 h-4 w-4" />
                {t("setPrices")} ({selectedRoomIds.length})
              </Button>
            )}

            {!isCreating && (
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("addRoom")}
              </Button>
            )}
          </div>
        </div>

        {rooms && rooms.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedRoomIds.length === rooms.length}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {t("selectAll")}
            </label>
          </div>
        )}
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold mb-6">{t("newRoom")}</h3>
          <RoomForm
            hotelId={hotelId}
            onSuccess={() => {
              setIsCreating(false);
              refetch();
            }}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      {/* Rooms Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rooms?.map((room: RoomWithPricings) => (
          <div key={room.id} className="group relative">
            {editingId === room.id ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <RoomForm
                  hotelId={hotelId}
                  room={room}
                  onSuccess={() => {
                    setEditingId(null);
                    refetch();
                  }}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              <div
                className={cn(
                  "bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border-2",
                  selectedRoomIds.includes(room.id)
                    ? "border-blue-500 shadow-lg"
                    : "border-gray-100"
                )}
              >
                {/* Checkbox */}
                <div className="absolute top-4 left-4 z-10">
                  <input
                    type="checkbox"
                    checked={selectedRoomIds.includes(room.id)}
                    onChange={() => handleSelectRoom(room.id)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                  {room.imageUrl ? (
                    <Image
                      src={room.imageUrl}
                      alt={room.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="h-16 w-16 text-gray-400" />
                    </div>
                  )}

                  {/* Actions flottantes */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-white/90 backdrop-blur-sm"
                      onClick={() => setEditingId(room.id)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-white/90 backdrop-blur-sm"
                      onClick={() => handleDelete(room.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {room.name}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Users className="h-4 w-4" />
                    <span>
                      {t("capacity")}: {room.capacity} {t("persons")}
                    </span>
                  </div>

                  {room.description && (
                    <div
                      className="text-sm text-gray-600 mb-4 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: room.description }}
                    />
                  )}

                  {/* Prix par tranche d'âge */}
                  <div className="space-y-2 mb-4">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Euro className="h-3.5 w-3.5" />
                      {t("pricing")}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {room.roomPricings.map((pricing) => (
                        <div
                          key={pricing.id}
                          className="bg-gray-50 rounded-lg px-3 py-2 text-xs"
                        >
                          <div className="text-gray-600">
                            {pricing?.ageRange?.name}
                          </div>
                          <div className="font-semibold text-gray-900">
                            {Number(pricing?.price)}€
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => {
                      setSelectedRoomIds([room.id]);
                      setPricingModalOpen(true);
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    {t("configurePricing")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {rooms?.length === 0 && !isCreating && (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("noRooms")}
          </h3>
          <p className="text-gray-500 mb-6">{t("noRoomsDesc")}</p>
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("addRoom")}
          </Button>
        </div>
      )}

      {/* Pricing Modal */}
      {pricingModalOpen && (
        <PricingModal
          isOpen={pricingModalOpen}
          onClose={() => setPricingModalOpen(false)}
          roomIds={selectedRoomIds}
          ageRanges={ageRanges || []}
          onSuccess={() => {
            refetch();
            setSelectedRoomIds([]);
          }}
        />
      )}
    </div>
  );
}
