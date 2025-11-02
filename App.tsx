import React, { useState, useEffect, useCallback } from 'react';
import type { Property, ValuationReport, Filters } from './types';
import { getValuation } from './services/geminiService';
import { SearchForm } from './components/SearchForm';
import { ValuationReportDisplay } from './components/ValuationReportDisplay';
import { FavoritesList } from './components/FavoritesList';
import { Header } from './components/Header';
import { mockProperties, initialFilters } from './constants';
import { MapView } from './components/MapView';

// Helper function to generate mock nearby properties for context
const generateNearbyProperties = (baseProperty: Property, count: number): Property[] => {
  const nearby: Property[] = [];
  let propertySource = baseProperty;
  
  // Use a fallback if the base property is a new one without complete data
  if (!propertySource.price || propertySource.price === 0) {
      const fallback = mockProperties.find(p => p.district === propertySource.district) || mockProperties[0];
      propertySource = { ...propertySource, price: fallback.price, size: fallback.size, yearBuilt: fallback.yearBuilt, type: fallback.type, bedrooms: fallback.bedrooms, bathrooms: fallback.bathrooms, floor: fallback.floor };
  }

  for (let i = 0; i < count; i++) {
    const priceVariance = (Math.random() - 0.5) * 0.2; // +/- 10%
    const sizeVariance = (Math.random() - 0.5) * 0.2; // +/- 10%
    const yearVariance = Math.floor((Math.random() - 0.5) * 10); // +/- 5 years
    
    // Generate a random transaction date within the last 3 years
    const transactionDate = new Date(Date.now() - Math.random() * 3 * 365 * 24 * 60 * 60 * 1000);

    const floor = Math.floor(Math.random() * 15) + 1;
    const totalFloors = floor + Math.floor(Math.random() * 10);

    nearby.push({
      ...propertySource,
      id: `nearby_${propertySource.id}_${Date.now()}_${i}`,
      address: `${propertySource.district} 附近實價登錄 #${i + 1}`,
      latitude: propertySource.latitude + (Math.random() - 0.5) * 0.005, // ~500m radius
      longitude: propertySource.longitude + (Math.random() - 0.5) * 0.005,
      price: Math.max(1000000, Math.round(propertySource.price * (1 + priceVariance))),
      size: Math.max(10, Math.round(propertySource.size * (1 + sizeVariance))),
      yearBuilt: propertySource.yearBuilt + yearVariance,
      floor: `${floor}樓 / ${totalFloors}樓`,
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isValuating, setIsValuating] = useState(false);
  const [transactionList, setTransactionList] = useState<Property[]>([]);
  const [filters, setFilters] = useState<Filters>(initialFilters);

  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem('propertyFavorites');
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (e) {
      console.error("Failed to parse favorites from localStorage", e);
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
  
  const handleSearch = useCallback(async (address: string) => {
    setError(null);
    setValuation(null);
    setIsValuating(true);
    setIsLoading(true);

    let propertyToValuate: Property | null = mockProperties.find(p => 
      p.address.toLowerCase().includes(address.toLowerCase())
    ) || null;

    if (!propertyToValuate && address) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=tw`);
        if (!response.ok) throw new Error('Geocoding service failed');
        const data = await response.json();

        if (data && data.length > 0) {
          const { lat, lon, display_name } = data[0];
          const baseProperty = mockProperties[Math.floor(Math.random() * mockProperties.length)];
          const floor = Math.floor(Math.random() * 15) + 1;
          const totalFloors = floor + Math.floor(Math.random() * 10);
          propertyToValuate = {
            ...baseProperty,
            id: `prop_${Date.now()}`,
            address: display_name, // Use the more complete address from geocoding
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
            floor: `${floor}樓 / ${totalFloors}樓`,
          };
        } else {
          throw new Error('地址無法定位，請嘗試更詳細的地址或檢查錯別字。');
        }
      } catch (geoError) {
        console.error("Geocoding error:", geoError);
        const errorMessage = geoError instanceof Error ? geoError.message : '地址定位時發生未知錯誤。';
        setError(errorMessage);
        // Still set a selected property to show the user's input, but without coordinates
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
    
    if (!propertyToValuate) {
        setError('請輸入有效的地址。');
        setTransactionList([]);
        setIsLoading(false);
        setIsValuating(false);
        return;
    }

    setSelectedProperty(propertyToValuate);
    const nearby = generateNearbyProperties(propertyToValuate, 4);
    setTransactionList([propertyToValuate, ...nearby]);
    
    try {
      const report = await getValuation(propertyToValuate);
      setValuation(report);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '估價時發生未知錯誤，請稍後再試。';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

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


  return (
    <div className="min-h-screen bg-slate-100/50 font-sans text-slate-800">
      <Header />
      <main className="container mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-8">
          <MapView 
            property={selectedProperty}
            properties={transactionList}
            filters={filters}
            onSelectProperty={selectPropertyFromList} 
          />
          <FavoritesList 
            properties={transactionList}
            favorites={favorites}
            filters={filters}
            onSelectProperty={selectPropertyFromList}
            onToggleFavorite={toggleFavorite}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Right Column */}
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
      </main>
    </div>
  );
};

export default App;