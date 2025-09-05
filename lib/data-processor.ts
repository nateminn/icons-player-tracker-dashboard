import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SEMrushRow {
  Keyword: string;
  'Avg. monthly searches': string;
  Competition: string;
  'YoY change': string;
  Country?: string;
}

export class DataProcessor {
  private playerMappings: Map<string, string>;
  private merchTerms: Set<string>;
  
  constructor() {
    // Initialize player name mappings (sample - expand for all 150 players)
    this.playerMappings = new Map([
      // Main names
      ['messi', 'Lionel Messi'],
      ['leo messi', 'Lionel Messi'],
      ['l messi', 'Lionel Messi'],
      ['lionel messi', 'Lionel Messi'],
      
      ['ronaldo', 'Cristiano Ronaldo'],
      ['cr7', 'Cristiano Ronaldo'],
      ['cristiano', 'Cristiano Ronaldo'],
      ['cristiano ronaldo', 'Cristiano Ronaldo'],
      
      ['mbappe', 'Kylian Mbappe'],
      ['kylian mbappe', 'Kylian Mbappe'],
      ['mbappé', 'Kylian Mbappe'],
      
      ['haaland', 'Erling Haaland'],
      ['erling haaland', 'Erling Haaland'],
      ['håland', 'Erling Haaland'],
      
      ['bellingham', 'Jude Bellingham'],
      ['jude bellingham', 'Jude Bellingham'],
      ['j bellingham', 'Jude Bellingham'],
      
      ['vinicius', 'Vinicius Jr'],
      ['vinicius jr', 'Vinicius Jr'],
      ['vini jr', 'Vinicius Jr'],
      
      ['foden', 'Phil Foden'],
      ['phil foden', 'Phil Foden'],
      ['p foden', 'Phil Foden'],
      
      ['pedri', 'Pedri'],
      
      ['saka', 'Bukayo Saka'],
      ['bukayo saka', 'Bukayo Saka'],
      ['b saka', 'Bukayo Saka'],
      
      ['musiala', 'Jamal Musiala'],
      ['jamal musiala', 'Jamal Musiala'],
      ['j musiala', 'Jamal Musiala'],
      
      // Add more player mappings here...
      // You would expand this to cover all variations of all 150 players
    ]);
    
    // Initialize merchandise terms
    this.merchTerms = new Set([
      'shirt', 'jersey', 'signed', 'autograph', 'card',
      'poster', 'boots', 'kit', 'memorabilia', 'authentic',
      'official', 'retro', 'vintage', 'framed', 'ball',
      'merchandise', 'merch', 'buy', 'purchase', 'shop',
      'store', 'price', 'cost', 'sale', 'deal'
    ]);
  }
  
  async processMultipleReports(files: File[]): Promise<{ success: boolean; message: string; recordsProcessed: number }> {
    console.log(`Processing ${files.length} SEMrush reports...`);
    
    try {
      const allData: SEMrushRow[] = [];
      
      // Process each file
      for (const file of files) {
        const data = await this.parseCSV(file);
        allData.push(...data);
      }
      
      // Aggregate and process
      const processed = this.aggregateData(allData);
      
      // Upload to database (commented out until Supabase is configured)
      // await this.uploadToSupabase(processed);
      
      return {
        success: true,
        message: `Successfully processed ${files.length} files`,
        recordsProcessed: processed.length
      };
      
    } catch (error) {
      console.error('Processing error:', error);
      return {
        success: false,
        message: `Error processing files: ${error}`,
        recordsProcessed: 0
      };
    }
  }
  
