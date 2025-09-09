import { FINAL_PLAYER_NAMES } from './final-player-data';

// Your specified 6 markets with location codes
export const PRIORITY_MARKETS = {
  "United Kingdom": 2826,
  "United States": 2840, 
  "Canada": 2124,
  "Australia": 2036,
  "Germany": 2276,
  "Mexico": 2484
};

// Your specified 32 merch terms
export const MERCH_TERMS = [
  // Basic merchandise
  "shirt",
  "jersey", 
  "signed shirt",
  "signed jersey",
  
  // Autographed items
  "signed",
  "autograph",
  "autographed",
  "memorabilia",
  
  // Equipment
  "boots",
  "cleats",
  
  // Collectibles
  "card",
  "poster", 
  "signed photo",
  "authentic",
  "official",
  "framed",
  "signed ball",
  "collectibles",
  
  // Premium autographed
  "autographed shirt",
  "autographed jersey",
  "signature",
  "coins",
  "exclusive",
  "dedication",
  
  // Art & Display
  "artwork",
  "signed art",
  
  // Category terms
  "sports memorabilia",
  "soccer memorabilia", 
  "football memorabilia",
  
  // Premium categories
  "limited edition",
  "unique",
  "one of a kind"
];

// Generate all keyword combinations for a specific player
export function generatePlayerMerchKeywords(playerName: string): string[] {
  const keywords: string[] = [];
  
  // Generate all combinations: "player name + merch term"
  MERCH_TERMS.forEach(term => {
    keywords.push(`${playerName} ${term}`);
  });
  
  return keywords;
}

// Calculate total API request structure
export function calculateApiRequestStructure() {
  const totalPlayers = FINAL_PLAYER_NAMES.length; // 125
  const totalMarkets = Object.keys(PRIORITY_MARKETS).length; // 6
  const totalMerchTerms = MERCH_TERMS.length; // 32
  const totalKeywords = totalPlayers * totalMerchTerms; // 4,000 keywords
  
  // DataForSEO allows 1000 keywords per request
  const maxKeywordsPerRequest = 1000;
  
  // Calculate requests needed per market
  const requestsPerMarket = Math.ceil(totalKeywords / maxKeywordsPerRequest);
  
  // Total API requests needed
  const totalApiRequests = requestsPerMarket * totalMarkets;
  
  return {
    totalPlayers,
    totalMarkets, 
    totalMerchTerms,
    totalKeywords,
    requestsPerMarket,
    totalApiRequests,
    maxKeywordsPerRequest
  };
}

// Create batched keyword requests optimized for API efficiency
export function createOptimizedKeywordBatches() {
  const structure = calculateApiRequestStructure();
  const batches: Array<{
    market: string;
    locationCode: number;
    keywords: string[];
    batchNumber: number;
  }> = [];
  
  // Generate all keywords first
  const allKeywords: string[] = [];
  FINAL_PLAYER_NAMES.forEach(playerName => {
    const playerKeywords = generatePlayerMerchKeywords(playerName);
    allKeywords.push(...playerKeywords);
  });
  
  // Create batches for each market
  Object.entries(PRIORITY_MARKETS).forEach(([market, locationCode]) => {
    // Split keywords into chunks of 1000
    for (let i = 0; i < allKeywords.length; i += structure.maxKeywordsPerRequest) {
      const keywordBatch = allKeywords.slice(i, i + structure.maxKeywordsPerRequest);
      
      batches.push({
        market,
        locationCode,
        keywords: keywordBatch,
        batchNumber: Math.floor(i / structure.maxKeywordsPerRequest) + 1
      });
    }
  });
  
  return {
    batches,
    totalBatches: batches.length,
    structure
  };
}

// Cost estimation function (will need actual DataForSEO pricing)
export function estimateCosts(pricePerRequest: number = 0.50) { // Placeholder price
  const { totalApiRequests } = calculateApiRequestStructure();
  
  return {
    totalRequests: totalApiRequests,
    estimatedCostUSD: totalApiRequests * pricePerRequest,
    pricePerRequest,
    breakdown: {
      requestsPerMarket: Math.ceil(4000 / 1000), // 4 requests per market
      markets: 6,
      totalRequests: Math.ceil(4000 / 1000) * 6 // 24 total requests
    }
  };
}

// Generate preview for testing (small subset)
export function generateTestPreview(playerCount: number = 5, marketCount: number = 2) {
  const testPlayers = FINAL_PLAYER_NAMES.slice(0, playerCount);
  const testMarkets = Object.entries(PRIORITY_MARKETS).slice(0, marketCount);
  
  const testKeywords = testPlayers.length * MERCH_TERMS.length;
  const testRequests = testMarkets.length * Math.ceil(testKeywords / 1000);
  
  return {
    players: testPlayers,
    markets: testMarkets.map(([name]) => name),
    totalKeywords: testKeywords,
    totalRequests: testRequests,
    estimatedCost: testRequests * 0.50 // Placeholder
  };
}