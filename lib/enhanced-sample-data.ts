export interface EnhancedPlayerData {
  id: number;
  name: string;
  total_volume: number;
  player_volume: number;
  merch_volume: number;
  trend_percent: number;
  opportunity_score: number;
  market_count: number;
  market: string;
  age: number;
  position: string;
  current_team: string;
  nationality: string;
}

export const comprehensivePlayerData: EnhancedPlayerData[] = [
  // Top tier global stars
  { id: 1, name: "Lionel Messi", total_volume: 850000, player_volume: 650000, merch_volume: 200000, trend_percent: 12, opportunity_score: 0, market_count: 8, market: "United States", age: 36, position: "RW", current_team: "Inter Miami", nationality: "Argentina" },
  { id: 2, name: "Cristiano Ronaldo", total_volume: 790000, player_volume: 590000, merch_volume: 200000, trend_percent: -5, opportunity_score: 0, market_count: 9, market: "Saudi Arabia", age: 39, position: "ST", current_team: "Al Nassr", nationality: "Portugal" },
  
  // High opportunity unsigned players
  { id: 3, name: "Kylian Mbappe", total_volume: 620000, player_volume: 450000, merch_volume: 170000, trend_percent: 25, opportunity_score: 89, market_count: 7, market: "France", age: 25, position: "ST", current_team: "PSG", nationality: "France" },
  { id: 4, name: "Erling Haaland", total_volume: 580000, player_volume: 420000, merch_volume: 160000, trend_percent: 30, opportunity_score: 85, market_count: 6, market: "United Kingdom", age: 24, position: "ST", current_team: "Man City", nationality: "Norway" },
  { id: 5, name: "Jude Bellingham", total_volume: 420000, player_volume: 320000, merch_volume: 100000, trend_percent: 45, opportunity_score: 92, market_count: 5, market: "Spain", age: 21, position: "CM", current_team: "Real Madrid", nationality: "England" },
  { id: 6, name: "Pedri", total_volume: 290000, player_volume: 220000, merch_volume: 70000, trend_percent: 22, opportunity_score: 73, market_count: 5, market: "Spain", age: 21, position: "CM", current_team: "Barcelona", nationality: "Spain" },
  { id: 7, name: "Phil Foden", total_volume: 320000, player_volume: 250000, merch_volume: 70000, trend_percent: 28, opportunity_score: 78, market_count: 4, market: "United Kingdom", age: 24, position: "AM", current_team: "Man City", nationality: "England" },
  { id: 8, name: "Bukayo Saka", total_volume: 275000, player_volume: 200000, merch_volume: 75000, trend_percent: 40, opportunity_score: 82, market_count: 4, market: "United Kingdom", age: 22, position: "RW", current_team: "Arsenal", nationality: "England" },
  { id: 9, name: "Jamal Musiala", total_volume: 245000, player_volume: 180000, merch_volume: 65000, trend_percent: 33, opportunity_score: 76, market_count: 4, market: "Germany", age: 21, position: "AM", current_team: "Bayern Munich", nationality: "Germany" },
  { id: 10, name: "Gavi", total_volume: 195000, player_volume: 150000, merch_volume: 45000, trend_percent: 35, opportunity_score: 71, market_count: 4, market: "Spain", age: 20, position: "CM", current_team: "Barcelona", nationality: "Spain" },
  
  // Recently signed players
  { id: 11, name: "Vinicius Jr", total_volume: 380000, player_volume: 280000, merch_volume: 100000, trend_percent: 35, opportunity_score: 0, market_count: 6, market: "Spain", age: 24, position: "LW", current_team: "Real Madrid", nationality: "Brazil" },
  { id: 12, name: "Rafael Leao", total_volume: 185000, player_volume: 140000, merch_volume: 45000, trend_percent: 28, opportunity_score: 68, market_count: 3, market: "Italy", age: 25, position: "LW", current_team: "AC Milan", nationality: "Portugal" },
  { id: 13, name: "Aurelien Tchouameni", total_volume: 165000, player_volume: 130000, merch_volume: 35000, trend_percent: 18, opportunity_score: 0, market_count: 4, market: "France", age: 24, position: "CDM", current_team: "Real Madrid", nationality: "France" },
  
  // More unsigned prospects
  { id: 14, name: "Victor Osimhen", total_volume: 235000, player_volume: 180000, merch_volume: 55000, trend_percent: 42, opportunity_score: 79, market_count: 5, market: "Italy", age: 25, position: "ST", current_team: "Napoli", nationality: "Nigeria" },
  { id: 15, name: "Florian Wirtz", total_volume: 158000, player_volume: 125000, merch_volume: 33000, trend_percent: 55, opportunity_score: 84, market_count: 3, market: "Germany", age: 21, position: "AM", current_team: "Bayer Leverkusen", nationality: "Germany" },
  { id: 16, name: "Khvicha Kvaratskhelia", total_volume: 175000, player_volume: 135000, merch_volume: 40000, trend_percent: 48, opportunity_score: 77, market_count: 4, market: "Italy", age: 23, position: "LW", current_team: "Napoli", nationality: "Georgia" },
  { id: 17, name: "Eduardo Camavinga", total_volume: 145000, player_volume: 110000, merch_volume: 35000, trend_percent: 25, opportunity_score: 69, market_count: 4, market: "Spain", age: 22, position: "CM", current_team: "Real Madrid", nationality: "France" },
  { id: 18, name: "Youssoufa Moukoko", total_volume: 125000, player_volume: 95000, merch_volume: 30000, trend_percent: 38, opportunity_score: 72, market_count: 3, market: "Germany", age: 19, position: "ST", current_team: "Borussia Dortmund", nationality: "Germany" },
  
  // Additional signed players for comparison
  { id: 19, name: "Robert Lewandowski", total_volume: 310000, player_volume: 240000, merch_volume: 70000, trend_percent: -8, opportunity_score: 0, market_count: 6, market: "Spain", age: 35, position: "ST", current_team: "Barcelona", nationality: "Poland" },
  { id: 20, name: "Kevin De Bruyne", total_volume: 295000, player_volume: 225000, merch_volume: 70000, trend_percent: 5, opportunity_score: 0, market_count: 5, market: "United Kingdom", age: 33, position: "AM", current_team: "Man City", nationality: "Belgium" },
  { id: 21, name: "Mohamed Salah", total_volume: 445000, player_volume: 340000, merch_volume: 105000, trend_percent: 15, opportunity_score: 0, market_count: 7, market: "United Kingdom", age: 32, position: "RW", current_team: "Liverpool", nationality: "Egypt" },
  { id: 22, name: "Sadio Mane", total_volume: 225000, player_volume: 170000, merch_volume: 55000, trend_percent: -12, opportunity_score: 0, market_count: 6, market: "SA", age: 32, position: "LW", current_team: "Al Nassr", nationality: "Senegal" },
  { id: 23, name: "Harry Kane", total_volume: 285000, player_volume: 215000, merch_volume: 70000, trend_percent: 8, opportunity_score: 0, market_count: 5, market: "Germany", age: 31, position: "ST", current_team: "Bayern Munich", nationality: "England" },
  
  // More unsigned emerging talents
  { id: 24, name: "Ansu Fati", total_volume: 165000, player_volume: 125000, merch_volume: 40000, trend_percent: 15, opportunity_score: 65, market_count: 4, market: "Spain", age: 22, position: "LW", current_team: "Barcelona", nationality: "Spain" },
  { id: 25, name: "Mason Mount", total_volume: 155000, player_volume: 120000, merch_volume: 35000, trend_percent: 12, opportunity_score: 61, market_count: 3, market: "United Kingdom", age: 26, position: "AM", current_team: "Man United", nationality: "England" },
  { id: 26, name: "Declan Rice", total_volume: 175000, player_volume: 135000, merch_volume: 40000, trend_percent: 22, opportunity_score: 67, market_count: 3, market: "United Kingdom", age: 25, position: "CDM", current_team: "Arsenal", nationality: "England" },
  { id: 27, name: "Enzo Fernandez", total_volume: 135000, player_volume: 105000, merch_volume: 30000, trend_percent: 45, opportunity_score: 75, market_count: 4, market: "United Kingdom", age: 23, position: "CM", current_team: "Chelsea", nationality: "Argentina" },
  { id: 28, name: "Cody Gakpo", total_volume: 115000, player_volume: 85000, merch_volume: 30000, trend_percent: 32, opportunity_score: 68, market_count: 3, market: "United Kingdom", age: 25, position: "LW", current_team: "Liverpool", nationality: "Netherlands" },
  
  // Serie A talents
  { id: 29, name: "Nicolo Barella", total_volume: 125000, player_volume: 95000, merch_volume: 30000, trend_percent: 18, opportunity_score: 63, market_count: 3, market: "Italy", age: 27, position: "CM", current_team: "Inter Milan", nationality: "Italy" },
  { id: 30, name: "Federico Chiesa", total_volume: 145000, player_volume: 110000, merch_volume: 35000, trend_percent: 8, opportunity_score: 58, market_count: 3, market: "Italy", age: 27, position: "RW", current_team: "Juventus", nationality: "Italy" },
];

