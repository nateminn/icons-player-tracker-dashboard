"use client";

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { 
  Menu, X, Download, TrendingUp, 
  TrendingDown, Users, Globe, Target, BarChart3, Upload, Search, 
  Star, Award, ArrowUpDown
} from "lucide-react";
import { generateEnhancedPlayerData, marketsList } from '@/lib/market-data-generator';
import { transformAPIToDashboard } from '@/lib/api-data-transformer';

// Dynamic import for Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface MarketData {
  market: string;
  volume: number;
  player_volume: number;
  merch_volume: number;
  trend_percent: number;
}

interface PlayerData {
  id: number;
  name: string;
  total_volume: number;
  player_volume: number;
  merch_volume: number;
  trend_percent: number;
  opportunity_score: number;
  market_count: number;
  market: string;
  markets: MarketData[];
  age: number;
  position: string;
  current_team: string;
  nationality: string;
}

export default function EnhancedDashboard() {
  // Core state
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<PlayerData[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(["all"]);
  const [volumeRange, setVolumeRange] = useState<[number, number]>([0, 1000000]);
  const [opportunityRange, setOpportunityRange] = useState<[number, number]>([0, 100]);
  const [sortBy, setSortBy] = useState<string>("total_volume");
  const [sortOrder] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRange] = useState<{ from: Date; to: Date }>({
    from: new Date("2024-07-01"),
    to: new Date("2025-07-01")
  });

  // Data collection and upload state
  const [isCollectingData, setIsCollectingData] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<"sample" | "uploaded">("sample");
  const [collectionResults, setCollectionResults] = useState<{
    filePath: string;
    players: string[];
    markets: string[];
    keywordCount: number;
    cost: number;
    timestamp: string;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  
  // Individual search state
  const [individualSearchQuery, setIndividualSearchQuery] = useState<string>("");
  const [individualSearchResults, setIndividualSearchResults] = useState<PlayerData[]>([]);
  
  // Comparison state
  const [selectedPlayersForComparison, setSelectedPlayersForComparison] = useState<string[]>([]);
  
  // Market analysis state (reserved for future use)
  // const [selectedMarketForAnalysis, setSelectedMarketForAnalysis] = useState<string>("all");

  // Initialize with sample data
  useEffect(() => {
    const sampleData = generateEnhancedPlayerData();
    setPlayers(sampleData);
    setFilteredPlayers(sampleData);
    updateVolumeRange(sampleData);
  }, []);

  // Update volume range based on data
  const updateVolumeRange = (data: PlayerData[]) => {
    if (data.length === 0) return;
    const maxVolume = Math.max(...data.map(p => p.total_volume));
    const minVolume = Math.min(...data.map(p => p.total_volume));
    setVolumeRange([minVolume, maxVolume]);
  };

  // Filter players based on criteria
  useEffect(() => {
    let filtered = [...players];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(player =>
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.current_team.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.position.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Market filter
    if (selectedMarkets.length > 0 && !selectedMarkets.includes("all")) {
      filtered = filtered.filter(player =>
        player.markets.some(market => selectedMarkets.includes(market.market))
      );
    }

    // Volume filter
    filtered = filtered.filter(player =>
      player.total_volume >= volumeRange[0] && player.total_volume <= volumeRange[1]
    );

    // Opportunity filter
    filtered = filtered.filter(player =>
      player.opportunity_score >= opportunityRange[0] && player.opportunity_score <= opportunityRange[1]
    );

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof PlayerData] as number;
      const bVal = b[sortBy as keyof PlayerData] as number;
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    setFilteredPlayers(filtered);
  }, [players, searchQuery, selectedMarkets, volumeRange, opportunityRange, sortBy, sortOrder]);

  // Collect all data from API
  const collectAllData = async () => {
    setIsCollectingData(true);
    try {
      console.log('Starting full data collection...');
      
      const response = await fetch('/api/dataforseo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'collect_all_data',
          dateFrom: dateRange.from.toISOString().split('T')[0],
          dateTo: dateRange.to.toISOString().split('T')[0]
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('Data collection completed!', result.data);
        setCollectionResults({
          filePath: result.data.filePath,
          players: result.data.players,
          markets: result.data.markets,
          keywordCount: result.data.keywordCount,
          cost: result.data.actualCost,
          timestamp: new Date().toISOString()
        });
        alert(`Data Collection Complete!\n\nFile saved to: ${result.data.filePath}\n\nPlayers: ${result.data.players.length}\nMarkets: ${result.data.markets.length}\nKeywords: ${result.data.keywordCount}\nCost: $${result.data.actualCost}\n\nReview the file and drag it back to upload.`);
      } else {
        throw new Error(result.error || 'Data collection failed');
      }
    } catch (error) {
      console.error("Data collection failed:", error);
      alert("Data collection failed. Check console for details.");
    } finally {
      setIsCollectingData(false);
    }
  };

  // Handle file drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(file => file.name.endsWith('.json'));
    
    if (jsonFile) {
      uploadFile(jsonFile);
    } else {
      alert("Please drop a JSON data file.");
    }
  };

  // Handle file upload
  const uploadFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Transform API data to dashboard format
      const dashboardData = transformAPIToDashboard([data]);
      
      if (dashboardData.length > 0) {
        setPlayers(dashboardData);
        setDataSource("uploaded");
        updateVolumeRange(dashboardData);
        
        const realMarkets = [...new Set(dashboardData.flatMap(p => p.markets.map(m => m.market)))];
        console.log('Successfully uploaded data for', dashboardData.length, 'players');
        alert(`Upload Complete!\n\nLoaded ${dashboardData.length} players\nMarkets: ${realMarkets.join(', ')}`);
      } else {
        alert('No player data could be extracted from the file.');
      }
    } catch (error) {
      console.error('File upload failed:', error);
      alert('File upload failed. Please check the file format.');
    }
  };

  // CSV Export functions
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generatePlayerCSV = () => {
    let csv = 'Player Name,Total Volume,Player Volume,Merch Volume,Opportunity Score,Market Count,Primary Market,Age,Position,Team,Nationality,Trend %\n';
    
    filteredPlayers.forEach(player => {
      csv += `"${player.name}",${player.total_volume},${player.player_volume},${player.merch_volume},${player.opportunity_score},${player.market_count},"${player.market}",${player.age},"${player.position}","${player.current_team}","${player.nationality}",${player.trend_percent.toFixed(2)}\n`;
    });
    
    return csv;
  };

  // Individual search functionality  
  const handleIndividualSearch = () => {
    if (!individualSearchQuery.trim()) {
      setIndividualSearchResults([]);
      return;
    }
    
    const results = players.filter(player =>
      player.name.toLowerCase().includes(individualSearchQuery.toLowerCase()) ||
      player.current_team.toLowerCase().includes(individualSearchQuery.toLowerCase()) ||
      player.position.toLowerCase().includes(individualSearchQuery.toLowerCase()) ||
      player.nationality.toLowerCase().includes(individualSearchQuery.toLowerCase())
    );
    setIndividualSearchResults(results);
  };

  // Player comparison functionality
  const togglePlayerForComparison = (playerId: string) => {
    setSelectedPlayersForComparison(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else if (prev.length < 4) {
        return [...prev, playerId];
      }
      return prev;
    });
  };

  const getComparisonPlayers = () => {
    return players.filter(p => selectedPlayersForComparison.includes(p.id.toString()));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Data Controls</h2>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Data Source */}
          <div className="mb-6">
            <div className="text-xs text-gray-500 mb-2">Current Source:</div>
            <Badge variant={dataSource === "uploaded" ? "default" : "secondary"}>
              {dataSource === "uploaded" ? "Uploaded Data" : "Sample Data"}
            </Badge>
          </div>

          {/* Data Collection */}
          <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
            <h3 className="font-medium text-blue-800 mb-3">Data Collection</h3>
            
            <Button 
              className="w-full mb-3" 
              onClick={collectAllData}
              disabled={isCollectingData}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {isCollectingData ? 'Collecting Data...' : 'Collect All Data'}
            </Button>

            {collectionResults && (
              <div className="mt-3 p-3 bg-white rounded border text-sm">
                <div className="font-medium text-green-600 mb-2">Collection Complete</div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div>File: {collectionResults.filePath}</div>
                  <div>Players: {collectionResults.players.length}</div>
                  <div>Markets: {collectionResults.markets.length}</div>
                  <div>Keywords: {collectionResults.keywordCount}</div>
                  <div>Cost: ${collectionResults.cost}</div>
                </div>
              </div>
            )}
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Manual Upload</h3>
            
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <div className="text-sm text-gray-600">
                Drop JSON data file here
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Review data quality before upload
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
              <Input
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Markets</label>
              <Select value={selectedMarkets[0]} onValueChange={(value) => setSelectedMarkets(value === "all" ? ["all"] : [value])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Markets</SelectItem>
                  {marketsList.map((market) => (
                    <SelectItem key={market} value={market}>{market}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Volume Range: {volumeRange[0].toLocaleString()} - {volumeRange[1].toLocaleString()}
              </label>
              <Slider
                value={volumeRange}
                onValueChange={(value) => setVolumeRange(value as [number, number])}
                max={1000000}
                step={10000}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Opportunity Score: {opportunityRange[0]} - {opportunityRange[1]}
              </label>
              <Slider
                value={opportunityRange}
                onValueChange={(value) => setOpportunityRange(value as [number, number])}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Export */}
          <div className="mt-6 pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => downloadCSV(generatePlayerCSV(), `player-data-${format(new Date(), 'yyyy-MM-dd')}.csv`)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-margin duration-300 ease-in-out ${sidebarOpen ? 'ml-80' : 'ml-0'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">Football Player Merchandise Dashboard</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline">July 2025 Data</Badge>
                <Badge variant="secondary">{filteredPlayers.length} Players</Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="individual">Individual Search</TabsTrigger>
              <TabsTrigger value="players">All Players</TabsTrigger>
              <TabsTrigger value="comparison">Player Comparison</TabsTrigger>
              <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
              <TabsTrigger value="markets">Markets</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Players</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{filteredPlayers.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {filteredPlayers.reduce((sum, p) => sum + p.total_volume, 0).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Markets</CardTitle>
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {new Set(filteredPlayers.flatMap(p => p.markets.map(m => m.market))).size}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Opportunity</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {filteredPlayers.length > 0 
                        ? Math.round(filteredPlayers.reduce((sum, p) => sum + p.opportunity_score, 0) / filteredPlayers.length)
                        : 0}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Overview Charts and Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performers Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top 10 Players by Volume</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <Plot
                        data={[
                          {
                            x: filteredPlayers.slice(0, 10).map(p => p.name),
                            y: filteredPlayers.slice(0, 10).map(p => p.total_volume),
                            type: 'bar',
                            marker: { color: '#10B981' },
                          },
                        ]}
                        layout={{
                          title: { text: 'Top Performers by Search Volume' },
                          xaxis: { title: { text: 'Players' } },
                          yaxis: { title: { text: 'Total Volume' } },
                          height: 300,
                        }}
                        config={{ responsive: true }}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Market Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Volume by Market</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <Plot
                        data={[
                          {
                            labels: Array.from(new Set(filteredPlayers.flatMap(p => p.markets.map(m => m.market)))),
                            values: Array.from(new Set(filteredPlayers.flatMap(p => p.markets.map(m => m.market)))).map(market => {
                              return filteredPlayers.reduce((sum, player) => {
                                const marketData = player.markets.find(m => m.market === market);
                                return sum + (marketData?.volume || 0);
                              }, 0);
                            }),
                            type: 'pie',
                            marker: { colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'] },
                          },
                        ]}
                        layout={{
                          title: { text: 'Market Distribution' },
                          height: 300,
                        }}
                        config={{ responsive: true }}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Opportunities Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Opportunities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Player</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Volume</TableHead>
                          <TableHead>Trend</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPlayers
                          .sort((a, b) => b.opportunity_score - a.opportunity_score)
                          .slice(0, 5)
                          .map((player) => (
                            <TableRow key={player.id}>
                              <TableCell className="font-medium">{player.name}</TableCell>
                              <TableCell>
                                <Badge variant={player.opportunity_score >= 75 ? "default" : "secondary"}>
                                  {player.opportunity_score}
                                </Badge>
                              </TableCell>
                              <TableCell>{player.total_volume.toLocaleString()}</TableCell>
                              <TableCell>
                                <span className={player.trend_percent >= 0 ? "text-green-600" : "text-red-600"}>
                                  {player.trend_percent.toFixed(1)}%
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Market Performance Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Market Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Market</TableHead>
                          <TableHead>Players</TableHead>
                          <TableHead>Total Volume</TableHead>
                          <TableHead>Avg Volume</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from(new Set(filteredPlayers.flatMap(p => p.markets.map(m => m.market)))).map((market) => {
                          const marketPlayers = filteredPlayers.filter(p => p.markets.some(m => m.market === market));
                          const totalVolume = marketPlayers.reduce((sum, p) => {
                            const marketData = p.markets.find(m => m.market === market);
                            return sum + (marketData?.volume || 0);
                          }, 0);
                          const avgVolume = totalVolume / marketPlayers.length;
                          
                          return (
                            <TableRow key={market}>
                              <TableCell className="font-medium">{market}</TableCell>
                              <TableCell>{marketPlayers.length}</TableCell>
                              <TableCell>{totalVolume.toLocaleString()}</TableCell>
                              <TableCell>{Math.round(avgVolume).toLocaleString()}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Individual Search Tab */}
            <TabsContent value="individual" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Individual Player Search
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Input
                          placeholder="Search by player name, team, position, or nationality..."
                          value={individualSearchQuery}
                          onChange={(e) => setIndividualSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleIndividualSearch()}
                        />
                      </div>
                      <Button onClick={handleIndividualSearch}>
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </Button>
                    </div>
                    
                    {individualSearchResults.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {individualSearchResults.map((player) => (
                          <Card key={player.id} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h3 className="font-bold text-lg">{player.name}</h3>
                                <Badge variant={player.opportunity_score >= 75 ? "default" : "secondary"}>
                                  {player.opportunity_score}
                                </Badge>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div><strong>Team:</strong> {player.current_team}</div>
                                <div><strong>Position:</strong> {player.position}</div>
                                <div><strong>Nationality:</strong> {player.nationality}</div>
                                <div><strong>Age:</strong> {player.age}</div>
                                <div><strong>Total Volume:</strong> {player.total_volume.toLocaleString()}</div>
                                <div><strong>Markets:</strong> {player.market_count}</div>
                                <div className="flex items-center">
                                  <strong>Trend:</strong>
                                  <div className="flex items-center ml-2">
                                    {player.trend_percent >= 0 ? (
                                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                                    ) : (
                                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                                    )}
                                    <span className={player.trend_percent >= 0 ? "text-green-600" : "text-red-600"}>
                                      {player.trend_percent.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="pt-2">
                                <h4 className="font-medium mb-2">Market Breakdown:</h4>
                                <div className="space-y-1">
                                  {player.markets.slice(0, 3).map((market, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                      <span>{market.market}:</span>
                                      <span>{market.volume.toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                    
                    {individualSearchQuery && individualSearchResults.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No players found matching &quot;{individualSearchQuery}&quot;
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Players Tab */}
            <TabsContent value="players" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Player Performance</CardTitle>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="total_volume">Total Volume</SelectItem>
                        <SelectItem value="opportunity_score">Opportunity Score</SelectItem>
                        <SelectItem value="market_count">Market Count</SelectItem>
                        <SelectItem value="trend_percent">Trend</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Total Volume</TableHead>
                        <TableHead>Opportunity</TableHead>
                        <TableHead>Markets</TableHead>
                        <TableHead>Trend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlayers.slice(0, 20).map((player) => (
                        <TableRow key={player.id}>
                          <TableCell className="font-medium">{player.name}</TableCell>
                          <TableCell>{player.current_team}</TableCell>
                          <TableCell>{player.position}</TableCell>
                          <TableCell>{player.total_volume.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={player.opportunity_score >= 75 ? "default" : player.opportunity_score >= 50 ? "secondary" : "outline"}>
                              {player.opportunity_score}
                            </Badge>
                          </TableCell>
                          <TableCell>{player.market_count}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {player.trend_percent >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                              )}
                              <span className={player.trend_percent >= 0 ? "text-green-600" : "text-red-600"}>
                                {player.trend_percent.toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Player Comparison Tab */}
            <TabsContent value="comparison" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowUpDown className="h-5 w-5" />
                    Player Comparison (Select up to 4 players)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Player Selection */}
                    <div>
                      <h3 className="font-medium mb-4">Select Players to Compare:</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                        {filteredPlayers.slice(0, 20).map((player) => (
                          <div key={player.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`compare-${player.id}`}
                              checked={selectedPlayersForComparison.includes(player.id.toString())}
                              onCheckedChange={() => togglePlayerForComparison(player.id.toString())}
                              disabled={!selectedPlayersForComparison.includes(player.id.toString()) && selectedPlayersForComparison.length >= 4}
                            />
                            <label htmlFor={`compare-${player.id}`} className="text-sm font-medium">
                              {player.name} ({player.current_team})
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Comparison Results */}
                    {selectedPlayersForComparison.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-4">Comparison Results:</h3>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Metric</TableHead>
                                {getComparisonPlayers().map((player) => (
                                  <TableHead key={player.id}>{player.name}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">Total Volume</TableCell>
                                {getComparisonPlayers().map((player) => (
                                  <TableCell key={player.id}>{player.total_volume.toLocaleString()}</TableCell>
                                ))}
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Opportunity Score</TableCell>
                                {getComparisonPlayers().map((player) => (
                                  <TableCell key={player.id}>
                                    <Badge variant={player.opportunity_score >= 75 ? "default" : "secondary"}>
                                      {player.opportunity_score}
                                    </Badge>
                                  </TableCell>
                                ))}
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Market Count</TableCell>
                                {getComparisonPlayers().map((player) => (
                                  <TableCell key={player.id}>{player.market_count}</TableCell>
                                ))}
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Trend %</TableCell>
                                {getComparisonPlayers().map((player) => (
                                  <TableCell key={player.id}>
                                    <span className={player.trend_percent >= 0 ? "text-green-600" : "text-red-600"}>
                                      {player.trend_percent.toFixed(1)}%
                                    </span>
                                  </TableCell>
                                ))}
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Team</TableCell>
                                {getComparisonPlayers().map((player) => (
                                  <TableCell key={player.id}>{player.current_team}</TableCell>
                                ))}
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Position</TableCell>
                                {getComparisonPlayers().map((player) => (
                                  <TableCell key={player.id}>{player.position}</TableCell>
                                ))}
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>

                        {/* Comparison Chart */}
                        {getComparisonPlayers().length > 0 && (
                          <div className="mt-6">
                            <h4 className="font-medium mb-4">Visual Comparison</h4>
                            <div className="h-80">
                              <Plot
                                data={[
                                  {
                                    x: getComparisonPlayers().map(p => p.name),
                                    y: getComparisonPlayers().map(p => p.total_volume),
                                    type: 'bar',
                                    name: 'Total Volume',
                                    marker: { color: '#3B82F6' },
                                  },
                                ]}
                                layout={{
                                  title: { text: 'Total Volume Comparison' },
                                  xaxis: { title: { text: 'Players' } },
                                  yaxis: { title: { text: 'Volume' } },
                                  height: 300,
                                }}
                                config={{ responsive: true }}
                                style={{ width: '100%', height: '100%' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Opportunities Tab */}
            <TabsContent value="opportunities" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Opportunity Score Rankings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Top Opportunities */}
                    <div>
                      <h3 className="font-medium mb-4">Top Opportunities (Score ≥ 75)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPlayers
                          .filter(p => p.opportunity_score >= 75)
                          .sort((a, b) => b.opportunity_score - a.opportunity_score)
                          .map((player) => (
                            <Card key={player.id} className="p-4 border-green-200 bg-green-50">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold">{player.name}</h4>
                                <Badge className="bg-green-600">
                                  <Award className="h-3 w-3 mr-1" />
                                  {player.opportunity_score}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div>Volume: {player.total_volume.toLocaleString()}</div>
                                <div>Markets: {player.market_count}</div>
                                <div>Team: {player.current_team}</div>
                                <div className="flex items-center">
                                  Trend: 
                                  {player.trend_percent >= 0 ? (
                                    <TrendingUp className="h-3 w-3 text-green-600 ml-1 mr-1" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3 text-red-600 ml-1 mr-1" />
                                  )}
                                  <span className={player.trend_percent >= 0 ? "text-green-600" : "text-red-600"}>
                                    {player.trend_percent.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            </Card>
                          ))}
                      </div>
                    </div>

                    {/* Medium Opportunities */}
                    <div>
                      <h3 className="font-medium mb-4">Medium Opportunities (Score 50-74)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {filteredPlayers
                          .filter(p => p.opportunity_score >= 50 && p.opportunity_score < 75)
                          .sort((a, b) => b.opportunity_score - a.opportunity_score)
                          .slice(0, 12)
                          .map((player) => (
                            <Card key={player.id} className="p-3 border-yellow-200 bg-yellow-50">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-sm">{player.name}</h4>
                                <Badge variant="secondary">{player.opportunity_score}</Badge>
                              </div>
                              <div className="space-y-1 text-xs">
                                <div>Vol: {player.total_volume.toLocaleString()}</div>
                                <div>Markets: {player.market_count}</div>
                              </div>
                            </Card>
                          ))}
                      </div>
                    </div>

                    {/* Opportunity Score Distribution Chart */}
                    <div>
                      <h3 className="font-medium mb-4">Opportunity Score Distribution</h3>
                      <div className="h-64">
                        <Plot
                          data={[
                            {
                              x: filteredPlayers.map(p => p.opportunity_score),
                              type: 'histogram',
                              marker: { color: '#8B5CF6' },
                            },
                          ]}
                          layout={{
                            title: { text: 'Distribution of Opportunity Scores' },
                            xaxis: { title: { text: 'Opportunity Score' } },
                            yaxis: { title: { text: 'Number of Players' } },
                            height: 250,
                          }}
                          config={{ responsive: true }}
                          style={{ width: '100%', height: '100%' }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Markets Tab */}
            <TabsContent value="markets" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Market Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from(new Set(filteredPlayers.flatMap(p => p.markets.map(m => m.market)))).map((market) => {
                      const marketPlayers = filteredPlayers.filter(p => p.markets.some(m => m.market === market));
                      const totalVolume = marketPlayers.reduce((sum, p) => {
                        const marketData = p.markets.find(m => m.market === market);
                        return sum + (marketData?.volume || 0);
                      }, 0);
                      
                      return (
                        <div key={market} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium">{market}</h3>
                            <Badge>{marketPlayers.length} players</Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            Total Volume: {totalVolume.toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Trend Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <Plot
                      data={[
                        {
                          x: filteredPlayers.map(p => p.name),
                          y: filteredPlayers.map(p => p.trend_percent),
                          type: 'bar',
                          marker: {
                            color: filteredPlayers.map(p => p.trend_percent >= 0 ? '#10B981' : '#EF4444'),
                          },
                        },
                      ]}
                      layout={{
                        title: { text: 'Player Trend Analysis' },
                        xaxis: { title: { text: 'Players' } },
                        yaxis: { title: { text: 'Trend %' } },
                        height: 350,
                      }}
                      config={{ responsive: true }}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}