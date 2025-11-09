import React, { useState, useEffect, useCallback, useContext } from 'react';
import type { Property, ValuationReport, Filters, ComparisonValuationState, ValuationHistoryItem } from './types';
import { getValuation } from './services/geminiService';
import { mockProperties, initialFilters } from './constants';
import { MapView } from './components/MapView';
import { ComparisonView } from './components/ComparisonView';
import { sanitizeAddressForGeocoding } from './utils';
import { getLocalTransactions, fetchLiveNearbyTransactions } from './services/realEstateService';
import { ValuationHistory } from './components/ValuationHistory';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { LoginModal } from './components/LoginModal';
import { AdminPanel } from './components/AdminPanel';
import { MainPanel } from './components/MainPanel';
import { BuildingOfficeIcon } from './components/icons/BuildingOfficeIcon';
import { MapIcon } from './components/icons/MapIcon';
import { XMarkIcon } from './components/icons/XMarkIcon';


const defaultPropertyData = {
  price: 15000000,
  size: 85,
  yearBuilt: 2005,
  type: '華廈' as const,
  bedrooms: 3,
  bathrooms: 2,
  floor: '7樓 / 15樓',
};

const AppContent: React.FC = () => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(mockProperties[0]);
  const [valuation, setValuation] = useState<ValuationReport | null>(null);
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [recentSearches, setRecentSearches] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isValuating, setIsValuating] = useState(false);
  const [transactionList, setTransactionList] = useState<Property[]>([]);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [comparisonList, setComparisonList] = useState<Property[]>([]);
  const [comparisonValuations, setComparisonValuations] = useState<Record<string, ComparisonValuationState>>({});
  const [isComparing, setIsComparing] = useState(false);
  const [valuationHistory, setValuationHistory] = useState<ValuationHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const { currentUser, isLoginModalOpen, isAdminPanelOpen, setLoginModalOpen } = useContext(AuthContext);

  useEffect(() => {
    const resetAndInitialize = async () => {
        // Reset transient state to defaults
        setSelectedProperty(mockProperties[0]);
        setValuation(null);
        setIsLoading(false);
        setError(null);
        setIsValuating(false);
        setFilters(initialFilters);
        setComparisonList([]);
        setComparisonValuations({});
        setIsHistoryOpen(false);
        setIsMapOpen(false);
        setIsComparing(false);
        
        // Load user-specific persisted state or clear it if no user is logged in
        if (currentUser) {
            const userFavoritesKey = `propertyFavorites_${currentUser.email}`;
            const userRecentKey = `propertyRecentSearches_${currentUser.email}`;
            const userHistoryKey = `valuationHistory_${currentUser.email}`;

            try {
                const storedFavorites = localStorage.getItem(userFavoritesKey);
                setFavorites(storedFavorites ? JSON.parse(storedFavorites) : []);

                const storedRecent = localStorage.getItem(userRecentKey);
                setRecentSearches(storedRecent ? JSON.parse(storedRecent) : []);
                
                const storedHistory = localStorage.getItem(userHistoryKey);
                setValuationHistory(storedHistory ? JSON.parse(storedHistory) : []);
            } catch (e) {
                console.error("Failed to parse user data from localStorage:", e);
                setFavorites([]);
                setRecentSearches([]);
                setValuationHistory([]);
            }
        } else {
            // Clear lists if no user is logged in
            setFavorites([]);
            setRecentSearches([]);
            setValuationHistory([]);
        }

        // Initialize default transaction data for the default property
        const defaultProp = mockProperties[0];
        if (defaultProp) {
            try {
                const { city, district } = defaultProp;
                if (city && district) {
                    const localData = getLocalTransactions(city, district);
                    setTransactionList([defaultProp, ...localData]);
                    const liveData = await fetchLiveNearbyTransactions(city, district);
                    if (liveData) {
                        setTransactionList([defaultProp, ...liveData]);
                    }
                } else {
                     setTransactionList([defaultProp]);
                }
            } catch (e) {
                console.error("Initialization failed during transaction fetch:", e);
                if (mockProperties[0]) {
                   setTransactionList([mockProperties[0]]);
                }
            }
        }
    };
    
    resetAndInitialize();
  }, [currentUser]);

  const handleFilterChange = useCallback((name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const handleLocationSelect = useCallback(async (
    address: string,
    details: { coords: { lat: number; lon: number }; district: string; city?: string }
  ) => {
    setError(null);
    setValuation(null);
    setIsValuating(false);
    setIsLoading(true);

    const { coords, district, city } = details;
    const propertyToUpdate: Property = {
      ...defaultPropertyData,
      id: `prop_select_${Date.now()}`,
      address: address,
      latitude: coords.lat,
      longitude: coords.lon,
      city: city,
      district: district,
      imageUrl: `https://picsum.photos/seed/${Date.now()}/800/600`,
    };

    setSelectedProperty(propertyToUpdate);
    
    if (city && district) {
      const localData = getLocalTransactions(city, district);
      setTransactionList([propertyToUpdate, ...localData]);
      const liveData = await fetchLiveNearbyTransactions(city, district);
      if (liveData) {
        setTransactionList([propertyToUpdate, ...liveData]);
      }
    } else {
      setTransactionList([propertyToUpdate]);
    }
    
    setIsLoading(false);
  }, []);
  
  const handleSearch = useCallback(async (
    address: string,
    reference: string,
    details?: { coords: { lat: number; lon: number }; district: string; city?: string },
    customInputs?: { size?: number; pricePerPing?: number; floor?: string }
  ) => {
    setError(null);
    setValuation(null);
    setIsValuating(true);
    setIsLoading(true);
    setTransactionList([]);

    let propertyToValuate: Property | null = null;
      
    if (details) {
        const { coords, district, city } = details;
        propertyToValuate = {
          ...defaultPropertyData,
          id: `prop_${Date.now()}`,
          address: address,
          latitude: coords.lat,
          longitude: coords.lon,
          city: city,
          district: district,
          imageUrl: `https://picsum.photos/seed/${Date.now()}/800/600`,
        };
    } else {
        propertyToValuate = mockProperties.find(p => 
          p.address.trim().toLowerCase() === address.trim().toLowerCase()
        ) || null;
          
        const isSearchingForSelectedProperty = selectedProperty &&
          selectedProperty.address === address &&
          selectedProperty.latitude &&
          selectedProperty.longitude;

        if (!propertyToValuate && address) {
          if (isSearchingForSelectedProperty) {
            propertyToValuate = selectedProperty;
          } else {
            try {
              const sanitizedAddress = sanitizeAddressForGeocoding(address);
              let response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(sanitizedAddress)}&countrycodes=tw&addressdetails=1&accept-language=zh-TW`);
              if (!response.ok) throw new Error('Geocoding service failed');
              let data = await response.json();
              let isBroadSearch = false;

              if (!data || data.length === 0) {
                  isBroadSearch = true;
                  console.warn(`Geocoding failed for full address: "${sanitizedAddress}". Retrying with a broader search.`);
                  const streetMatch = sanitizedAddress.match(/^(.*?[路街巷段大道])/);
                  if (streetMatch && streetMatch[1]) {
                      const broaderAddress = streetMatch[1];
                      response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(broaderAddress)}&countrycodes=tw&addressdetails=1&accept-language=zh-TW`);
                      if (response.ok) {
                          data = await response.json();
                      }
                  }
              }

              if (data && data.length > 0) {
                  const { lat, lon, address: addrDetails } = data[0];
                  
                  let displayAddress = address; 
                  if (!isBroadSearch && addrDetails) {
                      const hn = addrDetails.house_number ? String(addrDetails.house_number).trim() : '';
                      const houseNumberPart = hn ? (hn.endsWith('號') ? hn : `${hn}號`) : '';
                      const addressParts = [
                        addrDetails.city || addrDetails.county,
                        addrDetails.suburb || addrDetails.city_district,
                        addrDetails.road,
                        houseNumberPart
                      ];
                      const tempAddress = addressParts.filter(Boolean).join('');
                      if (tempAddress) {
                          displayAddress = tempAddress;
                      }
                  }

                  propertyToValuate = {
                      ...defaultPropertyData,
                      id: `prop_${Date.now()}`,
                      address: displayAddress,
                      latitude: parseFloat(lat),
                      longitude: parseFloat(lon),
                      city: addrDetails.city || addrDetails.county,
                      district: addrDetails.suburb || addrDetails.city_district || '未知區域',
                      imageUrl: `https://picsum.photos/seed/${Date.now()}/800/600`,
                  };

                  if (isBroadSearch) {
                      setError('無法精確定位地址，已顯示該路段的大致位置。您可以在地圖上拖動標記以修正。');
                  }
              } else {
                  throw new Error('地址無法定位。請嘗試輸入更完整的地址，例如包含「縣市」與「區域」。');
              }
            } catch (geoError) {
              console.error("Geocoding error:", geoError);
              const errorMessage = geoError instanceof Error ? geoError.message : '地址定位時發生未知錯誤。';
              setError(errorMessage);
              const tempErrorProperty: Property = {
                ...(mockProperties[0]),
                id: `error_${Date.now()}`,
                address: address,
              };
              setSelectedProperty(tempErrorProperty);
              setTransactionList([tempErrorProperty]);
              setIsLoading(false);
              setIsValuating(false);
              return; 
            }
          }
        }
    }
    
    if (!propertyToValuate) {
        setError('請輸入有效的地址。');
        setTransactionList([]);
        setIsLoading(false);
        setIsValuating(false);
        return;
    }

    setRecentSearches(prevSearches => {
        const filtered = prevSearches.filter(p => p.address !== propertyToValuate!.address);
        const updatedSearches = [propertyToValuate!, ...filtered];
        const cappedSearches = updatedSearches.slice(0, 5);
        if (currentUser) {
            localStorage.setItem(`propertyRecentSearches_${currentUser.email}`, JSON.stringify(cappedSearches));
        }
        return cappedSearches;
    });

    setSelectedProperty(propertyToValuate);
    
    const performValuation = async (contextTransactions: Property[]) => {
      try {
        const report = await getValuation(propertyToValuate!, contextTransactions.slice(0, 10), reference, customInputs);
        setValuation(report);
        const newHistoryItem: ValuationHistoryItem = {
          property: propertyToValuate!,
          report: report,
          date: new Date().toISOString(),
        };
        setValuationHistory(prevHistory => {
            const updatedHistory = [newHistoryItem, ...prevHistory].slice(0, 10);
            if (currentUser) {
                localStorage.setItem(`valuationHistory_${currentUser.email}`, JSON.stringify(updatedHistory));
            }
            return updatedHistory;
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '估價時發生未知錯誤，請稍後再試。';
        setError(errorMessage);
        console.error(err);
      } finally {
        setIsLoading(false);
        setIsValuating(false);
      }
    };

    const { city, district } = propertyToValuate;

    if (city && district) {
      const localData = getLocalTransactions(city, district);
      setTransactionList([propertyToValuate, ...localData]);
      const liveData = await fetchLiveNearbyTransactions(city, district);
      if (liveData) {
        const addressMatch = propertyToValuate.address.match(/^(.*[路街段巷弄])/);
        const baseAddress = addressMatch ? addressMatch[1] : null;
        const sortedLiveData = baseAddress 
            ? [
                ...liveData.filter(p => p.address.startsWith(baseAddress)),
                ...liveData.filter(p => !p.address.startsWith(baseAddress))
              ]
            : liveData;
        setTransactionList([propertyToValuate, ...sortedLiveData]);
        await performValuation(sortedLiveData);
      } else {
        await performValuation(localData);
      }
    } else {
      setTransactionList([propertyToValuate]);
      await performValuation([]);
    }
  }, [selectedProperty, currentUser]);

  const handleToggleCompare = useCallback(async (property: Property) => {
    setComparisonList(prev => {
      const isInList = prev.some(p => p.id === property.id);
      if (isInList) {
        return prev.filter(p => p.id !== property.id);
      } else {
        if (prev.length >= 4) {
            alert('最多只能比較 4 個房產。');
            return prev;
        }
        if (!comparisonValuations[property.id] || comparisonValuations[property.id].error) {
           setComparisonValuations(prevVals => ({
              ...prevVals,
              [property.id]: { report: null, isLoading: true, error: null }
            }));
           const { city, district } = property;
           if (city && district) {
                fetchLiveNearbyTransactions(city, district)
                .then(transactions => {
                    const contextData = transactions || getLocalTransactions(city, district);
                    return getValuation(property, contextData.slice(0, 10), '綜合市場因素');
                })
                .then(report => {
                    setComparisonValuations(prevVals => ({
                       ...prevVals,
                       [property.id]: { report, isLoading: false, error: null }
                    }));
                })
                .catch(err => {
                    const errorMessage = err instanceof Error ? err.message : '估價失敗';
                    setComparisonValuations(prevVals => ({
                       ...prevVals,
                       [property.id]: { report: null, isLoading: false, error: errorMessage }
                    }));
                });
           }
        }
        return [...prev, property];
      }
    });
  }, [comparisonValuations]);

  const handleClearCompare = () => setComparisonList([]);

  const toggleFavorite = (property: Property) => {
    let updatedFavorites;
    if (favorites.some(fav => fav.id === property.id)) {
      updatedFavorites = favorites.filter(fav => fav.id !== property.id);
    } else {
      updatedFavorites = [...favorites, property];
    }
    setFavorites(updatedFavorites);
    if (currentUser) {
        localStorage.setItem(`propertyFavorites_${currentUser.email}`, JSON.stringify(updatedFavorites));
    }
  };
  
  const selectPropertyFromList = (property: Property) => {
    setSelectedProperty(property);
    setValuation(null);
    setIsValuating(false);
    
    const { city, district } = property;
    if (city && district) {
        const localData = getLocalTransactions(city, district);
        setTransactionList([property, ...localData]);
        fetchLiveNearbyTransactions(city, district).then(liveData => {
            if (liveData) {
                setTransactionList([property, ...liveData]);
            }
        });
    } else {
         setTransactionList([property]);
    }
  };
  
  const handleMapMarkerSelect = (property: Property) => {
    setSelectedProperty(property);
    setValuation(null);
    setIsValuating(false);
  };
  
  const handleSelectRecent = (property: Property) => {
    handleSearch(
      property.address, 
      '綜合市場因素', 
      property.latitude && property.longitude 
        ? { coords: { lat: property.latitude, lon: property.longitude }, city: property.city, district: property.district } 
        : undefined
    );
  };
  
  const handleSelectHistory = (property: Property) => {
    handleSearch(
      property.address,
      '實價登錄',
      property.latitude && property.longitude
        ? { coords: { lat: property.latitude, lon: property.longitude }, city: property.city, district: property.district }
        : undefined
    );
    setIsHistoryOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      {currentUser ? (
        <main className="flex-grow p-4 max-w-4xl mx-auto w-full">
          <MainPanel 
            onSearch={handleSearch}
            onLocationSelect={handleLocationSelect}
            isLoading={isLoading}
            selectedProperty={selectedProperty}
            valuation={valuation}
            isValuating={isValuating}
            error={error}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onOpenHistory={() => setIsHistoryOpen(true)}
            transactionList={transactionList}
            filters={filters}
            onSelectProperty={selectPropertyFromList}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            comparisonList={comparisonList}
            onToggleCompare={handleToggleCompare}
            recentSearches={recentSearches}
            onSelectRecent={handleSelectRecent}
            onCompareClick={() => setIsComparing(true)}
            onOpenMap={() => setIsMapOpen(true)}
            currentUser={currentUser}
          />
        </main>
      ) : (
        <main className="flex-grow flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-white p-10 rounded-2xl shadow-lg border-2 border-black max-w-lg">
                <div className="mx-auto bg-blue-600 p-4 rounded-lg inline-block mb-6">
                    <BuildingOfficeIcon className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">歡迎使用 AI 房產估價師</h2>
                <p className="text-gray-600 mb-6">
                    請登入或註冊帳號，以開始探索即時房產估價、市場趨勢分析以及更多強大功能。
                </p>
                <button
                    onClick={() => setLoginModalOpen(true)}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                >
                    登入 / 註冊
                </button>
            </div>
        </main>
      )}
      
      {isMapOpen && currentUser && (
        <div 
            className="fixed top-20 right-4 bottom-4 z-40 bg-white rounded-2xl shadow-2xl w-[90vw] md:w-[60vw] lg:w-[45vw] xl:w-[40%] max-w-[700px] flex flex-col overflow-hidden border-2 border-black animate-slide-in-right"
        >
            <button 
                onClick={() => setIsMapOpen(false)} 
                className="absolute top-3 right-3 z-[1001] p-2 bg-white/80 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                aria-label="關閉地圖"
            >
                <XMarkIcon className="h-6 w-6 text-gray-800" />
            </button>
            <MapView
                property={selectedProperty}
                properties={transactionList}
                filters={filters}
                onSelectProperty={selectPropertyFromList}
                onMapMarkerSelect={handleMapMarkerSelect}
                onLocationSelect={handleLocationSelect}
            />
        </div>
      )}

      {isComparing && currentUser && (
        <ComparisonView 
          properties={comparisonList}
          valuations={comparisonValuations}
          onClose={() => setIsComparing(false)}
          onRemove={handleToggleCompare}
          onClear={handleClearCompare}
        />
      )}
      {isHistoryOpen && currentUser && (
        <ValuationHistory
          history={valuationHistory}
          onClose={() => setIsHistoryOpen(false)}
          onSelect={handleSelectHistory}
        />
      )}
      {isLoginModalOpen && <LoginModal />}
      {isAdminPanelOpen && currentUser?.role === '管理員' && <AdminPanel />}
       <style>{`
        @keyframes slide-in-right {
          from { 
            transform: translateX(100%); 
            opacity: 0;
          }
          to { 
            transform: translateX(0); 
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;