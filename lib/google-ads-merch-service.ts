// Google Ads API service specifically for merch keyword testing
// Format: "Player Name + Merch Term" (e.g., "Lionel Messi shirt")

import { FINAL_PLAYER_NAMES } from './final-player-data';
import { dataStorageService } from './data-storage-service';

// 5 priority markets for production run
export const PRIORITY_MARKETS = {
  "United States": 2840,
  "United Kingdom": 2826, 
  "Mexico": 2484,
  "Australia": 2036,
  "Germany": 2276
};

// Company approved merch terms (30 total for production)
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
  "limited edition"
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
  async runMicroTest(dateFrom?: string, dateTo?: string, useSandbox?: boolean): Promise<{
    testType: string;
    players: string[];
    markets: string[];
    keywordCount: number;
    estimatedCost: number;
    dateRange?: { from: string; to: string };
    apiMode: string;
    results: Record<string, GoogleAdsKeywordResult[]>;
  }> {
    const mode = useSandbox !== undefined ? (useSandbox ? 'Sandbox' : 'Live') : (this.baseUrl.includes('sandbox') ? 'Sandbox' : 'Live');
    console.log(`🧪 Starting Micro Test ${mode} Mode ($0.05)...`);
    
    // Override baseUrl if useSandbox parameter is provided
    const originalBaseUrl = this.baseUrl;
    if (useSandbox !== undefined) {
      this.baseUrl = useSandbox 
        ? 'https://sandbox.dataforseo.com/v3' 
        : 'https://api.dataforseo.com/v3';
    }
    
    const testPlayers = FINAL_PLAYER_NAMES.slice(0, 5);
    const testMarkets = Object.entries(PRIORITY_MARKETS).slice(0, 2);
    const testKeywords = this.generatePlayerMerchKeywords(testPlayers, APPROVED_MERCH_TERMS);
    
    // SAFETY VALIDATION for micro test too
    if (!mode.includes('Sandbox')) {
      this.validateSpending(0.05);
    }
    
    console.log(`👥 Players: ${testPlayers.join(', ')}`);
    console.log(`🌍 Markets: ${testMarkets.map(([name]) => name).join(', ')}`);
    console.log(`🔑 Keywords: ${testKeywords.length} total`);
    console.log(`🔧 API Mode: ${mode}`);
    
    if (dateFrom && dateTo) {
      console.log(`📅 Date range: ${dateFrom} to ${dateTo}`);
    } else {
      console.log(`📅 Date range: Current + 12 months historical`);
    }
    
    const results: Record<string, GoogleAdsKeywordResult[]> = {};
    
    for (const [market, locationCode] of testMarkets) {
      console.log(`\n📊 Testing market: ${market}`);
      try {
        const marketResults = await this.getKeywordSearchVolume(
          testKeywords, 
          locationCode, 
          'en',
          dateFrom,
          dateTo
        );
        results[market] = marketResults;
        
        // Add delay between requests  
        await this.delay(2000);
      } catch (error) {
        console.error(`❌ Failed for market ${market}:`, error);
        results[market] = [];
      }
    }
    
    // Restore original baseUrl
    this.baseUrl = originalBaseUrl;
    
    const testResults = {
      testType: 'micro' as const,
      players: testPlayers,
      markets: testMarkets.map(([name]) => name),
      keywordCount: testKeywords.length,
      estimatedCost: 0.05,
      dateRange: dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined,
      apiMode: mode,
      results
    };

    // Auto-save all Google Ads API results for permanent storage
    try {
      const storageId = await dataStorageService.saveAPIResults(
        'micro',
        'Google Ads API',
        { tasks: [{ result: results }] }, // Raw API structure
        testResults
      );
      console.log(`💾 Google Ads micro test results saved with ID: ${storageId}`);
    } catch (error) {
      console.error('⚠️ Failed to save Google Ads micro test results:', error);
    }
    
    return testResults;
  }

  // Validate spending is authorized
  private validateSpending(estimatedCost: number): void {
    const allowRealMoney = process.env.ALLOW_REAL_MONEY_TESTS === 'true';
    const maxCost = parseFloat(process.env.MAX_ALLOWED_COST || '1.50');
    
    if (!allowRealMoney) {
      throw new Error('🚨 SAFETY BLOCK: Real money tests disabled. Set ALLOW_REAL_MONEY_TESTS=true in .env.local');
    }
    
    if (estimatedCost > maxCost) {
      throw new Error(`🚨 COST LIMIT EXCEEDED: Estimated cost $${estimatedCost.toFixed(2)} > limit $${maxCost.toFixed(2)}`);
    }
    
    console.log(`💰 Cost validation passed: $${estimatedCost.toFixed(2)} ≤ $${maxCost.toFixed(2)}`);
  }

  // Run full production test (125 players × 5 markets × 30 terms = 18,750 keywords)
  async runFullProductionTest(dateFrom?: string, dateTo?: string): Promise<{
    testType: string;
    players: string[];
    markets: string[];
    keywordCount: number;
    totalRequests: number;
    estimatedCost: number;
    dateRange?: { from: string; to: string };
    apiMode: string;
    progress: { current: number; total: number };
    results: Record<string, GoogleAdsKeywordResult[]>;
  }> {
    console.log('🚀 Starting Full Production Test...');
    console.log('📊 SCOPE: 125 players × 30 merch terms × 5 markets = 18,750 keywords');
    
    const allPlayers = FINAL_PLAYER_NAMES; // All 125 players
    const allMarkets = Object.entries(PRIORITY_MARKETS); // All 5 markets
    const allKeywords = this.generatePlayerMerchKeywords(allPlayers, APPROVED_MERCH_TERMS);
    
    // Calculate requests needed (max 1000 keywords per request)
    const keywordsPerRequest = 1000;
    const requestsPerMarket = Math.ceil(allKeywords.length / keywordsPerRequest);
    const totalRequests = requestsPerMarket * allMarkets.length;
    const estimatedCost = totalRequests * 0.05; // $0.05 per request
    
    // SAFETY VALIDATION - Prevent surprise charges
    this.validateSpending(estimatedCost);
    
    console.log(`👥 Players: ${allPlayers.length}`);
    console.log(`🌍 Markets: ${allMarkets.map(([name]) => name).join(', ')}`);
    console.log(`🔑 Keywords: ${allKeywords.length} total`);
    console.log(`📤 Requests: ${requestsPerMarket} per market × ${allMarkets.length} markets = ${totalRequests} total`);
    console.log(`💰 Estimated cost: $${estimatedCost.toFixed(2)}`);
    
    if (dateFrom && dateTo) {
      console.log(`📅 Date range: ${dateFrom} to ${dateTo}`);
    }
    
    const results: Record<string, GoogleAdsKeywordResult[]> = {};
    let currentRequest = 0;
    
    for (const [market, locationCode] of allMarkets) {
      console.log(`\n🌍 Processing market: ${market}`);
      results[market] = [];
      
      // Split keywords into batches of 1000
      for (let i = 0; i < allKeywords.length; i += keywordsPerRequest) {
        currentRequest++;
        const keywordBatch = allKeywords.slice(i, i + keywordsPerRequest);
        
        console.log(`📤 Request ${currentRequest}/${totalRequests}: Processing ${keywordBatch.length} keywords for ${market}`);
        
        try {
          const batchResults = await this.getKeywordSearchVolume(
            keywordBatch,
            locationCode,
            'en',
            dateFrom,
            dateTo
          );
          
          results[market].push(...batchResults);
          console.log(`✅ Received ${batchResults.length} results for ${market} (batch ${Math.floor(i / keywordsPerRequest) + 1})`);
          
          // Add delay between requests (rate limiting)
          if (currentRequest < totalRequests) {
            console.log('⏱️ Waiting 5 seconds between requests...');
            await this.delay(5000);
          }
          
        } catch (error) {
          console.error(`❌ Failed batch for ${market}:`, error);
          // Continue with other batches even if one fails
        }
      }
      
      console.log(`🎯 Market ${market} complete: ${results[market].length} total results`);
    }
    
    const totalResults = Object.values(results).reduce((sum, marketResults) => sum + marketResults.length, 0);
    console.log(`\n🎉 Full Production Test Complete!`);
    console.log(`📊 Total Results: ${totalResults}/${allKeywords.length * allMarkets.length} keywords processed`);
    
    const testResults = {
      testType: 'full_production' as const,
      players: allPlayers,
      markets: allMarkets.map(([name]) => name),
      keywordCount: allKeywords.length,
      totalRequests,
      estimatedCost,
      dateRange: dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined,
      apiMode: 'Live',
      progress: { current: totalResults, total: allKeywords.length * allMarkets.length },
      results
    };

    // Auto-save ALL production results for permanent storage (CRITICAL)
    try {
      const storageId = await dataStorageService.saveAPIResults(
        'full_production',
        'Google Ads API',
        { tasks: [{ result: results }] }, // Raw API structure
        testResults
      );
      console.log(`💾 FULL PRODUCTION results saved with ID: ${storageId}`);
      console.log(`📁 Data location: ${dataStorageService.getStorageDirectory()}`);
      console.log(`📊 Files created: JSON, comprehensive CSV, July 2025 CSV, executive summary, raw API`);
    } catch (error) {
      console.error('🚨 CRITICAL: Failed to save full production results:', error);
      // Still return results even if auto-save fails
    }
    
    return testResults;
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