import React from 'react';
import type { Property, ValuationReport } from '../types';
import { PriceTrendChart } from './PriceTrendChart';
// Fix: Correctly import named exports StarIconSolid and StarIconOutline.
import { StarIconSolid } from './icons/StarIconSolid';
import { StarIconOutline } from './icons/StarIconOutline';
import { BuildingOfficeIcon } from './icons/BuildingOfficeIcon';
import { AcademicCapIcon } from './icons/AcademicCapIcon';
import { TruckIcon } from './icons/TruckIcon';
import { ShoppingCartIcon } from './icons/ShoppingCartIcon';

interface ValuationReportDisplayProps {
  property: Property;
  valuation: ValuationReport | null;
  isLoading: boolean;
  error: string | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isValuating: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  }).format(amount);
};

const SkeletonLoader: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-slate-200 rounded-md w-3/4 mb-4"></div>
    <div className="h-4 bg-slate-200 rounded-md w-1/2 mb-6"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="space-y-3">
        <div className="h-4 bg-slate-200 rounded w-full"></div>
        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
        <div className="h-4 bg-slate-200 rounded w-full"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-slate-200 rounded w-full"></div>
        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
        <div className="h-4 bg-slate-200 rounded w-full"></div>
      </div>
    </div>
    <div className="h-40 bg-slate-200 rounded-lg"></div>
  </div>
);

const InitialStateDisplay: React.FC = () => (
  <div className="text-center py-10 px-6 bg-slate-50 rounded-lg">
    <BuildingOfficeIcon className="mx-auto h-12 w-12 text-slate-400" />
    <h3 className="mt-2 text-lg font-medium text-slate-800">歡迎使用 AI 房產估價師</h3>
    <p className="mt-1 text-sm text-slate-500">
      請在上方輸入您想查詢的地址，或使用定位功能，即可獲得即時 AI 估價與市場分析。
    </p>
  </div>
);

export const ValuationReportDisplay: React.FC<ValuationReportDisplayProps> = ({
  property,
  valuation,
  isLoading,
  error,
  isFavorite,
  onToggleFavorite,
  isValuating,
}) => {
  const renderConfidenceBadge = (confidence: '高' | '中' | '低') => {
    const baseClasses = "px-2.5 py-0.5 text-xs font-semibold rounded-full";
    if (confidence === '高') return <span className={`${baseClasses} bg-green-100 text-green-800`}>高</span>;
    if (confidence === '中') return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>中</span>;
    return <span className={`${baseClasses} bg-red-100 text-red-800`}>低</span>;
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{property.address}</h2>
          <p className="text-slate-500">{`${property.district} | ${property.type} | ${property.floor} | ${(property.size / 3.30579).toFixed(1)} 坪`}</p>
        </div>
        <button onClick={onToggleFavorite} className="p-2 text-slate-400 hover:text-yellow-500 transition-colors">
          {isFavorite ? <StarIconSolid className="h-7 w-7 text-yellow-400" /> : <StarIconOutline className="h-7 w-7" />}
        </button>
      </div>
      
      <div className="border-t border-slate-200 pt-4">
        {isLoading && <SkeletonLoader />}
        {error && <div className="text-center py-10 text-red-600 bg-red-50 rounded-lg">{error}</div>}
        {!isLoading && !error && !isValuating && <InitialStateDisplay />}
        {!isLoading && !error && valuation && (
          <div>
            <div className="mb-6">
                <span className="text-sm text-slate-500">AI 估計總價</span>
                <p className="text-4xl font-bold text-blue-600">{formatCurrency(valuation.estimatedPrice)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-slate-600">{`約 ${formatCurrency(valuation.pricePerSqm * 3.30579)} / 坪`}</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-sm text-slate-500">信心指數:</span>
                  {renderConfidenceBadge(valuation.confidence)}
                </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">市場總結</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{valuation.marketSummary}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-green-700">優點分析</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                  {valuation.pros.map((pro, index) => <li key={index}>{pro}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-red-700">風險提示</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                  {valuation.cons.map((con, index) => <li key={index}>{con}</li>)}
                </ul>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">周邊機能分析</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 bg-blue-100 text-blue-600 rounded-lg p-2">
                        <AcademicCapIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm">鄰近學區</h4>
                        <ul className="list-disc list-inside text-xs text-slate-500 mt-1 space-y-1">
                            {valuation.amenitiesAnalysis.schools.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                </div>
                 <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 bg-emerald-100 text-emerald-600 rounded-lg p-2">
                        <TruckIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm">交通便利</h4>
                        <ul className="list-disc list-inside text-xs text-slate-500 mt-1 space-y-1">
                            {valuation.amenitiesAnalysis.transport.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                </div>
                 <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 bg-amber-100 text-amber-600 rounded-lg p-2">
                        <ShoppingCartIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm">生活採買</h4>
                        <ul className="list-disc list-inside text-xs text-slate-500 mt-1 space-y-1">
                            {valuation.amenitiesAnalysis.shopping.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">近十年房價趨勢</h3>
              <div className="h-64 w-full">
                <PriceTrendChart data={valuation.priceTrend} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};