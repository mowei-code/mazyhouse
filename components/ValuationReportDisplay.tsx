import React, { useState } from 'react';
import type { Property, ValuationReport, RealtorInfo, User } from '../types';
import { getScenarioAnalysis } from '../services/geminiService';
import { StarIconOutline } from './icons/StarIconOutline';
import { StarIconSolid } from './icons/StarIconSolid';
import { ArrowTrendingUpIcon } from './icons/ArrowTrendingUpIcon';
import { ArrowTrendingDownIcon } from './icons/ArrowTrendingDownIcon';
import { MinusSmallIcon } from './icons/MinusSmallIcon';
import { AcademicCapIcon } from './icons/AcademicCapIcon';
import { ShoppingCartIcon } from './icons/ShoppingCartIcon';
import { TruckIcon } from './icons/TruckIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { MortgageCalculator } from './MortgageCalculator';
import { CalculatorIcon } from './icons/CalculatorIcon';
import { ChatBubbleLeftRightIcon } from './icons/ChatBubbleLeftRightIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface ValuationReportDisplayProps {
  property: Property;
  valuation: ValuationReport | null;
  isLoading: boolean;
  error: string | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isValuating: boolean;
  onOpenHistory: () => void;
  currentUser: User | null;
}

const formatPrice = (price: number): string => {
  if (price >= 100000000) {
    return `${(price / 100000000).toFixed(2)} 億`;
  }
  return `${(price / 10000).toLocaleString('zh-TW', { maximumFractionDigits: 0 })} 萬`;
};

