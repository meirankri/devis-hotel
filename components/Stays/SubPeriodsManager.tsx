"use client";

import React, { useState, useEffect } from "react";
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
  const [subPeriods, setSubPeriods] = useState<SubPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<SubPeriod | null>(null);
  const [formData, setFormData] = useState<SubPeriodFormData>({
    name: "",
    startDate: "",
    endDate: "",
  });
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Charger les sous-périodes
  useEffect(() => {
    fetchSubPeriods();
  }, [stayId]);

  const fetchSubPeriods = async () => {
    try {
      const response = await fetch(`/api/stays/${stayId}/sub-periods`);
      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setSubPeriods(data.data);
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les sous-périodes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

    try {
      const url = editingPeriod
        ? `/api/sub-periods/${editingPeriod.id}`
        : `/api/stays/${stayId}/sub-periods`;

      const method = editingPeriod ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la sauvegarde");
      }

      toast({
        title: "Succès",
        description: editingPeriod
          ? "Sous-période modifiée avec succès"
          : "Sous-période créée avec succès",
      });

      await fetchSubPeriods();
      handleCloseModal();
    } catch (error) {
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Erreur lors de la sauvegarde",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (periodId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette sous-période ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/sub-periods/${periodId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }

      toast({
        title: "Succès",
        description: "Sous-période supprimée avec succès",
      });

      await fetchSubPeriods();
    } catch (error) {
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Erreur lors de la suppression",
        variant: "destructive",
      });
    }
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

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();

    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null);
      return;
    }

    // Réorganiser localement
    const draggedIndex = subPeriods.findIndex((p) => p.id === draggedItem);
    const targetIndex = subPeriods.findIndex((p) => p.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newPeriods = [...subPeriods];
    const [removed] = newPeriods.splice(draggedIndex, 1);
    newPeriods.splice(targetIndex, 0, removed);

    setSubPeriods(newPeriods);

    try {
      // Envoyer le nouvel ordre au serveur
      const response = await fetch(`/api/stays/${stayId}/sub-periods/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subPeriodIds: newPeriods.map((p) => p.id),
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la réorganisation");
      }

      toast({
        title: "Succès",
        description: "Ordre mis à jour",
      });
    } catch (error) {
      // Recharger en cas d'erreur
      await fetchSubPeriods();
      toast({
        title: "Erreur",
        description: "Impossible de réorganiser",
        variant: "destructive",
      });
    }

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
