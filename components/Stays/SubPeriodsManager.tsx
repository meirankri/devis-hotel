"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import {
  useSubPeriods,
  useCreateSubPeriod,
  useUpdateSubPeriod,
  useDeleteSubPeriod
} from "@/hooks/queries/useSubPeriods";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface SubPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  order: number;
  hasPricing?: boolean;
}

interface SubPeriodsManagerProps {
  stayId: string;
  stayStartDate: Date;
  stayEndDate: Date;
  organizationId?: string;
}

interface SubPeriodFormData {
  name: string;
  startDate: string;
  endDate: string;
}

export function SubPeriodsManager({
  stayId,
  stayStartDate,
  stayEndDate,
  organizationId,
}: SubPeriodsManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<SubPeriod | null>(null);
  const [formData, setFormData] = useState<SubPeriodFormData>({
    name: "",
    startDate: "",
    endDate: "",
  });
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Utilisation de React Query pour charger les sous-périodes
  // Plus de useEffect, useState pour loading/error, ou fetchSubPeriods manuel !
  const {
    data: subPeriods = [],
    isLoading: loading,
    error
  } = useSubPeriods(stayId);

  // Hooks pour les mutations (create, update, delete)
  const createMutation = useCreateSubPeriod(stayId);
  const updateMutation = useUpdateSubPeriod(stayId);
  const deleteMutation = useDeleteSubPeriod(stayId);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation des dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (startDate < stayStartDate || endDate > stayEndDate) {
      toast({
        title: "Erreur",
        description: "Les dates doivent être dans les limites du séjour",
        variant: "destructive",
      });
      return;
    }

    if (startDate >= endDate) {
      toast({
        title: "Erreur",
        description: "La date de fin doit être après la date de début",
        variant: "destructive",
      });
      return;
    }

    // Utilisation de React Query mutations - beaucoup plus simple !
    const mutationData = {
      name: formData.name,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
    };

    if (editingPeriod) {
      // Update avec React Query
      updateMutation.mutate(
        { id: editingPeriod.id, ...mutationData },
        {
          onSuccess: () => {
            handleCloseModal();
          }
        }
      );
    } else {
      // Create avec React Query
      createMutation.mutate(mutationData, {
        onSuccess: () => {
          handleCloseModal();
        }
      });
    }
  };

  const handleDelete = async (periodId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette sous-période ?")) {
      return;
    }

    // Beaucoup plus simple avec React Query !
    // Les toasts et le refetch sont gérés automatiquement par le hook
    deleteMutation.mutate(periodId);
  };

  const handleEdit = (period: SubPeriod) => {
    setEditingPeriod(period);
    setFormData({
      name: period.name,
      startDate: format(new Date(period.startDate), "yyyy-MM-dd"),
      endDate: format(new Date(period.endDate), "yyyy-MM-dd"),
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPeriod(null);
    setFormData({ name: "", startDate: "", endDate: "" });
  };

  const handleDragStart = (periodId: string) => {
    setDraggedItem(periodId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Mutation pour réorganiser les sous-périodes
  const reorderMutation = useMutation({
    mutationFn: async (subPeriodIds: string[]) => {
      const response = await fetch(`/api/stays/${stayId}/sub-periods/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ subPeriodIds }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la réorganisation");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Ordre mis à jour",
      });
    },
    onError: () => {
      // Invalider le cache pour recharger depuis le serveur
      queryClient.invalidateQueries({ queryKey: ['sub-periods', stayId] });
      toast({
        title: "Erreur",
        description: "Impossible de réorganiser",
        variant: "destructive",
      });
    }
  });

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();

    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null);
      return;
    }

    // Réorganiser localement pour l'optimistic update
    const draggedIndex = subPeriods.findIndex((p) => p.id === draggedItem);
    const targetIndex = subPeriods.findIndex((p) => p.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newPeriods = [...subPeriods];
    const [removed] = newPeriods.splice(draggedIndex, 1);
    newPeriods.splice(targetIndex, 0, removed);

    // Update optimiste du cache React Query
    queryClient.setQueryData(['sub-periods', stayId], newPeriods);

    // Envoyer le nouvel ordre au serveur
    reorderMutation.mutate(newPeriods.map((p) => p.id));

    setDraggedItem(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sous-périodes</h3>
        <Button onClick={() => setIsModalOpen(true)} size="sm" type="button">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une sous-période
        </Button>
      </div>

      {subPeriods.length === 0 ? (
        <div className="p-8 border rounded-lg bg-white">
          <div className="text-center text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Aucune sous-période définie</p>
            <p className="text-xs mt-2">
              Les sous-périodes permettent de définir des tarifs différents pour
              chaque partie du séjour.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {subPeriods.map((period) => (
            <div
              key={period.id}
              className="p-4 cursor-move hover:shadow-md transition-shadow border rounded-lg bg-white"
              draggable
              onDragStart={() => handleDragStart(period.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, period.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                  <div>
                    <h4 className="font-medium">{period.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(period.startDate), "dd MMM yyyy", {
                        locale: fr,
                      })}{" "}
                      -{" "}
                      {format(new Date(period.endDate), "dd MMM yyyy", {
                        locale: fr,
                      })}
                    </p>
                  </div>
                  {period.hasPricing && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Tarifs définis
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(period)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(period.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          editingPeriod ? "Modifier la sous-période" : "Nouvelle sous-période"
        }
      >
        <div>
          <Label htmlFor="name">Nom de la période</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Semaine 1, Première quinzaine..."
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Date de début</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              min={format(stayStartDate, "yyyy-MM-dd")}
              max={format(stayEndDate, "yyyy-MM-dd")}
              required
            />
          </div>

          <div>
            <Label htmlFor="endDate">Date de fin</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              min={format(stayStartDate, "yyyy-MM-dd")}
              max={format(stayEndDate, "yyyy-MM-dd")}
              required
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Information</p>
              <p>
                Les dates doivent être comprises entre le{" "}
                {format(stayStartDate, "dd/MM/yyyy")} et le{" "}
                {format(stayEndDate, "dd/MM/yyyy")}.
              </p>
              <p className="mt-1">
                Les sous-périodes ne peuvent pas se chevaucher.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleCloseModal}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            {editingPeriod ? "Modifier" : "Créer"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
