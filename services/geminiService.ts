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

export async function getValuation(property: Property, nearbyProperties: Property[], reference: string): Promise<ValuationReport> {
  const nearbyPropertiesContext = nearbyProperties.length > 0
    ? nearbyProperties.map(p => 
        `- 地址: ${p.address}, 總價: ${Math.round(p.price / 10000)}萬, 坪數: ${(p.size / 3.30579).toFixed(1)}坪, 屋齡: ${new Date().getFullYear() - p.yearBuilt}年, 交易日期: ${p.transactionDate || '近期'}`
      ).join('\n')
    : '無可用的附近交易資料。';

  let referenceInstruction = '';
    switch (reference) {
        case '實價登錄':
            referenceInstruction = `
            **估價參考基準: 實價登錄**
            您的角色是數據分析師。請嚴格基於下方提供的「模擬的附近交易資料」進行估價。計算出該區域的平均單價，並以此為基礎，根據目標房產的條件（屋齡、樓層等）做微幅調整。您的分析應著重於數據，避免過多主觀或未來性的預測。
            `;
            break;
        case '房屋仲介觀點':
            referenceInstruction = `
            **估價參考基準: 房屋仲介觀點**
            您的角色是經驗豐富的房仲。您的估價應帶有銷售導向，挖掘房產的最大潛力。請參考附近交易資料，但更要強調目標房產的獨特優勢（如地點、格局、屋況潛力）。您的估價可以偏向市場的高標，並在市場總結中強調未來增值潛力，用以說服潛在買家。
            `;
            break;
        case '真實坪數':
             referenceInstruction = `
            **估價參考基準: 真實坪數**
            您的角色是估價師，專注於成本法。請以「單價」為核心進行計算。首先，從「模擬的附近交易資料」中計算出一個可靠的平均「每坪單價」。然後，將此單價乘以目標房產的坪數，得出基礎總價。最後，根據樓層、屋齡等因素進行不超過5%的微調。您的分析應簡潔、客觀，聚焦於數字。
            `;
            break;
        case '綜合市場因素':
        default:
            referenceInstruction = `
            **估價參考基準: 綜合市場因素**
            您的角色是市場分析師，進行全面性的評估。請平衡考量地點、附近交易資料、宏觀經濟趨勢以及房產自身條件。您的估價應是一個中立、客觀的市場價值，反映當前的供需狀況。
            `;
            break;
    }

  const prompt = `
    您是一位頂尖的台灣房地產分析師，擁有對各地區房價行情的深入了解。您的首要任務是提供一個**基於地點**的精準估價。

    **估價核心原則 (請嚴格遵守):**
    1.  **地點決定一切:** 房產的「城市」與「行政區」是影響價格最重要的因素，權重遠高於其他所有條件。例如，'台北市大安區'的房價基準遠高於'新北市中和區'。請務必運用您對台灣各區域市場行情的知識來校準估價。
    2.  **參考資料的批判性使用:** 下方提供的「附近實價登錄資料」是**模擬數據**，僅供初步參考。如果這些數據與您對該地區的認知有顯著差異，請**優先採用您的專業知識**來判斷，並在市場總結中簡要說明您的判斷依據。
    3.  **綜合評估:** 在確定了地點的價格基準後，再根據房屋類型、屋齡、坪數、樓層等條件進行細微調整。

    ${referenceInstruction}

    **主要評估房產資訊:**
    - 地址: ${property.address}
    - 類型: ${property.type}
    - 坪數: ${Math.round(property.size / 3.30579)} 坪 (${property.size} 平方公尺)
    - 格局: ${property.bedrooms} 房 / ${property.bathrooms} 衛
    - 屋齡: ${new Date().getFullYear() - property.yearBuilt} 年 (建於 ${property.yearBuilt} 年)
    - 樓層: ${property.floor}
    
    **模擬的附近交易資料 (僅供參考):**
${nearbyPropertiesContext}

    請基於以上所有資訊，進行綜合分析後，並嚴格遵守提供的 JSON schema 格式進行回覆。
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

export async function getValuationAdjustment(property: Property, originalReport: ValuationReport, userQuery: string): Promise<string> {
    const prompt = `
    您是一位專業的台灣房地產分析師。
    這是一份針對以下房產的初步 AI 估價報告：

    **房產資訊:**
    - 地址: ${property.address}
    - 類型: ${property.type}
    - 坪數: ${Math.round(property.size / 3.30579)} 坪
    - 格局: ${property.bedrooms} 房 / ${property.bathrooms} 衛
    - 屋齡: ${new Date().getFullYear() - property.yearBuilt} 年
    - 估計總價: ${originalReport.estimatedPrice.toLocaleString('zh-TW')} TWD

    **初步報告摘要:**
    ${originalReport.marketSummary}

    現在，請根據使用者提出的以下「情境」，分析此情境對房價可能造成的影響。
    請提供一段簡潔的分析說明（約100-150字），並在**可能的情況下**，提供一個調整後的**預估價格區間**。
    您的回覆應口語化、易於理解，並直接回答使用者的問題。

    **使用者情境:**
    "${userQuery}"

    請直接提供分析文字，不要使用 JSON 格式。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0.3,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API for adjustment:", error);
    if (error && typeof error === 'object') {
        const apiErrorDetails = (error as any).error || error;
        if (apiErrorDetails && (String(apiErrorDetails.code) === '429' || apiErrorDetails.status === 'RESOURCE_EXHAUSTED')) {
            throw new Error("API 請求頻率過高，已超出目前方案的額度，請稍後再試。");
        }
    }
    throw new Error("無法從 AI 模型取得情境分析。請檢查您的網路連線或 API 金鑰是否有效。");
  }
}