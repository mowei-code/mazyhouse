import React, { useState, useEffect } from 'react';
import { MapPinIcon } from './icons/MapPinIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { formatNominatimAddress } from '../utils';
import type { User } from '../types';

interface SearchFormProps {
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
  initialAddress: string;
  currentUser: User | null;
}

const valuationReferences = [
    { value: '綜合市場因素', label: '綜合市場因素' },
    { value: '實價登錄', label: '實價登錄' },
    { value: '房屋仲介觀點', label: '房屋仲介觀點' },
    { value: '真實坪數', label: '真實坪數' },
];

const restrictedReferences = ['實價登錄', '房屋仲介觀點', '真實坪數'];

export const SearchForm: React.FC<SearchFormProps> = ({ onSearch, onLocationSelect, isLoading, initialAddress, currentUser }) => {
  const [address, setAddress] = useState(initialAddress);
  const [reference, setReference] = useState(valuationReferences[0].value);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [customSize, setCustomSize] = useState('');
  const [customPricePerPing, setCustomPricePerPing] = useState('');
  const [customFloor, setCustomFloor] = useState('');

  const userHasPermission = currentUser?.role === '管理員' || currentUser?.role === '付費用戶';

  useEffect(() => {
    setAddress(initialAddress);
  }, [initialAddress]);

  // Reset reference if the current one becomes disabled (e.g., on logout)
  useEffect(() => {
    if (restrictedReferences.includes(reference) && !userHasPermission) {
      setReference(valuationReferences[0].value);
    }
  }, [userHasPermission, reference]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeolocationError(null);
    if (address.trim()) {
      let customInputs: { size?: number; pricePerPing?: number; floor?: string } = {};
      if (reference === '真實坪數') {
        const sizeNum = parseFloat(customSize);
        const priceNum = parseFloat(customPricePerPing);
        if (!isNaN(sizeNum) && sizeNum > 0) {
          customInputs.size = sizeNum;
        }
        if (!isNaN(priceNum) && priceNum > 0) {
          customInputs.pricePerPing = priceNum;
        }
        if (customFloor.trim() !== '') {
            customInputs.floor = customFloor.trim();
        }
      }
      onSearch(address.trim(), reference, undefined, Object.keys(customInputs).length > 0 ? customInputs : undefined);
    }
  };
  
  const handleGeolocation = () => {
    setGeolocationError(null);
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=zh-TW`);
            if (!response.ok) {
                throw new Error('Reverse geocoding failed');
            }
            const data = await response.json();
            
            let fetchedAddress = formatNominatimAddress(data);
            let fetchedDistrict = '未知區域';
            let fetchedCity = undefined;

            if (data.address) {
                const addr = data.address;
                fetchedDistrict = addr.suburb || addr.city_district || '未知區域';
                fetchedCity = addr.city || addr.county;
            }
            
            if (!fetchedAddress) {
                fetchedAddress = `緯度: ${latitude.toFixed(5)}, 經度: ${longitude.toFixed(5)}`;
            }

            setAddress(fetchedAddress);
            onLocationSelect(fetchedAddress, { 
                coords: { lat: latitude, lon: longitude },
                district: fetchedDistrict,
                city: fetchedCity
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
        },
        options
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
            className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 bg-white"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={handleGeolocation}
            disabled={isLoading}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-blue-600 transition-colors"
            title="使用目前位置"
            aria-label="使用目前位置"
          >
            <MapPinIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Valuation Reference Radio Buttons */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-600 mb-2">
            估價參考基準
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {valuationReferences.map((ref) => {
                const isRestricted = restrictedReferences.includes(ref.value);
                const isDisabled = isRestricted && !userHasPermission;

                return (
                  <div key={ref.value} title={isDisabled ? '此功能僅限付費會員及管理員使用' : ''}>
                    <input
                      type="radio"
                      id={`ref-${ref.value}`}
                      name="valuation-reference"
                      value={ref.value}
                      checked={reference === ref.value}
                      onChange={(e) => setReference(e.target.value)}
                      className="sr-only"
                      disabled={isLoading || isDisabled}
                    />
                    <label
                      htmlFor={`ref-${ref.value}`}
                      className={`
                        block w-full text-center px-3 py-2 border rounded-lg text-sm font-medium transition-all
                        ${
                          reference === ref.value
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                            : 'bg-white border-gray-300 text-gray-700'
                        }
                        ${!isDisabled ? 'cursor-pointer hover:bg-gray-100 hover:border-gray-400' : ''}
                        ${isLoading || isDisabled ? 'cursor-not-allowed opacity-50' : ''}
                      `}
                    >
                      {ref.label}
                    </label>
                  </div>
                )
            })}
          </div>
        </fieldset>

        {/* Custom Inputs for '真實坪數' */}
        {reference === '真實坪數' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div>
              <label htmlFor="custom-size" className="block text-sm font-medium text-gray-600 mb-1">
                自訂實際坪數
              </label>
              <input
                id="custom-size"
                type="number"
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                placeholder="例如：32.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                disabled={isLoading}
                step="0.01"
              />
            </div>
            <div>
              <label htmlFor="custom-price" className="block text-sm font-medium text-gray-600 mb-1">
                自訂參考單價 (萬/坪)
              </label>
              <input
                id="custom-price"
                type="number"
                value={customPricePerPing}
                onChange={(e) => setCustomPricePerPing(e.target.value)}
                placeholder="例如：85"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                disabled={isLoading}
                step="0.1"
              />
            </div>
            <div className="sm:col-span-2">
               <label htmlFor="custom-floor" className="block text-sm font-medium text-gray-600 mb-1">
                  自訂樓層 (選填)
              </label>
              <input
                  id="custom-floor"
                  type="text"
                  value={customFloor}
                  onChange={(e) => setCustomFloor(e.target.value)}
                  placeholder="例如: 8樓 / 15樓"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  disabled={isLoading}
              />
            </div>
             <p className="text-xs text-gray-500 sm:col-span-2">
                若填寫此區塊，AI 將優先使用您提供的數值進行估算。若留白，則會依據附近行情自動估算。
            </p>
          </div>
        )}


        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !address.trim()}
          className="w-full flex justify-center items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-150 transform hover:scale-105"
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
              AI智慧為您估價參考
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