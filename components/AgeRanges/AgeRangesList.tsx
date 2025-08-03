'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/app/_trpc/client';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, Users, ArrowUp, ArrowDown } from 'lucide-react';
import { AgeRangeForm } from './AgeRangeForm';
import { toast } from '@/components/ui/use-toast';
import { AgeRange } from '@/domain/entities/AgeRange';

export function AgeRangesList() {
  const t = useTranslations('AgeRanges');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: ageRanges, isLoading, refetch } = trpc.ageRanges.getAll.useQuery();
  const deleteAgeRange = trpc.ageRanges.delete.useMutation({
    onSuccess: () => {
      toast({
        title: t('deleteSuccess'),
        description: t('deleteSuccessDesc'),
      });
      refetch();
    },
    onError: () => {
      toast({
        title: t('deleteError'),
        description: t('deleteErrorDesc'),
        variant: 'destructive',
      });
    },
  });

  const updateAgeRange = trpc.ageRanges.update.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleDelete = async (id: string) => {
    if (confirm(t('confirmDelete'))) {
      await deleteAgeRange.mutateAsync({ id });
    }
  };

  const handleMoveUp = async (id: string, currentOrder: number) => {
    const prevItem = ageRanges?.find((a: AgeRange) => a.order === currentOrder - 1);
    if (!prevItem) return;

    await Promise.all([
      updateAgeRange.mutateAsync({ id, data: { order: currentOrder - 1 } }),
      updateAgeRange.mutateAsync({ id: prevItem.id, data: { order: currentOrder } }),
    ]);
  };

  const handleMoveDown = async (id: string, currentOrder: number) => {
    const nextItem = ageRanges?.find((a: AgeRange) => a.order === currentOrder + 1);
    if (!nextItem) return;

    await Promise.all([
      updateAgeRange.mutateAsync({ id, data: { order: currentOrder + 1 } }),
      updateAgeRange.mutateAsync({ id: nextItem.id, data: { order: currentOrder } }),
    ]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const maxOrder = Math.max(...(ageRanges?.map((a: AgeRange) => a.order) || [0]));

  return (
    <div>
      {!isCreating && (
        <div className="mb-8 flex justify-end">
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('addAgeRange')}
          </Button>
        </div>
      )}

      {isCreating && (
        <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-6">{t('newAgeRange')}</h2>
          <AgeRangeForm
            onSuccess={() => {
              setIsCreating(false);
              refetch();
            }}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('order')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('name')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('ageRange')}
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ageRanges?.map((ageRange: AgeRange) => (
                <tr key={ageRange.id} className="hover:bg-gray-50 transition-colors">
                  {editingId === ageRange.id ? (
                    <td colSpan={4} className="px-6 py-4">
                      <AgeRangeForm
                        ageRange={ageRange}
                        onSuccess={() => {
                          setEditingId(null);
                          refetch();
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    </td>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleMoveUp(ageRange.id, ageRange.order)}
                            disabled={ageRange.order === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleMoveDown(ageRange.id, ageRange.order)}
                            disabled={ageRange.order === maxOrder}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <span className="text-sm text-gray-600 ml-2">#{ageRange.order + 1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-purple-100 rounded-lg mr-3">
                            <Users className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {ageRange.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ageRange.minAge !== null && ageRange.maxAge !== null ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {ageRange.minAge} - {ageRange.maxAge} ans
                          </span>
                        ) : ageRange.minAge !== null ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {ageRange.minAge}+ ans
                          </span>
                        ) : ageRange.maxAge !== null ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Jusqu'à {ageRange.maxAge} ans
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingId(ageRange.id)}
                          className="mr-2"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(ageRange.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {ageRanges?.length === 0 && (
          <div className="text-center py-16">
            <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('noAgeRanges')}
            </h3>
            <p className="text-gray-500 mb-6">
              {t('noAgeRangesDesc')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}