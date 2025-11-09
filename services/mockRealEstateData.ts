import type { Property } from '../types';

// This file contains a static snapshot of real estate data.
// It serves as a reliable fallback to ensure the application can always initialize and function,
// even when live API calls via CORS proxies fail.

const TAIPEI_DAAN: Property[] = [
    // User-provided transactions for 羅斯福路二段79之1號
  {
    "id": "real_lvr_1",
    "address": "台北市大安區羅斯福路二段79之1號七樓之5",
    "district": "大安區",
    "type": "華廈",
    "price": 10000000,
    "size": 56.39, // 17.06坪
    "bedrooms": 1,
    "bathrooms": 1,
    "yearBuilt": 1986,
    "imageUrl": "https://picsum.photos/seed/real_lvr_1/800/600",
    "floor": "七層/十二層",
    "transactionDate": "2025-06-26",
    "remarks": "資料來源: 內政部實價登錄"
  },
  {
    "id": "real_lvr_2",
    "address": "台北市大安區羅斯福路二段79之1號五樓之6",
    "district": "大安區",
    "type": "華廈",
    "price": 11080000,
    "size": 39.80, // 12.04坪
    "bedrooms": 1,
    "bathrooms": 1,
    "yearBuilt": 1986,
    "imageUrl": "https://picsum.photos/seed/real_lvr_2/800/600",
    "floor": "五層/十二層",
    "transactionDate": "2025-05-21",
    "remarks": "資料來源: 內政部實價登錄"
  },
  {
    "id": "real_lvr_3",
    "address": "台北市大安區羅斯福路二段79之1號九樓",
    "district": "大安区",
    "type": "華廈",
    "price": 24880000,
    "size": 90.54, // 27.39坪
    "bedrooms": 3,
    "bathrooms": 2,
    "yearBuilt": 1988,
    "imageUrl": "https://picsum.photos/seed/real_lvr_3/800/600",
    "floor": "九層/十二層",
    "transactionDate": "2023-08-20",
    "remarks": "資料來源: 內政部實價登錄"
  },
  {
    "id": "real_lvr_4",
    "address": "台北市大安區羅斯福路二段79之1號九樓之4",
    "district": "大安區",
    "type": "華廈",
    "price": 10500000,
    "size": 41.12, // 12.44坪
    "bedrooms": 2,
    "bathrooms": 1,
    "yearBuilt": 1989,
    "imageUrl": "https://picsum.photos/seed/real_lvr_4/800/600",
    "floor": "九層/十二層",
    "transactionDate": "2022-06-06",
    "remarks": "資料來源: 內政部實價登錄"
  },
  {
    "id": "real_A1",
    "address": "台北市大安區信義路四段25號",
    "district": "大安區",
    "type": "電梯大樓",
    "price": 68000000,
    "size": 135.5,
    "bedrooms": 3,
    "bathrooms": 2,
    "yearBuilt": 2015,
    "imageUrl": "https://picsum.photos/seed/realA1/800/600",
    "floor": "12樓/25樓",
    "transactionDate": "2023-11-05"
  },
  {
    "id": "real_A2",
    "address": "台北市大安區和平東路一段162號",
    "district": "大安區",
    "type": "公寓",
    "price": 18500000,
    "size": 88.1,
    "bedrooms": 3,
    "bathrooms": 1,
    "yearBuilt": 1985,
    "imageUrl": "https://picsum.photos/seed/realA2/800/600",
    "floor": "4樓/5樓",
    "transactionDate": "2024-01-20",
    "remarks": "親友間交易，價格偏低"
  },
  {
    "id": "real_A3",
    "address": "台北市大安區羅斯福路三段81巷",
    "district": "大安區",
    "type": "華廈",
    "price": 32000000,
    "size": 75.5,
    "bedrooms": 2,
    "bathrooms": 2,
    "yearBuilt": 2008,
    "imageUrl": "https://picsum.photos/seed/realA3/800/600",
    "floor": "5樓/10樓",
    "transactionDate": "2023-09-15"
  },
  {
    "id": "real_A4",
    "address": "台北市大安區復興南路一段300號",
    "district": "大安區",
    "type": "電梯大樓",
    "price": 85000000,
    "size": 180.2,
    "bedrooms": 4,
    "bathrooms": 3,
    "yearBuilt": 2018,
    "imageUrl": "https://picsum.photos/seed/realA4/800/600",
    "floor": "20樓/28樓",
    "transactionDate": "2024-02-01"
  },
  {
    "id": "real_A5",
    "address": "台北市大安區仁愛路四段112巷",
    "district": "大安區",
    "type": "電梯大樓",
    "price": 95000000,
    "size": 205.0,
    "bedrooms": 4,
    "bathrooms": 3,
    "yearBuilt": 2005,
    "imageUrl": "https://picsum.photos/seed/realA5/800/600",
    "floor": "9樓/14樓",
    "transactionDate": "2024-03-12"
  }
];

