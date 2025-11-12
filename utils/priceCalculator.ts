// Types pour les différentes structures de données
interface RoomPricing {
  ageRangeId: string;
  price: number;
  subPeriodId?: string | null;
}

interface Room {
  id: string;
  name: string;
  capacity: number;
  roomPricings: RoomPricing[];
}

interface SelectedSubPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

// Structure pour QuoteFormV2.tsx
interface RoomInstance {
  id: string;
  occupants: { [ageRangeId: string]: number };
}

interface RoomSelection {
  roomId: string;
  room: Room;
  instances: RoomInstance[];
}

// Structure pour les devis depuis la DB
interface QuoteParticipant {
  ageRangeId: string;
  count: number;
}

interface QuoteRoom {
  room: Room;
  quantity: number;
}

interface QuoteRoomOccupant {
  ageRangeId: string;
  count: number;
}

interface QuoteRoomWithOccupants {
  room: Room;
  quoteRoomOccupants: QuoteRoomOccupant[];
}

/**
 * Calcule le prix TOTAL pour une personne d'une tranche d'âge donnée à travers toutes les sous-périodes sélectionnées.
 *
 * IMPORTANT : Cette fonction ADDITIONNE les prix de chaque sous-période.
 * Par exemple : Si Semaine 1 = 500€ et Semaine 2 = 600€, le prix total sera 1100€ par personne.
 *
 * Stratégie de tarification :
 * 1. Si aucune sous-période n'est sélectionnée → retourne le prix global du séjour
 * 2. Pour chaque sous-période sélectionnée :
 *    - Cherche d'abord un prix spécifique à cette sous-période
 *    - Si non trouvé, utilise le prix global comme fallback
 *    - ADDITIONNE tous ces prix pour obtenir le total
 *
 * @param room - La chambre contenant les informations de tarification
 * @param ageRangeId - L'ID de la tranche d'âge (ex: "adult", "child", "infant")
 * @param selectedSubPeriods - Les sous-périodes sélectionnées (optionnel)
 * @returns Le prix total par personne en euros (somme de toutes les périodes)
 *
 * @example
 * // Exemple avec 2 sous-périodes
 * const room = {
 *   roomPricings: [
 *     { ageRangeId: "adult", subPeriodId: "week1", price: 500 },
 *     { ageRangeId: "adult", subPeriodId: "week2", price: 600 },
 *     { ageRangeId: "adult", subPeriodId: null, price: 1000 } // Prix global (fallback)
 *   ]
 * };
 *
 * const selectedPeriods = [
 *   { id: "week1", name: "Semaine 1" },
 *   { id: "week2", name: "Semaine 2" }
 * ];
 *
 * const price = calculateTotalPricePerPersonAcrossSubPeriods(room, "adult", selectedPeriods);
 * // Retourne : 1100 (500 + 600)
 */
function calculateTotalPricePerPersonAcrossSubPeriods(
  room: Room,
  ageRangeId: string,
  selectedSubPeriods?: SelectedSubPeriod[]
): number {
  // Si pas de sous-périodes sélectionnées, retourner le prix global du séjour complet
  if (!selectedSubPeriods || selectedSubPeriods.length === 0) {
    const globalPricing = room.roomPricings.find(
      (rp) => rp.ageRangeId === ageRangeId && !rp.subPeriodId
    );
    return globalPricing ? Number(globalPricing.price) : 0;
  }

  // SOMME des prix pour toutes les sous-périodes sélectionnées
  let totalPrice = 0;
  selectedSubPeriods.forEach((subPeriod) => {
    // Chercher d'abord un prix spécifique pour cette sous-période
    const subPeriodPricing = room.roomPricings.find(
      (rp) => rp.ageRangeId === ageRangeId && rp.subPeriodId === subPeriod.id
    );

    if (subPeriodPricing) {
      // Prix spécifique trouvé pour cette sous-période
      totalPrice += Number(subPeriodPricing.price);
    } else {
      // Pas de prix spécifique → utiliser le prix global comme fallback
      const globalPricing = room.roomPricings.find(
        (rp) => rp.ageRangeId === ageRangeId && !rp.subPeriodId
      );
      totalPrice += globalPricing ? Number(globalPricing.price) : 0;
    }
  });

  return totalPrice;
}

// Pour compatibilité avec l'ancien nom (deprecated - à supprimer dans une future version)
const calculatePriceForAgeRange = calculateTotalPricePerPersonAcrossSubPeriods;

// Export de la nouvelle fonction pour usage externe
export { calculateTotalPricePerPersonAcrossSubPeriods };

/**
 * Récupère le prix d'une chambre pour une tranche d'âge spécifique et optionnellement une sous-période.
 * Avec fallback vers le prix global si pas de prix spécifique à la sous-période.
 *
 * @param room - La chambre avec les informations de prix
 * @param ageRangeId - L'ID de la tranche d'âge
 * @param subPeriodId - L'ID de la sous-période (optionnel)
 * @returns Le prix en euros, ou 0 si aucun prix trouvé
 *
 * @example
 * // Prix global (sans sous-période)
 * const globalPrice = getRoomPriceForAgeRange(room, "adult");
 *
 * // Prix pour une sous-période spécifique avec fallback
 * const periodPrice = getRoomPriceForAgeRange(room, "adult", "week1");
 * // Si pas de prix week1, retourne le prix global
 */
