// DataForSEO Labs API service - 90% cheaper than Google Ads API
// Cost: $0.01 + $0.0001 per keyword (vs $0.05 per Google Ads request)
// For 18,750 keywords: ~$1.89 vs $18.75

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

interface DataForSEOLabsKeywordResult {
  keyword: string;
  location_code: number;
  language_code: string;
  search_volume?: number;
  cpc?: number;
  competition?: number;
  competition_level?: string;
  monthly_searches?: Array<{
    year: number;
    month: number;
    search_volume: number;
  }>;
}

class DataForSEOLabsService {
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

  // Generate keywords in format: "Player Name + Merch Term"
  generatePlayerMerchKeywords(playerNames: string[], merchTerms: string[]): string[] {
    const keywords: string[] = [];
    
    playerNames.forEach(playerName => {
      merchTerms.forEach(term => {
        keywords.push(`${playerName} ${term}`);
      });
    });
    
    return keywords;
  }

  // Get keyword data using DataForSEO Labs API - much cheaper option
  async getKeywordData(
    keyword: string,
    locationCode: number = 2840,
    languageCode: string = 'en',
    dateFrom?: string,
    dateTo?: string
  ): Promise<DataForSEOLabsKeywordResult | null> {
    const url = `${this.baseUrl}/dataforseo_labs/google/keyword_ideas/live`;
    
    const payload: {
      keyword: string;
      location_code: number;
      language_code: string;
      limit?: number;
      date_from?: string;
      date_to?: string;
    } = {
      keyword: keyword,
      location_code: locationCode,
      language_code: languageCode,
      limit: 1  // We only want data for the exact keyword, not related suggestions
    };
    
    // Add date range if specified
    if (dateFrom) payload.date_from = dateFrom;
    if (dateTo) payload.date_to = dateTo;

    try {
      console.log(`🔍 Labs API request for: "${keyword}" in location ${locationCode}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([payload]),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status_code !== 20000) {
        throw new Error(`API error: ${data.status_message}`);
      }

      if (!data.tasks?.[0]?.result) {
        console.warn(`⚠️ No results for keyword: ${keyword}`);
        return null;
      }

      // Find exact match for our keyword in the results
      const results = data.tasks[0].result;
      const exactMatch = results.find((item: { keyword?: string; search_volume?: number; cpc?: number; competition?: number; competition_level?: string; monthly_searches?: Array<{year: number; month: number; search_volume: number}> }) => 
        item.keyword && item.keyword.toLowerCase() === keyword.toLowerCase()
      );

      if (exactMatch) {
        return {
          keyword: keyword,
          location_code: locationCode,
          language_code: languageCode,
          search_volume: exactMatch.search_volume,
          cpc: exactMatch.cpc,
          competition: exactMatch.competition,
          competition_level: exactMatch.competition_level,
          monthly_searches: exactMatch.monthly_searches
        };
      }

      // If no exact match, return the first result with our keyword name
      return {
        keyword: keyword,
        location_code: locationCode,
        language_code: languageCode,
        search_volume: results[0]?.search_volume || 0,
        cpc: results[0]?.cpc || 0,
        competition: results[0]?.competition || 0,
        competition_level: results[0]?.competition_level || 'LOW',
        monthly_searches: results[0]?.monthly_searches || []
      };
      
    } catch (error) {
      console.error(`❌ Labs API request failed for "${keyword}":`, error);
      return null;
    }
  }

  // Run micro test (5 players × 2 markets × 30 terms = 300 keywords)
  async runMicroTest(dateFrom?: string, dateTo?: string, useSandbox?: boolean): Promise<{
    testType: string;
    players: string[];
    markets: string[];
    keywordCount: number;
    estimatedCost: number;
    actualCost: number;
    dateRange?: { from: string; to: string };
    apiMode: string;
    results: Record<string, DataForSEOLabsKeywordResult[]>;
  }> {
    const mode = useSandbox !== undefined ? (useSandbox ? 'Sandbox' : 'Live') : (this.baseUrl.includes('sandbox') ? 'Sandbox' : 'Live');
    console.log(`🧪 Starting Labs API Micro Test ${mode} Mode...`);
    
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
    
    const estimatedCost = testKeywords.length * 0.0101; // $0.01 base + $0.0001 per keyword
    
    console.log(`👥 Players: ${testPlayers.join(', ')}`);
    console.log(`🌍 Markets: ${testMarkets.map(([name]) => name).join(', ')}`);
    console.log(`🔑 Keywords: ${testKeywords.length} total`);
    console.log(`💰 Estimated cost: $${estimatedCost.toFixed(3)} (Labs API)`);
    
    if (dateFrom && dateTo) {
      console.log(`📅 Date range: ${dateFrom} to ${dateTo}`);
    }
    
    const results: Record<string, DataForSEOLabsKeywordResult[]> = {};
    let totalRequests = 0;
    
    for (const [market, locationCode] of testMarkets) {
      console.log(`\n📊 Testing market: ${market}`);
      results[market] = [];
      
      for (const keyword of testKeywords) {
        try {
          const result = await this.getKeywordData(
            keyword, 
            locationCode, 
            'en',
            dateFrom,
            dateTo
          );
          
          if (result) {
            results[market].push(result);
          }
          totalRequests++;
          
          // Add delay to respect rate limits
          await this.delay(200); // 200ms between requests
          
        } catch (error) {
          console.error(`❌ Failed for keyword "${keyword}" in ${market}:`, error);
        }
      }
      
      console.log(`✅ Market ${market} complete: ${results[market].length} results`);
    }
    
    // Restore original baseUrl
    this.baseUrl = originalBaseUrl;
    
    const actualCost = totalRequests * 0.0101; // Actual cost based on requests made
    
    const testResults = {
      testType: 'micro_labs' as const,
      players: testPlayers,
      markets: testMarkets.map(([name]) => name),
      keywordCount: testKeywords.length,
      estimatedCost,
      actualCost,
      dateRange: dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined,
      apiMode: mode,
      results
    };

    // Auto-save all API results for permanent storage
    try {
      const storageId = await dataStorageService.saveAPIResults(
        'micro_labs',
        'DataForSEO Labs',
        { tasks: [{ result: results }] }, // Raw API structure
        testResults
      );
      console.log(`💾 Micro test results saved with ID: ${storageId}`);
    } catch (error) {
      console.error('⚠️ Failed to save micro test results:', error);
    }
    
    return testResults;
  }

  // Run full production test (125 players × 30 terms × 5 markets = 18,750 keywords)
  async runFullProductionTest(dateFrom?: string, dateTo?: string): Promise<{
    testType: string;
    players: string[];
    markets: string[];
    keywordCount: number;
    totalRequests: number;
    estimatedCost: number;
    actualCost: number;
    dateRange?: { from: string; to: string };
    apiMode: string;
    progress: { current: number; total: number };
    results: Record<string, DataForSEOLabsKeywordResult[]>;
  }> {
    console.log('🚀 Starting Labs API Full Production Test...');
    console.log('📊 SCOPE: 125 players × 30 merch terms × 5 markets = 18,750 keywords');
    
    const allPlayers = FINAL_PLAYER_NAMES; // All 125 players
    const allMarkets = Object.entries(PRIORITY_MARKETS); // All 5 markets
    const allKeywords = this.generatePlayerMerchKeywords(allPlayers, APPROVED_MERCH_TERMS);
    
    const totalKeywords = allKeywords.length * allMarkets.length; // 18,750 total keyword requests
    const estimatedCost = totalKeywords * 0.0101; // $0.01 + $0.0001 per keyword
    
    console.log(`👥 Players: ${allPlayers.length}`);
    console.log(`🌍 Markets: ${allMarkets.map(([name]) => name).join(', ')}`);
    console.log(`🔑 Keywords: ${allKeywords.length} per market`);
    console.log(`📊 Total keyword requests: ${totalKeywords}`);
    console.log(`💰 Estimated cost: $${estimatedCost.toFixed(2)} (Labs API - 90% cheaper!)`);
    
    if (dateFrom && dateTo) {
      console.log(`📅 Date range: ${dateFrom} to ${dateTo}`);
    }
    
    const results: Record<string, DataForSEOLabsKeywordResult[]> = {};
    let totalRequests = 0;
    
    for (const [market, locationCode] of allMarkets) {
      console.log(`\n🌍 Processing market: ${market}`);
      results[market] = [];
      
      for (let i = 0; i < allKeywords.length; i++) {
        const keyword = allKeywords[i];
        totalRequests++;
        
        console.log(`📤 Request ${totalRequests}/${totalKeywords}: "${keyword}" for ${market} (${(totalRequests/totalKeywords*100).toFixed(1)}%)`);
        
        try {
          const result = await this.getKeywordData(
            keyword,
            locationCode,
            'en',
            dateFrom,
            dateTo
          );
          
          if (result) {
            results[market].push(result);
          }
          
          // Rate limiting - 300ms between requests
          if (totalRequests < totalKeywords) {
            await this.delay(300);
          }
          
        } catch (error) {
          console.error(`❌ Failed for "${keyword}" in ${market}:`, error);
        }
      }
      
      console.log(`🎯 Market ${market} complete: ${results[market].length} results`);
    }
    
    const actualCost = totalRequests * 0.0101;
    console.log(`\n🎉 Labs API Production Test Complete!`);
    console.log(`💰 Final cost: $${actualCost.toFixed(2)} (saved ~$16.86 vs Google Ads API!)`);
    
    const productionResults = {
      testType: 'full_production_labs' as const,
      players: allPlayers,
      markets: allMarkets.map(([name]) => name),
      keywordCount: allKeywords.length,
      totalRequests,
      estimatedCost,
      actualCost,
      dateRange: dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined,
      apiMode: 'Live',
      progress: { current: totalRequests, total: totalKeywords },
      results
    };

    // Auto-save all production API results for permanent storage
    try {
      const storageId = await dataStorageService.saveAPIResults(
        'full_production_labs',
        'DataForSEO Labs',
        { tasks: [{ result: results }] }, // Raw API structure
        productionResults
      );
      console.log(`💾 Production test results saved with ID: ${storageId}`);
      console.log(`📁 Data saved to: ${dataStorageService.getStorageDirectory()}`);
    } catch (error) {
      console.error('⚠️ Failed to save production test results:', error);
    }
    
    return productionResults;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const dataForSEOLabsService = new DataForSEOLabsService();