  private async parseCSV(file: File): Promise<SEMrushRow[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          // Filter out empty rows and validate data
          const validData = (results.data as SEMrushRow[]).filter((row: SEMrushRow) => 
            row.Keyword && 
            row['Avg. monthly searches'] && 
            row.Keyword.trim().length > 0
          ) as SEMrushRow[];
          
          resolve(validData);
        },
        error: (error) => reject(error)
      });
    });
  }
  
  private aggregateData(rawData: SEMrushRow[]): Record<string, string | number>[] {
    const aggregated = new Map();
    let processedCount = 0;
    
    rawData.forEach(row => {
      const keyword = row.Keyword.toLowerCase().trim();
      const volume = this.parseVolume(row['Avg. monthly searches']);
      
      // Skip if volume is 0 or invalid
      if (volume === 0) return;
      
      // Identify player and type
      const { player, isMerch } = this.identifyPlayer(keyword);
      
      if (player) {
        processedCount++;
        const market = this.mapCountry(row.Country);
        const key = `${player}-${market}`;
        
        if (!aggregated.has(key)) {
          aggregated.set(key, {
            player,
            market,
            playerVolume: 0,
            merchVolume: 0,
            totalKeywords: 0,
            trend: this.parseTrend(row['YoY change']),
            keywords: []
          });
        }
        
        const entry = aggregated.get(key);
        entry.totalKeywords++;
        entry.keywords.push(keyword);
        
        if (isMerch) {
          entry.merchVolume += volume;
        } else {
          entry.playerVolume += volume;
        }
        
        // Average the trend
        const currentTrend = this.parseTrend(row['YoY change']);
        if (!isNaN(currentTrend)) {
          entry.trend = (entry.trend + currentTrend) / 2;
        }
      }
    });
    
    console.log(`Processed ${processedCount} relevant keywords for ${aggregated.size} player-market combinations`);
    
    // Convert to array and calculate final metrics
    return Array.from(aggregated.values()).map(entry => ({
      ...entry,
      totalVolume: entry.playerVolume + entry.merchVolume,
      merchantRatio: entry.merchVolume / (entry.playerVolume + entry.merchVolume) * 100,
      opportunityScore: this.calculateOpportunityScore(entry)
    }));
  }
  
  private identifyPlayer(keyword: string): { player: string | null, isMerch: boolean } {
    // Check each player mapping
    for (const [pattern, playerName] of this.playerMappings) {
      if (keyword.includes(pattern)) {
        // Check if it's merchandise related
        const isMerch = Array.from(this.merchTerms).some(term => 
          keyword.includes(term) && !pattern.includes(term)
        );
        
        return { player: playerName, isMerch };
      }
    }
    
    return { player: null, isMerch: false };
  }
  
  private parseVolume(volumeStr: string): number {
    // Remove any non-digit characters except hyphen for ranges
    const cleanStr = volumeStr.replace(/[^0-9\-–]/g, '');
    
    // Handle ranges (e.g., "1000-5000" or "1000–5000")
    if (cleanStr.includes('-') || cleanStr.includes('–')) {
      const parts = cleanStr.split(/[-–]/);
      if (parts.length === 2) {
        const low = parseInt(parts[0]) || 0;
        const high = parseInt(parts[1]) || 0;
        return Math.floor((low + high) / 2);
      }
    }
    
    // Handle exact numbers
    return parseInt(cleanStr) || 0;
  }
  
  private parseTrend(trendStr: string): number {
    if (!trendStr || trendStr === '∞' || trendStr === '-') return 0;
    
    // Remove % sign and convert to number
    const numStr = trendStr.replace('%', '').trim();
    return parseFloat(numStr) || 0;
  }
  
  private mapCountry(country?: string): string {
    if (!country) return 'Global';
    
    const mappings: Record<string, string> = {
      'United States': 'US',
      'United Kingdom': 'UK', 
      'Germany': 'DE',
      'Spain': 'ES',
      'Italy': 'IT',
      'France': 'FR',
      'Mexico': 'MX',
      'China': 'CN',
      'Saudi Arabia': 'SA',
      'Japan': 'JP'
    };
    
    return mappings[country] || country.substring(0, 2).toUpperCase();
  }
  
  private calculateOpportunityScore(data: Record<string, string | number>): number {
    const totalVolume = data.totalVolume;
    const trend = data.trend || 0;
    const keywordCount = data.totalKeywords;
    
    // Volume component (0-40 points) - logarithmic scale
    let volumeScore = 0;
    if (Number(totalVolume) > 0) {
      volumeScore = Math.min(Math.log10(Number(totalVolume)) * 8, 40);
    }
    
    // Trend component (0-35 points)
    const trendScore = Math.max(Math.min(Number(trend) * 0.7, 35), -15);
    
    // Keyword diversity component (0-25 points)
    const diversityScore = Math.min(Number(keywordCount) * 2, 25);
    
    // Calculate total (can be negative for declining trends)
    const totalScore = volumeScore + trendScore + diversityScore;
    
    // Normalize to 0-100 scale
    return Math.max(0, Math.min(100, totalScore));
  }
  
  private async uploadToSupabase(data: Record<string, string | number>[]): Promise<void> {
    const dataMonth = new Date().toISOString().slice(0, 7) + '-01';
    
    try {
      // First, get or create players
      const uniquePlayers = [...new Set(data.map(item => item.player))];
      
      for (const playerName of uniquePlayers) {
        const { error } = await supabase
          .from('players')
          .upsert({ 
            name: playerName,
            status: 'Unknown', // Default status
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'name' 
          });
        
        if (error) console.error(`Error upserting player ${playerName}:`, error);
      }
      
      // Get player IDs
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, name')
        .in('name', uniquePlayers);
        
      if (playersError) throw playersError;
      
      const playerIdMap = new Map(players?.map(p => [p.name, p.id]) || []);
      
      // Get market IDs
      const { data: markets, error: marketsError } = await supabase
        .from('markets')
        .select('id, code');
        
      if (marketsError) throw marketsError;
      
      const marketIdMap = new Map(markets?.map(m => [m.code, m.id]) || []);
      
      // Prepare summary data
      const summaries = data.map(row => ({
        player_id: playerIdMap.get(row.player),
        market_id: marketIdMap.get(row.market),
        player_search_volume: row.playerVolume,
        merch_search_volume: row.merchVolume,
        total_search_volume: row.totalVolume,
        trend_percent: row.trend,
        opportunity_score: row.opportunityScore,
        data_month: dataMonth,
        updated_at: new Date().toISOString()
      })).filter(item => item.player_id && item.market_id);
      
      // Batch upsert to player_market_summary
      const { error: summaryError } = await supabase
        .from('player_market_summary')
        .upsert(summaries, { 
          onConflict: 'player_id,market_id,data_month' 
        });
      
      if (summaryError) throw summaryError;
      
      console.log(`Successfully uploaded ${summaries.length} player-market summaries`);
      
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }
  
  // Helper method to add new player mappings
  addPlayerMapping(variations: string[], playerName: string) {
    variations.forEach(variation => {
      this.playerMappings.set(variation.toLowerCase(), playerName);
    });
  }
  
  // Helper method to get processing statistics
  getProcessingStats(data: Record<string, string | number>[]) {
    const totalPlayers = new Set(data.map(item => item.player)).size;
    const totalMarkets = new Set(data.map(item => item.market)).size;
    const totalVolume = data.reduce((sum, item) => sum + item.totalVolume, 0);
    const avgOpportunityScore = data.reduce((sum, item) => sum + item.opportunityScore, 0) / data.length;
    
    return {
      totalPlayers,
      totalMarkets,
      totalVolume,
      avgOpportunityScore: avgOpportunityScore.toFixed(2),
      topPlayers: data
        .sort((a, b) => b.totalVolume - a.totalVolume)
        .slice(0, 5)
        .map(item => ({ name: item.player, volume: item.totalVolume }))
    };
  }
}

// Export default instance
export const dataProcessor = new DataProcessor();