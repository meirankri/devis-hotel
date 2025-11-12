import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';

interface SubPeriod {
  id: string;
  name: string;
  startDate: string;  // Les dates viennent du serveur comme strings ISO
  endDate: string;    // Les dates viennent du serveur comme strings ISO
  stayId: string;
  order: number;
  hasPricing?: boolean;  // Optionnel, indique si des prix sont configurés
}

interface CreateSubPeriodData {
  name: string;
  startDate: Date;
  endDate: Date;
  order?: number;
}

interface UpdateSubPeriodData extends Partial<CreateSubPeriodData> {
  id: string;
}

/**
 * Récupère les sous-périodes pour un séjour donné
 *
 * @param stayId - L'ID du séjour
 * @param options - Options de configuration
 * @returns Résultat de la query avec les données des sous-périodes
 *
 * @example
 * ```tsx
 * function MyComponent({ stayId }: Props) {
 *   const { data: subPeriods, isLoading, error } = useSubPeriods(stayId);
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorMessage />;
 *
 *   return <SubPeriodsList periods={subPeriods} />;
 * }
 * ```
 *
 * Bénéfices par rapport à useEffect :
 * - Gestion automatique du loading/error
 * - Cache intelligent (30 secondes)
 * - Déduplication des requêtes
 * - Refetch automatique en arrière-plan
 * - Pas de race conditions
 */
export function useSubPeriods(
  stayId: string,
  options?: {
    enabled?: boolean;
    onError?: (error: Error) => void;
    onSuccess?: (data: SubPeriod[]) => void;
  }
) {
  return useQuery({
    queryKey: ['sub-periods', stayId],
    queryFn: async () => {
      const response = await fetch(`/api/stays/${stayId}/sub-periods`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors du chargement des sous-périodes');
      }

      const json = await response.json();
      return (json.data || []) as SubPeriod[];
    },
    // Les données restent fraîches pendant 30 secondes
    staleTime: 30000,
    // Garde en cache pendant 5 minutes
    gcTime: 5 * 60 * 1000,
    // Réessaie une fois en cas d'échec
    retry: 1,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Mutation pour créer une nouvelle sous-période
 * Avec update optimiste pour une meilleure UX
 */
export function useCreateSubPeriod(stayId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSubPeriodData) => {
      const response = await fetch(`/api/stays/${stayId}/sub-periods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Erreur lors de la création');
      }

      return response.json();
    },

    // Update optimiste - l'UI se met à jour avant la réponse du serveur
    onMutate: async (newPeriod) => {
      // Annule les requêtes en cours pour éviter de les écraser
      await queryClient.cancelQueries({ queryKey: ['sub-periods', stayId] });

      // Sauvegarde l'état actuel pour rollback en cas d'erreur
      const previousPeriods = queryClient.getQueryData<SubPeriod[]>(['sub-periods', stayId]);

      // Mise à jour optimiste du cache
      queryClient.setQueryData(['sub-periods', stayId], (old: SubPeriod[] = []) => [
        ...old,
        {
          ...newPeriod,
          // Convertir les dates en strings ISO pour correspondre au type
          startDate: newPeriod.startDate.toISOString(),
          endDate: newPeriod.endDate.toISOString(),
          id: 'temp-' + Date.now(),
          stayId,
          order: newPeriod.order || old.length
        } as SubPeriod
      ]);

      // Retourne le contexte pour le rollback
      return { previousPeriods };
    },

    // Rollback en cas d'erreur
    onError: (error, _newPeriod, context) => {
      if (context?.previousPeriods) {
        queryClient.setQueryData(['sub-periods', stayId], context.previousPeriods);
      }

      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },

    // Refetch après succès pour avoir les vraies données du serveur
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-periods', stayId] });
      toast({
        title: "Succès",
        description: "La sous-période a été créée avec succès",
      });
    },
  });
}

/**
 * Mutation pour mettre à jour une sous-période
 */
export function useUpdateSubPeriod(stayId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateSubPeriodData) => {
      const response = await fetch(`/api/sub-periods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Erreur lors de la mise à jour');
      }

      return response.json();
    },

    // Update optimiste
    onMutate: async (updatedPeriod) => {
      await queryClient.cancelQueries({ queryKey: ['sub-periods', stayId] });

      const previousPeriods = queryClient.getQueryData<SubPeriod[]>(['sub-periods', stayId]);

      queryClient.setQueryData(['sub-periods', stayId], (old: SubPeriod[] = []) =>
        old.map(period =>
          period.id === updatedPeriod.id
            ? {
                ...period,
                ...updatedPeriod,
                // Convertir les dates si elles sont fournies
                ...(updatedPeriod.startDate && { startDate: updatedPeriod.startDate.toISOString() }),
                ...(updatedPeriod.endDate && { endDate: updatedPeriod.endDate.toISOString() })
              }
            : period
        )
      );

      return { previousPeriods };
    },

    onError: (error, _updatedPeriod, context) => {
      if (context?.previousPeriods) {
        queryClient.setQueryData(['sub-periods', stayId], context.previousPeriods);
      }

      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-periods', stayId] });
      toast({
        title: "Succès",
        description: "La sous-période a été mise à jour",
      });
    },
  });
}

/**
 * Mutation pour supprimer une sous-période
 */
export function useDeleteSubPeriod(stayId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subPeriodId: string) => {
      const response = await fetch(`/api/sub-periods/${subPeriodId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Erreur lors de la suppression');
      }

      return response.json();
    },

    // Update optimiste
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['sub-periods', stayId] });

      const previousPeriods = queryClient.getQueryData<SubPeriod[]>(['sub-periods', stayId]);

      queryClient.setQueryData(['sub-periods', stayId], (old: SubPeriod[] = []) =>
        old.filter(period => period.id !== deletedId)
      );

      return { previousPeriods };
    },

    onError: (error, _deletedId, context) => {
      if (context?.previousPeriods) {
        queryClient.setQueryData(['sub-periods', stayId], context.previousPeriods);
      }

      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-periods', stayId] });
      toast({
        title: "Succès",
        description: "La sous-période a été supprimée",
      });
    },
  });
}