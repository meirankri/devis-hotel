'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { trpc } from '@/app/_trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { createAgeRangeSchema, type CreateAgeRangeDto } from '@/application/dto/age-range.dto';
import { AgeRange } from '@/domain/entities/AgeRange';

interface AgeRangeFormProps {
  ageRange?: AgeRange;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AgeRangeForm({ ageRange, onSuccess, onCancel }: AgeRangeFormProps) {
  const t = useTranslations('AgeRanges');
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateAgeRangeDto>({
    resolver: zodResolver(createAgeRangeSchema),
    defaultValues: {
      name: ageRange?.name || '',
      minAge: ageRange?.minAge ?? undefined,
      maxAge: ageRange?.maxAge ?? undefined,
      order: ageRange?.order ?? 0,
    },
  });

  const createAgeRange = trpc.ageRanges.create.useMutation({
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

  const updateAgeRange = trpc.ageRanges.update.useMutation({
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

  const onSubmit = async (data: CreateAgeRangeDto) => {
    if (ageRange) {
      await updateAgeRange.mutateAsync({ id: ageRange.id, data });
    } else {
      await createAgeRange.mutateAsync(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            {t('rangeName')} *
          </Label>
          <Input
            id="name"
            {...register('name')}
            placeholder={t('rangeNamePlaceholder')}
            className="mt-1"
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="minAge" className="text-sm font-medium text-gray-700">
            {t('minAge')}
          </Label>
          <Input
            id="minAge"
            type="number"
            min="0"
            {...register('minAge', { valueAsNumber: true })}
            placeholder="0"
            className="mt-1"
          />
          {errors.minAge && (
            <p className="text-sm text-red-600 mt-1">{errors.minAge.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="maxAge" className="text-sm font-medium text-gray-700">
            {t('maxAge')}
          </Label>
          <Input
            id="maxAge"
            type="number"
            min="0"
            {...register('maxAge', { valueAsNumber: true })}
            placeholder="99"
            className="mt-1"
          />
          {errors.maxAge && (
            <p className="text-sm text-red-600 mt-1">{errors.maxAge.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
        >
          {isSubmitting
            ? t('saving')
            : ageRange
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