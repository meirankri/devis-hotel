import React from "react";
import { Bed } from "lucide-react";
import type { Room } from "@/types/quote";

interface RoomCardProps {
  room: Room;
  onClick: () => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all text-left group"
    >
      {room.imageUrl && (
        <div className="h-32 w-full overflow-hidden rounded-lg mb-3">
          <img
            src={room.imageUrl}
            alt={room.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </div>
      )}
      
      <div className="flex items-center gap-2 mb-2">
        <Bed className="h-4 w-4 text-blue-600" />
        <span className="font-semibold text-gray-900">{room.name}</span>
      </div>
      
      {room.description && (
        <div 
          className="text-sm text-gray-600 mb-2 line-clamp-2"
          dangerouslySetInnerHTML={{ __html: room.description }}
        />
      )}
      
      <p className="text-sm text-gray-600">
        Capacité: {room.capacity} personne{room.capacity > 1 ? 's' : ''}
      </p>
    </button>
  );
};