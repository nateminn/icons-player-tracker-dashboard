// DataForSEO API Service for getting keyword search volume data

interface KeywordData {
  keyword: string;
  location_code?: number;
  language_code?: string;
  search_volume?: number;
  cpc?: number;
  competition?: number;
  monthly_searches?: Array<{
    year: number;
    month: number;
    search_volume: number;
  }>;
}

interface SearchVolumeResponse {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    result_count: number;
    path: string[];
    data: {
      api_version: string;
      function: string;
      keywords: string[];
    };
    result: KeywordData[];
  }>;
}

class DataForSEOService {
  private baseUrl: string;
  private credentials: string;

  constructor() {
    const username = process.env.DATAFORSEO_USERNAME!;
    const password = process.env.DATAFORSEO_PASSWORD!;
    const useSandbox = process.env.DATAFORSEO_USE_SANDBOX === 'true';
    
    this.baseUrl = useSandbox 
      ? 'https://sandbox.dataforseo.com/v3' 
      : 'https://api.dataforseo.com/v3';
    
    this.credentials = Buffer.from(`${username}:${password}`).toString('base64');
  }

  async getKeywordSearchVolume(
    keywords: string[], 
    locationCode: number = 2840, // US by default
    languageCode: string = 'en'
  ): Promise<KeywordData[]> {
    const url = `${this.baseUrl}/keywords_data/google_ads/search_volume/live`;
    
    const payload = [
      {
        keywords: keywords.slice(0, 1000), // Max 1000 keywords per request
        location_code: locationCode,
        language_code: languageCode,
      }
    ];

    try {
      console.log(`Making DataForSEO API request to: ${url}`);
      console.log(`Request payload:`, JSON.stringify(payload, null, 2));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
      }

      const data: SearchVolumeResponse = await response.json();
      
      console.log(`DataForSEO API response:`, JSON.stringify(data, null, 2));
      
      if (data.status_code !== 20000) {
        throw new Error(`DataForSEO API error: ${data.status_message}`);
      }

      if (data.tasks.length === 0 || !data.tasks[0].result) {
        console.warn('No results returned from DataForSEO API');
        return [];
      }

      return data.tasks[0].result;
    } catch (error) {
      console.error('Error fetching keyword search volume:', error);
      throw error;
    }
  }

  async getPlayerKeywordData(
    playerName: string, 
    locationCodes: number[] = [2840] // US by default
  ): Promise<{
    playerName: string;
    marketData: Array<{
      locationCode: number;
      keywords: {
        playerVolume: number;
        merchVolume: number;
        totalVolume: number;
      };
    }>;
  }> {
    // Generate keyword variations for the player
    const keywords = this.generatePlayerKeywords(playerName);
    
    const marketData = [];
    
    for (const locationCode of locationCodes) {
      try {
        const keywordResults = await this.getKeywordSearchVolume(keywords, locationCode);
        
        // Calculate volumes based on keyword categories
        const playerKeywords = keywords.filter(k => this.isPlayerKeyword(k, playerName));
        const merchKeywords = keywords.filter(k => this.isMerchKeyword(k, playerName));
        
        let playerVolume = 0;
        let merchVolume = 0;
        let totalVolume = 0;
        
        keywordResults.forEach(result => {
          const volume = result.search_volume || 0;
          totalVolume += volume;
          
          if (playerKeywords.includes(result.keyword)) {
            playerVolume += volume;
          } else if (merchKeywords.includes(result.keyword)) {
            merchVolume += volume;
          }
        });
        
        marketData.push({
          locationCode,
          keywords: {
            playerVolume,
            merchVolume,
            totalVolume
          }
        });
        
        // Add delay to respect rate limits (12 requests per minute)
        await this.delay(5000);
        
      } catch (error) {
        console.error(`Error fetching data for location ${locationCode}:`, error);
        // Continue with other locations even if one fails
      }
    }
    
    return {
      playerName,
      marketData
    };
  }

  private generatePlayerKeywords(playerName: string): string[] {
    const baseKeywords = [
      playerName,
      `${playerName} soccer`,
      `${playerName} football`,
      `${playerName} goals`,
      `${playerName} stats`,
      `${playerName} highlights`,
      `${playerName} transfer`,
      `${playerName} jersey`,
      `${playerName} shirt`,
      `${playerName} merchandise`,
      `${playerName} kit`,
      `${playerName} boots`,
      `buy ${playerName} jersey`,
      `${playerName} soccer jersey`,
      `${playerName} football shirt`
    ];
    
    return baseKeywords;
  }

  private isPlayerKeyword(keyword: string, playerName: string): boolean {
    const playerKeywordIndicators = ['stats', 'goals', 'highlights', 'transfer', 'soccer', 'football'];
    const lowerKeyword = keyword.toLowerCase();
    return playerKeywordIndicators.some(indicator => lowerKeyword.includes(indicator)) ||
           lowerKeyword === playerName.toLowerCase();
  }

  private isMerchKeyword(keyword: string, playerName: string): boolean {
    const merchKeywordIndicators = ['jersey', 'shirt', 'merchandise', 'kit', 'boots', 'buy'];
    const lowerKeyword = keyword.toLowerCase();
    return merchKeywordIndicators.some(indicator => lowerKeyword.includes(indicator));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Location codes for major markets
  static readonly LOCATION_CODES = {
    US: 2840,
    UK: 2826,
    GERMANY: 2276,
    SPAIN: 2724,
    FRANCE: 2250,
    ITALY: 2380,
    BRAZIL: 2076,
    MEXICO: 2484,
    CANADA: 2124,
    AUSTRALIA: 2036
  } as const;

  // Language codes
  static readonly LANGUAGE_CODES = {
    ENGLISH: 'en',
    SPANISH: 'es',
    FRENCH: 'fr',
    GERMAN: 'de',
    ITALIAN: 'it',
    PORTUGUESE: 'pt'
  } as const;
}

export const dataForSEOService = new DataForSEOService();
export type { KeywordData, SearchVolumeResponse };