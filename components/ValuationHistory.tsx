import React from 'react';
import type { Property, ValuationHistoryItem } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';

interface ValuationHistoryProps {
  history: ValuationHistoryItem[];
  onClose: () => void;
  onSelect: (property: Property) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-TW', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const ValuationHistory: React.FC<ValuationHistoryProps> = ({ history, onClose, onSelect }) => {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="valuation-history-title"
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden transition-transform duration-300 animate-scale-up border-2 border-black"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h2 id="valuation-history-title" className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            估價歷史紀錄
          </h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors" aria-label="關閉視窗">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="p-4 sm:p-6 overflow-y-auto">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <DocumentTextIcon className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">尚無估價紀錄</h3>
              <p className="text-sm text-gray-500 mt-1">
                您進行的 AI 估價將會顯示在這裡。
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={`${item.property.id}-${item.date}-${index}`} className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <p className="font-semibold text-gray-800">{item.property.address}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(item.date)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className="text-lg font-bold text-blue-600">{formatCurrency(item.report.estimatedPrice)}</p>
                            <p className="text-xs text-gray-500">估計總價</p>
                        </div>
                    </div>
                    <div className="mt-3 border-t border-gray-200 pt-3 flex justify-end">
                        <button
                            onClick={() => onSelect(item.property)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
                        >
                            重新估價
                        </button>
                    </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        @keyframes scale-up {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scale-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};