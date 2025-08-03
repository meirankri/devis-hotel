'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/app/_trpc/client';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, Building2, MapPin, Bed } from 'lucide-react';
import { HotelForm } from './HotelForm';
import { toast } from '@/components/ui/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { Hotel } from '@/domain/entities/Hotel';

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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {!isCreating && (
        <div className="mb-8 flex justify-end">
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('addHotel')}
          </Button>
        </div>
      )}

      {isCreating && (
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-6">{t('newHotel')}</h2>
          <HotelForm
            onSuccess={() => {
              setIsCreating(false);
              refetch();
            }}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {hotels?.map((hotel: Hotel) => (
          <div key={hotel.id} className="group relative">
            {editingId === hotel.id ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <HotelForm
                  hotel={hotel}
                  onSuccess={() => {
                    setEditingId(null);
                    refetch();
                  }}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
                <div className="relative h-56 bg-gray-100">
                  {hotel.imageUrl ? (
                    <Image
                      src={hotel.imageUrl}
                      alt={hotel.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <Building2 className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Actions flottantes */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-white/90 backdrop-blur-sm"
                      onClick={() => setEditingId(hotel.id)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-white/90 backdrop-blur-sm"
                      onClick={() => handleDelete(hotel.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {hotel.name}
                  </h3>
                  
                  {hotel.description && (
                    <div 
                      className="text-sm text-gray-600 mb-3 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: hotel.description }}
                    />
                  )}
                  
                  {hotel.address && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{hotel.address}</span>
                    </div>
                  )}
                  
                  <Link href={`/hotels/${hotel.id}/rooms`}>
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                      <Bed className="mr-2 h-4 w-4" />
                      {t('manageRooms')}
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {hotels?.length === 0 && !isCreating && (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
          <Building2 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('noHotels')}
          </h3>
          <p className="text-gray-500 mb-6">
            {t('noHotelsDesc')}
          </p>
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('addHotel')}
          </Button>
        </div>
      )}
    </div>
  );
}