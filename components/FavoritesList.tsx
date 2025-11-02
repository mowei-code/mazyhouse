import React, { useState, useMemo } from 'react';
import type { Property, Filters } from '../types';
import { PropertyCard } from './PropertyCard';
import { StarIconSolid } from './icons/StarIconSolid';
import { BuildingOfficeIcon } from './icons/BuildingOfficeIcon';
import { PROPERTY_TYPES, PRICE_RANGES, BEDROOM_OPTIONS, YEAR_BUILT_RANGES, PRICE_PER_SQM_RANGES, SIZE_RANGES, initialFilters } from '../constants';
import { applyFilters } from '../utils';


interface PropertyListProps {
  properties: Property[];
  favorites: Property[];
  filters: Filters;
  onSelectProperty: (property: Property) => void;
  onToggleFavorite: (property: Property) => void;
  onFilterChange: (name: string, value: string) => void;
  onClearFilters: () => void;
}


export const FavoritesList: React.FC<PropertyListProps> = ({ properties, favorites, filters, onSelectProperty, onToggleFavorite, onFilterChange, onClearFilters }) => {
  const [view, setView] = useState<'all' | 'favorites'>('all');
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange(e.target.name, e.target.value);
  };

  const filteredList = useMemo(() => {
    const sourceList = view === 'all' ? properties : favorites;
    return applyFilters(sourceList, filters);
  }, [view, properties, favorites, filters]);

  const getTabClassName = (tabName: 'all' | 'favorites') => {
    const base = "inline-flex items-center justify-center px-4 py-3 border-b-2 font-medium text-sm transition-colors";
    if (view === tabName) {
      return `${base} border-blue-600 text-blue-600`;
    }
    return `${base} border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300`;
  };

  const sourceList = view === 'all' ? properties : favorites;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800">房產列表</h3>
        {sourceList.length > 0 && <span className="text-sm font-medium bg-slate-200 text-slate-600 rounded-full px-2 py-0.5">{filteredList.length} / {sourceList.length}</span>}
      </div>

       <div className="border-b border-slate-200 -mx-6 px-6">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          <button onClick={() => setView('all')} className={getTabClassName('all')}>
            <BuildingOfficeIcon className="h-5 w-5 mr-2" />
            <span>所有房產</span>
          </button>
          <button onClick={() => setView('favorites')} className={getTabClassName('favorites')}>
            <StarIconSolid className="h-5 w-5 mr-2 text-yellow-400" />
            <span>我的收藏</span>
          </button>
        </nav>
      </div>

      <div className="pt-2 space-y-3">
        <h4 className="text-sm font-semibold text-slate-500">篩選條件</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              name="type"
              aria-label="Filter by property type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full text-sm pl-3 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 bg-white"
            >
              <option value="all">所有類型</option>
              {PROPERTY_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              name="price"
              aria-label="Filter by price range"
              value={filters.price}
              onChange={handleFilterChange}
              className="w-full text-sm pl-3 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 bg-white"
            >
              {PRICE_RANGES.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
            <select
              name="bedrooms"
              aria-label="Filter by number of bedrooms"
              value={filters.bedrooms}
              onChange={handleFilterChange}
              className="w-full text-sm pl-3 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 bg-white"
            >
              {BEDROOM_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              name="yearBuilt"
              aria-label="Filter by year built"
              value={filters.yearBuilt}
              onChange={handleFilterChange}
              className="w-full text-sm pl-3 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 bg-white"
            >
              {YEAR_BUILT_RANGES.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
            <select
              name="pricePerSqm"
              aria-label="Filter by price per square meter"
              value={filters.pricePerSqm}
              onChange={handleFilterChange}
              className="w-full text-sm pl-3 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 bg-white"
            >
              {PRICE_PER_SQM_RANGES.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
            <select
              name="size"
              aria-label="Filter by size in ping"
              value={filters.size}
              onChange={handleFilterChange}
              className="w-full text-sm pl-3 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 bg-white"
            >
              {SIZE_RANGES.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
        </div>
        <div className="flex justify-end pt-1">
            <button
                onClick={onClearFilters}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors disabled:text-slate-400 disabled:cursor-not-allowed"
                disabled={JSON.stringify(filters) === JSON.stringify(initialFilters)}
                aria-label="清除所有篩選條件"
            >
                清除篩選
            </button>
        </div>
      </div>
      
      <div className="border-t border-slate-200 pt-4">
        {sourceList.length === 0 ? (
          <p className="text-sm text-center text-slate-500 py-4">
            {view === 'favorites' 
                ? '尚未收藏任何房產。點擊估價報告旁的星號即可加入收藏。' 
                : '沒有可顯示的房產。'}
          </p>
        ) : filteredList.length > 0 ? (
          <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
            {filteredList.map(property => (
              <PropertyCard
                key={property.id}
                property={property}
                onSelect={onSelectProperty}
                onToggleFavorite={onToggleFavorite}
                isFavorite={favorites.some(fav => fav.id === property.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-center text-slate-500 py-4">
            沒有符合篩選條件的項目。
          </p>
        )}
      </div>
    </div>
  );
};