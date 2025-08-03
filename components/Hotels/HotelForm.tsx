'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { trpc } from '@/app/_trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { createHotelSchema, type CreateHotelDto } from '@/application/dto/hotel.dto';
import { ImageUpload } from '@/components/ui/image-upload';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

type HotelData = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

interface HotelFormProps {
  hotel?: HotelData;
  onSuccess: () => void;
  onCancel: () => void;
}

export function HotelForm({ hotel, onSuccess, onCancel }: HotelFormProps) {
  const t = useTranslations('Hotels');
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateHotelDto>({
    resolver: zodResolver(createHotelSchema),
    defaultValues: {
      name: hotel?.name || '',
      description: hotel?.description || '',
      address: hotel?.address || '',
      imageUrl: hotel?.imageUrl || '',
    },
  });

  const createHotel = trpc.hotels.create.useMutation({
    onSuccess: () => {
      toast({
        title: t('createSuccess'),
        description: t('createSuccessDesc'),
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: t('createError'),
        description: t('createErrorDesc'),
        variant: 'destructive',
      });
    },
  });

  const updateHotel = trpc.hotels.update.useMutation({
    onSuccess: () => {
      toast({
        title: t('updateSuccess'),
        description: t('updateSuccessDesc'),
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: t('updateError'),
        description: t('updateErrorDesc'),
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: CreateHotelDto) => {
    if (hotel) {
      await updateHotel.mutateAsync({ id: hotel.id, data });
    } else {
      await createHotel.mutateAsync(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">{t('hotelName')} *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder={t('hotelNamePlaceholder')}
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label>{t('hotelDescription')}</Label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              value={field.value || ''}
              onChange={field.onChange}
              placeholder={t('hotelDescriptionPlaceholder')}
              className="mt-1"
            />
          )}
        />
        {errors.description && (
          <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="address">{t('hotelAddress')}</Label>
        <Input
          id="address"
          {...register('address')}
          placeholder={t('hotelAddressPlaceholder')}
        />
        {errors.address && (
          <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>
        )}
      </div>

      <div>
        <Label>{t('hotelImage')}</Label>
        <Controller
          name="imageUrl"
          control={control}
          render={({ field }) => (
            <ImageUpload
              value={field.value || ''}
              onChange={field.onChange}
              entityId={hotel?.id || 'temp'}
              entityType="hotel"
              className="mt-1"
            />
          )}
        />
        {errors.imageUrl && (
          <p className="text-sm text-red-600 mt-1">{errors.imageUrl.message}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t('saving')
            : hotel
            ? t('update')
            : t('create')}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('cancel')}
        </Button>
      </div>
    </form>
  );
}