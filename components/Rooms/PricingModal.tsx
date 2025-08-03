'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/app/_trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { X, Euro, Plus } from 'lucide-react';

type AgeRangeType = {
  id: string;
  name: string;
  minAge: number | null;
  maxAge: number | null;
  order: number;
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
  onSuccess: () => void;
}

export function PricingModal({ 
  isOpen, 
  onClose, 
  roomIds, 
  ageRanges,
  onSuccess 
}: PricingModalProps) {
  const t = useTranslations('Rooms');
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [customAgeRanges, setCustomAgeRanges] = useState<CustomAgeRange[]>([]);
  const [showAddAgeRange, setShowAddAgeRange] = useState(false);
  const [newMinAge, setNewMinAge] = useState('');
  const [newMaxAge, setNewMaxAge] = useState('');
  
  const updatePricing = trpc.rooms.updateMultiplePricing.useMutation({
    onSuccess: () => {
      toast({
        title: t('pricingUpdateSuccess'),
        description: t('pricingUpdateSuccessDesc'),
      });
    },
    onError: () => {
      toast({
        title: t('pricingUpdateError'),
        description: t('pricingUpdateErrorDesc'),
        variant: 'destructive',
      });
    },
  });

  const createAgeRange = trpc.ageRanges.create.useMutation();

  const handleAddAgeRange = () => {
    if (newMinAge && newMaxAge) {
      const newRange: CustomAgeRange = {
        id: `custom-${Date.now()}`,
        minAge: parseInt(newMinAge),
        maxAge: parseInt(newMaxAge),
        isCustom: true,
      };
      setCustomAgeRanges([...customAgeRanges, newRange]);
      setNewMinAge('');
      setNewMaxAge('');
      setShowAddAgeRange(false);
    }
  };

  const handleSubmit = async () => {
    // Séparer les prix des tranches d'âge existantes et personnalisées
    const existingRangeUpdates = Object.entries(prices)
      .filter(([id]) => !id.startsWith('custom-'))
      .map(([ageRangeId, price]) => 
        updatePricing.mutateAsync({
          roomIds,
          ageRangeId,
          price,
        })
      );

    // Pour les tranches personnalisées, nous devons les créer d'abord
    const customRangeUpdates = customAgeRanges
      .filter(range => prices[range.id])
      .map(async (range) => {
        // Créer la tranche d'âge
        const newAgeRange = await createAgeRange.mutateAsync({
          name: `${range.minAge}-${range.maxAge} ans`,
          minAge: range.minAge,
          maxAge: range.maxAge,
          order: 999, // Mettre à la fin
        });

        // Puis mettre à jour les prix
        return updatePricing.mutateAsync({
          roomIds,
          ageRangeId: newAgeRange.id,
          price: prices[range.id],
        });
      });

    try {
      await Promise.all([...existingRangeUpdates, ...customRangeUpdates]);
      onSuccess();
      onClose();
    } catch (error) {
      // Erreur déjà gérée par onError
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t('setPricesTitle')}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {t('setPricesFor')} {roomIds.length} {t('rooms')}
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

          <div className="space-y-4 mb-6">
            <p className="text-sm text-gray-600">
              {t('pricingHelp')}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Important :</strong> Les prix saisis correspondent au prix total par personne pour le séjour complet, pas au prix par nuit.
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
                    value={prices[ageRange.id] || ''}
                    onChange={(e) => setPrices(prev => ({
                      ...prev,
                      [ageRange.id]: parseFloat(e.target.value) || 0
                    }))}
                    placeholder="0.00"
                    className="pl-10"
                  />
                </div>
              </div>
            ))}

            {/* Tranches d'âge personnalisées */}
            {customAgeRanges.map((range) => (
              <div key={range.id} className="relative bg-blue-50 p-3 rounded-lg">
                <Label 
                  htmlFor={`price-${range.id}`}
                  className="text-sm font-medium text-gray-700 mb-1 block"
                >
                  {range.minAge}-{range.maxAge} ans
                  <span className="text-xs text-blue-600 ml-2">(Nouvelle tranche)</span>
                </Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id={`price-${range.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={prices[range.id] || ''}
                    onChange={(e) => setPrices(prev => ({
                      ...prev,
                      [range.id]: parseFloat(e.target.value) || 0
                    }))}
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
                    <Label htmlFor="minAge" className="text-xs text-gray-600">Âge min</Label>
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
                    <Label htmlFor="maxAge" className="text-xs text-gray-600">Âge max</Label>
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
                      setNewMinAge('');
                      setNewMaxAge('');
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
              disabled={Object.keys(prices).length === 0 || updatePricing.isPending}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {updatePricing.isPending ? t('saving') : t('applyPrices')}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={updatePricing.isPending}
              className="flex-1 border-2"
            >
              {t('cancel')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}