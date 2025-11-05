import React from 'react';
import type { Property, ValuationReport, ComparisonValuationState } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { PriceTrendChart } from './PriceTrendChart';

interface ComparisonViewProps {
  properties: Property[];
  valuations: Record<string, ComparisonValuationState>;
  onClose: () => void;
}

const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined || amount === null) return 'N/A';
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  }).format(amount);
};

const ComparisonSkeleton: React.FC = () => (
    <div className="space-y-4 p-4 animate-pulse">
        <div className="h-24 bg-slate-200 rounded-md"></div>
        <div className="h-6 bg-slate-200 rounded-md w-3/4"></div>
        <div className="h-6 bg-slate-200 rounded-md w-1/2"></div>
        <div className="space-y-2 pt-4">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded"></div>
        </div>
    </div>
);

export const ComparisonView: React.FC<ComparisonViewProps> = ({ properties, valuations, onClose }) => {
  
  const renderRow = (title: string, dataExtractor: (report: ValuationReport) => React.ReactNode | string | string[]) => {
    return (
      <tr>
        <td className="p-3 font-semibold text-slate-600 bg-emerald-50 border-b border-r border-slate-200 sticky left-0">{title}</td>
        {properties.map(prop => {
          const valuationState = valuations[prop.id];
          return (
            <td key={prop.id} className="p-3 border-b border-slate-200 align-top">
              {valuationState?.report ? (
                Array.isArray(dataExtractor(valuationState.report)) ? (
                  <ul className="list-disc list-inside space-y-1">
                    {(dataExtractor(valuationState.report) as string[]).map((item, index) => <li key={index}>{item}</li>)}
                  </ul>
                ) : (
                  dataExtractor(valuationState.report)
                )
              ) : null}
            </td>
          );
        })}
      </tr>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-800">房產比較報告</h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-800 transition-colors">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </header>
        
        <div className="flex-grow overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr>
                <th className="p-3 text-left font-semibold text-slate-600 bg-emerald-50 border-b-2 border-slate-300 border-r border-slate-200 w-1/6 sticky left-0">項目</th>
                {properties.map(prop => {
                  const valuationState = valuations[prop.id];
                  return (
                    <th key={prop.id} className="p-3 border-b-2 border-slate-300 w-1/4">
                      {valuationState?.isLoading && <ComparisonSkeleton />}
                      {valuationState?.error && <div className="text-red-600 p-2 bg-red-50 rounded-md">{valuationState.error}</div>}
                      {valuationState?.report && (
                         <div className="text-left font-normal">
                           <img src={prop.imageUrl} alt={prop.address} className="h-24 w-full object-cover rounded-md mb-2"/>
                           <p className="font-semibold text-slate-800">{prop.address}</p>
                           <p className="text-xs text-slate-500">{`${prop.district} | ${prop.type} | ${(prop.size / 3.30579).toFixed(1)} 坪`}</p>
                         </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {renderRow('估計總價', report => <span className="font-bold text-blue-600">{formatCurrency(report.estimatedPrice)}</span>)}
              {renderRow('每坪單價', report => formatCurrency(report.pricePerSqm * 3.30579))}
              {renderRow('信心指數', report => report.confidence)}
              {renderRow('市場總結', report => <p className="leading-relaxed">{report.marketSummary}</p>)}
              {renderRow('優點', report => report.pros)}
              {renderRow('缺點', report => report.cons)}
              {renderRow('鄰近學區', report => report.amenitiesAnalysis.schools)}
              {renderRow('交通便利', report => report.amenitiesAnalysis.transport)}
              {renderRow('生活採買', report => report.amenitiesAnalysis.shopping)}
              <tr>
                 <td className="p-3 font-semibold text-slate-600 bg-emerald-50 border-b border-r border-slate-200 sticky left-0">房價趨勢</td>
                 {properties.map(prop => {
                    const valuationState = valuations[prop.id];
                    return (
                        <td key={prop.id} className="p-3 border-b border-slate-200 h-48">
                            {valuationState?.report && <PriceTrendChart data={valuationState.report.priceTrend} />}
                        </td>
                    );
                 })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};