import React from 'react';
import type { Property } from '../types';
// Fix: Correctly import named exports StarIconSolid and StarIconOutline.
import { StarIconSolid } from './icons/StarIconSolid';
import { StarIconOutline } from './icons/StarIconOutline';

interface PropertyCardProps {
  property: Property;
  onSelect: (property: Property) => void;
  onToggleFavorite: (property: Property) => void;
  isFavorite: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onSelect, onToggleFavorite, isFavorite }) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection when toggling favorite
    onToggleFavorite(property);
  };
  
  const formatPrice = (price: number) => {
    return (price / 10000).toLocaleString('zh-TW', { maximumFractionDigits: 0 }) + ' 萬';
  };

  return (
    <div 
      onClick={() => onSelect(property)}
      className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors duration-150"
    >
      <img src={property.imageUrl} alt={property.address} className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
      <div className="flex-grow min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{property.address}</p>
        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2">
            <span>{`${property.district} | ${property.type} | ${property.floor} | ${(property.size / 3.30579).toFixed(1)} 坪`}</span>
            {property.transactionDate && (
                <>
                    <span className="text-slate-300">|</span>
                    <span>交易: {property.transactionDate}</span>
                </>
            )}
        </div>
        <p className="text-sm font-bold text-blue-600 mt-1">{formatPrice(property.price)}</p>
      </div>
      <button onClick={handleFavoriteClick} className="p-2 text-slate-400 hover:text-yellow-500 transition-colors flex-shrink-0">
        {isFavorite ? <StarIconSolid className="h-5 w-5 text-yellow-400" /> : <StarIconOutline className="h-5 w-5" />}
      </button>
    </div>
  );
};