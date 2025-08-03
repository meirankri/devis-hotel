'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { trpc } from '@/app/_trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { createRoomSchema, type CreateRoomDto } from '@/application/dto/room.dto';
import { ImageUpload } from '@/components/ui/image-upload';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

interface RoomFormProps {
  hotelId: string;
  room?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RoomForm({ hotelId, room, onSuccess, onCancel }: RoomFormProps) {
  const t = useTranslations('Rooms');
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoomDto>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      hotelId,
      name: room?.name || '',
      description: room?.description || '',
      capacity: room?.capacity || 2,
      imageUrl: room?.imageUrl || '',
    },
  });

  const createRoom = trpc.rooms.create.useMutation({
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

  const updateRoom = trpc.rooms.update.useMutation({
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

  const onSubmit = async (data: CreateRoomDto) => {
    if (room) {
      await updateRoom.mutateAsync({ id: room.id, data });
    } else {
      await createRoom.mutateAsync(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            {t('roomName')} *
          </Label>
          <Input
            id="name"
            {...register('name')}
            placeholder={t('roomNamePlaceholder')}
            className="mt-1"
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="capacity" className="text-sm font-medium text-gray-700">
            {t('roomCapacity')} *
          </Label>
          <Input
            id="capacity"
            type="number"
            {...register('capacity', { valueAsNumber: true })}
            placeholder="2"
            className="mt-1"
          />
          {errors.capacity && (
            <p className="text-sm text-red-600 mt-1">{errors.capacity.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">
          {t('roomDescription')}
        </Label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              value={field.value || ''}
              onChange={field.onChange}
              placeholder={t('roomDescriptionPlaceholder')}
              className="mt-1"
            />
          )}
        />
        {errors.description && (
          <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
        )}
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">
          {t('roomImage')}
        </Label>
        <Controller
          name="imageUrl"
          control={control}
          render={({ field }) => (
            <ImageUpload
              value={field.value || ''}
              onChange={field.onChange}
              entityId={room?.id || hotelId}
              entityType="room"
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
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          {isSubmitting
            ? t('saving')
            : room
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