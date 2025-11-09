import { GoogleGenAI, Type } from "@google/genai";
import type { Property, ValuationReport } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const valuationSchema = {
  type: Type.OBJECT,
  properties: {
    estimatedPrice: {
      type: Type.NUMBER,
      description: 'AI估算出的房產總價，單位為新台幣(TWD)。'
    },
    pricePerSqm: {
      type: Type.NUMBER,
      description: 'AI估算出的每平方公尺單價，單位為新台幣(TWD)。'
    },
    confidence: {
      type: Type.STRING,
      description: 'AI對此次估價的信心指數，例如：高、中、低。並簡要說明原因。'
    },
    marketSummary: {
      type: Type.STRING,
      description: '對該房產所在區域的市場行情簡要總結，不超過150字。'
    },
    pros: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '列出此房產的3個主要優點。'
    },
    cons: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '列出此房產的3個主要缺點。'
    },
    amenitiesAnalysis: {
      type: Type.OBJECT,
      properties: {
        schools: { type: Type.STRING, description: '鄰近學區與教育資源分析。' },
        transport: { type: Type.STRING, description: '周邊交通便利性分析。' },
        shopping: { type: Type.STRING, description: '生活採買與商業機能分析。' }
      },
      required: ['schools', 'transport', 'shopping']
    },
    realtorAnalysis: {
      type: Type.ARRAY,
      description: "僅在估價基準為'房屋仲介觀點'時提供。生成2-3家當地房仲的分析。",
      items: {
        type: Type.OBJECT,
        properties: {
          realtorName: { type: Type.STRING, description: '房仲品牌名稱，例如：信義房屋、永慶房屋。' },
          branchName: { type: Type.STRING, description: '模擬的在地分店名稱，例如：大安森林公園店。' },
          address: { type: Type.STRING, description: '模擬的分店地址。' },
          analysis: { type: Type.STRING, description: '針對目標物件，以該房仲品牌的口吻和專業角度，提供一段詳細的市場觀點、潛在客群、與銷售策略分析。' }
        },
        required: ['realtorName', 'branchName', 'address', 'analysis']
      }
    }
  },
  required: ['estimatedPrice', 'pricePerSqm', 'confidence', 'marketSummary', 'pros', 'cons', 'amenitiesAnalysis']
};


export const getValuation = async (
  property: Property,
  nearbyTransactions: Property[],
  reference: string,
  customInputs?: { size?: number; pricePerPing?: number; floor?: string }
): Promise<ValuationReport> => {
    
  let prompt = `
    請扮演一位專業的台灣房地產AI估價師。
    目標房產地址：${property.address}
    房屋類型：${property.type}
    屋齡：${new Date().getFullYear() - property.yearBuilt}年
    格局：${property.bedrooms}房 / ${property.bathrooms}衛
    樓層：${customInputs?.floor || property.floor}
    建物面積：${(customInputs?.size || property.size).toFixed(2)} 平方公尺 (約 ${((customInputs?.size || property.size) / 3.30579).toFixed(2)} 坪)

    估價參考基準：**${reference}**

    ${customInputs ? `
    使用者自訂參考數值 (請優先使用這些數值進行估算):
    - 實際坪數: ${customInputs.size ? (customInputs.size / 3.30579).toFixed(2) + ' 坪' : '未提供'}
    - 參考單價: ${customInputs.pricePerPing ? customInputs.pricePerPing + ' 萬/坪' : '未提供'}
    - 樓層: ${customInputs.floor || '未提供'}
    ` : ''}

    參考的周邊${nearbyTransactions.length}筆近期成交資訊：
    ${nearbyTransactions.map(p => 
      `- 地址: ${p.address}, 總價: ${p.price.toLocaleString()} TWD, 面積: ${(p.size / 3.30579).toFixed(2)} 坪, 類型: ${p.type}, 屋齡: ${new Date().getFullYear() - p.yearBuilt}年, 交易日期: ${p.transactionDate || 'N/A'}`
    ).join('\n')}

    請根據以上所有資訊，提供一份專業的JSON格式估價報告。
    - 估價需考慮地點、屋齡、類型、樓層、坪數、市場趨勢及提供的成交資訊。
    - **特別注意**：當估價參考基準為 **'房屋仲介觀點'** 時，請務必在報告中加入 \`realtorAnalysis\` 欄位，模擬2-3家不同品牌的當地房仲（例如：信義房屋、永慶房屋、台灣房屋）對此物件的專業觀點分析。
    - 其他估價基準則**不需要** \`realtorAnalysis\` 欄位。
    - 輸出語言為繁體中文。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: valuationSchema,
      },
    });

    const jsonString = response.text.trim();
    const cleanedJsonString = jsonString.replace(/^```json\s*|```\s*$/g, '');
    const reportData = JSON.parse(cleanedJsonString);
    
    if (!reportData.estimatedPrice || !reportData.pros || !reportData.cons) {
        throw new Error("AI回傳的資料格式不完整，缺少必要欄位。");
    }

    return reportData as ValuationReport;

  } catch (error) {
    console.error("Gemini API call failed:", error);
    if (error instanceof Error && error.message.includes('SAFETY')) {
        throw new Error("內容因安全考量被過濾，請嘗試不同的查詢。");
    }
     if (error instanceof Error && error.message.includes('response is not valid JSON')) {
        throw new Error("AI模型未回傳有效的JSON格式，請稍後再試。");
    }
    throw new Error("AI估價服務暫時無法連線，請稍後再試。");
  }
};

export const getScenarioAnalysis = async (
  property: Property,
  valuation: ValuationReport,
  query: string
): Promise<string> => {
  const prompt = `
    請扮演一位專業的台灣房地產AI分析師。
    我正在評估一個房產，以下是它的基本資料和初步估價結果：
    - 地址: ${property.address}
    - 房屋類型: ${property.type}
    - 屋齡: ${new Date().getFullYear() - property.yearBuilt} 年
    - AI初步估價: ${valuation.estimatedPrice.toLocaleString()} TWD

    現在，我有一個特定的情境想請您分析，這個情境可能會如何影響房價。請根據您的專業知識提供一段簡潔、專業的分析。

    我的情境是：「${query}」

    請直接提供分析內容，不需要重複我的問題。輸出語言為繁體中文。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini scenario analysis failed:", error);
    if (error instanceof Error && error.message.includes('SAFETY')) {
      throw new Error("內容因安全考量被過濾，請嘗試不同的查詢。");
    }
    throw new Error("AI情境分析服務暫時無法連線，請稍後再試。");
  }
};