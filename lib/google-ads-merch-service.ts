// Google Ads API service specifically for merch keyword testing
// Format: "Player Name + Merch Term" (e.g., "Lionel Messi shirt")

import { FINAL_PLAYER_NAMES } from './final-player-data';

// 6 priority markets as specified
export const PRIORITY_MARKETS = {
  "United Kingdom": 2826,
  "United States": 2840, 
  "Canada": 2124,
  "Australia": 2036,
  "Germany": 2276,
  "Mexico": 2484
};

// Company approved merch terms (30 total)
export const APPROVED_MERCH_TERMS = [
  "shirt",
  "jersey", 
  "signed shirt",
  "signed jersey",
  "signed",
  "autograph",
  "autographed", 
  "memorabilia",
  "boots",
  "cleats",
  "card",
  "poster",
  "signed photo",
  "authentic",
  "official", 
  "framed",
  "signed ball",
  "collectibles",
  "autographed shirt",
  "autographed jersey",
  "signature",
  "coins",
  "exclusive",
  "dedication",
  "artwork",
  "signed art",
  "sports memorabilia",
  "soccer memorabilia", 
  "football memorabilia",
  "limited edition",
  "Unique",
  "One of a kind"
];

interface GoogleAdsKeywordResult {
  keyword: string;
  location_code: number;
  language_code: string;
  search_volume?: number;
  competition?: string;
  competition_index?: number;
  cpc?: number;
  monthly_searches?: Array<{
    year: number;
    month: number;  
    search_volume: number;
  }>;
}

class GoogleAdsMerchService {
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

  // Generate keywords in correct format: "Player Name + Merch Term"
  generatePlayerMerchKeywords(playerNames: string[], merchTerms: string[]): string[] {
    const keywords: string[] = [];
    
    playerNames.forEach(playerName => {
      merchTerms.forEach(term => {
        keywords.push(`${playerName} ${term}`);
      });
    });
    
    return keywords;
  }

  // Test sandbox connection
  async testSandboxConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing Google Ads API sandbox connection...');
      
      // Test with a small set of keywords
      const testKeywords = this.generatePlayerMerchKeywords(
        ['Lionel Messi', 'Cristiano Ronaldo'],
        ['shirt', 'jersey']
      );
      
      const result = await this.getKeywordSearchVolume(testKeywords, 2840); // US market
      
      console.log('✅ Sandbox test successful!');
      console.log(`📊 Received data for ${result.length} keywords`);
      
      return result.length > 0;
    } catch (error) {
      console.error('❌ Sandbox test failed:', error);
      return false;
    }
  }

  // Main API call to Google Ads endpoint
  async getKeywordSearchVolume(
    keywords: string[],
    locationCode: number = 2840,
    languageCode: string = 'en',
    dateFrom?: string,
    dateTo?: string
  ): Promise<GoogleAdsKeywordResult[]> {
    const url = `${this.baseUrl}/keywords_data/google_ads/search_volume/live`;
    
    const payload: {
      keywords: string[];
      location_code: number;
      language_code: string;
      date_from?: string;
      date_to?: string;
    } = {
      keywords: keywords.slice(0, 1000), // Max 1000 keywords per request
      location_code: locationCode,
      language_code: languageCode
    };
    
    // Add date range if specified for historical data
    if (dateFrom) payload.date_from = dateFrom;
    if (dateTo) payload.date_to = dateTo;

    try {
      console.log(`🚀 Making Google Ads API request to: ${url}`);
      console.log(`📝 Keywords: ${keywords.length} total`);
      console.log(`🌍 Location: ${locationCode}`);
      if (dateFrom) console.log(`📅 Date range: ${dateFrom} to ${dateTo}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([payload]), // Google Ads API expects array
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status_code !== 20000) {
        throw new Error(`API error: ${data.status_message}`);
      }

      if (!data.tasks?.[0]?.result) {
        console.warn('⚠️ No results returned from API');
        return [];
      }

      console.log(`✅ Received ${data.tasks[0].result.length} keyword results`);
      return data.tasks[0].result;
      
    } catch (error) {
      console.error('❌ API request failed:', error);
      throw error;
    }
  }

  // Run micro test (5 players × 2 markets for $0.05)
  async runMicroTest(): Promise<{
    testType: string;
    players: string[];
    markets: string[];
    keywordCount: number;
    estimatedCost: number;
    results: Record<string, GoogleAdsKeywordResult[]>;
  }> {
    console.log('🧪 Starting Micro Test ($0.05)...');
    
    const testPlayers = FINAL_PLAYER_NAMES.slice(0, 5);
    const testMarkets = Object.entries(PRIORITY_MARKETS).slice(0, 2);
    const testKeywords = this.generatePlayerMerchKeywords(testPlayers, APPROVED_MERCH_TERMS);
    
    console.log(`👥 Players: ${testPlayers.join(', ')}`);
    console.log(`🌍 Markets: ${testMarkets.map(([name]) => name).join(', ')}`);
    console.log(`🔑 Keywords: ${testKeywords.length} total`);
    
    const results: Record<string, GoogleAdsKeywordResult[]> = {};
    
    for (const [market, locationCode] of testMarkets) {
      console.log(`\n📊 Testing market: ${market}`);
      try {
        const marketResults = await this.getKeywordSearchVolume(testKeywords, locationCode);
        results[market] = marketResults;
        
        // Add delay between requests  
        await this.delay(2000);
      } catch (error) {
        console.error(`❌ Failed for market ${market}:`, error);
        results[market] = [];
      }
    }
    
    return {
      testType: 'micro',
      players: testPlayers,
      markets: testMarkets.map(([name]) => name),
      keywordCount: testKeywords.length,
      estimatedCost: 0.05,
      results
    };
  }

  // Calculate full production requirements
  calculateProductionRequirements(merchTerms: string[]): {
    totalPlayers: number;
    totalMarkets: number;
    totalTerms: number;
    totalKeywords: number;
    requestsPerMarket: number;
    totalRequests: number;
    estimatedCost: string;
  } {
    const totalPlayers = FINAL_PLAYER_NAMES.length; // 125
    const totalMarkets = Object.keys(PRIORITY_MARKETS).length; // 6
    const totalTerms = merchTerms.length;
    const totalKeywords = totalPlayers * totalTerms; // e.g., 125 × 30 = 3,750
    const requestsPerMarket = Math.ceil(totalKeywords / 1000);
    const totalRequests = requestsPerMarket * totalMarkets;
    const estimatedCost = totalRequests * 0.05; // $0.05 per request
    
    return {
      totalPlayers,
      totalMarkets,
      totalTerms,
      totalKeywords,
      requestsPerMarket, 
      totalRequests,
      estimatedCost: `$${estimatedCost.toFixed(2)}`
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const googleAdsMerchService = new GoogleAdsMerchService();