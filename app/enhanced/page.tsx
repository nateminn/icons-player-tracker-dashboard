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
  Menu, X, Download, Settings, RefreshCcw, TrendingUp, 
  TrendingDown, Users, Globe, Target, BarChart3 
} from "lucide-react";
import { generateEnhancedPlayerData, marketsList } from '@/lib/market-data-generator';

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
  markets: MarketData[]; // Required to match EnhancedPlayerData
  age: number;
  position: string;
  current_team: string;
  nationality: string;
}

export default function EnhancedDashboard() {
  // Client-side mounting state to prevent hydration issues
  const [isMounted, setIsMounted] = useState(false);
  
  // State
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(["United Kingdom", "United States", "Germany", "Spain"]);
  const [volumeRange, setVolumeRange] = useState<number[]>([0, 1000000]);
  const [dataMonth] = useState(new Date());
  const [topPlayersCount, setTopPlayersCount] = useState<number>(10);
  const [heatmapPlayerCount, setHeatmapPlayerCount] = useState<number>(10);
  const [selectedComparisonPlayers, setSelectedComparisonPlayers] = useState<string[]>([]);
  const [playerSearchTerm, setPlayerSearchTerm] = useState<string>("");
  const [showPlayerDropdown, setShowPlayerDropdown] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("volume");
  const [tableSearchTerm, setTableSearchTerm] = useState<string>("");
  const [showAllPlayers, setShowAllPlayers] = useState<boolean>(false);
  const [selectedPlayerForAnalytics, setSelectedPlayerForAnalytics] = useState<string>("");
  const [playerNameSearch, setPlayerNameSearch] = useState<string>("");
  const [teamSearch, setTeamSearch] = useState<string>("");
  
  // DataForSEO integration state
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<"sample" | "dataforseo">("sample");
  const [apiConnectionStatus, setApiConnectionStatus] = useState<"unknown" | "connected" | "error">("unknown");
  const [microTestResults, setMicroTestResults] = useState<{
    testType: string;
    players: string[];
    markets: string[];
    keywordCount: number;
    estimatedCost: number;
    results: Record<string, Array<{
      keyword: string;
      search_volume?: number;
      competition?: string;
      cpc?: number;
    }>>;
  } | null>(null);


  useEffect(() => {
    // Set mounted state for hydration
    setIsMounted(true);
    
    // Load the enhanced player data with market-specific search demand
    const enhancedData = generateEnhancedPlayerData();
    setPlayers(enhancedData);
    
    // Set initial volume range based on aggregated market data
    // Since we're filtering by markets, we need to calculate the range for selected markets
    const initialSelectedMarkets = ["United Kingdom", "United States", "Germany", "Spain"];
    const marketBasedVolumes = enhancedData.map(player => {
      const selectedMarketData = player.markets?.filter(m => initialSelectedMarkets.includes(m.market)) || [];
      return selectedMarketData.reduce((sum, m) => sum + m.volume, 0);
    }).filter(vol => vol > 0);
    
    setVolumeRange([Math.min(...marketBasedVolumes), Math.max(...marketBasedVolumes)]);
    
    // Test API connection on load
    testApiConnection();
  }, []);

  // Test DataForSEO API connection
  const testApiConnection = async () => {
    try {
      const response = await fetch('/api/dataforseo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test_connection'
        }),
      });

      const result = await response.json();
      setApiConnectionStatus(result.success ? "connected" : "error");
    } catch (error) {
      console.error("API connection test failed:", error);
      setApiConnectionStatus("error");
    }
  };

  // Run micro test for merch keywords
  const runMicroTest = async () => {
    setIsLoadingData(true);
    try {
      console.log('🧪 Starting Micro Test - 5 players × 2 markets with merch terms...');
      
      const response = await fetch('/api/dataforseo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'run_micro_test'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Micro test completed!', result.data);
        setMicroTestResults(result.data);
        alert(`🎉 Micro Test Completed!\n\nTested ${result.data.keywordCount} merch keywords for ${result.data.players.length} players across ${result.data.markets.length} markets.\n\nEstimated cost: $${result.data.estimatedCost}\n\nResults now displayed below!`);
      } else {
        throw new Error(result.error || 'Micro test failed');
      }
    } catch (error) {
      console.error("❌ Micro test failed:", error);
      alert("Micro test failed. Check console for details.");
    } finally {
      setIsLoadingData(false);
    }
  };

  // Fetch data from DataForSEO
  const fetchDataFromAPI = async () => {
    setIsLoadingData(true);
    try {
      // Use a subset of the most popular players from the final list for API testing
      const popularPlayers = [
        "Jude Bellingham",
        "Bukayo Saka", 
        "Cole Palmer",
        "Phil Foden",
        "Martin Odegaard",
        "Pedri",
        "Jamal Musiala",
        "Vini Jr.",
        "Rafael Leão",
        "Florian Wirtz"
      ];
      
      // For now, use sample data - batch player fetching needs to be implemented
      // TODO: Implement batch API calls for multiple players
      const sampleData = generateEnhancedPlayerData().filter(
        player => popularPlayers.includes(player.name)
      );
      setPlayers(sampleData);
      setDataSource("dataforseo");
      
      // Update volume range based on new data
      const volumes = sampleData.map(p => p.total_volume);
      setVolumeRange([Math.min(...volumes), Math.max(...volumes)]);
      
    } catch (error) {
      console.error("Error fetching data from API:", error);
      alert("Failed to fetch data from DataForSEO. Using sample data instead.");
    } finally {
      setIsLoadingData(false);
    }
  };

  // Load sample data
  const loadSampleData = () => {
    const enhancedData = generateEnhancedPlayerData();
    setPlayers(enhancedData);
    setDataSource("sample");
    
    // Reset volume range based on currently selected markets
    const marketBasedVolumes = enhancedData.map(player => {
      const selectedMarketData = player.markets?.filter(m => selectedMarkets.includes(m.market)) || [];
      return selectedMarketData.reduce((sum, m) => sum + m.volume, 0);
    }).filter(vol => vol > 0);
    
    if (marketBasedVolumes.length > 0) {
      setVolumeRange([Math.min(...marketBasedVolumes), Math.max(...marketBasedVolumes)]);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowPlayerDropdown(false);
    };
    
    if (showPlayerDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showPlayerDropdown]);

  // Filter and aggregate data based on selected markets
  const filteredData = players
    .map(player => {
      // Aggregate search volume data for selected markets only
      const selectedMarketData = player.markets?.filter(m => selectedMarkets.includes(m.market)) || [];
      
      if (selectedMarketData.length === 0) {
        // If no market data available, return null to filter out
        return null;
      }
      
      // Calculate aggregated metrics for selected markets
      const aggregatedVolume = selectedMarketData.reduce((sum, m) => sum + m.volume, 0);
      const aggregatedPlayerVolume = selectedMarketData.reduce((sum, m) => sum + m.player_volume, 0);
      const aggregatedMerchVolume = selectedMarketData.reduce((sum, m) => sum + m.merch_volume, 0);
      const avgTrend = selectedMarketData.length > 0 
        ? selectedMarketData.reduce((sum, m) => sum + m.trend_percent, 0) / selectedMarketData.length 
        : 0;
      
      // Find primary market among selected ones
      const primaryMarket = selectedMarketData.reduce((max, current) => 
        current.volume > max.volume ? current : max
      );
      
      return {
        ...player,
        total_volume: aggregatedVolume,
        player_volume: aggregatedPlayerVolume,
        merch_volume: aggregatedMerchVolume,
        trend_percent: Number(avgTrend.toFixed(1)),
        market: primaryMarket.market,
        market_count: selectedMarketData.length
      };
    })
    .filter((player): player is NonNullable<typeof player> => 
      player !== null && 
      player.total_volume >= volumeRange[0] && 
      player.total_volume <= volumeRange[1]
    );

  // Sort filtered data based on selected sort option
  const sortedData = [...filteredData].sort((a, b) => {
    switch (sortBy) {
      case 'volume':
        return b.total_volume - a.total_volume;
      case 'trend':
        return b.trend_percent - a.trend_percent;
      case 'opportunity':
        return b.opportunity_score - a.opportunity_score;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return b.total_volume - a.total_volume;
    }
  });

  // Filter sorted data for table search
  const tableFilteredData = sortedData.filter(player =>
    player.name.toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
    player.current_team.toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
    player.nationality.toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
    player.position.toLowerCase().includes(tableSearchTerm.toLowerCase())
  );

  // Calculate KPIs
  const totalVolume = filteredData.reduce((sum, p) => sum + p.total_volume, 0);
  const avgVolumePerPlayer = filteredData.length > 0 ? totalVolume / filteredData.length : 0;
  const avgTrend = filteredData.length > 0 ? filteredData.reduce((sum, p) => sum + p.trend_percent, 0) / filteredData.length : 0;
  
  // Top market calculation
  const marketVolumes = filteredData.reduce((acc, player) => {
    acc[player.market] = (acc[player.market] || 0) + player.total_volume;
    return acc;
  }, {} as Record<string, number>);
  const topMarket = Object.entries(marketVolumes).reduce((a, b) => a[1] > b[1] ? a : b, ['N/A', 0]);

  // Prepare chart data
  const topPlayersData = filteredData
    .sort((a, b) => b.total_volume - a.total_volume)
    .slice(0, topPlayersCount)
    .map(p => ({
      player: p.name,
      volume: p.total_volume,
      trend: p.trend_percent
    }));

  const marketDistributionData = Object.entries(marketVolumes).map(([market, volume]) => ({
    market,
    volume
  }));


  // Function to determine if a player should have a text label (isolated enough)
  const shouldShowLabel = (player: PlayerData, allPlayers: PlayerData[]) => {
    const minDistance = 50000; // Minimum volume distance to avoid overlap
    const minTrendDistance = 8; // Minimum trend distance to avoid overlap
    
    const nearby = allPlayers.filter(other => 
      other.id !== player.id &&
      Math.abs(other.total_volume - player.total_volume) < minDistance &&
      Math.abs(other.trend_percent - player.trend_percent) < minTrendDistance
    );
    
    return nearby.length === 0;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Streamlit-style Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white shadow-lg`}>
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">📊 Dashboard Controls</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Data Source Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Data Source</h3>
            
            {/* API Connection Status */}
            <div className="mb-3 p-2 rounded-md bg-gray-50">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${
                  apiConnectionStatus === "connected" ? "bg-green-500" : 
                  apiConnectionStatus === "error" ? "bg-red-500" : "bg-yellow-500"
                }`} />
                <span className="text-xs text-gray-600">
                  DataForSEO API: {
                    apiConnectionStatus === "connected" ? "Connected" :
                    apiConnectionStatus === "error" ? "Error" : "Testing..."
                  }
                </span>
              </div>
            </div>

            {/* Current Data Source */}
            <div className="mb-3 p-2 rounded-md border">
              <div className="text-xs text-gray-500 mb-1">Current Source:</div>
              <div className="flex items-center gap-2">
                <Badge variant={dataSource === "dataforseo" ? "default" : "secondary"}>
                  {dataSource === "dataforseo" ? "📊 DataForSEO API" : "🎮 Sample Data"}
                </Badge>
                <span className="text-xs text-gray-500">
                  ({players.length} players)
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button 
                className="w-full" 
                variant={dataSource === "dataforseo" ? "default" : "outline"}
                onClick={fetchDataFromAPI}
                disabled={isLoadingData || apiConnectionStatus === "error"}
              >
                {isLoadingData ? (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                    Fetching API Data...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 mr-2" />
                    Fetch from DataForSEO
                  </>
                )}
              </Button>
              
              <Button 
                className="w-full" 
                variant={dataSource === "sample" ? "default" : "outline"}
                onClick={loadSampleData}
                disabled={isLoadingData}
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Load Sample Data
              </Button>
              
              <Button 
                className="w-full" 
                variant="outline" 
                onClick={testApiConnection}
                disabled={isLoadingData}
              >
                <Settings className="h-4 w-4 mr-2" />
                Test API Connection
              </Button>

              {apiConnectionStatus === "connected" && (
                <Button 
                  className="w-full"
                  variant="default" 
                  onClick={runMicroTest}
                  disabled={isLoadingData}
                  style={{ backgroundColor: '#16a34a', color: 'white' }}
                >
                  <Target className="h-4 w-4 mr-2" />
                  🧪 Run Micro Test ($0.05)
                </Button>
              )}
            </div>

            {/* API Usage Warning */}
            {apiConnectionStatus === "connected" && (
              <div className="mt-3 p-2 rounded-md bg-yellow-50 border border-yellow-200">
                <div className="text-xs text-yellow-700">
                  ⚠️ Using DataForSEO ${process.env.DATAFORSEO_USE_SANDBOX === 'true' ? 'Sandbox' : 'Live API'}.
                  {process.env.DATAFORSEO_USE_SANDBOX === 'true' ? ' Free sandbox data.' : ' Live requests cost credits.'}
                </div>
              </div>
            )}

            {/* Micro Test Results */}
            {microTestResults && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <h4 className="font-medium text-green-800 mb-2">🧪 Micro Test Results</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Players:</strong> {microTestResults.players.join(', ')}</p>
                  <p><strong>Markets:</strong> {microTestResults.markets.join(', ')}</p>
                  <p><strong>Keywords tested:</strong> {microTestResults.keywordCount}</p>
                  <p><strong>Cost:</strong> ${microTestResults.estimatedCost}</p>
                </div>
                
                {/* Sample results for each market */}
                {Object.entries(microTestResults.results || {}).map(([market, keywords]) => (
                  <div key={market} className="mt-3 p-2 bg-white rounded border">
                    <p className="font-medium text-sm">{market} - Top Keywords:</p>
                    <div className="text-xs space-y-1 mt-1">
                      {keywords.slice(0, 3).map((kw, i: number) => (
                        <div key={i} className="flex justify-between">
                          <span>&quot;{kw.keyword}&quot;</span>
                          <span>{kw.search_volume?.toLocaleString() || 0} searches/month</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={() => setMicroTestResults(null)}
                  className="mt-2 text-xs text-green-600 hover:text-green-800"
                >
                  Hide Results
                </button>
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">🔍 Filters</h3>
            
            {/* Market Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-700">Select Markets:</label>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setSelectedMarkets(marketsList)}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedMarkets([])}
                  className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Unselect All
                </button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {marketsList.map(market => (
                  <div key={market} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedMarkets.includes(market)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMarkets([...selectedMarkets, market]);
                        } else {
                          setSelectedMarkets(selectedMarkets.filter(m => m !== market));
                        }
                      }}
                    />
                    <label className="text-sm text-gray-700">{market}</label>
                  </div>
                ))}
              </div>
            </div>


            {/* Volume Range Slider */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Search Volume Range: {volumeRange[0].toLocaleString()} - {volumeRange[1].toLocaleString()}
              </label>
              <Slider
                value={volumeRange}
                onValueChange={setVolumeRange}
                min={0}
                max={1000000}
                step={10000}
                className="mt-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-gray-200 shadow-sm border-b p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-black">
                  Icons Player Demand Tracker
                </h1>
                <p className="text-gray-600 mt-1">
                  Global Search Demand Analysis • {format(dataMonth, 'MMMM yyyy')}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 items-center">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline">
                📧 Email Report
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50">
          {/* Enhanced KPI Cards - Compact Style */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white h-20">
              <CardContent className="!p-2 !pl-4 h-full flex items-center">
                <div className="flex items-center justify-between w-full">
                  <div className="flex-1 min-h-0">
                    <p className="text-blue-100 text-xs font-medium mb-1">Total Search Volume</p>
                    <p className="text-lg font-bold leading-none mb-1">{(totalVolume / 1000000).toFixed(1)}M</p>
                    <div className="flex items-center">
                      {avgTrend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      <span className="text-xs">{avgTrend >= 0 ? '+' : ''}{avgTrend.toFixed(1)}% avg trend</span>
                    </div>
                  </div>
                  <BarChart3 className="h-6 w-6 text-blue-200 ml-2 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white h-20">
              <CardContent className="!p-2 !pl-4 h-full flex items-center">
                <div className="flex items-center justify-between w-full">
                  <div className="flex-1 min-h-0">
                    <p className="text-green-100 text-xs font-medium mb-1">Avg Volume per Player</p>
                    <p className="text-lg font-bold leading-none mb-1">{Math.round(avgVolumePerPlayer / 1000)}K</p>
                    <p className="text-green-200 text-xs">Across selected markets</p>
                  </div>
                  <Users className="h-6 w-6 text-green-200 ml-2 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white h-20">
              <CardContent className="!p-2 !pl-4 h-full flex items-center">
                <div className="flex items-center justify-between w-full">
                  <div className="flex-1 min-h-0">
                    <p className="text-purple-100 text-xs font-medium mb-1">Top Market</p>
                    <p className="text-lg font-bold leading-none mb-1">{topMarket[0]}</p>
                    <p className="text-purple-200 text-xs">{(topMarket[1] / 1000).toFixed(0)}K searches</p>
                  </div>
                  <Globe className="h-6 w-6 text-purple-200 ml-2 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white h-20">
              <CardContent className="!p-2 !pl-4 h-full flex items-center">
                <div className="flex items-center justify-between w-full">
                  <div className="flex-1 min-h-0">
                    <p className="text-orange-100 text-xs font-medium mb-1">Total Players Tracked</p>
                    <p className="text-lg font-bold leading-none mb-1">{filteredData.length}</p>
                    <p className="text-orange-200 text-xs">Players analyzed</p>
                  </div>
                  <Target className="h-6 w-6 text-orange-200 ml-2 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Tabs matching Streamlit structure */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-white border border-gray-200">
              <TabsTrigger value="overview">📈 Overview</TabsTrigger>
              <TabsTrigger value="data">📊 Total Player Data</TabsTrigger>
              <TabsTrigger value="analytics">👤 Individual Player Data</TabsTrigger>
              <TabsTrigger value="heatmap">🌍 Heatmap</TabsTrigger>
              <TabsTrigger value="comparisons">⚖️ Comparisons</TabsTrigger>
              <TabsTrigger value="opportunities">🎯 Opportunities</TabsTrigger>
            </TabsList>

            {/* Overview Tab with Plotly Charts */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Interactive Bar Chart */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Top Players by Search Volume</CardTitle>
                      <Select value={topPlayersCount.toString()} onValueChange={(value) => setTopPlayersCount(parseInt(value))}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isMounted && (
                      // @ts-expect-error - Plotly type definitions conflict
                      <Plot
                        data={[{
                          type: 'bar' as const,
                          x: topPlayersData.map(d => d.volume),
                          y: topPlayersData.map(d => d.player),
                          orientation: 'h' as const,
                          marker: {
                            color: 'rgba(59, 130, 246, 0.8)',
                            line: { color: 'rgba(59, 130, 246, 1)', width: 1 }
                          },
                          hovertemplate: '<b>%{y}</b><br>Volume: %{x:,.0f}<extra></extra>',
                          name: ''
                        }]}
                        layout={{
                          height: Math.max(400, topPlayersCount * 20), // Dynamic height: 20px per player, minimum 400px
                          margin: { t: 20, r: 20, b: 40, l: 150 },
                          xaxis: { title: 'Search Volume' },
                          yaxis: { 
                            title: '', 
                            automargin: true,
                            tickfont: {
                              size: Math.max(8, 14 - (topPlayersCount / 5)) // Smaller font for more players
                            }
                          },
                          hovermode: 'closest' as const,
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          paper_bgcolor: 'rgba(0,0,0,0)'
                        }}
                        config={{ displayModeBar: false }}
                        style={{ width: '100%', height: `${Math.max(400, topPlayersCount * 20)}px` }}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Interactive Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Market Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isMounted && (
                      <Plot
                        data={[{
                          type: 'pie' as const,
                          labels: marketDistributionData.map(d => d.market),
                          values: marketDistributionData.map(d => d.volume),
                          hole: 0.3,
                          hovertemplate: '<b>%{label}</b><br>Volume: %{value:,.0f}<br>Share: %{percent}<extra></extra>'
                        }]}
                        layout={{
                          height: 400,
                          margin: { t: 20, r: 20, b: 20, l: 20 },
                          showlegend: true,
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          paper_bgcolor: 'rgba(0,0,0,0)'
                        }}
                        config={{ displayModeBar: false }}
                        style={{ width: '100%', height: '400px' }}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Trend Analysis Scatter Plot */}
              <Card>
                <CardHeader>
                  <CardTitle>Player Popularity vs Growth Trend</CardTitle>
                  <p className="text-sm text-gray-600">
                    Dotted line shows zero growth
                  </p>
                </CardHeader>
                <CardContent>
                  {isMounted && (
                    // @ts-expect-error - Plotly type definitions conflict
                    <Plot
                      data={[
                        // All players
                        {
                          type: 'scatter' as const,
                          mode: 'markers' as const,
                          name: 'Players',
                          x: filteredData.map(p => p.total_volume),
                          y: filteredData.map(p => p.trend_percent),
                          text: filteredData.map(p => p.name),
                          marker: {
                            color: '#3b82f6',
                            size: filteredData.map(p => Math.max(8, Math.sqrt(p.total_volume) / 50)),
                            line: { color: '#1d4ed8', width: 1 }
                          },
                          hovertemplate: '<b>%{text}</b><br>Volume: %{x:,.0f}<br>Trend: %{y:.1f}%<extra></extra>'
                        },
                        // Text labels for isolated points
                        {
                          type: 'scatter' as const,
                          mode: 'text' as const,
                          name: 'Player Names',
                          showlegend: false,
                          x: filteredData
                            .filter(p => shouldShowLabel(p, filteredData))
                            .map(p => p.total_volume),
                          y: filteredData
                            .filter(p => shouldShowLabel(p, filteredData))
                            .map(p => p.trend_percent + 2), // Offset slightly above the dot
                          text: filteredData
                            .filter(p => shouldShowLabel(p, filteredData))
                            .map(p => p.name),
                          textfont: {
                            size: 10,
                            color: 'rgba(55, 65, 81, 0.8)'
                          },
                          textposition: 'top center' as const,
                          hoverinfo: 'skip'
                        }
                      ]}
                      layout={{
                        height: 400,
                        margin: { t: 20, r: 20, b: 60, l: 60 },
                        xaxis: { title: 'Total Search Volume' },
                        yaxis: { title: 'Growth Trend (%)' },
                        hovermode: 'closest' as const,
                        showlegend: true,
                        legend: {
                          x: 1,
                          y: 1,
                          xanchor: 'right',
                          bgcolor: 'rgba(255, 255, 255, 0.8)',
                          bordercolor: 'rgba(0, 0, 0, 0.1)',
                          borderwidth: 1
                        },
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        shapes: [{
                          type: 'line' as const,
                          x0: 0,
                          x1: Math.max(...filteredData.map(p => p.total_volume)),
                          y0: 0,
                          y1: 0,
                          line: { color: 'gray', dash: 'dash' as const, width: 1 }
                        }]
                      }}
                      config={{ displayModeBar: false }}
                      style={{ width: '100%', height: '400px' }}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Player Data Tab - Comprehensive database table */}
            <TabsContent value="data">
              <Card>
                <CardHeader>
                  <CardTitle>📊 Player Database</CardTitle>
                  <p className="text-gray-600">Complete player tracking database with search and analytics</p>
                </CardHeader>
                <CardContent>
                  {/* Search and Controls */}
                  <div className="mb-6 space-y-4">
                    <div className="flex gap-4 items-center">
                      <div className="flex-1">
                        <Input
                          type="text"
                          placeholder="Search players, teams, countries, positions..."
                          value={tableSearchTerm}
                          onChange={(e) => setTableSearchTerm(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="volume">Search Volume</SelectItem>
                          <SelectItem value="trend">Trend %</SelectItem>
                          <SelectItem value="opportunity">Opportunity Score</SelectItem>
                          <SelectItem value="name">Name</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex gap-2 items-center">
                      <Badge variant="secondary">
                        {tableFilteredData.length} of {filteredData.length} players shown
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAllPlayers(!showAllPlayers)}
                      >
                        {showAllPlayers ? 'Show Top 20' : 'Show All Players'}
                      </Button>
                      {tableSearchTerm && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTableSearchTerm('')}
                        >
                          Clear Search
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Player</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Age</TableHead>
                          <TableHead>Team</TableHead>
                          <TableHead>Market</TableHead>
                          <TableHead>Volume</TableHead>
                          <TableHead>Trend %</TableHead>
                          <TableHead>Opportunity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableFilteredData
                          .slice(0, showAllPlayers ? tableFilteredData.length : 20)
                          .map((player) => (
                          <TableRow key={player.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div>
                                <div className="font-medium">{player.name}</div>
                                <div className="text-sm text-gray-500">{player.nationality}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{player.position}</Badge>
                            </TableCell>
                            <TableCell>{player.age}</TableCell>
                            <TableCell className="text-sm">{player.current_team}</TableCell>
                            <TableCell className="text-sm">{player.market}</TableCell>
                            <TableCell className="font-mono">
                              {(player.total_volume / 1000).toFixed(0)}K
                            </TableCell>
                            <TableCell className={`font-mono ${player.trend_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {player.trend_percent >= 0 ? '+' : ''}{player.trend_percent.toFixed(1)}%
                            </TableCell>
                            <TableCell className="font-mono">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {player.opportunity_score.toFixed(0)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {tableFilteredData.length === 0 && tableSearchTerm && (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-lg">No players found matching &ldquo;{tableSearchTerm}&rdquo;</p>
                      <p className="text-sm mt-2">Try searching by name, team, country, or position</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab - Individual Player Details */}
            <TabsContent value="analytics">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>👤 Individual Player Analytics</CardTitle>
                    <p className="text-gray-600">Detailed breakdown and insights for a specific player</p>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6 space-y-4">
                      <label className="block text-sm font-medium">Search for Player:</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Input
                            type="text"
                            placeholder="Search by player name..."
                            value={playerNameSearch}
                            onChange={(e) => setPlayerNameSearch(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Input
                            type="text"
                            placeholder="Search by team name..."
                            value={teamSearch}
                            onChange={(e) => setTeamSearch(e.target.value)}
                            className="w-full"
                          />
                        </div>
                      </div>
                      
                      {/* Search Results */}
                      {(playerNameSearch || teamSearch) && (
                        <div className="border rounded-lg max-h-48 overflow-y-auto">
                          {(() => {
                            const searchResults = filteredData.filter(player => {
                              const matchesName = !playerNameSearch || player.name.toLowerCase().includes(playerNameSearch.toLowerCase());
                              const matchesTeam = !teamSearch || player.current_team.toLowerCase().includes(teamSearch.toLowerCase());
                              return matchesName && matchesTeam;
                            });
                            
                            if (searchResults.length === 0) {
                              return (
                                <div className="p-4 text-gray-500 text-center">
                                  No players found matching your search criteria
                                </div>
                              );
                            }
                            
                            return searchResults.map(player => (
                              <div
                                key={player.id}
                                className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${selectedPlayerForAnalytics === player.name ? 'bg-blue-50 border-blue-200' : ''}`}
                                onClick={() => {
                                  setSelectedPlayerForAnalytics(player.name);
                                  setPlayerNameSearch('');
                                  setTeamSearch('');
                                }}
                              >
                                <div className="font-medium">{player.name}</div>
                                <div className="text-sm text-gray-600">
                                  {player.current_team} • {player.position} • {(player.total_volume / 1000).toFixed(0)}K searches
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      )}
                      
                      {selectedPlayerForAnalytics && !(playerNameSearch || teamSearch) && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <span className="text-sm font-medium">Selected:</span>
                          <span className="text-sm">{selectedPlayerForAnalytics}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPlayerForAnalytics('')}
                            className="ml-auto h-6 px-2 text-xs"
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </div>

                    {selectedPlayerForAnalytics && (() => {
                      const selectedPlayer = filteredData.find(p => p.name === selectedPlayerForAnalytics);
                      if (!selectedPlayer) return null;

                      return (
                        <div className="space-y-6">
                          {/* Player Header */}
                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h2 className="text-2xl font-bold text-gray-900">{selectedPlayer.name}</h2>
                                <div className="space-y-2 mt-3 text-sm text-gray-600">
                                  <p><span className="font-medium">Team:</span> {selectedPlayer.current_team}</p>
                                  <p><span className="font-medium">Position:</span> {selectedPlayer.position}</p>
                                  <p><span className="font-medium">Age:</span> {selectedPlayer.age} years old</p>
                                  <p><span className="font-medium">Nationality:</span> {selectedPlayer.nationality}</p>
                                  <p><span className="font-medium">Primary Market:</span> {selectedPlayer.market}</p>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Opportunity Score:</span>
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                    {selectedPlayer.opportunity_score.toFixed(0)}/100
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Market Coverage:</span>
                                  <span className="text-sm font-bold">{selectedPlayer.market_count} markets</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Search Volume Stats */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                              <CardContent className="p-4">
                                <div className="text-center">
                                  <p className="text-sm text-gray-600">Total Search Volume</p>
                                  <p className="text-2xl font-bold text-blue-600">
                                    {(selectedPlayer.total_volume / 1000).toFixed(0)}K
                                  </p>
                                  <p className="text-xs text-gray-500">Monthly searches</p>
                                </div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <div className="text-center">
                                  <p className="text-sm text-gray-600">Player Volume</p>
                                  <p className="text-2xl font-bold text-green-600">
                                    {(selectedPlayer.player_volume / 1000).toFixed(0)}K
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {((selectedPlayer.player_volume / selectedPlayer.total_volume) * 100).toFixed(0)}% of total
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <div className="text-center">
                                  <p className="text-sm text-gray-600">Merch Volume</p>
                                  <p className="text-2xl font-bold text-purple-600">
                                    {(selectedPlayer.merch_volume / 1000).toFixed(0)}K
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {((selectedPlayer.merch_volume / selectedPlayer.total_volume) * 100).toFixed(0)}% of total
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Trend Analysis */}
                          <Card>
                            <CardHeader>
                              <CardTitle>Search Trend Analysis</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                  <div className="flex items-center gap-2 mb-4">
                                    {selectedPlayer.trend_percent >= 0 ? (
                                      <TrendingUp className="h-5 w-5 text-green-600" />
                                    ) : (
                                      <TrendingDown className="h-5 w-5 text-red-600" />
                                    )}
                                    <span className={`text-lg font-bold ${selectedPlayer.trend_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {selectedPlayer.trend_percent >= 0 ? '+' : ''}{selectedPlayer.trend_percent.toFixed(1)}%
                                    </span>
                                    <span className="text-sm text-gray-600">trend this month</span>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <div>
                                      <div className="flex justify-between text-sm mb-1">
                                        <span>Player Name Searches</span>
                                        <span>{((selectedPlayer.player_volume / selectedPlayer.total_volume) * 100).toFixed(0)}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-green-600 h-2 rounded-full" 
                                          style={{width: `${(selectedPlayer.player_volume / selectedPlayer.total_volume) * 100}%`}}
                                        ></div>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <div className="flex justify-between text-sm mb-1">
                                        <span>Merchandise Searches</span>
                                        <span>{((selectedPlayer.merch_volume / selectedPlayer.total_volume) * 100).toFixed(0)}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-purple-600 h-2 rounded-full" 
                                          style={{width: `${(selectedPlayer.merch_volume / selectedPlayer.total_volume) * 100}%`}}
                                        ></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  {/* Market Performance Ranking */}
                                  <h4 className="font-semibold mb-3">Market Performance Insights</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                                      <span>Primary Market:</span>
                                      <Badge variant="secondary">{selectedPlayer.market}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                      <span>Global Ranking:</span>
                                      <span className="font-mono">
                                        #{filteredData.sort((a, b) => b.total_volume - a.total_volume).findIndex(p => p.id === selectedPlayer.id) + 1} 
                                        <span className="text-gray-500"> of {filteredData.length}</span>
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                      <span>Position Ranking:</span>
                                      <span className="font-mono">
                                        #{filteredData.filter(p => p.position === selectedPlayer.position).sort((a, b) => b.total_volume - a.total_volume).findIndex(p => p.id === selectedPlayer.id) + 1}
                                        <span className="text-gray-500"> in {selectedPlayer.position}</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })()}

                    {!selectedPlayerForAnalytics && (
                      <div className="text-center py-12 text-gray-500">
                        <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-xl font-semibold mb-2">Select a Player</h3>
                        <p>Choose a player from the dropdown above to see detailed analytics</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Heatmap Tab */}
            <TabsContent value="heatmap">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>🌍 Player-Market Heatmap</CardTitle>
                      <p className="text-gray-600">Search volume intensity across players and markets</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Players:</span>
                      <Select value={heatmapPlayerCount.toString()} onValueChange={(value) => setHeatmapPlayerCount(parseInt(value))}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Generate heatmap data using all available markets and selected player count
                    const topPlayers = filteredData
                      .sort((a, b) => b.total_volume - a.total_volume)
                      .slice(0, heatmapPlayerCount);
                    
                    // Use marketsList to ensure we show all markets
                    const allMarkets = marketsList;
                    
                    // Create 2D array for heatmap
                    const heatmapZ = [];
                    
                    for (let i = 0; i < topPlayers.length; i++) {
                      const playerRow = [];
                      for (let j = 0; j < allMarkets.length; j++) {
                        if (allMarkets[j] === topPlayers[i].market) {
                          // Player's actual market gets full volume
                          playerRow.push(topPlayers[i].total_volume);
                        } else {
                          // Other markets get simulated lower volume
                          playerRow.push(Math.round(topPlayers[i].total_volume * (Math.random() * 0.4 + 0.1)));
                        }
                      }
                      heatmapZ.push(playerRow);
                    }

                    return isMounted && topPlayers.length > 0 && (
                      // @ts-expect-error - Plotly type definitions conflict
                      <Plot
                        data={[{
                          type: 'heatmap' as const,
                          z: heatmapZ,
                          x: allMarkets,
                          y: topPlayers.map(p => p.name),
                          colorscale: [
                            [0, '#22C55E'],     // Green (low/cool)
                            [0.3, '#65A30D'],   // Yellow-green
                            [0.6, '#F59E0B'],   // Orange
                            [1, '#DC2626']      // Red (high/hot)
                          ] as const,
                          hovertemplate: '<b>%{y}</b> in <b>%{x}</b><br>Volume: %{z:,.0f}<extra></extra>'
                        }]}
                        layout={{
                          height: Math.max(400, topPlayers.length * 30 + 150),
                          margin: { t: 20, r: 20, b: 100, l: 150 },
                          xaxis: { title: 'Market', tickangle: 45 },
                          yaxis: { title: 'Player' },
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          paper_bgcolor: 'rgba(0,0,0,0)'
                        }}
                        config={{ displayModeBar: false }}
                        style={{ width: '100%', height: `${Math.max(400, topPlayers.length * 30 + 150)}px` }}
                      />
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Comparisons Tab */}
            <TabsContent value="comparisons">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>⚖️ Player Comparison Tool</CardTitle>
                    <p className="text-gray-600">Compare 2-5 players across selected markets</p>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-3">Search and Select Players to Compare (2-5 players):</label>
                      
                      {/* Search Input with Dropdown */}
                      <div className="relative mb-4" onClick={(e) => e.stopPropagation()}>
                        <Input
                          type="text"
                          placeholder="Search players..."
                          value={playerSearchTerm}
                          onChange={(e) => {
                            setPlayerSearchTerm(e.target.value);
                            setShowPlayerDropdown(true);
                          }}
                          onFocus={() => setShowPlayerDropdown(true)}
                          className="w-full"
                        />
                        
                        {showPlayerDropdown && (
                          <div 
                            className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {(() => {
                              const searchResults = filteredData.filter(player =>
                                player.name.toLowerCase().includes(playerSearchTerm.toLowerCase())
                              );
                              
                              return searchResults.length > 0 ? (
                                searchResults.map(player => (
                                  <div
                                    key={player.id}
                                    className={`px-3 py-2 cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                                      selectedComparisonPlayers.includes(player.name) ? 'bg-blue-50' : ''
                                    } ${
                                      !selectedComparisonPlayers.includes(player.name) && selectedComparisonPlayers.length >= 5
                                        ? 'opacity-50 cursor-not-allowed'
                                        : ''
                                    }`}
                                    onClick={() => {
                                      if (selectedComparisonPlayers.includes(player.name)) {
                                        setSelectedComparisonPlayers(selectedComparisonPlayers.filter(p => p !== player.name));
                                      } else if (selectedComparisonPlayers.length < 5) {
                                        setSelectedComparisonPlayers([...selectedComparisonPlayers, player.name]);
                                      }
                                    }}
                                  >
                                    <div>
                                      <div className="font-medium">{player.name}</div>
                                      <div className="text-xs text-gray-500">
                                        {player.current_team} • {(player.total_volume / 1000).toFixed(0)}K searches
                                      </div>
                                    </div>
                                    {selectedComparisonPlayers.includes(player.name) && (
                                      <Badge variant="default" className="text-xs">Selected</Badge>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-gray-500 text-sm">No players found</div>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Selected Players Display */}
                      {selectedComparisonPlayers.length > 0 && (
                        <div className="mb-4">
                          <div className="text-sm font-medium mb-2">Selected Players:</div>
                          <div className="flex flex-wrap gap-2">
                            {selectedComparisonPlayers.map(playerName => (
                              <Badge 
                                key={playerName} 
                                variant="secondary" 
                                className="flex items-center gap-1"
                              >
                                {playerName}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 hover:bg-red-100"
                                  onClick={() => {
                                    setSelectedComparisonPlayers(selectedComparisonPlayers.filter(p => p !== playerName));
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 items-center">
                        <Badge variant="secondary">{selectedComparisonPlayers.length}/5 players selected</Badge>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedComparisonPlayers([]);
                            setPlayerSearchTerm("");
                            setShowPlayerDropdown(false);
                          }}
                        >
                          Clear All
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowPlayerDropdown(false)}
                        >
                          Close Search
                        </Button>
                      </div>
                    </div>
                    
                    {selectedComparisonPlayers.length >= 2 && (
                      <div className="space-y-4">
                        {/* Market Comparison Bar Chart */}
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Search Volume by Market</h3>
                          {(() => {
                            const comparisonPlayersData = filteredData.filter(p => 
                              selectedComparisonPlayers.includes(p.name)
                            );
                            
                            const plotData = selectedMarkets.map(market => ({
                              x: comparisonPlayersData.map(p => p.name),
                              y: comparisonPlayersData.map(p => {
                                if (market === p.market) {
                                  return p.total_volume;
                                } else {
                                  // Simulate volume in other markets
                                  return Math.round(p.total_volume * (Math.random() * 0.4 + 0.1));
                                }
                              }),
                              name: market,
                              type: 'bar' as const,
                              hovertemplate: '<b>%{x}</b><br>' + market + ': %{y:,.0f}<extra></extra>'
                            }));

                            return isMounted && (
                              // @ts-expect-error - Plotly type definitions conflict
                      <Plot
                                data={plotData}
                                layout={{
                                  height: 400,
                                  margin: { t: 20, r: 20, b: 80, l: 60 },
                                  xaxis: { title: 'Players' },
                                  yaxis: { title: 'Search Volume' },
                                  barmode: 'group' as const,
                                  plot_bgcolor: 'rgba(0,0,0,0)',
                                  paper_bgcolor: 'rgba(0,0,0,0)',
                                  legend: { orientation: 'h' as const, y: -0.2 }
                                }}
                                config={{ displayModeBar: false }}
                                style={{ width: '100%', height: '400px' }}
                              />
                            );
                          })()}
                        </div>

                        {/* Player Metrics Comparison */}
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Player Metrics Comparison</h3>
                          {(() => {
                            const comparisonPlayersData = filteredData.filter(p => 
                              selectedComparisonPlayers.includes(p.name)
                            );
                            
                            const metrics = [
                              { key: 'total_volume', name: 'Total Volume (K)', divisor: 1000 },
                              { key: 'trend_percent', name: 'Trend %', divisor: 1 },
                              { key: 'opportunity_score', name: 'Opportunity Score', divisor: 1 },
                              { key: 'market_count', name: 'Market Count', divisor: 1 }
                            ];

                            const plotData = metrics.map(metric => ({
                              x: comparisonPlayersData.map(p => p.name),
                              y: comparisonPlayersData.map(p => p[metric.key as keyof PlayerData] as number / metric.divisor),
                              name: metric.name,
                              type: 'bar' as const,
                              hovertemplate: '<b>%{x}</b><br>' + metric.name + ': %{y}<extra></extra>'
                            }));

                            return isMounted && (
                              // @ts-expect-error - Plotly type definitions conflict
                      <Plot
                                data={plotData}
                                layout={{
                                  height: 400,
                                  margin: { t: 20, r: 20, b: 80, l: 60 },
                                  xaxis: { title: 'Players' },
                                  yaxis: { title: 'Value' },
                                  barmode: 'group' as const,
                                  plot_bgcolor: 'rgba(0,0,0,0)',
                                  paper_bgcolor: 'rgba(0,0,0,0)',
                                  legend: { orientation: 'h' as const, y: -0.2 }
                                }}
                                config={{ displayModeBar: false }}
                                style={{ width: '100%', height: '400px' }}
                              />
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {selectedComparisonPlayers.length < 2 && (
                      <div className="text-center py-12 text-gray-500">
                        <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-xl font-semibold mb-2">Select Players to Compare</h3>
                        <p>Choose at least 2 players to see the comparison charts</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Opportunities Tab */}
            <TabsContent value="opportunities">
              <div className="space-y-6">
                {/* Opportunity Score Methodology */}
                <Card>
                  <CardHeader>
                    <CardTitle>🎯 Opportunity Score Methodology</CardTitle>
                    <p className="text-gray-600">Understanding how opportunity scores are calculated from key performance metrics</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">50%</div>
                          <div className="text-sm text-blue-800 font-medium">Total Volume</div>
                          <div className="text-xs text-gray-600">Base interest level</div>
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">30%</div>
                          <div className="text-sm text-green-800 font-medium">Growth Trend</div>
                          <div className="text-xs text-gray-600">Momentum indicator</div>
                        </div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">20%</div>
                          <div className="text-sm text-purple-800 font-medium">Market Reach</div>
                          <div className="text-xs text-gray-600">Number of global markets</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p className="text-sm text-gray-700">
                        <strong>Formula:</strong> Opportunity Score = (Volume × 0.5) + (Trend × 0.3) + (Markets × 0.2)
                        <br />
                        <strong>Note:</strong> All players receive opportunity scores based on their market performance.
                      </p>
                      <div className="text-xs text-gray-600 space-y-2">
                        <p>
                          <strong>Market Reach Definition:</strong> The number of different geographical markets where the player has significant search volume presence.
                        </p>
                        <p>
                          <strong>Significance Threshold:</strong> A market is considered &ldquo;significant&rdquo; if the player receives at least 5,000+ monthly searches in that region, representing meaningful fan interest and commercial potential.
                        </p>
                        <p>
                          <strong>Example:</strong> A player with 50K searches in UK, 30K in US, 15K in Germany, 8K in Spain, and 6K in Italy = 5 markets (higher global appeal vs. a player with 100K searches only in their home country = 1 market).
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Comprehensive Opportunities Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>📊 Comprehensive Opportunity Analysis</CardTitle>
                    <p className="text-gray-600">Detailed breakdown of all metrics contributing to opportunity scores</p>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-8">#</TableHead>
                            <TableHead>Player</TableHead>
                            <TableHead>Team</TableHead>
                            <TableHead>Age</TableHead>
                            <TableHead>Total Volume</TableHead>
                            <TableHead>Player Volume</TableHead>
                            <TableHead>Merch Volume</TableHead>
                            <TableHead>Growth Trend</TableHead>
                            <TableHead>Markets</TableHead>
                            <TableHead>Opportunity Score</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredData
                            .sort((a, b) => b.opportunity_score - a.opportunity_score)
                            .slice(0, 15)
                            .map((player, index) => (
                              <TableRow key={player.id} className={index < 3 ? 'bg-green-50' : ''}>
                                <TableCell>
                                  <div className={`text-center font-bold ${index < 3 ? 'text-green-600' : 'text-gray-600'}`}>
                                    #{index + 1}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{player.name}</div>
                                    <div className="text-sm text-gray-500">{player.nationality}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div className="font-medium">{player.current_team}</div>
                                    <div className="text-gray-500">{player.position}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={player.age <= 23 ? 'default' : player.age <= 27 ? 'secondary' : 'outline'}>
                                    {player.age}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="text-right">
                                    <div className="font-medium">{(player.total_volume / 1000).toFixed(0)}K</div>
                                    <div className="text-xs text-gray-500">Monthly</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-right">
                                    <div className="font-medium">{(player.player_volume / 1000).toFixed(0)}K</div>
                                    <div className="text-xs text-gray-500">
                                      {((player.player_volume / player.total_volume) * 100).toFixed(0)}%
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-right">
                                    <div className="font-medium">{(player.merch_volume / 1000).toFixed(0)}K</div>
                                    <div className="text-xs text-gray-500">
                                      {((player.merch_volume / player.total_volume) * 100).toFixed(0)}%
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-end">
                                    {player.trend_percent >= 0 ? 
                                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" /> : 
                                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                                    }
                                    <span className={`font-medium ${player.trend_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {player.trend_percent >= 0 ? '+' : ''}{player.trend_percent.toFixed(1)}%
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-center">
                                    <Badge variant="outline">{player.market_count}</Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-right">
                                    <div className={`text-xl font-bold ${
                                      player.opportunity_score >= 80 ? 'text-green-600' :
                                      player.opportunity_score >= 70 ? 'text-blue-600' :
                                      player.opportunity_score >= 60 ? 'text-orange-600' : 'text-gray-600'
                                    }`}>
                                      {player.opportunity_score.toFixed(0)}
                                    </div>
                                    <div className="text-xs text-gray-500">/100</div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}