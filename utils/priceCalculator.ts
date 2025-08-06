// Types pour les différentes structures de données
interface RoomPricing {
  ageRangeId: string;
  price: number;
}

interface Room {
  id: string;
  name: string;
  capacity: number;
  roomPricings: RoomPricing[];
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
 * Calcule le prix total pour les chambres sélectionnées dans le formulaire
 * Prix par séjour complet (pas par nuit)
 */
export function calculatePriceFromRoomSelections(
  selectedRooms: RoomSelection[]
): number {
  let total = 0;

  selectedRooms.forEach(({ room, instances }) => {
    instances.forEach((instance) => {
      Object.entries(instance.occupants).forEach(([ageRangeId, count]) => {
        const pricing = room.roomPricings.find(
          (rp) => rp.ageRangeId === ageRangeId
        );
        if (pricing && count > 0) {
          // Prix par séjour complet
          total += pricing.price * count;
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
        console.log(
          `Participant ${
            participant.ageRangeId
          }: avgPrice ${avgPrice} * count ${participant.count} = ${
            avgPrice * participant.count
          }`
        );
      }
    }
  });

  console.log("Total calculated from quote data:", total);
  return total;
}

/**
 * Calcule le prix total pour un devis avec occupants par chambre (nouvelle structure)
 * Prix par séjour complet (pas par nuit)
 */
export function calculatePriceFromRoomOccupants(
  rooms: QuoteRoomWithOccupants[]
): number {
  let total = 0;

  rooms.forEach((qr) => {
    if (qr.quoteRoomOccupants && qr.quoteRoomOccupants.length > 0) {
      qr.quoteRoomOccupants.forEach((occupant) => {
        const pricing = qr.room.roomPricings.find(
          (rp) => rp.ageRangeId === occupant.ageRangeId
        );
        if (pricing && occupant.count > 0) {
          console.log(
            "Adding to total:",
            pricing.price,
            "*",
            occupant.count,
            "=",
            pricing.price * occupant.count
          );
          total += pricing.price * occupant.count;
        }
      });
    }
  });

  return total;
}

/**
 * Fonction universelle qui détecte le type de données et calcule le prix approprié
 */
export function calculateQuotePrice(data: any): number {
  console.log("calculateQuotePrice called with data structure check");

  // Si c'est des selections de chambres (QuoteFormV2)
  if (Array.isArray(data) && data[0]?.instances) {
    console.log("Using calculatePriceFromRoomSelections");
    return calculatePriceFromRoomSelections(data);
  }

  // Si c'est un objet quote avec quoteRooms ayant des quoteRoomOccupants NON VIDES
  if (data.quoteRooms && data.quoteRooms.length > 0) {
    // Vérifier si au moins une room a des quoteRoomOccupants avec des données
    const hasRoomOccupants = data.quoteRooms.some(
      (qr: any) => qr.quoteRoomOccupants && qr.quoteRoomOccupants.length > 0
    );

    if (hasRoomOccupants) {
      console.log("Using calculatePriceFromRoomOccupants");
      return calculatePriceFromRoomOccupants(data.quoteRooms);
    }
  }

  // Si c'est un objet quote avec participants et rooms (structure classique)
  if (data.quoteParticipants && data.quoteRooms) {
    console.log("Using calculatePriceFromQuoteData");
    console.log("Participants:", data.quoteParticipants.length);
    console.log("Rooms:", data.quoteRooms.length);
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
