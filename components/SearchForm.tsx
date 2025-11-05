import React, { useState, useEffect } from 'react';
import { MapPinIcon } from './icons/MapPinIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface SearchFormProps {
  onSearch: (
    address: string,
    reference: string,
    details?: { coords: { lat: number; lon: number }; district: string }
  ) => void;
  isLoading: boolean;
  initialAddress: string;
}

const valuationReferences = [
    { value: '綜合市場因素', label: '綜合市場因素' },
    { value: '實價登錄', label: '實價登錄' },
    { value: '房屋仲介觀點', label: '房屋仲介觀點' },
    { value: '真實坪數', label: '真實坪數' },
];

export const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isLoading, initialAddress }) => {
  const [address, setAddress] = useState(initialAddress);
  const [reference, setReference] = useState(valuationReferences[0].value);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);

  useEffect(() => {
    setAddress(initialAddress);
  }, [initialAddress]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeolocationError(null);
    if (address.trim()) {
      onSearch(address.trim(), reference);
    }
  };
  
  const handleGeolocation = () => {
    setGeolocationError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=zh-TW`);
            if (!response.ok) {
                throw new Error('Reverse geocoding failed');
            }
            const data = await response.json();
            
            let fetchedAddress = '';
            let fetchedDistrict = '未知區域';

            if (data.address) {
                const addr = data.address;
                // FIX: Trim whitespace from house number string before suffix check to prevent duplication.
                const hn = addr.house_number ? String(addr.house_number).trim() : '';
                const houseNumberPart = hn ? (hn.endsWith('號') ? hn : `${hn}號`) : '';
                
                const addressParts = [
                    addr.city || addr.county,
                    addr.suburb || addr.city_district,
                    addr.road,
                    houseNumberPart
                ];
                fetchedAddress = addressParts.filter(Boolean).join('');
                fetchedDistrict = addr.suburb || addr.city_district || addr.county || '未知區域';
            }
            
            if (!fetchedAddress) {
                fetchedAddress = data.display_name || `緯度: ${latitude.toFixed(5)}, 經度: ${longitude.toFixed(5)}`;
            }

            setAddress(fetchedAddress);
            onSearch(fetchedAddress, reference, { 
                coords: { lat: latitude, lon: longitude },
                district: fetchedDistrict,
            });
          } catch (error) {
              console.error("Geolocation reverse geocoding error:", error);
              setGeolocationError("無法將目前位置轉換為地址。");
          }
        },
        (error: GeolocationPositionError) => {
          console.error(`Geolocation error: ${error.message} (code: ${error.code})`);
          let errorMessage: string;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "您已拒絕位置授權，請至瀏覽器設定開啟權限後再試。";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "無法偵測目前位置，請確認裝置定位功能已開啟。";
              break;
            case error.TIMEOUT:
              errorMessage = "取得位置資訊已逾時，請稍後再試。";
              break;
            default:
              errorMessage = "發生未知的定位錯誤，請稍後再試。";
              break;
          }
          setGeolocationError(errorMessage);
        }
      );
    } else {
      setGeolocationError("您的瀏覽器不支援地理位置功能。");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex flex-col gap-4">
        {/* Address Input and Geolocation Button */}
        <div className="relative flex-grow">
          <label htmlFor="address-search" className="sr-only">地址搜尋</label>
          <input
            id="address-search"
            type="text"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setGeolocationError(null);
            }}
            placeholder="例如：台北市大安區信義路四段1號"
            className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 bg-white"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={handleGeolocation}
            disabled={isLoading}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-blue-600 transition-colors"
            title="使用目前位置"
            aria-label="使用目前位置"
          >
            <MapPinIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Valuation Reference Radio Buttons */}
        <fieldset>
          <legend className="block text-sm font-medium text-slate-600 mb-2">
            估價參考基準
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {valuationReferences.map((ref) => (
              <div key={ref.value}>
                <input
                  type="radio"
                  id={`ref-${ref.value}`}
                  name="valuation-reference"
                  value={ref.value}
                  checked={reference === ref.value}
                  onChange={(e) => setReference(e.target.value)}
                  className="sr-only"
                  disabled={isLoading}
                />
                <label
                  htmlFor={`ref-${ref.value}`}
                  className={`
                    block w-full text-center px-3 py-2 border rounded-lg cursor-pointer text-sm font-medium transition-all
                    ${
                      reference === ref.value
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400'
                    }
                    ${isLoading ? 'cursor-not-allowed opacity-50' : ''}
                  `}
                >
                  {ref.label}
                </label>
              </div>
            ))}
          </div>
        </fieldset>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !address.trim()}
          className="w-full flex justify-center items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-150 transform hover:scale-105"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              估價中...
            </>
          ) : (
            <>
              <SparklesIcon className="h-5 w-5" />
              AI 智能估價
            </>
          )}
        </button>
      </div>
      {geolocationError && (
        <div className="mt-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg p-3 flex justify-between items-center transition-opacity duration-300" role="alert">
          <span>{geolocationError}</span>
          <button 
            type="button" 
            onClick={() => setGeolocationError(null)} 
            className="text-red-800 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-full p-1 -mr-1"
            aria-label="關閉錯誤訊息"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </form>
  );
};
