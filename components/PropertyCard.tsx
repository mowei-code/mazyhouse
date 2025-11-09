import React from 'react';
import type { Property } from '../types';
import { StarIconSolid } from './icons/StarIconSolid';
import { StarIconOutline } from './icons/StarIconOutline';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { TagIcon } from './icons/TagIcon';
import { isSpecialTransaction } from '../utils';

interface PropertyCardProps {
  property: Property;
  onSelect: (property: Property) => void;
  onToggleFavorite: (property: Property) => void;
  isFavorite: boolean;
  isInCompareList: boolean;
  onToggleCompare: (property: Property) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onSelect, onToggleFavorite, isFavorite, isInCompareList, onToggleCompare }) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection when toggling favorite
    onToggleFavorite(property);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCompare(property);
  };
  
  const formatPrice = (price: number) => {
    return (price / 10000).toLocaleString('zh-TW', { maximumFractionDigits: 0 }) + ' 萬';
  };

  const showSpecialTransactionTag = isSpecialTransaction(property);

  return (
    <div 
      onClick={() => onSelect(property)}
      className="flex items-center gap-4 p-3 bg-white rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 ease-in-out hover:shadow-md hover:scale-[1.02] border border-gray-200"
    >
      <img src={property.imageUrl} alt={property.address} className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
      <div className="flex-grow min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{property.address}</p>
        <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-2">
            <span>{`${property.district} | ${property.type} | ${property.floor} | ${(property.size / 3.30579).toFixed(1)} 坪`}</span>
            {property.transactionDate && (
                <>
                    <span className="text-gray-300">|</span>
                    <span>交易: {property.transactionDate}</span>
                </>
            )}
            {showSpecialTransactionTag && (
               <>
                <span className="text-gray-300">|</span>
                <span 
                  className="flex items-center gap-1 text-amber-700 font-semibold"
                  title={property.remarks}
                >
                    <TagIcon className="h-3 w-3" />
                    特殊交易
                </span>
               </>
            )}
        </div>
        <p className="text-sm font-bold text-blue-600 mt-1">{formatPrice(property.price)}</p>
      </div>
      <div className="flex-shrink-0 flex flex-col items-center gap-2">
        <button 
          onClick={handleFavoriteClick} 
          className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
          title={isFavorite ? '從收藏中移除' : '加入收藏'}
        >
          {isFavorite ? <StarIconSolid className="h-5 w-5 text-yellow-400" /> : <StarIconOutline className="h-5 w-5" />}
        </button>
        <button
          onClick={handleCompareClick}
          className={`p-1 rounded-full transition-colors ${isInCompareList ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-100'}`}
          title={isInCompareList ? '從比較中移除' : '加入比較'}
        >
          {isInCompareList ? <CheckCircleIcon className="h-5 w-5" /> : <PlusCircleIcon className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
};