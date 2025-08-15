'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Star, StarOff, GripVertical } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface ImageItem {
  id?: string;
  url: string;
  order: number;
  isMain: boolean;
  file?: File;
  isUploading?: boolean;
  markedForDeletion?: boolean;
}

interface MultiImageUploadProps {
  value: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  className?: string;
  entityId: string;
  entityType: string;
  maxImages?: number;
}

export function MultiImageUpload({
  value = [],
  onChange,
  className,
  entityId,
  entityType,
  maxImages = 10,
}: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingIndices, setUploadingIndices] = useState<Set<number>>(new Set());
  const [deletedImages, setDeletedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = maxImages - value.length;
    if (remainingSlots <= 0) {
      toast({
        title: 'Limite atteinte',
        description: `Vous pouvez ajouter maximum ${maxImages} images`,
        variant: 'destructive',
      });
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    
    // Validation
    for (const file of filesToUpload) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Erreur',
          description: `${file.name} n'est pas une image valide`,
          variant: 'destructive',
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Erreur',
          description: `${file.name} dépasse la taille maximale de 5MB`,
          variant: 'destructive',
        });
        return;
      }
    }

    // Upload des fichiers
    setIsUploading(true);
    const newImages: ImageItem[] = [];
    const currentMaxOrder = Math.max(0, ...value.map(img => img.order));

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
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
          throw new Error(`Erreur lors de l'upload de ${file.name}`);
        }

        const data = await response.json();
        newImages.push({
          url: data.fileUrl || '',
          order: currentMaxOrder + i + 1,
          isMain: value.length === 0 && i === 0, // La première image devient principale si aucune image n'existe
        });
      } catch (error) {
        toast({
          title: 'Erreur',
          description: `Impossible d'uploader ${file.name}`,
          variant: 'destructive',
        });
      }
    }

    if (newImages.length > 0) {
      onChange([...value, ...newImages]);
      toast({
        title: 'Succès',
        description: `${newImages.length} image(s) uploadée(s) avec succès`,
      });
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = async (index: number) => {
    const imageToRemove = value[index];
    
    // Si l'image a un ID (existe en base), on essaie de la supprimer du stockage
    if (imageToRemove.id && imageToRemove.url) {
      try {
        const response = await fetch(`/api/delete-image?url=${encodeURIComponent(imageToRemove.url)}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          console.error('Erreur lors de la suppression de l\'image du stockage');
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
      
      // Ajouter à la liste des images supprimées pour tracking
      setDeletedImages(prev => [...prev, imageToRemove.url]);
    }
    
    const newImages = value.filter((_, i) => i !== index);
    
    // Si on supprime l'image principale, la première image devient principale
    if (imageToRemove.isMain && newImages.length > 0) {
      newImages[0].isMain = true;
    }
    
    // Réajuster l'ordre
    newImages.forEach((img, i) => {
      img.order = i;
    });
    
    onChange(newImages);
  };

  const handleSetMain = (index: number) => {
    const newImages = value.map((img, i) => ({
      ...img,
      isMain: i === index,
    }));
    onChange(newImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= value.length) return;
    
    const newImages = [...value];
    const [movedItem] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedItem);
    
    // Réajuster l'ordre
    newImages.forEach((img, i) => {
      img.order = i;
    });
    
    onChange(newImages);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading || value.length >= maxImages}
      />

      {/* Grille d'images */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {value.map((image, index) => (
            <div
              key={image.id || image.url}
              className="relative group"
            >
              <div className="relative h-32 w-full overflow-hidden rounded-lg border-2 border-gray-200">
                <Image
                  src={image.url}
                  alt={`Image ${index + 1}`}
                  fill
                  className="object-cover"
                />
                
                {/* Badge image principale */}
                {image.isMain && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Principale
                  </div>
                )}

                {/* Overlay avec actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {/* Boutons de déplacement */}
                  {index > 0 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => moveImage(index, index - 1)}
                    >
                      ←
                    </Button>
                  )}
                  
                  {!image.isMain && (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => handleSetMain(index)}
                      title="Définir comme image principale"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    onClick={() => handleRemove(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  {index < value.length - 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => moveImage(index, index + 1)}
                    >
                      →
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Numéro d'ordre */}
              <div className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bouton d'ajout */}
      {value.length < maxImages && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="relative w-full h-32 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100"
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-600">
                Ajouter des images ({value.length}/{maxImages})
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG jusqu'à 5MB - Sélection multiple
              </p>
            </>
          )}
        </button>
      )}

      {/* Instructions */}
      {value.length > 0 && (
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Cliquez sur l'étoile pour définir l'image principale</p>
          <p>• Utilisez les flèches pour réorganiser les images</p>
          <p>• Survolez une image pour voir les actions disponibles</p>
        </div>
      )}
      
      {/* Cleanup effect pour les images temporaires non sauvegardées */}
      {useEffect(() => {
        return () => {
          // Cleanup des images uploadées mais non sauvegardées lors du démontage
          const tempImages = value.filter(img => !img.id && img.url);
          tempImages.forEach(async (img) => {
            try {
              await fetch(`/api/delete-image?url=${encodeURIComponent(img.url)}`, {
                method: 'DELETE',
              });
            } catch (error) {
              console.error('Erreur lors du cleanup:', error);
            }
          });
        };
      }, [])}
    </div>
  );
}