const NEW_TAIPEI_BANQIAO: Property[] = [
  {
    "id": "real_B1",
    "address": "新北市板橋區縣民大道二段10號",
    "district": "板橋區",
    "type": "電梯大樓",
    "price": 45000000,
    "size": 120.7,
    "bedrooms": 3,
    "bathrooms": 2,
    "yearBuilt": 2012,
    "imageUrl": "https://picsum.photos/seed/realB1/800/600",
    "floor": "18樓/30樓",
    "transactionDate": "2023-12-10"
  },
  {
    "id": "real_B2",
    "address": "新北市板橋區中山路一段150號",
    "district": "板橋區",
    "type": "華廈",
    "price": 18500000,
    "size": 85.3,
    "bedrooms": 2,
    "bathrooms": 1,
    "yearBuilt": 1999,
    "imageUrl": "https://picsum.photos/seed/realB2/800/600",
    "floor": "7樓/12樓",
    "transactionDate": "2024-01-08"
  },
  {
    "id": "real_B3",
    "address": "新北市板橋區漢生東路270巷",
    "district": "板橋區",
    "type": "公寓",
    "price": 16000000,
    "size": 95.0,
    "bedrooms": 3,
    "bathrooms": 2,
    "yearBuilt": 1988,
    "imageUrl": "https://picsum.photos/seed/realB3/800/600",
    "floor": "3樓/5樓",
    "transactionDate": "2023-10-25",
    "remarks": "含頂樓增建"
  },
  {
    "id": "real_B4",
    "address": "新北市板橋區新站路28號",
    "district": "板橋區",
    "type": "電梯大樓",
    "price": 62000000,
    "size": 155.8,
    "bedrooms": 3,
    "bathrooms": 2,
    "yearBuilt": 2019,
    "imageUrl": "https://picsum.photos/seed/realB4/800/600",
    "floor": "25樓/34樓",
    "transactionDate": "2024-04-05"
  }
];

const TAICHUNG_XITUN: Property[] = [
  {
    "id": "real_C1",
    "address": "台中市西屯區市政路100號",
    "district": "西屯區",
    "type": "電梯大樓",
    "price": 38000000,
    "size": 150.5,
    "bedrooms": 3,
    "bathrooms": 2,
    "yearBuilt": 2017,
    "imageUrl": "https://picsum.photos/seed/realC1/800/600",
    "floor": "22樓/29樓",
    "transactionDate": "2023-11-20"
  },
  {
    "id": "real_C2",
    "address": "台中市西屯區逢甲路20巷",
    "district": "西屯區",
    "type": "透天厝",
    "price": 42000000,
    "size": 210.0,
    "bedrooms": 5,
    "bathrooms": 4,
    "yearBuilt": 2005,
    "imageUrl": "https://picsum.photos/seed/realC2/800/600",
    "floor": "1-4樓/4樓",
    "transactionDate": "2024-01-30"
  },
  {
    "id": "real_C3",
    "address": "台中市西屯區青海路二段200號",
    "district": "西屯區",
    "type": "華廈",
    "price": 17800000,
    "size": 102.5,
    "bedrooms": 3,
    "bathrooms": 2,
    "yearBuilt": 2008,
    "imageUrl": "https://picsum.photos/seed/realC3/800/600",
    "floor": "6樓/14樓",
    "transactionDate": "2024-02-18"
  }
];

const KAOHSIUNG_ZUOYING: Property[] = [
  {
    "id": "real_D1",
    "address": "高雄市左營區博愛三路10號",
    "district": "左營區",
    "type": "電梯大樓",
    "price": 28000000,
    "size": 140.8,
    "bedrooms": 3,
    "bathrooms": 2,
    "yearBuilt": 2016,
    "imageUrl": "https://picsum.photos/seed/realD1/800/600",
    "floor": "15樓/24樓",
    "transactionDate": "2023-12-01"
  },
  {
    "id": "real_D2",
    "address": "高雄市左營區富國路200號",
    "district": "左營區",
    "type": "華廈",
    "price": 15000000,
    "size": 105.2,
    "bedrooms": 3,
    "bathrooms": 2,
    "yearBuilt": 2002,
    "imageUrl": "https://picsum.photos/seed/realD2/800/600",
    "floor": "8樓/12樓",
    "transactionDate": "2024-02-05"
  },
  {
    "id": "real_D3",
    "address": "高雄市左營區明誠二路330號",
    "district": "左營區",
    "type": "電梯大樓",
    "price": 21500000,
    "size": 125.5,
    "bedrooms": 3,
    "bathrooms": 2,
    "yearBuilt": 2014,
    "imageUrl": "https://picsum.photos/seed/realD3/800/600",
    "floor": "11樓/21樓",
    "transactionDate": "2024-03-22"
  }
];

export const MOCK_REAL_ESTATE_DATA: Record<string, Property[]> = {
    '台北-大安': TAIPEI_DAAN,
    '台北-信義': TAIPEI_DAAN,
    '台北-中山': TAIPEI_DAAN,
    '台北-中正': TAIPEI_DAAN,
    '台北-松山': TAIPEI_DAAN,
    '新北-板橋': NEW_TAIPEI_BANQIAO,
    '新北-中和': NEW_TAIPEI_BANQIAO,
    '新北-永和': NEW_TAIPEI_BANQIAO,
    '新北-新莊': NEW_TAIPEI_BANQIAO,
    '新北-三重': NEW_TAIPEI_BANQIAO,
    '台中-西屯': TAICHUNG_XITUN,
    '台中-南屯': TAICHUNG_XITUN,
    '台中-北屯': TAICHUNG_XITUN,
    '高雄-左營': KAOHSIUNG_ZUOYING,
    '高雄-鼓山': KAOHSIUNG_ZUOYING,
    '高雄-三民': KAOHSIUNG_ZUOYING,
};