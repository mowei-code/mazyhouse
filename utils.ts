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
