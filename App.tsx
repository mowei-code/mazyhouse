import React, { useState, useEffect, useCallback } from 'react';
import type { Property, ValuationReport, Filters, ComparisonValuationState } from './types';
import { getValuation } from './services/geminiService';
import { SearchForm } from './components/SearchForm';
import { ValuationReportDisplay } from './components/ValuationReportDisplay';
import { FavoritesList } from './components/FavoritesList';
import { Header } from './components/Header';
import { mockProperties, initialFilters } from './constants';
import { MapView } from './components/MapView';
import { RecentSearchesList } from './components/RecentSearchesList';
import { ComparisonTray } from './components/ComparisonTray';
import { ComparisonView } from './components/ComparisonView';
import { sanitizeAddressForGeocoding } from './utils';

// Define a more neutral fallback property to avoid biasing towards Taipei prices.
const defaultPropertyData = {
  price: 15000000,
  size: 85,
  yearBuilt: 2005,
  type: '華廈' as const,
  bedrooms: 3,
  bathrooms: 2,
  floor: '7樓 / 15樓',
};

// Helper function to generate mock nearby properties for context
const generateNearbyProperties = (baseProperty: Property, count: number): Property[] => {
  const nearby: Property[] = [];
  let propertySource = baseProperty;
  
  // Use a fallback if the base property is a new one without complete data
  if (!propertySource.price || propertySource.price === 0) {
      const fallback = mockProperties.find(p => p.district === propertySource.district) || defaultPropertyData;
      propertySource = { ...propertySource, price: fallback.price, size: fallback.size, yearBuilt: fallback.yearBuilt, type: fallback.type, bedrooms: fallback.bedrooms, bathrooms: fallback.bathrooms, floor: fallback.floor };
  }

  // Determine how many transactions should be in the same building to make it more realistic
  const sameBuildingCount = Math.floor(count / 2);

  for (let i = 0; i < count; i++) {
    const isSameBuilding = i < sameBuildingCount;

    const priceVariance = (Math.random() - 0.5) * 0.2; // +/- 10%
    const sizeVariance = (Math.random() - 0.5) * 0.2; // +/- 10%
    const transactionDate = new Date(Date.now() - Math.random() * 3 * 365 * 24 * 60 * 60 * 1000);
    
    let generatedAddress = '';
    let generatedFloor = '';
    let generatedYearBuilt = propertySource.yearBuilt;
    
    // Extract total floors from the base property's floor string, e.g., "8樓 / 14樓" -> 14
    const baseTotalFloorsMatch = propertySource.floor.match(/\/ (\d+)樓/);
    const baseTotalFloors = baseTotalFloorsMatch ? parseInt(baseTotalFloorsMatch[1], 10) : 15 + Math.floor(Math.random() * 10);

    if (isSameBuilding) {
      generatedAddress = propertySource.address; // Use the same address for the same building
      
      // Generate a different floor within the same building's floor range
      let newFloor;
      do {
          newFloor = Math.floor(Math.random() * baseTotalFloors) + 1;
      } while (newFloor === parseInt(propertySource.floor, 10)); // Ensure it's not the same floor as the main property
      generatedFloor = `${newFloor}樓 / ${baseTotalFloors}樓`;
      // Year built remains the same for the same building
      generatedYearBuilt = propertySource.yearBuilt;
    } else {
      // Generate a nearby address (existing logic for different buildings)
      const addressMatch = propertySource.address.match(/^(.*[路街段巷弄])/);
      const baseAddress = addressMatch && addressMatch[1] 
        ? addressMatch[1] 
        : `${propertySource.district}${['中山','中正','信義','和平'][i % 4]}路`;
      const newHouseNumber = Math.floor(Math.random() * 200) + 1;
      generatedAddress = `${baseAddress}${newHouseNumber}號`;

      // Generate floor and year for the new, nearby building
      const floor = Math.floor(Math.random() * 15) + 1;
      const totalFloors = floor + Math.floor(Math.random() * 10);
      generatedFloor = `${floor}樓 / ${totalFloors}樓`;
      const yearVariance = Math.floor((Math.random() - 0.5) * 10); // +/- 5 years
      generatedYearBuilt = propertySource.yearBuilt + yearVariance;
    }

    nearby.push({
      ...propertySource,
      id: `nearby_${propertySource.id}_${Date.now()}_${i}`,
      address: generatedAddress,
      // Jitter coordinates slightly for same-building properties to avoid map marker overlap
      latitude: propertySource.latitude + (Math.random() - 0.5) * (isSameBuilding ? 0.0001 : 0.005),
      longitude: propertySource.longitude + (Math.random() - 0.5) * (isSameBuilding ? 0.0001 : 0.005),
      price: Math.max(1000000, Math.round(propertySource.price * (1 + priceVariance))),
      size: Math.max(10, Math.round(propertySource.size * (1 + sizeVariance))),
      yearBuilt: generatedYearBuilt,
      floor: generatedFloor,
      imageUrl: `https://picsum.photos/seed/nearby${i}${propertySource.id}/800/600`,
      transactionDate: transactionDate.toISOString().split('T')[0],
    });
  }
  return nearby;
};


