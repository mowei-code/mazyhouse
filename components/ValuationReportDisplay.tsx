import React, { useState, useEffect, useRef } from 'react';
import type { Property, ValuationReport } from '../types';
import { PriceTrendChart } from './PriceTrendChart';
import { getValuationAdjustment } from '../services/geminiService';
import { StarIconSolid } from './icons/StarIconSolid';
import { StarIconOutline } from './icons/StarIconOutline';
import { BuildingOfficeIcon } from './icons/BuildingOfficeIcon';
import { AcademicCapIcon } from './icons/AcademicCapIcon';
import { TruckIcon } from './icons/TruckIcon';
import { ShoppingCartIcon } from './icons/ShoppingCartIcon';
import { ChatBubbleLeftRightIcon } from './icons/ChatBubbleLeftRightIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { MortgageCalculator } from './MortgageCalculator';

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

const AnimatedNumber = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startValue = 0; // Always start from 0 for a fresh animation
    const endValue = value;
    if (startValue === endValue) {
        setDisplayValue(endValue);
        return;
    };

    let startTime: number | null = null;
    const duration = 1200; // Animation duration in ms

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      const newDisplayValue = Math.round(startValue + (endValue - startValue) * easedProgress);
      
      setDisplayValue(newDisplayValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    const frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return <span>{formatCurrency(displayValue)}</span>;
};

const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);


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
  <div className="text-center py-10 px-6 bg-emerald-50 rounded-lg overflow-hidden">
    <div className="relative inline-block">
        <div className="absolute -inset-3 bg-blue-200/50 rounded-full blur-xl animate-pulse delay-500"></div>
        <BuildingOfficeIcon className="relative mx-auto h-12 w-12 text-slate-400" />
    </div>
    <h3 className="mt-4 text-lg font-medium text-slate-800">歡迎使用 AI 房產估價師</h3>
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
  const [adjustmentQuery, setAdjustmentQuery] = useState('');
  const [adjustmentResult, setAdjustmentResult] = useState<string | null>(null);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);

  useEffect(() => {
    // Reset adjustment state when the main property or valuation changes
    setAdjustmentQuery('');
    setAdjustmentResult(null);
    setAdjustmentError(null);
    setIsAdjusting(false);
  }, [property, valuation]);

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentQuery.trim() || !valuation) return;

    setIsAdjusting(true);
    setAdjustmentResult(null);
    setAdjustmentError(null);

    try {
      const result = await getValuationAdjustment(property, valuation, adjustmentQuery);
      setAdjustmentResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '分析時發生未知錯誤，請稍後再試。';
      setAdjustmentError(errorMessage);
    } finally {
      setIsAdjusting(false);
    }
  };

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
                <p className="text-4xl font-bold text-blue-600">
                    <AnimatedNumber value={valuation.estimatedPrice} />
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-slate-600">{`約 ${formatCurrency(valuation.pricePerSqm * 3.30579)} / 坪`}</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-sm text-slate-500">信心指數:</span>
                  {renderConfidenceBadge(valuation.confidence)}
                </div>
            </div>

            <MortgageCalculator estimatedPrice={valuation.estimatedPrice} />

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">市場總結</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{valuation.marketSummary}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-green-700">優點分析</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  {valuation.pros.map((pro, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex-shrink-0 mt-1 w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <CheckIcon className="w-2.5 h-2.5" />
                      </span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-red-700">風險提示</h3>
                 <ul className="space-y-2 text-sm text-slate-600">
                  {valuation.cons.map((con, index) => (
                     <li key={index} className="flex items-start gap-3">
                      <span className="flex-shrink-0 mt-1 w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                        <XIcon className="w-2.5 h-2.5" />
                      </span>
                      <span>{con}</span>
                    </li>
                  ))}
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

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">近十年房價趨勢</h3>
              <div className="h-64 w-full">
                <PriceTrendChart data={valuation.priceTrend} />
              </div>
            </div>

            <div className="border-t border-slate-200 mt-8 pt-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-slate-800">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
                <span>AI 情境分析</span>
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                想知道特定條件會如何影響估價嗎？例如：「如果重新裝潢過」、「如果是頂樓加蓋」或「附近有嫌惡設施」。
              </p>
              <form onSubmit={handleAdjustmentSubmit}>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={adjustmentQuery}
                    onChange={(e) => setAdjustmentQuery(e.target.value)}
                    placeholder="輸入您想分析的情境..."
                    className="w-full pl-4 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 bg-white"
                    disabled={isAdjusting}
                  />
                  <button
                    type="submit"
                    disabled={isAdjusting || !adjustmentQuery.trim()}
                    className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all"
                  >
                    {isAdjusting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        分析中...
                      </>
                    ) : (
                      <>
                       <SparklesIcon className="h-5 w-5" />
                        進行分析
                      </>
                    )}
                  </button>
                </div>
              </form>
              
              <div className="mt-4 min-h-[4rem]">
                {isAdjusting && (
                  <div className="animate-pulse p-4 bg-slate-50 rounded-lg">
                      <div className="h-4 bg-slate-200 rounded w-full mb-3"></div>
                      <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                  </div>
                )}
                {adjustmentError && (
                  <div className="text-red-700 bg-red-100 p-4 rounded-lg text-sm" role="alert">{adjustmentError}</div>
                )}
                {adjustmentResult && (
                  <div className="text-slate-800 bg-blue-50/70 p-4 rounded-lg text-sm leading-relaxed border border-blue-100 whitespace-pre-wrap">
                    {adjustmentResult}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};