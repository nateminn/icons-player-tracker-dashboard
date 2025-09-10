// Data Storage Service - Auto-saves all DataForSEO API results
// Saves to both local files and provides export functionality

import fs from 'fs';
import path from 'path';

export interface StoredDataForSEOResult {
  id: string;
  timestamp: string;
  testType: 'micro_labs' | 'full_production_labs' | 'micro' | 'full_production';
  source: 'DataForSEO Labs' | 'Google Ads API';
  metadata: {
    players: string[];
    markets: string[];
    keywordCount: number;
    actualCost: number;
    dateRange?: { from: string; to: string };
    apiMode: string;
  };
  rawApiData: Record<string, unknown>; // Complete raw API response
  processedResults: Record<string, unknown>; // Processed results for dashboard
  monthlyData: {
    [market: string]: Array<{
      keyword: string;
      player: string;
      monthlyBreakdown: Array<{
        year: number;
        month: number;
        search_volume: number;
      }>;
    }>;
  };
}

class DataStorageService {
  private storageDir: string;
  
  constructor() {
    // Store in project directory under /data
    this.storageDir = path.join(process.cwd(), 'data', 'api-results');
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
      console.log(`📁 Created data storage directory: ${this.storageDir}`);
    }
  }

  // Auto-save API results with comprehensive metadata
  async saveAPIResults(
    testType: StoredDataForSEOResult['testType'],
    source: StoredDataForSEOResult['source'],
    rawApiData: Record<string, unknown>,
    processedResults: Record<string, unknown>
  ): Promise<string> {
    const id = `${testType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    // Extract monthly data for July 2025 analysis
    const monthlyData = this.extractMonthlyData((processedResults.results || {}) as Record<string, unknown>);
    
    const storedData: StoredDataForSEOResult = {
      id,
      timestamp,
      testType,
      source,
      metadata: {
        players: (processedResults.players as string[]) || [],
        markets: (processedResults.markets as string[]) || [],
        keywordCount: (processedResults.keywordCount as number) || 0,
        actualCost: (processedResults.actualCost as number) || 0,
        dateRange: processedResults.dateRange as { from: string; to: string } | undefined,
        apiMode: (processedResults.apiMode as string) || 'Unknown'
      },
      rawApiData,
      processedResults,
      monthlyData
    };

    // Save to JSON file
    const filename = `${id}.json`;
    const filepath = path.join(this.storageDir, filename);
    
    try {
      fs.writeFileSync(filepath, JSON.stringify(storedData, null, 2));
      console.log(`💾 Saved API results to: ${filepath}`);
      
      // Also create CSV exports automatically
      await this.createAutomaticExports(storedData);
      
      // Show all created files for easy access
      console.log(`\n📁 ALL DATA FILES CREATED:`);
      console.log(`   JSON: ${filepath}`);
      console.log(`   Comprehensive CSV: ${path.join(this.storageDir, `${id.split('_')[0]}_${new Date().toISOString().split('T')[0]}_comprehensive.csv`)}`);
      console.log(`   July 2025 CSV: ${path.join(this.storageDir, `${id.split('_')[0]}_${new Date().toISOString().split('T')[0]}_july2025.csv`)}`);
      console.log(`   Executive Summary: ${path.join(this.storageDir, `${id.split('_')[0]}_${new Date().toISOString().split('T')[0]}_executive_summary.csv`)}`);
      console.log(`   Raw API Data: ${path.join(this.storageDir, `${id.split('_')[0]}_${new Date().toISOString().split('T')[0]}_raw_api.json`)}`);
      console.log(`📂 Storage Directory: ${this.storageDir}\n`);
      
      return id;
    } catch (error) {
      console.error('❌ Failed to save API results:', error);
      throw error;
    }
  }

  // Extract monthly data for easy analysis
  private extractMonthlyData(results: Record<string, unknown>): StoredDataForSEOResult['monthlyData'] {
    const monthlyData: StoredDataForSEOResult['monthlyData'] = {};
    
    Object.entries(results).forEach(([market, keywords]) => {
      monthlyData[market] = [];
      
      (keywords as Array<Record<string, unknown>>).forEach((kw) => {
        // Extract player name from keyword
        const playerMatch = (kw.keyword as string).match(/^([A-Za-z\s]+?)\s+(shirt|jersey|signed|autograph|memorabilia|boots|cleats|card|poster|authentic|official|framed|ball|collectibles|signature|coins|exclusive|dedication|artwork|art|sports|soccer|football|limited|edition)/i);
        const player = playerMatch ? playerMatch[1].trim() : 'Unknown';
        
        if (kw.monthly_searches && Array.isArray(kw.monthly_searches)) {
          monthlyData[market].push({
            keyword: kw.keyword as string,
            player,
            monthlyBreakdown: kw.monthly_searches as Array<{year: number; month: number; search_volume: number}>
          });
        }
      });
    });
    
    return monthlyData;
  }

  // Create automatic CSV and JSON exports
  private async createAutomaticExports(data: StoredDataForSEOResult) {
    const baseFilename = `${data.testType}_${data.timestamp.split('T')[0]}`;
    
    // 1. Comprehensive CSV with all data
    const comprehensiveCSV = this.generateComprehensiveCSV(data);
    fs.writeFileSync(
      path.join(this.storageDir, `${baseFilename}_comprehensive.csv`),
      comprehensiveCSV
    );
    
    // 2. July 2025 specific CSV
    const july2025CSV = this.generateJuly2025CSV(data);
    fs.writeFileSync(
      path.join(this.storageDir, `${baseFilename}_july2025.csv`),
      july2025CSV
    );
    
    // 3. Executive summary CSV
    const executiveCSV = this.generateExecutiveSummaryCSV(data);
    fs.writeFileSync(
      path.join(this.storageDir, `${baseFilename}_executive_summary.csv`),
      executiveCSV
    );
    
    // 4. Raw API responses (for debugging/analysis)
    fs.writeFileSync(
      path.join(this.storageDir, `${baseFilename}_raw_api.json`),
      JSON.stringify(data.rawApiData, null, 2)
    );
    
    console.log(`📊 Created automatic exports for ${data.testType} test`);
  }

  // Generate comprehensive CSV with all available data
  private generateComprehensiveCSV(data: StoredDataForSEOResult): string {
    let csv = 'Market,Player Name,Keyword,Search Volume,Competition Level,CPC ($),Monthly Trend (Last 3 months),Test Type,Source,Date Range,Cost\n';
    
    Object.entries(data.processedResults.results || {}).forEach(([market, keywords]) => {
      (keywords as Array<Record<string, unknown>>).forEach((kw) => {
        const playerMatch = (kw.keyword as string).match(/^([A-Za-z\s]+?)\s+(shirt|jersey|signed|autograph|memorabilia|boots|cleats|card|poster|authentic|official|framed|ball|collectibles|signature|coins|exclusive|dedication|artwork|art|sports|soccer|football|limited|edition)/i);
        const player = playerMatch ? playerMatch[1].trim() : 'Unknown';
        
        const monthlyTrend = kw.monthly_searches && Array.isArray(kw.monthly_searches) ? 
          kw.monthly_searches.slice(-3).map((m: {search_volume: number}) => m.search_volume).join(';') : 
          'N/A';
          
        csv += `"${market}","${player}","${(kw as Record<string, unknown>).keyword}",${(kw as Record<string, unknown>).search_volume || 0},"${(kw as Record<string, unknown>).competition_level || 'N/A'}",${(kw as Record<string, unknown>).cpc || 0},"${monthlyTrend}","${data.testType}","${data.source}","${data.metadata.dateRange?.from || 'Current'} to ${data.metadata.dateRange?.to || 'Current'}",${data.metadata.actualCost}\n`;
      });
    });
    
    return csv;
  }

  // Generate July 2025 specific data
  private generateJuly2025CSV(data: StoredDataForSEOResult): string {
    let csv = 'Market,Player Name,Keyword,July 2025 Search Volume,Competition Level,CPC ($)\n';
    
    Object.entries(data.monthlyData).forEach(([market, keywords]) => {
      keywords.forEach((item) => {
        // Find July 2025 data
        const july2025 = item.monthlyBreakdown.find(m => m.year === 2025 && m.month === 7);
        const volume = july2025 ? july2025.search_volume : 'N/A';
        
        // Get additional data from processed results
        const keywordData = (data.processedResults.results as Record<string, unknown>)?.[market] as Array<Record<string, unknown>> | undefined;
        const matchedKeyword = keywordData?.find((k: Record<string, unknown>) => k.keyword === item.keyword);
        const competition = matchedKeyword?.competition_level || 'N/A';
        const cpc = matchedKeyword?.cpc || 0;
        
        csv += `"${market}","${item.player}","${item.keyword}",${volume},"${competition}",${cpc}\n`;
      });
    });
    
    return csv;
  }

  // Generate executive summary
  private generateExecutiveSummaryCSV(data: StoredDataForSEOResult): string {
    let csv = 'Metric,Value\n';
    csv += `Test Type,${data.testType}\n`;
    csv += `Source API,${data.source}\n`;
    csv += `Total Players,${data.metadata.players.length}\n`;
    csv += `Total Markets,${data.metadata.markets.length}\n`;
    csv += `Total Keywords,${data.metadata.keywordCount}\n`;
    csv += `API Cost,$${data.metadata.actualCost}\n`;
    csv += `Date Range,"${data.metadata.dateRange?.from || 'Current'} to ${data.metadata.dateRange?.to || 'Current'}"\n`;
    csv += `API Mode,${data.metadata.apiMode}\n`;
    csv += `Timestamp,${data.timestamp}\n`;
    
    return csv;
  }

  // Get all stored results
  getAllStoredResults(): StoredDataForSEOResult[] {
    try {
      const files = fs.readdirSync(this.storageDir).filter(f => f.endsWith('.json') && !f.includes('_raw_api'));
      
      return files.map(file => {
        const filepath = path.join(this.storageDir, file);
        const content = fs.readFileSync(filepath, 'utf8');
        return JSON.parse(content) as StoredDataForSEOResult;
      }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('❌ Failed to read stored results:', error);
      return [];
    }
  }

  // Get specific stored result
  getStoredResult(id: string): StoredDataForSEOResult | null {
    try {
      const filepath = path.join(this.storageDir, `${id}.json`);
      const content = fs.readFileSync(filepath, 'utf8');
      return JSON.parse(content) as StoredDataForSEOResult;
    } catch (error) {
      console.error(`❌ Failed to read stored result ${id}:`, error);
      return null;
    }
  }

  // Get storage directory path
  getStorageDirectory(): string {
    return this.storageDir;
  }
}

export const dataStorageService = new DataStorageService();