import type { Property, Filters } from './types';

export const mockProperties: Property[] = [
  {
    id: 'prop1',
    address: '台北市大安區古莊里羅斯福路二段79-1號',
    district: '大安區',
    type: '華廈',
    price: 25000000,
    size: 90.25, // Approx 27.3坪
    bedrooms: 2,
    bathrooms: 1,
    yearBuilt: 2005,
    imageUrl: 'https://picsum.photos/seed/prop1/800/600',
    latitude: 25.0259,
    longitude: 121.5238,
    floor: '8樓 / 14樓',
  },
  {
    id: 'prop2',
    address: '新北市板橋區文化路一段100號',
    district: '板橋區',
    type: '公寓',
    price: 12000000,
    size: 75,
    bedrooms: 2,
    bathrooms: 1,
    yearBuilt: 1998,
    imageUrl: 'https://picsum.photos/seed/prop2/800/600',
    latitude: 25.0142,
    longitude: 121.4678,
    floor: '4樓 / 5樓',
  },
  {
    id: 'prop3',
    address: '台中市西屯區台灣大道三段301號',
    district: '西屯區',
    type: '華廈',
    price: 25000000,
    size: 120,
    bedrooms: 4,
    bathrooms: 2,
    yearBuilt: 2010,
    imageUrl: 'https://picsum.photos/seed/prop3/800/600',
    latitude: 24.1643,
    longitude: 120.6445,
    floor: '11樓 / 22樓',
  },
  {
    id: 'prop4',
    address: '高雄市左營區博愛二路777號',
    district: '左營區',
    type: '透天厝',
    price: 38000000,
    size: 200,
    bedrooms: 5,
    bathrooms: 4,
    yearBuilt: 2018,
    imageUrl: 'https://picsum.photos/seed/prop4/800/600',
    latitude: 22.6698,
    longitude: 120.3023,
    floor: '1-4樓 / 4樓',
  },
];

export const initialFilters: Filters = {
  type: '華廈',
  price: 'all',
  bedrooms: 'all',
  yearBuilt: 'all',
  pricePerSqm: 'all',
  size: '0-30',
};

export const PROPERTY_TYPES = ['公寓', '電梯大樓', '透天厝', '華廈'];

export const PRICE_RANGES = [
  { value: 'all', label: '所有價格' },
  { value: '0-1500', label: '1500萬以下' },
  { value: '1500-3000', label: '1500-3000萬' },
  { value: '3000-5000', label: '3000-5000萬' },
  { value: '5000+', label: '5000萬以上' },
];

export const BEDROOM_OPTIONS = [
  { value: 'all', label: '所有房型' },
  { value: '1', label: '1房' },
  { value: '2', label: '2房' },
  { value: '3', label: '3房' },
  { value: '4', label: '4房' },
  { value: '5+', label: '5房以上' },
];

export const YEAR_BUILT_RANGES = [
  { value: 'all', label: '所有屋齡' },
  { value: '0-5', label: '5年內' },
  { value: '5-10', label: '5-10年' },
  { value: '10-20', label: '10-20年' },
  { value: '20+', label: '20年以上' },
];

export const PRICE_PER_SQM_RANGES = [
  { value: 'all', label: '所有單價' },
  { value: '0-200000', label: '20萬/㎡ 以下' },
  { value: '200000-300000', label: '20-30萬/㎡' },
  { value: '300000-400000', label: '30-40萬/㎡' },
  { value: '400000+', label: '40萬/㎡ 以上' },
];

export const SIZE_RANGES = [
  { value: 'all', label: '任意坪數' },
  { value: '0-30', label: '30坪以下' },
  { value: '30-60', label: '30-60坪' },
  { value: '60+', label: '60坪以上' },
];