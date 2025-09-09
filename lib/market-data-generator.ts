import { FINAL_PLAYER_NAMES, FINAL_PLAYER_METADATA } from './final-player-data';
import { EnhancedPlayerData, MarketData } from './enhanced-sample-data';

export const marketsList = [
  "United States",
  "United Kingdom", 
  "Germany",
  "Spain",
  "France",
  "Italy",
  "Brazil",
  "Mexico",
  "Canada",
  "Australia"
];

// Generate market-specific search volumes for each player
function generateMarketData(playerName: string, baseVolume: number): MarketData[] {
  const markets: MarketData[] = [];
  
  for (const market of marketsList) {
    // Create realistic distribution based on player popularity and market characteristics
    let marketMultiplier = 1.0;
    
    // Market size factors (approximate internet population and football interest)
    const marketFactors: Record<string, number> = {
      "United States": 1.2,      // Large population, growing football interest
      "United Kingdom": 1.5,     // High football interest, English-speaking
      "Germany": 1.1,            // Strong football culture
      "Spain": 1.3,              // Football-obsessed culture
      "France": 1.0,             // Baseline
      "Italy": 1.1,              // Strong football culture
      "Brazil": 1.4,             // Football-crazy nation
      "Mexico": 0.8,             // Smaller digital market
      "Canada": 0.6,             // Smaller population, less football interest
      "Australia": 0.5           // Smallest football interest
    };
    
    marketMultiplier *= marketFactors[market] || 1.0;
    
    // Player-specific factors based on nationality and current team
    const playerMeta = FINAL_PLAYER_METADATA[playerName as keyof typeof FINAL_PLAYER_METADATA];
    if (playerMeta) {
      // Higher search in player's nationality market
      if ((playerMeta.nationality === "England" && market === "United Kingdom") ||
          (playerMeta.nationality === "United States" && market === "United States") ||
          (playerMeta.nationality === "Germany" && market === "Germany") ||
          (playerMeta.nationality === "Spain" && market === "Spain") ||
          (playerMeta.nationality === "France" && market === "France") ||
          (playerMeta.nationality === "Italy" && market === "Italy") ||
          (playerMeta.nationality === "Brazil" && market === "Brazil") ||
          (playerMeta.nationality === "Mexico" && market === "Mexico") ||
          (playerMeta.nationality === "Canada" && market === "Canada") ||
          (playerMeta.nationality === "Australia" && market === "Australia")) {
        marketMultiplier *= 1.8; // 80% boost in home country
      }
      
      // Team-based factors
      const teamMarketBoost: Record<string, string[]> = {
        "United Kingdom": ["Arsenal", "Chelsea", "Liverpool", "Manchester United", "Manchester City", "Tottenham", "Newcastle", "Brighton"],
        "Spain": ["Real Madrid", "Barcelona", "Atletico Madrid", "Sevilla", "Athletic Bilbao"],
        "Germany": ["Bayern Munich", "Borussia Dortmund", "Bayer Leverkusen", "RB Leipzig"],
        "Italy": ["Juventus", "AC Milan", "Inter Milan", "AS Roma", "Napoli"],
        "France": ["PSG", "Monaco", "Lyon", "Marseille"],
        "United States": ["Inter Miami", "LA Galaxy", "Atlanta United", "Seattle Sounders"]
      };
      
      Object.entries(teamMarketBoost).forEach(([marketName, teams]) => {
        if (market === marketName && teams.some(team => playerMeta.current_team.includes(team))) {
          marketMultiplier *= 1.5; // 50% boost in team's market
        }
      });
    }
    
    // Add some randomness to make data more realistic
    const randomFactor = 0.7 + (Math.random() * 0.6); // 0.7x to 1.3x
    marketMultiplier *= randomFactor;
    
    const marketVolume = Math.round(baseVolume * marketMultiplier);
    const playerVolume = Math.round(marketVolume * 0.7);
    const merchVolume = Math.round(marketVolume * 0.3);
    const trend = (Math.random() - 0.5) * 40; // ±20% trend
    
    markets.push({
      market,
      volume: marketVolume,
      player_volume: playerVolume,
      merch_volume: merchVolume,
      trend_percent: Number(trend.toFixed(1))
    });
  }
  
  return markets;
}

// Generate enhanced player data with market breakdowns
export function generateEnhancedPlayerData(): EnhancedPlayerData[] {
  return FINAL_PLAYER_NAMES.map((playerName, index) => {
    const playerMeta = FINAL_PLAYER_METADATA[playerName as keyof typeof FINAL_PLAYER_METADATA];
    
    // Generate base volume (higher for more popular/younger players)
    const baseVolume = Math.floor(Math.random() * 400000) + 100000; // 100K-500K base
    
    // Generate market data
    const marketData = generateMarketData(playerName, baseVolume);
    
    // Calculate totals across all markets
    const totalVolume = marketData.reduce((sum, m) => sum + m.volume, 0);
    const totalPlayerVolume = marketData.reduce((sum, m) => sum + m.player_volume, 0);
    const totalMerchVolume = marketData.reduce((sum, m) => sum + m.merch_volume, 0);
    
    // Find primary market (highest volume)
    const primaryMarket = marketData.reduce((max, current) => 
      current.volume > max.volume ? current : max
    );
    
    // Calculate average trend
    const avgTrend = marketData.reduce((sum, m) => sum + m.trend_percent, 0) / marketData.length;
    
    // Count significant markets (>10K volume)
    const marketCount = marketData.filter(m => m.volume > 10000).length;
    
    // Calculate opportunity score
    const normalizedVolume = Math.min(totalVolume / 50000, 100);
    const normalizedTrend = Math.max(-50, Math.min(50, avgTrend));
    const opportunityScore = Math.round(
      (normalizedVolume * 0.5) + ((normalizedTrend + 50) * 0.3) + (marketCount * 2 * 0.2)
    );
    
    return {
      id: index + 1,
      name: playerName,
      total_volume: totalVolume,
      player_volume: totalPlayerVolume,
      merch_volume: totalMerchVolume,
      trend_percent: Number(avgTrend.toFixed(1)),
      opportunity_score: opportunityScore,
      market_count: marketCount,
      market: primaryMarket.market,
      markets: marketData,
      age: playerMeta?.age || 25,
      position: playerMeta?.position || "MID",
      current_team: playerMeta?.current_team || "Unknown FC",
      nationality: playerMeta?.nationality || "Unknown"
    };
  });
}