const App: React.FC = () => {
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

  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem('propertyFavorites');
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
      const storedRecent = localStorage.getItem('propertyRecentSearches');
      if (storedRecent) {
        setRecentSearches(JSON.parse(storedRecent));
      }
    } catch (e) {
      console.error("Failed to parse from localStorage", e);
    }

    // Initialize with the default property and its nearby transactions
    if (mockProperties[0]) {
        const nearby = generateNearbyProperties(mockProperties[0], 4);
        setTransactionList([mockProperties[0], ...nearby]);
    }
  }, []);

  const handleFilterChange = useCallback((name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);
  
  const handleSearch = useCallback(async (
    address: string,
    reference: string,
    details?: { coords: { lat: number; lon: number }; district: string }
  ) => {
    setError(null);
    setValuation(null);
    setIsValuating(true);
    setIsLoading(true);

    let propertyToValuate: Property | null = null;
      
    // Path A: Geolocation or other direct coordinate-based search
    if (details) {
        const { coords, district } = details;
        // FIX: Construct a clean property object using safe defaults and the correct, passed-in data.
        // This prevents data corruption from using a random mock property as a base.
        propertyToValuate = {
          ...defaultPropertyData,
          id: `prop_${Date.now()}`,
          address: address,
          latitude: coords.lat,
          longitude: coords.lon,
          district: district,
          imageUrl: `https://picsum.photos/seed/${Date.now()}/800/600`,
        };
    } else {
        // Path B: Text-based search
        // FIX: Use a strict, case-insensitive match to avoid false positives from fuzzy matching.
        propertyToValuate = mockProperties.find(p => 
          p.address.trim().toLowerCase() === address.trim().toLowerCase()
        ) || null;
          
        const isSearchingForSelectedProperty = selectedProperty &&
          selectedProperty.address === address &&
          selectedProperty.latitude &&
          selectedProperty.longitude;

        if (!propertyToValuate && address) {
          if (isSearchingForSelectedProperty) { // This handles map drags
            propertyToValuate = selectedProperty;
          } else {
             // No exact match found, so forward-geocode the address string.
            try {
              const sanitizedAddress = sanitizeAddressForGeocoding(address);
              const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(sanitizedAddress)}&countrycodes=tw&addressdetails=1&accept-language=zh-TW`);
              if (!response.ok) throw new Error('Geocoding service failed');
              const data = await response.json();

              if (data && data.length > 0) {
                const { lat, lon, address: addrDetails } = data[0];
                let constructedAddress = address; // Fallback to user input

                if (addrDetails) {
                  const hn = addrDetails.house_number ? String(addrDetails.house_number).trim() : '';
                  // FIX: Robustly handle '號' suffix to prevent duplicates.
                  const houseNumberPart = hn ? (hn.endsWith('號') ? hn : `${hn}號`) : '';

                  const addressParts = [
                    addrDetails.city || addrDetails.county,
                    addrDetails.suburb || addrDetails.city_district,
                    addrDetails.road,
                    houseNumberPart
                  ];
                  const tempAddress = addressParts.filter(Boolean).join('');
                  if (tempAddress) {
                      constructedAddress = tempAddress;
                  }
                }

                propertyToValuate = {
                  ...defaultPropertyData,
                  id: `prop_${Date.now()}`,
                  address: constructedAddress,
                  latitude: parseFloat(lat),
                  longitude: parseFloat(lon),
                  district: addrDetails.suburb || addrDetails.city_district || '未知區域',
                  imageUrl: `https://picsum.photos/seed/${Date.now()}/800/600`,
                };
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

    // Add to recent searches right after we have a valid property
    setRecentSearches(prevSearches => {
        const filtered = prevSearches.filter(p => p.address !== propertyToValuate!.address);
        const updatedSearches = [propertyToValuate!, ...filtered];
        const cappedSearches = updatedSearches.slice(0, 5);
        localStorage.setItem('propertyRecentSearches', JSON.stringify(cappedSearches));
        return cappedSearches;
    });

    setSelectedProperty(propertyToValuate);
    const nearby = generateNearbyProperties(propertyToValuate, 4);
    setTransactionList([propertyToValuate, ...nearby]);
    
    try {
      const report = await getValuation(propertyToValuate, nearby, reference);
      setValuation(report);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '估價時發生未知錯誤，請稍後再試。';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProperty]);

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

           const nearby = generateNearbyProperties(property, 4);
           getValuation(property, nearby, '綜合市場因素')
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
        return [...prev, property];
      }
    });
  }, [comparisonValuations]);

  const handleClearCompare = () => {
    setComparisonList([]);
  };

  const toggleFavorite = (property: Property) => {
    let updatedFavorites;
    if (favorites.some(fav => fav.id === property.id)) {
      updatedFavorites = favorites.filter(fav => fav.id !== property.id);
    } else {
      updatedFavorites = [...favorites, property];
    }
    setFavorites(updatedFavorites);
    localStorage.setItem('propertyFavorites', JSON.stringify(updatedFavorites));
  };
  
  const selectPropertyFromList = (property: Property) => {
    setSelectedProperty(property);
    setValuation(null);
    setIsValuating(false);
    const nearby = generateNearbyProperties(property, 4);
    setTransactionList([property, ...nearby]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleSelectRecent = (property: Property) => {
    handleSearch(
      property.address, 
      '綜合市場因素', 
      property.latitude && property.longitude 
        ? { coords: { lat: property.latitude, lon: property.longitude }, district: property.district } 
        : undefined
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-emerald-50 font-sans text-slate-800">
      <Header />
      <main className="container mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-32">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 sticky top-6">
            <SearchForm onSearch={handleSearch} isLoading={isLoading} initialAddress={selectedProperty?.address || ''} />
            
            {selectedProperty && (
              <ValuationReportDisplay
                property={selectedProperty}
                valuation={valuation}
                isLoading={isLoading}
                error={error}
                isFavorite={favorites.some(fav => fav.id === selectedProperty.id)}
                onToggleFavorite={() => toggleFavorite(selectedProperty)}
                isValuating={isValuating}
              />
            )}
          </div>
        </div>
      
        {/* Right Column (Sidebar) */}
        <div className="lg:col-span-4 space-y-8">
          <MapView 
            property={selectedProperty}
            properties={transactionList}
            filters={filters}
            onSelectProperty={selectPropertyFromList} 
          />
          <RecentSearchesList
            searches={recentSearches}
            onSelect={handleSelectRecent}
            comparisonList={comparisonList}
            onToggleCompare={handleToggleCompare}
          />
          <FavoritesList 
            properties={transactionList}
            favorites={favorites}
            filters={filters}
            onSelectProperty={selectPropertyFromList}
            onToggleFavorite={toggleFavorite}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            comparisonList={comparisonList}
            onToggleCompare={handleToggleCompare}
          />
        </div>
      </main>

      {comparisonList.length > 0 && (
        <ComparisonTray
          properties={comparisonList}
          onCompare={() => setIsComparing(true)}
          onRemove={handleToggleCompare}
          onClear={handleClearCompare}
        />
      )}

      {isComparing && (
        <ComparisonView
          properties={comparisonList}
          valuations={comparisonValuations}
          onClose={() => setIsComparing(false)}
        />
      )}
    </div>
  );
};

export default App;
