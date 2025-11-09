import React, { useContext } from 'react';
import type { Property, ValuationReport, Filters, User } from '../types';
import { SearchForm } from './SearchForm';
import { ValuationReportDisplay } from './ValuationReportDisplay';
import { TabbedInfo } from './TabbedInfo';
import { ScaleIcon } from './icons/ScaleIcon';
import { MapIcon } from './icons/MapIcon';
import { BuildingOfficeIcon } from './icons/BuildingOfficeIcon';
import { AuthContext } from '../contexts/AuthContext';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';


interface MainPanelProps {
  onSearch: (
    address: string,
    reference: string,
    details?: { coords: { lat: number; lon: number }; district: string; city?: string },
    customInputs?: { size?: number; pricePerPing?: number; floor?: string }
  ) => void;
  onLocationSelect: (
    address: string,
    details: { coords: { lat: number; lon: number }; district: string; city?: string }
  ) => void;
  isLoading: boolean;
  selectedProperty: Property | null;
  valuation: ValuationReport | null;
  isValuating: boolean;
  error: string | null;
  favorites: Property[];
  onToggleFavorite: (property: Property) => void;
  onOpenHistory: () => void;
  transactionList: Property[];
  filters: Filters;
  onSelectProperty: (property: Property) => void;
  onFilterChange: (name: keyof Filters, value: string) => void;
  onClearFilters: () => void;
  comparisonList: Property[];
  onToggleCompare: (property: Property) => void;
  recentSearches: Property[];
  onSelectRecent: (property: Property) => void;
  onCompareClick: () => void;
  onOpenMap: () => void;
  currentUser: User | null;
}

export const MainPanel: React.FC<MainPanelProps> = (props) => {
  const { logout, setLoginModalOpen, setAdminPanelOpen } = useContext(AuthContext);
  const { currentUser } = props;

  return (
    <div className="bg-gray-100 rounded-2xl h-full overflow-y-auto space-y-4 p-1">
       <div className="bg-white rounded-2xl shadow-lg p-4 border-2 border-black">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 group">
            <div className="bg-blue-600 p-2 rounded-lg transition-transform duration-300 ease-in-out group-hover:rotate-[-12deg] group-hover:scale-110">
                <BuildingOfficeIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">AI 房產估價師</h1>
            </div>
            
            <div>
            {currentUser ? (
                <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 hidden sm:flex items-center gap-2">
                    <UserCircleIcon className="h-5 w-5" />
                    {currentUser.email}
                </span>
                {currentUser.role === '管理員' && (
                    <button onClick={() => setAdminPanelOpen(true)} className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1.5" title="管理後台">
                    <Cog6ToothIcon className="h-5 w-5" />
                    <span className="hidden md:inline">管理後台</span>
                    </button>
                )}
                <button onClick={logout} className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors flex items-center gap-1.5" title="登出">
                    <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                    <span className="hidden md:inline">登出</span>
                </button>
                </div>
            ) : (
                <button
                onClick={() => setLoginModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
                >
                登入 / 註冊
                </button>
            )}
            </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-black">
        <div className="mb-6 pb-6 border-b border-gray-200">
           <button
              onClick={props.onOpenMap}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-all transform hover:scale-105"
           >
              <MapIcon className="h-5 w-5" />
              <span>地圖查詢</span>
           </button>
           <p className="text-xs text-gray-500 mt-2 text-center">
            點擊以開啟地圖，您可以在地圖上拖動標記來選擇位置進行估價。
           </p>
        </div>

        <SearchForm 
          onSearch={props.onSearch} 
          onLocationSelect={props.onLocationSelect}
          isLoading={props.isLoading} 
          initialAddress={props.selectedProperty?.address || ''} 
          currentUser={props.currentUser}
        />
        {props.selectedProperty && (
          <ValuationReportDisplay
            property={props.selectedProperty}
            valuation={props.valuation}
            isLoading={props.isValuating}
            error={props.error}
            isFavorite={props.favorites.some(fav => fav.id === props.selectedProperty!.id)}
            onToggleFavorite={() => props.onToggleFavorite(props.selectedProperty!)}
            isValuating={props.isValuating}
            onOpenHistory={props.onOpenHistory}
            currentUser={props.currentUser}
          />
        )}
      </div>

      <TabbedInfo {...props} />

      {props.comparisonList.length > 0 && (
         <div className="sticky bottom-0 left-0 right-0 p-2">
            <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-2xl border-2 border-black flex items-center justify-between">
                <div className="flex -space-x-4">
                    {props.comparisonList.map(p => (
                        <img key={p.id} src={p.imageUrl} alt={p.address} className="h-10 w-10 rounded-full object-cover border-2 border-white" title={p.address} />
                    ))}
                </div>
                <button 
                  onClick={props.onCompareClick} 
                  disabled={props.comparisonList.length < 2}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                >
                    <ScaleIcon className="h-5 w-5"/> <span>比較 ({props.comparisonList.length})</span>
                </button>
            </div>
         </div>
      )}

    </div>
  );
};