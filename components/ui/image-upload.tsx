'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
  entityId: string;
  entityType: string;
}

export function ImageUpload({
  value,
  onChange,
  className,
  entityId,
  entityType,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  
  // Mettre à jour le preview quand value change
  React.useEffect(() => {
    setPreview(value || null);
  }, [value]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une image',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast({
        title: 'Erreur',
        description: 'L\'image ne doit pas dépasser 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityId', entityId);
    formData.append('entityType', entityType);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload');
      }

      const data = await response.json();
      onChange(data.fileUrl || '');
      
      toast({
        title: 'Succès',
        description: 'Image uploadée avec succès',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'uploader l\'image',
        variant: 'destructive',
      });
      setPreview(value || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('relative', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading}
      />

      {preview ? (
        <div className="relative group">
          <div className="relative h-48 w-full overflow-hidden rounded-lg border-2 border-gray-200">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="relative h-48 w-full rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100"
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-600">
                Cliquez pour uploader une image
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG jusqu\'à 5MB
              </p>
            </>
          )}
        </button>
      )}
    </div>
  );
}