export function getRoomPriceForAgeRange(
  room: { roomPricings?: RoomPricing[] },
  ageRangeId: string,
  subPeriodId?: string | null
): number {
  if (!room.roomPricings) return 0;

  // Chercher d'abord le prix exact (avec ou sans sous-période)
  const exactPricing = room.roomPricings.find(
    (rp) => rp.ageRangeId === ageRangeId && rp.subPeriodId === subPeriodId
  );

  if (exactPricing) {
    return Number(exactPricing.price);
  }

  // Si une sous-période était demandée mais pas de prix trouvé,
  // faire un fallback vers le prix global
  if (subPeriodId) {
    const globalPricing = room.roomPricings.find(
      (rp) => rp.ageRangeId === ageRangeId && !rp.subPeriodId
    );
    return globalPricing ? Number(globalPricing.price) : 0;
  }

  return 0;
}

/**
 * Calcule le prix total pour les chambres sélectionnées dans le formulaire
 * Prix par séjour complet (pas par nuit)
 */
export function calculatePriceFromRoomSelections(
  selectedRooms: RoomSelection[],
  selectedSubPeriods?: SelectedSubPeriod[]
): number {
  let total = 0;

  selectedRooms.forEach(({ room, instances }) => {
    instances.forEach((instance) => {
      Object.entries(instance.occupants).forEach(([ageRangeId, count]) => {
        if (count > 0) {
          const pricePerPerson = calculateTotalPricePerPersonAcrossSubPeriods(
            room,
            ageRangeId,
            selectedSubPeriods
          );
          // Prix par séjour complet
          total += pricePerPerson * count;
        }
      });
    });
  });

  return total;
}

/**
 * Calcule le prix total pour un devis avec participants et chambres
 * Prix par séjour complet (pas par nuit)
 */
export function calculatePriceFromQuoteData(
  participants: QuoteParticipant[],
  rooms: QuoteRoom[]
): number {
  let total = 0;

  participants.forEach((participant) => {
    if (participant.count > 0) {
      const roomPrices: number[] = [];

      rooms.forEach((qr) => {
        const pricing = qr.room.roomPricings.find(
          (rp) => rp.ageRangeId === participant.ageRangeId
        );
        if (pricing) {
          roomPrices.push(Number(pricing.price) * qr.quantity);
        }
      });

      if (roomPrices.length > 0) {
        const avgPrice =
          roomPrices.reduce((sum, price) => sum + price, 0) / roomPrices.length;
        // Prix par séjour complet, pas par nuit
        total += avgPrice * participant.count;
      }
    }
  });

  return total;
}

/**
 * Calcule le prix total pour un devis avec occupants par chambre (nouvelle structure)
 * Prix par séjour complet (pas par nuit)
 */
export function calculatePriceFromRoomOccupants(
  rooms: QuoteRoomWithOccupants[],
  selectedSubPeriods?: SelectedSubPeriod[]
): number {
  let total = 0;

  rooms.forEach((qr) => {
    if (qr.quoteRoomOccupants && qr.quoteRoomOccupants.length > 0) {
      qr.quoteRoomOccupants.forEach((occupant) => {
        if (occupant.count > 0) {
          const pricePerPerson = calculatePriceForAgeRange(
            qr.room,
            occupant.ageRangeId,
            selectedSubPeriods
          );
          total += pricePerPerson * occupant.count;
        }
      });
    }
  });

  return total;
}

/**
 * Fonction universelle qui détecte le type de données et calcule le prix approprié
 */
export function calculateQuotePrice(data: any, selectedSubPeriods?: SelectedSubPeriod[]): number {
  // Si c'est des selections de chambres (QuoteFormV2)
  if (Array.isArray(data) && data[0]?.instances) {
    return calculatePriceFromRoomSelections(data, selectedSubPeriods);
  }

  // Si c'est un objet quote avec quoteRooms ayant des quoteRoomOccupants NON VIDES
  if (data.quoteRooms && data.quoteRooms.length > 0) {
    // Vérifier si au moins une room a des quoteRoomOccupants avec des données
    const hasRoomOccupants = data.quoteRooms.some(
      (qr: any) => qr.quoteRoomOccupants && qr.quoteRoomOccupants.length > 0
    );

    if (hasRoomOccupants) {
      return calculatePriceFromRoomOccupants(data.quoteRooms, selectedSubPeriods);
    }
  }

  // Si c'est un objet quote avec participants et rooms (structure classique)
  if (data.quoteParticipants && data.quoteRooms) {
    return calculatePriceFromQuoteData(data.quoteParticipants, data.quoteRooms);
  }

  console.warn("Structure de données non reconnue pour le calcul du prix");
  return 0;
}

/**
 * Calcule le prix moyen par tranche d'âge à partir de toutes les chambres
 */
export function calculateAveragePrice(
  ageRangeId: string,
  rooms: Room[]
): number {
  const prices = rooms
    .flatMap((room) => room.roomPricings)
    .filter((rp) => rp.ageRangeId === ageRangeId)
    .map((rp) => Number(rp.price));

  if (prices.length === 0) return 0;

  return prices.reduce((sum, price) => sum + price, 0) / prices.length;
}
