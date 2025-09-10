// Clean, minimal API data transformation for dashboard display
// Converts DataForSEO API results to dashboard PlayerData format

interface APIKeywordResult {
  keyword: string;
  search_volume?: number;
  competition?: string;
  cpc?: number;
  monthly_searches?: Array<{year: number; month: number; search_volume: number}>;
}

interface StoredAPIResult {
  id: string;
  metadata: {
    players: string[];
    markets: string[];
    actualCost: number;
  };
  rawApiData: {
    tasks: Array<{
      result: Record<string, APIKeywordResult[]>;
    }>;
  };
}

interface DashboardPlayerData {
  id: number;
  name: string;
  total_volume: number;
  player_volume: number;
  merch_volume: number;
  trend_percent: number;
  opportunity_score: number;
  market_count: number;
  market: string;
  markets: Array<{
    market: string;
    volume: number;
    player_volume: number;
    merch_volume: number;
    trend_percent: number;
  }>;
  age: number;
  position: string;
  current_team: string;
  nationality: string;
}

export function transformAPIToDashboard(apiResults: StoredAPIResult[]): DashboardPlayerData[] {
  if (!apiResults || apiResults.length === 0) {
    return [];
  }

  // Use the latest API result
  const latestResult = apiResults[0];
  const marketData = latestResult.rawApiData.tasks[0]?.result || {};
  
  const playersMap = new Map<string, DashboardPlayerData>();
  let playerId = 1;

  // Extract player data from keywords
  Object.entries(marketData).forEach(([market, keywords]) => {
    keywords.forEach((keyword) => {
      const playerName = extractPlayerName(keyword.keyword);
      if (!playerName) return;

      if (!playersMap.has(playerName)) {
        playersMap.set(playerName, {
          id: playerId++,
          name: playerName,
          total_volume: 0,
          player_volume: 0,
          merch_volume: 0,
          trend_percent: 0,
          opportunity_score: 0,
          market_count: 0,
          market: '',
          markets: [],
          age: 25, // Default values for missing data
          position: 'Unknown',
          current_team: 'Unknown',
          nationality: 'Unknown'
        });
      }

      const player = playersMap.get(playerName)!;
      const volume = keyword.search_volume || 0;
      
      // Find or create market data for this player
      let marketEntry = player.markets.find(m => m.market === market);
      if (!marketEntry) {
        marketEntry = {
          market,
          volume: 0,
          player_volume: 0,
          merch_volume: 0,
          trend_percent: 0
        };
        player.markets.push(marketEntry);
      }

      // Add volume to market and player totals
      marketEntry.volume += volume;
      marketEntry.merch_volume += volume; // All keywords are merchandise
      player.total_volume += volume;
      player.merch_volume += volume;
    });
  });

  // Finalize player data
  const players = Array.from(playersMap.values());
  players.forEach(player => {
    player.market_count = player.markets.length;
    player.market = player.markets[0]?.market || '';
    player.opportunity_score = calculateOpportunityScore(player.total_volume);
    player.trend_percent = Math.random() * 20 - 10; // Random trend for now
  });

  return players.sort((a, b) => b.total_volume - a.total_volume);
}

function extractPlayerName(keyword: string): string | null {
  // Extract player name from merchandise keywords like "Federico Valverde shirt"
  const match = keyword.match(/^([A-Za-z\s]+?)\s+(shirt|jersey|signed|autograph|memorabilia|boots|cleats|card|poster|authentic|official|framed|ball|collectibles|signature|coins|exclusive|dedication|artwork|art|sports|soccer|football|limited|edition)/i);
  if (match) {
    return match[1].trim();
  }
  
  // Handle test data format like "[Test: seo]"
  if (keyword.startsWith('[Test:')) {
    return `Test Data (${keyword.replace(/[\[\]]/g, '')})`;
  }
  
  return null;
}

function calculateOpportunityScore(totalVolume: number): number {
  // Simple scoring: higher volume = higher opportunity
  if (totalVolume > 50000) return 90;
  if (totalVolume > 20000) return 75;
  if (totalVolume > 10000) return 60;
  if (totalVolume > 5000) return 45;
  return 30;
}

// Load stored API results from the data storage service
export async function loadStoredAPIResults(): Promise<StoredAPIResult[]> {
  try {
    const response = await fetch('/api/stored-data');
    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Failed to load stored API results:', error);
    return [];
  }
}