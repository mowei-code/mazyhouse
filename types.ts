export interface Property {
  id: string;
  address: string;
  district: string;
  type: '公寓' | '電梯大樓' | '透天厝' | '華廈';
  price: number;
  size: number; // in square meters
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  imageUrl: string;
  latitude: number;
  longitude: number;
  floor: string;
  transactionDate?: string;
}

export interface PriceTrendDataPoint {
  label: string; // e.g., '2022 H1', '2022 H2'
  price: number;
}

export interface ValuationReport {
  estimatedPrice: number;
  pricePerSqm: number;
  priceTrend: PriceTrendDataPoint[];
  pros: string[];
  cons: string[];
  marketSummary: string;
  confidence: '高' | '中' | '低';
  amenitiesAnalysis: {
    schools: string[];
    transport: string[];
    shopping: string[];
  };
}

export interface Filters {
  type: string;
  price: string;
  bedrooms: string;
  yearBuilt: string;
  pricePerSqm: string;
  size: string;
}