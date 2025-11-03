import React from 'react';
import type { Property } from '../types';
import { ClockIcon } from './icons/ClockIcon';

interface RecentSearchesListProps {
  searches: Property[];
  onSelect: (property: Property) => void;
}

export const RecentSearchesList: React.FC<RecentSearchesListProps> = ({ searches, onSelect }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
      <div className="flex items-center gap-3">
        <ClockIcon className="h-6 w-6 text-slate-500" />
        <h3 className="text-xl font-bold text-slate-800">最近查詢</h3>
      </div>
      
      <div className="border-t border-slate-200 pt-4">
        {searches.length === 0 ? (
          <p className="text-sm text-center text-slate-500 py-4">
            您的查詢紀錄將會顯示在這裡。
          </p>
        ) : (
          <div className="space-y-2">
            {searches.map(property => (
              <button
                key={`${property.id}-${property.address}`}
                onClick={() => onSelect(property)}
                className="w-full text-left p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors duration-150"
                aria-label={`查詢地址： ${property.address}`}
              >
                <p className="text-sm font-semibold text-slate-800 truncate">{property.address}</p>
                <p className="text-xs text-slate-500">{property.district}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
