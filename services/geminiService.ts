
import { GoogleGenAI, Type } from "@google/genai";
import type { Property, ValuationReport } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const valuationSchema = {
  type: Type.OBJECT,
  properties: {
    estimatedPrice: { 
      type: Type.NUMBER,
      description: '房產的估計總價，單位為新台幣。'
    },
    pricePerSqm: { 
      type: Type.NUMBER,
      description: '每平方公尺的估計單價，單位為新台幣。'
    },
    priceTrend: {
      type: Type.ARRAY,
      description: '最近十年的房價趨勢數據點，每半年一個點。',
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, description: '時間標籤 (格式為 "YYYY H1" 或 "YYYY H2")' },
          price: { type: Type.NUMBER, description: '該半年度的平均總價，單位為新台幣。' },
        },
        required: ['label', 'price'],
      },
    },
    pros: {
      type: Type.ARRAY,
      description: '該房產的三個主要優點。',
      items: { type: Type.STRING },
    },
    cons: {
      type: Type.ARRAY,
      description: '該房產的三個主要缺點。',
      items: { type: Type.STRING },
    },
    marketSummary: {
      type: Type.STRING,
      description: '對該房產市場定位的簡短總結，約100字。',
    },
    confidence: {
      type: Type.STRING,
      description: '對此估價的信心水準，分為 "高"、"中"、"低"。',
    },
    amenitiesAnalysis: {
        type: Type.OBJECT,
        description: '周邊生活機能分析。',
        properties: {
            schools: {
                type: Type.ARRAY,
                description: '附近的主要學校或學區優勢。',
                items: { type: Type.STRING },
            },
            transport: {
                type: Type.ARRAY,
                description: '附近的主要交通站點或幹道。',
                items: { type: Type.STRING },
            },
            shopping: {
                type: Type.ARRAY,
                description: '附近的購物設施，如市場、超市、百貨。',
                items: { type: Type.STRING },
            },
        },
        required: ['schools', 'transport', 'shopping'],
    },
  },
  required: ['estimatedPrice', 'pricePerSqm', 'priceTrend', 'pros', 'cons', 'marketSummary', 'confidence', 'amenitiesAnalysis'],
};

export async function getValuation(property: Property, nearbyProperties: Property[]): Promise<ValuationReport> {
  const nearbyPropertiesContext = nearbyProperties.length > 0
    ? nearbyProperties.map(p => 
        `- 地址: ${p.address}, 總價: ${Math.round(p.price / 10000)}萬, 坪數: ${(p.size / 3.30579).toFixed(1)}坪, 屋齡: ${new Date().getFullYear() - p.yearBuilt}年, 交易日期: ${p.transactionDate || '近期'}`
      ).join('\n')
    : '無可用的附近交易資料。';

  const prompt = `
    您是一位專業的台灣房地產分析師。請根據以下房產資訊，並**高度參考**我們提供的「附近實價登錄資料」，提供一份詳細且盡量貼近市場行情的估價報告。估價應反映真實的市場交易價值。
    請嚴格遵守提供的 JSON schema 格式進行回覆。

    **主要評估房產資訊:**
    - 地址: ${property.address}
    - 類型: ${property.type}
    - 坪數: ${Math.round(property.size / 3.30579)} 坪 (${property.size} 平方公尺)
    - 格局: ${property.bedrooms} 房 / ${property.bathrooms} 衛
    - 屋齡: ${new Date().getFullYear() - property.yearBuilt} 年 (建於 ${property.yearBuilt} 年)
    - 樓層: ${property.floor}

    **附近實價登錄資料 (重要參考):**
${nearbyPropertiesContext}

    請基於以上所有資訊，進行綜合分析後，提供以下資訊：
    1.  **估計總價 (estimatedPrice)**: 新台幣。請確保此價格反映了附近相似房產的成交行情，並根據主要評估房產的條件（屋齡、樓層、格局等）進行合理調整。
    2.  **每坪單價 (pricePerSqm)**: 請換算成每平方公尺的價格後填入。
    3.  **房價趨勢 (priceTrend)**: 提供過去10年，每半年一個數據點的價格趨勢 (共20個點)。label 格式為 "YYYY H1" 或 "YYYY H2"，例如 "2023 H1"。
    4.  **優點 (pros)**: 列出3個主要優點。
    5.  **缺點 (cons)**: 列出3個主要缺點。
    6.  **市場總結 (marketSummary)**: 一段約100字的市場分析，說明您的估價依據，特別是與周邊行情的比較。
    7.  **信心指數 (confidence)**: "高"、"中" 或 "低"。
    8.  **周邊機能分析 (amenitiesAnalysis)**: 分析房產周邊的生活機能，分別列出：
        - **學校 (schools)**: 附近的著名學校或學區。
        - **交通 (transport)**: 主要的捷運站、公車站或交通幹道。
        - **購物 (shopping)**: 傳統市場、超市或百貨公司。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: valuationSchema,
        temperature: 0.2,
      },
    });

    const jsonText = response.text;
    const reportData = JSON.parse(jsonText);
    
    // Ensure priceTrend is sorted by label (e.g., "2020 H1")
    if (reportData.priceTrend && Array.isArray(reportData.priceTrend)) {
        reportData.priceTrend.sort((a: { label: string }, b: { label: string }) => {
            const [yearA, halfA] = a.label.split(' ');
            const [yearB, halfB] = b.label.split(' ');
            if (yearA !== yearB) {
                return parseInt(yearA) - parseInt(yearB);
            }
            return (halfA === 'H1' ? 1 : 2) - (halfB === 'H1' ? 1 : 2);
        });
    }

    return reportData as ValuationReport;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Check for specific API rate limit error. This logic is made more robust
    // to handle different possible error structures from the API client.
    if (error && typeof error === 'object') {
        // The actual error payload might be nested under an 'error' property,
        // or it could be the top-level object itself. This handles both cases.
        const apiErrorDetails = (error as any).error || error;
        if (apiErrorDetails && (String(apiErrorDetails.code) === '429' || apiErrorDetails.status === 'RESOURCE_EXHAUSTED')) {
            throw new Error("API 請求頻率過高，已超出目前方案的額度，請稍後再試。");
        }
    }
    // Generic error for other cases
    throw new Error("無法從 AI 模型取得估價。請檢查您的網路連線或 API 金鑰是否有效。");
  }
}