import { useQuery } from '@tanstack/react-query';

interface UseRoomPricingParams {
  roomIds: string[];
  enabled?: boolean;
}

interface PricingData {
  [subPeriodKey: string]: {
    [ageRangeId: string]: number;
  };
}

interface ApiResponse {
  success: boolean;
  data?: {
    pricing: PricingData;
    ageRanges?: unknown[];
    stays?: unknown[];
  };
}

export function useRoomPricing({ roomIds, enabled = true }: UseRoomPricingParams) {
  return useQuery({
    queryKey: ['room-pricing', roomIds],
    queryFn: async (): Promise<PricingData | null> => {
      if (!roomIds.length) return null;

      // Appels parallèles pour chaque chambre
      const promises = roomIds.map((roomId) =>
        fetch(`/api/rooms/${roomId}/pricing`, {
          credentials: 'include' // Inclure les cookies pour l'authentification
        })
          .then((res) => {
            if (!res.ok) throw new Error(`Failed to fetch pricing for room ${roomId}`);
            return res.json() as Promise<ApiResponse>;
          })
          .catch((error) => {
            console.error(`Error fetching pricing for room ${roomId}:`, error);
            return null;
          })
      );

      const results = await Promise.all(promises);

      // Filtrer les résultats valides
      const validResults = results.filter(
        (r): r is ApiResponse => r !== null && r.success === true && r.data?.pricing !== undefined
      );

      if (validResults.length === 0) return null;

      // Merger les résultats
      return mergeRoomPricing(validResults);
    },
    enabled: enabled && roomIds.length > 0,
    staleTime: 30000, // 30 secondes
    retry: 1,
  });
}

function mergeRoomPricing(results: ApiResponse[]): PricingData {
  const merged: PricingData = {};

  // Récupérer toutes les clés de sous-périodes
  const allPeriodKeys = new Set<string>();
  results.forEach((result) => {
    if (result.data?.pricing) {
      Object.keys(result.data.pricing).forEach((key) => allPeriodKeys.add(key));
    }
  });

  // Pour chaque sous-période (incluant 'global')
  allPeriodKeys.forEach((periodKey) => {
    merged[periodKey] = {};

    // Récupérer tous les age ranges pour cette période
    const ageRangeIds = new Set<string>();
    results.forEach((result) => {
      if (result.data?.pricing?.[periodKey]) {
        Object.keys(result.data.pricing[periodKey]).forEach((ageRangeId) =>
          ageRangeIds.add(ageRangeId)
        );
      }
    });

    // Pour chaque age range, vérifier la cohérence des prix
    ageRangeIds.forEach((ageRangeId) => {
      const prices: number[] = [];

      results.forEach((result) => {
        const price = result.data?.pricing?.[periodKey]?.[ageRangeId];
        if (price !== undefined && price !== null) {
          prices.push(Number(price));
        }
      });

      // Si tous les prix sont identiques, on les affiche
      if (prices.length > 0) {
        const uniquePrices = [...new Set(prices)];
        if (uniquePrices.length === 1) {
          merged[periodKey][ageRangeId] = uniquePrices[0];
        }
        // Si les prix diffèrent, on ne met rien (l'utilisateur devra définir un nouveau prix)
      }
    });
  });

  return merged;
}