'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/app/_trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { X, Euro } from 'lucide-react';

type AgeRangeType = {
  id: string;
  name: string;
  minAge: number | null;
  maxAge: number | null;
  order: number;
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
  
  // Debug
  console.log('PricingModal - ageRanges:', ageRanges);
  
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

  const handleSubmit = async () => {
    const updates = Object.entries(prices).map(([ageRangeId, price]) => 
      updatePricing.mutateAsync({
        roomIds,
        ageRangeId,
        price,
      })
    );

    try {
      await Promise.all(updates);
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