export const marketsList = ["United Kingdom", "United States", "Germany", "Spain", "Italy", "France", "Saudi Arabia", "Mexico", "China", "Japan"];

export const generateMarketData = (players: EnhancedPlayerData[]) => {
  return marketsList.map(market => {
    const marketPlayers = players.filter(p => p.market === market);
    const volume = marketPlayers.reduce((sum, p) => sum + p.total_volume, 0);
    const avgTrend = marketPlayers.length > 0 
      ? marketPlayers.reduce((sum, p) => sum + p.trend_percent, 0) / marketPlayers.length 
      : 0;
    
    return {
      market,
      volume,
      trend: avgTrend,
      playerCount: marketPlayers.length
    };
  });
};

export const generateHeatmapData = (players: EnhancedPlayerData[]) => {
  const topPlayers = players
    .sort((a, b) => b.total_volume - a.total_volume)
    .slice(0, 15);
  
  return topPlayers.map(player => 
    marketsList.map(market => ({
      player: player.name,
      market,
      volume: market === player.market 
        ? player.total_volume 
        : Math.round(player.total_volume * (Math.random() * 0.3 + 0.1)) // Simulate other market data
    }))
  ).flat();
};

// Updated opportunity score calculation (without age factor)
// New formula: (Volume × 0.5) + (Trend × 0.3) + (Markets × 0.2)

