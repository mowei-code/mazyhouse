import type { Property, Filters } from './types';

export const applyFilters = (properties: Property[], filters: Filters): Property[] => {
  return properties.filter(property => {
    // Filter by type
    if (filters.type !== 'all' && property.type !== filters.type) {
      return false;
    }
    
    // Filter by price
    if (filters.price !== 'all') {
      const priceInWan = property.price / 10000;
      if (filters.price === '0-1500' && priceInWan > 1500) return false;
      if (filters.price === '1500-3000' && (priceInWan < 1500 || priceInWan > 3000)) return false;
      if (filters.price === '3000-5000' && (priceInWan < 3000 || priceInWan > 5000)) return false;
      if (filters.price === '5000+' && priceInWan < 5000) return false;
    }

    // Filter by bedrooms
    if (filters.bedrooms !== 'all') {
      if (filters.bedrooms === '5+' && property.bedrooms < 5) return false;
      if (filters.bedrooms !== '5+' && !isNaN(parseInt(filters.bedrooms, 10)) && property.bedrooms !== parseInt(filters.bedrooms, 10)) return false;
    }

    // Filter by year built
    if (filters.yearBuilt !== 'all') {
      const propertyAge = new Date().getFullYear() - property.yearBuilt;
      if (filters.yearBuilt === '0-5' && propertyAge > 5) return false;
      if (filters.yearBuilt === '5-10' && (propertyAge <= 5 || propertyAge > 10)) return false;
      if (filters.yearBuilt === '10-20' && (propertyAge <= 10 || propertyAge > 20)) return false;
      if (filters.yearBuilt === '20+' && propertyAge <= 20) return false;
    }
    
    // Filter by price per square meter
    if (filters.pricePerSqm !== 'all') {
      const pricePerSqm = property.price / property.size;
      if (filters.pricePerSqm === '0-200000' && pricePerSqm > 200000) return false;
      if (filters.pricePerSqm === '200000-300000' && (pricePerSqm <= 200000 || pricePerSqm > 300000)) return false;
      if (filters.pricePerSqm === '300000-400000' && (pricePerSqm <= 300000 || pricePerSqm > 400000)) return false;
      if (filters.pricePerSqm === '400000+' && pricePerSqm <= 400000) return false;
    }

    // Filter by size in ping
    if (filters.size !== 'all') {
      const sizeInPing = property.size / 3.30579;
      if (filters.size === '0-30' && sizeInPing > 30) return false;
      if (filters.size === '30-60' && (sizeInPing <= 30 || sizeInPing > 60)) return false;
      if (filters.size === '60+' && sizeInPing <= 60) return false;
    }
    
    return true;
  });
};

export const sanitizeAddressForGeocoding = (address: string): string => {
  // Nominatim (OpenStreetMap's geocoder) often fails with certain Taiwanese address formats.
  // This function simplifies them to improve the likelihood of a successful geocoding lookup.
  // It handles formats like "79之1號" and "79-1號" by simplifying them to "79號".
  return address.replace(/(\d+)[之-]\d+號/g, '$1號');
};

export const parseAddress = (address: string): { city: string | null, district: string | null } => {
    // This regex is designed to capture Taiwanese city/county and district/township names.
    // e.g., "台北市大安區..." -> city: "台北市", district: "大安區"
    // e.g., "新北市板橋區..." -> city: "新北市", district: "板橋區"
    const match = address.match(/^(..[市縣])(..[區鄉鎮市])/);
    if (match && match.length >= 3) {
        return { city: match[1], district: match[2] };
    }
    return { city: null, district: null };
};

export const formatNominatimAddress = (data: any): string => {
    // Prioritize using the structured 'address' object for correct ordering
    if (data?.address) {
        const addr = data.address;
        const city = addr.city || addr.county || '';
        const district = addr.suburb || addr.city_district || '';
        const road = addr.road || '';
        
        let houseNumber = addr.house_number ? String(addr.house_number).trim() : '';
        if (houseNumber && !houseNumber.endsWith('號')) {
            houseNumber += '號';
        }

        const address = [city, district, road, houseNumber].filter(Boolean).join('');
        // If we successfully built a reasonable address, return it.
        if (address.length > 5) {
            return address;
        }
    }
    
    // Fallback to cleaning up and reversing the 'display_name' if structured approach fails.
    // Reversing is necessary because display_name is often ordered from smallest unit to largest.
    if (data?.display_name) {
        const addressParts = data.display_name.split(', ');
        const relevantParts = addressParts
            .filter((part: string) => 
                !part.match(/^\d{3,5}$/) && // filter out postal code
                part.toLowerCase() !== 'taiwan' && part !== '台灣' // filter out country
            )
            .reverse(); // Reverse to get City -> District -> Road order
        return relevantParts.join('');
    }

    return ''; // Return empty if nothing can be parsed.
};

export const isSpecialTransaction = (property: Property): boolean => {
  const remarksText = property.remarks ? property.remarks.trim() : '';
  if (!remarksText) {
    return false;
  }
  // This regex checks if the remarks *only* contain the standard boilerplate source text.
  // If it contains more than that (e.g.,親友間交易), it's considered a special transaction.
  const isBoilerplateOnly = /^資料來源\s*[:：]\s*內政部實價登錄$/.test(remarksText);
  return !isBoilerplateOnly;
};