"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  MapPin,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { StayForm } from "./StayForm";
import { toast } from "@/components/ui/use-toast";
import Image from "next/image";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import type { RouterOutputs } from "@/app/_trpc/client";

type Stay = RouterOutputs["stays"]["getAll"][number];

export function StaysList() {
  const t = useTranslations("Stays");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: stays, isLoading, refetch } = trpc.stays.getAll.useQuery();
  const deleteStay = trpc.stays.delete.useMutation({
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

  const toggleActive = trpc.stays.toggleActive.useMutation({
    onSuccess: () => {
      toast({
        title: t("statusUpdateSuccess"),
        description: t("statusUpdateSuccessDesc"),
      });
      refetch();
    },
  });

  const handleDelete = async (id: string) => {
    if (confirm(t("confirmDelete"))) {
      await deleteStay.mutateAsync({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      {!isCreating && (
        <div className="mb-8 flex justify-end">
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("addStay")}
          </Button>
        </div>
      )}

      {isCreating && (
        <div className="mb-8 bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-6">
            {t("newStay")}
          </h2>
          <StayForm
            onSuccess={() => {
              setIsCreating(false);
              refetch();
            }}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      <div className="grid gap-6 grid-cols-1">
        {stays?.map((stay: Stay) => (
          <div key={stay.id} className="group relative">
            {editingId === stay.id ? (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <StayForm
                  stay={stay}
                  onSuccess={() => {
                    setEditingId(null);
                    refetch();
                  }}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 group">
                {/* Status Badge */}
                <div className="absolute top-4 left-4 z-20">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      stay.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {stay.isActive ? t("active") : t("inactive")}
                  </span>
                </div>

                {/* Image */}
                <div className="relative h-56 bg-gradient-to-br from-indigo-100 to-purple-100">
                  {stay.imageUrl ? (
                    <Image
                      src={stay.imageUrl}
                      alt={stay.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="h-20 w-20 text-indigo-300" />
                    </div>
                  )}

                  {/* Overlay avec actions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <Link
                        href={`/${stay.organization?.slug || "default"}/${
                          stay.slug
                        }`}
                        target="_blank"
                        className="text-white hover:text-gray-200 transition-colors"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </Link>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30"
                          onClick={() => toggleActive.mutate({ id: stay.id })}
                        >
                          {stay.isActive ? (
                            <EyeOff className="h-4 w-4 text-white" />
                          ) : (
                            <Eye className="h-4 w-4 text-white" />
                          )}
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30"
                          onClick={() => setEditingId(stay.id)}
                        >
                          <Edit2 className="h-4 w-4 text-white" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30"
                          onClick={() => handleDelete(stay.id)}
                        >
                          <Trash2 className="h-4 w-4 text-white" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {stay.name}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <MapPin className="h-4 w-4" />
                    <span>{stay.hotel.name}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(stay.startDate), "d MMM", {
                        locale: fr,
                      })}{" "}
                      -
                      {format(new Date(stay.endDate), "d MMM yyyy", {
                        locale: fr,
                      })}
                    </span>
                  </div>

                  {stay.description && (
                    <div
                      className="text-sm text-gray-600 mb-4 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: stay.description }}
                    />
                  )}

                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {t("partialBooking")}:
                      </span>
                      <span
                        className={`font-medium ${
                          stay.allowPartialBooking
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        {stay.allowPartialBooking ? t("yes") : t("no")}
                      </span>
                    </div>

                    {stay.allowPartialBooking && stay.minDays && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{t("minDays")}:</span>
                        <span className="font-medium">{stay.minDays}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{t("url")}:</span>
                      <span className="font-mono text-xs text-indigo-600">
                        /{stay.organization?.slug || "default"}/{stay.slug}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {stays?.length === 0 && !isCreating && (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
          <Calendar className="mx-auto h-20 w-20 text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {t("noStays")}
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {t("noStaysDesc")}
          </p>
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("addStay")}
          </Button>
        </div>
      )}
    </div>
  );
}
