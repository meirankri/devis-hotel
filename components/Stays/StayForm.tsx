'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { trpc } from '@/app/_trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { createStaySchema, type CreateStayDto } from '@/application/dto/stay.dto';
import { ImageUpload } from '@/components/ui/image-upload';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { format } from 'date-fns';
import { Calendar, Info } from 'lucide-react';
import { Hotel } from '@/domain/entities/Hotel';

interface StayFormProps {
  stay?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StayForm({ stay, onSuccess, onCancel }: StayFormProps) {
  const t = useTranslations('Stays');
  
  const { data: hotels } = trpc.hotels.getAll.useQuery();
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateStayDto>({
    resolver: zodResolver(createStaySchema),
    defaultValues: {
      name: stay?.name || '',
      slug: stay?.slug || '',
      description: stay?.description || '',
      startDate: stay?.startDate ? format(new Date(stay.startDate), "yyyy-MM-dd") : '',
      endDate: stay?.endDate ? format(new Date(stay.endDate), "yyyy-MM-dd") : '',
      hotelId: stay?.hotelId || '',
      allowPartialBooking: stay?.allowPartialBooking || false,
      minDays: stay?.minDays || undefined,
      maxDays: stay?.maxDays || undefined,
      isActive: stay?.isActive ?? true,
      imageUrl: stay?.imageUrl || '',
    },
  });

  const allowPartialBooking = watch('allowPartialBooking');

  const createStay = trpc.stays.create.useMutation({
    onSuccess: () => {
      toast({
        title: t('createSuccess'),
        description: t('createSuccessDesc'),
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: t('createError'),
        description: error.message || t('createErrorDesc'),
        variant: 'destructive',
      });
    },
  });

  const updateStay = trpc.stays.update.useMutation({
    onSuccess: () => {
      toast({
        title: t('updateSuccess'),
        description: t('updateSuccessDesc'),
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: t('updateError'),
        description: error.message || t('updateErrorDesc'),
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: CreateStayDto) => {
    if (stay) {
      await updateStay.mutateAsync({ id: stay.id, data });
    } else {
      await createStay.mutateAsync(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            {t('stayName')} *
          </Label>
          <Input
            id="name"
            {...register('name')}
            placeholder={t('stayNamePlaceholder')}
            className="mt-1"
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="slug" className="text-sm font-medium text-gray-700">
            {t('staySlug')} *
          </Label>
          <div className="relative">
            <Input
              id="slug"
              {...register('slug')}
              placeholder={t('staySlugPlaceholder')}
              className="mt-1"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <Info className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          {errors.slug && (
            <p className="text-sm text-red-600 mt-1">{errors.slug.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {t('slugHelp')}
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="hotelId" className="text-sm font-medium text-gray-700">
          {t('hotel')} *
        </Label>
        <select
          id="hotelId"
          {...register('hotelId')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="">{t('selectHotel')}</option>
          {hotels?.map((hotel: Hotel) => (
            <option key={hotel.id} value={hotel.id}>
              {hotel.name}
            </option>
          ))}
        </select>
        {errors.hotelId && (
          <p className="text-sm text-red-600 mt-1">{errors.hotelId.message}</p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">
            {t('startDate')} *
          </Label>
          <div className="relative">
            <Input
              id="startDate"
              type="date"
              {...register('startDate')}
              className="mt-1 pl-10"
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          {errors.startDate && (
            <p className="text-sm text-red-600 mt-1">{errors.startDate.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="endDate" className="text-sm font-medium text-gray-700">
            {t('endDate')} *
          </Label>
          <div className="relative">
            <Input
              id="endDate"
              type="date"
              {...register('endDate')}
              className="mt-1 pl-10"
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          {errors.endDate && (
            <p className="text-sm text-red-600 mt-1">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">
          {t('stayDescription')}
        </Label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              value={field.value || ''}
              onChange={field.onChange}
              placeholder={t('stayDescriptionPlaceholder')}
              className="mt-1"
            />
          )}
        />
        {errors.description && (
          <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="allowPartialBooking"
            {...register('allowPartialBooking')}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <Label htmlFor="allowPartialBooking" className="text-sm font-medium text-gray-700 cursor-pointer">
            {t('allowPartialBooking')}
          </Label>
        </div>

        {allowPartialBooking && (
          <div className="grid gap-4 md:grid-cols-2 pl-7">
            <div>
              <Label htmlFor="minDays" className="text-sm font-medium text-gray-700">
                {t('minDays')}
              </Label>
              <Input
                id="minDays"
                type="number"
                min="1"
                {...register('minDays', { valueAsNumber: true })}
                placeholder="1"
                className="mt-1"
              />
              {errors.minDays && (
                <p className="text-sm text-red-600 mt-1">{errors.minDays.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="maxDays" className="text-sm font-medium text-gray-700">
                {t('maxDays')}
              </Label>
              <Input
                id="maxDays"
                type="number"
                min="1"
                {...register('maxDays', { valueAsNumber: true })}
                placeholder="7"
                className="mt-1"
              />
              {errors.maxDays && (
                <p className="text-sm text-red-600 mt-1">{errors.maxDays.message}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isActive"
          {...register('isActive')}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <Label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
          {t('activeStay')}
        </Label>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">
          {t('stayImage')}
        </Label>
        <Controller
          name="imageUrl"
          control={control}
          render={({ field }) => (
            <ImageUpload
              value={field.value || ''}
              onChange={field.onChange}
              entityId={stay?.id || 'temp'}
              entityType="stay"
              className="mt-1"
            />
          )}
        />
        {errors.imageUrl && (
          <p className="text-sm text-red-600 mt-1">{errors.imageUrl.message}</p>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          {isSubmitting
            ? t('saving')
            : stay
            ? t('update')
            : t('create')}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="border-2"
        >
          {t('cancel')}
        </Button>
      </div>
    </form>
  );
}