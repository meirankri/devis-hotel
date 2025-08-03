'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/app/_trpc/client';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Building } from 'lucide-react';
import { HotelForm } from './HotelForm';
import { toast } from '@/components/ui/use-toast';
import Link from 'next/link';
import Image from 'next/image';

export function HotelsList() {
  const t = useTranslations('Hotels');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: hotels, isLoading, refetch } = trpc.hotels.getAll.useQuery();
  const deleteHotel = trpc.hotels.delete.useMutation({
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

  const handleDelete = async (id: string) => {
    if (confirm(t('confirmDelete'))) {
      await deleteHotel.mutateAsync({ id });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('loading')}</div>;
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addHotel')}
        </Button>
      </div>

      {isCreating && (
        <div className="mb-6 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">{t('newHotel')}</h2>
          <HotelForm
            onSuccess={() => {
              setIsCreating(false);
              refetch();
            }}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {hotels?.map((hotel) => (
          <div key={hotel.id} className="bg-white p-6 rounded-lg shadow">
            {editingId === hotel.id ? (
              <HotelForm
                hotel={hotel}
                onSuccess={() => {
                  setEditingId(null);
                  refetch();
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                {hotel.imageUrl && (
                  <div className="relative w-full h-48 mb-4">
                    <Image
                      src={hotel.imageUrl}
                      alt={hotel.name}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                )}
                {!hotel.imageUrl && (
                  <div className="w-full h-48 bg-gray-200 rounded-md mb-4 flex items-center justify-center">
                    <Building className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                
                <h3 className="text-lg font-semibold mb-2">{hotel.name}</h3>
                {hotel.description && (
                  <p className="text-gray-600 mb-2">{hotel.description}</p>
                )}
                {hotel.address && (
                  <p className="text-sm text-gray-500 mb-4">{hotel.address}</p>
                )}
                
                <div className="flex gap-2">
                  <Link href={`/hotels/${hotel.id}/rooms`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      {t('manageRooms')}
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setEditingId(hotel.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(hotel.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {hotels?.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">{t('noHotels')}</p>
          <p className="text-gray-500 text-sm mt-1">
            {t('noHotelsDesc')}
          </p>
        </div>
      )}
    </div>
  );
}