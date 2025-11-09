import React from 'react';
import type { Property, Filters } from '../types';
import { PropertyCard } from './PropertyCard';
import {
  PROPERTY_TYPES,
  PRICE_RANGES,
  BEDROOM_OPTIONS,
  YEAR_BUILT_RANGES,
  PRICE_PER_SQM_RANGES,
  SIZE_RANGES
} from '../constants';
import { applyFilters } from '../utils';
import { ScaleIcon } from './icons/ScaleIcon';
import { LinkIcon } from './icons/LinkIcon';

interface FavoritesListProps {
  properties: Property[];
  favorites: Property[];
  filters: Filters;
  onSelectProperty: (property: Property) => void;
  onToggleFavorite: (property: Property) => void;
  onFilterChange: (name: keyof Filters, value: string) => void;
  onClearFilters: () => void;
  comparisonList: Property[];
  onToggleCompare: (property: Property) => void;
}

const FilterSelect: React.FC<{
  label: string;
  name: keyof Filters;
  value: string;
  options: readonly { value: string; label: string }[] | { value: string; label: string }[];
  onChange: (name: keyof Filters, value: string) => void;
}> = ({ label, name, value, options, onChange }) => (
  <div>
    <label htmlFor={name} className="block text-xs font-medium text-gray-500 mb-1">
      {label}
    </label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={(e) => onChange(name, e.target.value)}
      className="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md bg-gray-50 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
    >
      {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        )
      )}
    </select>
  </div>
);


export const FavoritesList: React.FC<FavoritesListProps> = ({
  properties,
  favorites,
  filters,
  onSelectProperty,
  onToggleFavorite,
  onFilterChange,
  onClearFilters,
  comparisonList,
  onToggleCompare,
}) => {
  const filteredProperties = applyFilters(properties, filters);

  const filterOptions = [
    { label: '類型', name: 'type', options: [{ value: 'all', label: '所有類型' }, ...PROPERTY_TYPES.map(t => ({value: t, label: t}))] },
    { label: '總價', name: 'price', options: PRICE_RANGES },
    { label: '格局', name: 'bedrooms', options: BEDROOM_OPTIONS },
    { label: '屋齡', name: 'yearBuilt', options: YEAR_BUILT_RANGES },
    { label: '坪數', name: 'size', options: SIZE_RANGES },
    { label: '單價', name: 'pricePerSqm', options: PRICE_PER_SQM_RANGES }
  ] as const;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-black space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-y-2">
        <div className="flex items-center gap-3">
            <a 
              href="https://lvr.land.moi.gov.tw/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
              title="資料來源：內政部不動產交易實價查詢服務"
            >
              <LinkIcon className="h-4 w-4" />
              <span>資料來源</span>
            </a>
        </div>
        <button
          onClick={onClearFilters}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          清除篩選
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 border-t border-b border-gray-200 py-4">
        {filterOptions.map(filter => (
          <FilterSelect
            key={filter.name}
            label={filter.label}
            name={filter.name}
            value={filters[filter.name]}
            options={filter.options}
            onChange={onFilterChange}
          />
        ))}
      </div>

      <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2 -mr-2">
        {filteredProperties.length > 0 ? (
          filteredProperties.map(property => (
            <PropertyCard
              key={property.id}
              property={property}
              onSelect={onSelectProperty}
              onToggleFavorite={onToggleFavorite}
              isFavorite={favorites.some(fav => fav.id === property.id)}
              isInCompareList={comparisonList.some(p => p.id === property.id)}
              onToggleCompare={onToggleCompare}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">
              沒有找到符合條件的房產。
              <br />
              請試著放寬您的篩選條件。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};