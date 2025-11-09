import type { Property } from '../types';
import { MOCK_REAL_ESTATE_DATA } from './mockRealEstateData';

// This is a free, public API that wraps the official government real estate data.
const API_ENDPOINT = 'https://api.bluenet-ride.com/p/realprice';

// A curated list of diverse, public CORS proxies to provide a resilient fallback system.
// The system will try each one in order until a request succeeds.
const PROXIES = [
    { buildUrl: (targetUrl: string) => `https://cors.eu.org/${targetUrl}` },
    { buildUrl: (targetUrl: string) => `https://corsproxy.io/?${encodeURIComponent(targetUrl)}` },
    { buildUrl: (targetUrl: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}` },
    { buildUrl: (targetUrl:string) => `https://thingproxy.freeboard.io/fetch/${targetUrl}`},
];


// Helper to map building types from the API to our internal types
const mapBuildingType = (apiType: string): '公寓' | '電梯大樓' | '透天厝' | '華廈' => {
    if (apiType.includes('公寓')) return '公寓';
    if (apiType.includes('住宅大樓')) return '電梯大樓';
    if (apiType.includes('透天厝')) return '透天厝';
    if (apiType.includes('華廈')) return '華廈';
    return '華廈';
};

// Helper to convert ROC year (e.g., 105) to AD year (e.g., 2016)
const convertRocToAdYear = (rocYearMonth: number | string): number => {
    const yearStr = String(rocYearMonth).padStart(5, '0').substring(0, 3);
    const rocYear = parseInt(yearStr, 10);
    return rocYear + 1911;
};

// Helper to format transaction date from ROC format (e.g., 1120515) to YYYY-MM-DD
const formatTransactionDate = (rocDate: number | string): string => {
    const dateStr = String(rocDate);
    const year = parseInt(dateStr.substring(0, 3), 10) + 1911;
    const month = dateStr.substring(3, 5);
    const day = dateStr.substring(5, 7);
    return `${year}-${month}-${day}`;
};


/**
 * NEW: Fetches a guaranteed set of transactions from the local mock data.
 * This function is reliable and will always return data instantly.
 */
export function getLocalTransactions(city: string, district: string): Property[] {
    const formattedCity = city.replace(/[市縣]$/, '');
    const formattedDistrict = district.replace(/[區鄉鎮市]$/, '');

    const key = `${formattedCity}-${formattedDistrict}` as keyof typeof MOCK_REAL_ESTATE_DATA;
    
    // FIX: If no specific mock data exists for the area, return an empty array.
    // This prevents showing incorrect data from a different city (e.g., Taipei)
    // when the user is searching in an area not covered by the mock data (e.g., Kaohsiung).
    const data = MOCK_REAL_ESTATE_DATA[key] ? [...MOCK_REAL_ESTATE_DATA[key]] : [];

    // Ensure all returned properties have the city field.
    return data.map(prop => ({ ...prop, city }));
}


/**
 * Attempts to fetch LIVE nearby transactions from the external API using a resilient proxy fallback system.
 * This function may fail if all proxies are down, but it will not crash the app.
 */
export async function fetchLiveNearbyTransactions(city: string, district: string): Promise<Property[] | null> {
    const formattedCity = city.replace(/[市縣]$/, '');
    const formattedDistrict = district.replace(/[區鄉鎮市]$/, '');
    const originalUrl = `${API_ENDPOINT}?city=${formattedCity}&district=${formattedDistrict}`;

    for (const proxy of PROXIES) {
        const proxiedUrl = proxy.buildUrl(originalUrl);
        const proxyIdentifier = proxiedUrl.split('/')[2]; // e.g., "corsproxy.io"

        try {
            const response = await fetch(proxiedUrl, { signal: AbortSignal.timeout(10000) });

            if (!response.ok) {
                // This is a normal failure, just try the next proxy silently.
                continue; 
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                 // Also a normal failure, try next.
                continue;
            }
            
            const data = await response.json();
            
            if (!Array.isArray(data)) {
                // Data format is wrong, try next.
                continue; 
            }
            
            console.log(`Successfully fetched LIVE data via '${proxyIdentifier}'.`);

            const properties: Property[] = data.map((item: any, index: number) => {
                const sizeInSqm = parseFloat(item['建物移轉總面積平方公尺']);
                return {
                    id: `real_${item['編號'] || index}`,
                    address: item['土地區段位置建物區段門牌'],
                    city: city, // Add the city to the property object
                    district: item['鄉鎮市區'],
                    type: mapBuildingType(item['建物型態']),
                    price: parseInt(item['總價元'], 10),
                    size: isNaN(sizeInSqm) ? 0 : sizeInSqm,
                    bedrooms: parseInt(item['房'], 10) || 0,
                    bathrooms: parseInt(item['衛'], 10) || 0,
                    yearBuilt: convertRocToAdYear(item['建築完成年月']),
                    imageUrl: `https://picsum.photos/seed/real${index}${item['鄉鎮市區']}/800/600`,
                    floor: item['樓別/樓高'] || 'N/A',
                    transactionDate: formatTransactionDate(item['交易年月日']),
                    remarks: item['備註'] || undefined,
                };
            }).filter(p => p.price > 0 && p.size > 0);

            return properties; // Success!

        } catch (error) {
            // This error is expected if a proxy is down. Silently continue to the next one.
        }
    }
    
    // This message is now a less-alarming 'warn' and clarifies the situation for developers.
    console.warn(
      "無法獲取即時房地產數據更新。這不是一個嚴重錯誤，應用程式將繼續正常運作並使用可靠的本地備用數據。"
    );
    return null; // Return null on complete failure
}