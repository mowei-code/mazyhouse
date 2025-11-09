import React from 'react';
import type { Property } from '../types';
import { ClockIcon } from './icons/ClockIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface RecentSearchesListProps {
  searches: Property[];
  onSelect: (property: Property) => void;
  comparisonList: Property[];
  onToggleCompare: (property: Property) => void;
}

export const RecentSearchesList: React.FC<RecentSearchesListProps> = ({ searches, onSelect, comparisonList, onToggleCompare }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-black space-y-4">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <ClockIcon className="h-6 w-6" />
        最近查詢紀錄
      </h3>
      <div className="border-t border-gray-200 pt-4">
        {searches.length === 0 ? (
          <p className="text-sm text-center text-gray-500 py-4">
            您的查詢紀錄將會顯示在這裡。
          </p>
        ) : (
          <div className="space-y-2">
            {searches.map(property => {
              const isInCompareList = comparisonList.some(p => p.id === property.id);
              return (
                <div key={`${property.id}-${property.address}`} className="flex items-center gap-2">
                  <button
                    onClick={() => onSelect(property)}
                    className="flex-grow text-left p-3 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors duration-150"
                    aria-label={`查詢地址： ${property.address}`}
                  >
                    <p className="text-sm font-semibold text-gray-800 truncate">{property.address}</p>
                    <p className="text-xs text-gray-500">{property.district}</p>
                  </button>
                  <button
                    onClick={() => onToggleCompare(property)}
                    className={`flex-shrink-0 p-2 rounded-full transition-colors ${isInCompareList ? 'text-green-600 hover:bg-green-100' : 'text-gray-500 hover:bg-gray-100'}`}
                    title={isInCompareList ? '從比較中移除' : '加入比較'}
                  >
                    {isInCompareList ? <CheckCircleIcon className="h-6 w-6" /> : <PlusCircleIcon className="h-6 w-6" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};