const ConfidenceIndicator: React.FC<{ confidence: string }> = ({ confidence }) => {
  let colorClass = 'bg-gray-200 text-gray-800';
  let level = '中';
  let trendIcon = <MinusSmallIcon className="h-4 w-4" />;
  if (confidence.includes('高')) {
    colorClass = 'bg-green-100 text-green-800';
    level = '高';
    trendIcon = <ArrowTrendingUpIcon className="h-4 w-4" />;
  } else if (confidence.includes('低')) {
    colorClass = 'bg-red-100 text-red-800';
    level = '低';
    trendIcon = <ArrowTrendingDownIcon className="h-4 w-4" />;
  }
  return (
    <div className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${colorClass}`}>
      {trendIcon}
      <span>信心指數: {level}</span>
    </div>
  );
};

const RealtorAnalysisDisplay: React.FC<{ analysis: RealtorInfo[] }> = ({ analysis }) => {
    return (
        <div className="mt-4">
            <h4 className="text-md font-bold text-gray-800 flex items-center gap-2 mb-3">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
                當地房仲觀點
            </h4>
            <div className="space-y-4">
                {analysis.map((item, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="font-bold text-gray-900">{item.realtorName} - {item.branchName}</p>
                        <p className="text-xs text-gray-500 mb-2">{item.address}</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.analysis}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface ScenarioAnalysisProps {
  property: Property;
  valuation: ValuationReport;
  currentUser: User | null;
}

const ScenarioAnalysis: React.FC<ScenarioAnalysisProps> = ({ property, valuation, currentUser }) => {
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [analysisError, setAnalysisError] = useState('');

  const userHasPermission = currentUser?.role === '管理員' || currentUser?.role === '付費用戶';

  const handleAnalysis = async () => {
    if (!query.trim()) {
      setAnalysisError('請輸入您想分析的情境。');
      return;
    }
    setIsAnalyzing(true);
    setAnalysisError('');
    setAnalysisResult('');
    try {
      const result = await getScenarioAnalysis(property, valuation, query);
      setAnalysisResult(result);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : '分析時發生未知錯誤。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <h4 className="text-md font-bold text-gray-800 flex items-center gap-2 mb-2">
        <SparklesIcon className="h-5 w-5 text-blue-600" />
        AI 情境分析
      </h4>
      {userHasPermission ? (
        <p className="text-sm text-gray-500 mb-3">
          想知道特定條件會如何影響估價嗎？ 例如：「如果重新裝潢過」、「如果是頂樓加蓋」或「附近有嫌惡設施」。
        </p>
      ) : (
         <div className="text-sm text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200 mb-3" role="alert">
            此為管理員與付費會員專屬功能。
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-stretch gap-2">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={userHasPermission ? "輸入您想分析的情境..." : "此功能僅限付費會員及管理員使用"}
          className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[44px] sm:min-h-0 disabled:bg-gray-100 disabled:cursor-not-allowed"
          rows={1}
          disabled={!userHasPermission || isAnalyzing}
        />
        <button
          onClick={handleAnalysis}
          disabled={!userHasPermission || isAnalyzing}
          className="flex-shrink-0 flex justify-center items-center gap-2 px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg shadow-sm hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>分析中...</span>
            </>
          ) : (
             <>
              <SparklesIcon className="h-5 w-5" />
              <span>進行分析</span>
            </>
          )}
        </button>
      </div>

      {analysisError && <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">{analysisError}</div>}
      
      {analysisResult && (
        <div className="mt-3 p-4 bg-blue-50/50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{analysisResult}</p>
        </div>
      )}
    </div>
  );
};


export const ValuationReportDisplay: React.FC<ValuationReportDisplayProps> = ({
  property,
  valuation,
  isLoading,
  error,
  isFavorite,
  onToggleFavorite,
  isValuating,
  onOpenHistory,
  currentUser
}) => {
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const pings = property.size / 3.30579;
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite();
  };
  
  if (isLoading || isValuating) {
    return (
      <div className="mt-6 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-md w-3/4"></div>
        <div className="h-12 bg-gray-200 rounded-md w-1/2"></div>
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded-md w-1/4"></div>
          <div className="h-6 bg-gray-200 rounded-md w-1/4"></div>
        </div>
        <div className="h-24 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-gray-200 rounded-lg"></div>
          <div className="h-20 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>;
  }
  
  if (!valuation) {
    return (
       <div className="mt-6 p-4 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 text-center">
            <p>請輸入地址並點擊「AI智慧為您估價參考」按鈕開始。</p>
       </div>
    );
  }
  
  const pricePerPing = (valuation.estimatedPrice / pings) / 10000;

  return (
    <div className="mt-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{property.address}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {`${property.district} | ${property.type} | ${property.floor} | ${pings.toFixed(1)} 坪`}
          </p>
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={handleFavoriteClick}
                className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                title={isFavorite ? '從收藏中移除' : '加入收藏'}
            >
                {isFavorite ? <StarIconSolid className="h-6 w-6 text-yellow-400" /> : <StarIconOutline className="h-6 w-6" />}
            </button>
             <button
                onClick={onOpenHistory}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="查看估價歷史紀錄"
            >
                <DocumentTextIcon className="h-6 w-6" />
            </button>
        </div>
      </div>

      <div className="mt-4 bg-gray-100 p-4 rounded-lg border-2 border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <span className="text-sm text-gray-600">AI 估計總價</span>
            <p className="text-4xl font-bold text-blue-600">{formatPrice(valuation.estimatedPrice)}</p>
          </div>
          <ConfidenceIndicator confidence={valuation.confidence} />
        </div>
        <div className="mt-2 text-sm text-gray-600">
          <p>每坪單價：<span className="font-semibold">{pricePerPing.toFixed(1)} 萬</span></p>
          <p className="text-xs text-gray-500 mt-1">{valuation.confidence}</p>
        </div>
        <button 
            onClick={() => setIsCalculatorOpen(true)}
            className="mt-4 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
        >
            <CalculatorIcon className="h-5 w-5" />
            <span>試算房貸月付金</span>
        </button>
      </div>

      <div className="mt-8 border-t-2 border-dashed border-gray-200 pt-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
            <SparklesIcon className="h-6 w-6 text-blue-600" />
            AI 綜合分析報告
        </h3>
        
        <p className="text-sm text-gray-700 leading-relaxed">{valuation.marketSummary}</p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-bold text-green-800 flex items-center gap-2"><ArrowTrendingUpIcon className="h-5 w-5" />優點分析</h4>
            <ul className="mt-2 list-disc list-inside text-sm text-green-900 space-y-1">
              {valuation.pros.map((pro, index) => <li key={index}>{pro}</li>)}
            </ul>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h4 className="font-bold text-red-800 flex items-center gap-2"><ArrowTrendingDownIcon className="h-5 w-5" />缺點分析</h4>
            <ul className="mt-2 list-disc list-inside text-sm text-red-900 space-y-1">
              {valuation.cons.map((con, index) => <li key={index}>{con}</li>)}
            </ul>
          </div>
        </div>
        
        <div className="mt-4">
            <h4 className="text-md font-bold text-gray-800 flex items-center gap-2 mb-3">
                <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                周邊機能分析
            </h4>
            <div className="space-y-3">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full"><AcademicCapIcon className="h-5 w-5 text-blue-700"/></div>
                    <div>
                        <p className="font-semibold text-sm">鄰近學區</p>
                        <p className="text-sm text-gray-600">{valuation.amenitiesAnalysis.schools}</p>
                    </div>
                </div>
                 <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full"><TruckIcon className="h-5 w-5 text-blue-700"/></div>
                    <div>
                        <p className="font-semibold text-sm">交通便利</p>
                        <p className="text-sm text-gray-600">{valuation.amenitiesAnalysis.transport}</p>
                    </div>
                </div>
                 <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full"><ShoppingCartIcon className="h-5 w-5 text-blue-700"/></div>
                    <div>
                        <p className="font-semibold text-sm">生活採買</p>
                        <p className="text-sm text-gray-600">{valuation.amenitiesAnalysis.shopping}</p>
                    </div>
                </div>
            </div>
        </div>
        
        {valuation.realtorAnalysis && valuation.realtorAnalysis.length > 0 && (
            <RealtorAnalysisDisplay analysis={valuation.realtorAnalysis} />
        )}

        <ScenarioAnalysis property={property} valuation={valuation} currentUser={currentUser} />

      </div>
      
      {isCalculatorOpen && (
          <MortgageCalculator
              estimatedPrice={valuation.estimatedPrice}
              isOpen={isCalculatorOpen}
              onClose={() => setIsCalculatorOpen(false)}
          />
      )}
    </div>
  );
};