// Market Reach Significance Threshold
export const MARKET_SIGNIFICANCE_THRESHOLD = 5000; // Minimum monthly searches to count as a significant market

export const calculateOpportunityScore = (player: EnhancedPlayerData): number => {
  if (player.opportunity_score === 0) return 0;
  
  // Normalize volume to 0-100 scale (assuming max volume is ~1M)
  const volumeScore = Math.min(100, (player.total_volume / 10000));
  
  // Trend is already a percentage, cap at reasonable bounds
  const trendScore = Math.max(0, Math.min(100, player.trend_percent + 50)); // Shift scale to make negatives low scores
  
  // Market count normalized (assuming max markets is 10)
  // Note: In production, market_count should only include markets above MARKET_SIGNIFICANCE_THRESHOLD
  const marketScore = Math.min(100, (player.market_count / 10) * 100);
  
  // Apply new weightings: 50% volume, 30% trend, 20% markets
  const finalScore = (volumeScore * 0.5) + (trendScore * 0.3) + (marketScore * 0.2);
  
  return Math.round(Math.max(0, Math.min(100, finalScore)));
};

// Market reach criteria explanation:
// - A market is considered "significant" if it generates 5,000+ monthly searches
// - This threshold represents meaningful fan interest and commercial potential
// - Helps distinguish between global stars (many significant markets) vs regional favorites
// - Examples:
//   * Global Star: 50K UK + 30K US + 15K Germany + 8K Spain + 6K Italy = 5 markets
//   * Regional Star: 100K in home country only = 1 market
//   * The global star has higher market reach despite similar total volume

// Note: The opportunity scores in the sample data are currently hardcoded for demo purposes.
// In a production system, they would be calculated using the calculateOpportunityScore function above.