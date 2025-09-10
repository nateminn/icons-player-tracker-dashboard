import { NextRequest, NextResponse } from 'next/server';
import { dataForSEOService } from '@/lib/dataforseo-service';

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json();

    switch (action) {
      case 'search_volume':
        const { keywords, locationCode, languageCode } = params;
        
        if (!keywords || !Array.isArray(keywords)) {
          return NextResponse.json(
            { error: 'Keywords array is required' },
            { status: 400 }
          );
        }

        const results = await dataForSEOService.getKeywordSearchVolume(
          keywords,
          locationCode,
          languageCode
        );

        return NextResponse.json({
          success: true,
          data: results,
          count: results.length
        });

      case 'player_data':
        const { playerName, locationCodes } = params;
        
        if (!playerName) {
          return NextResponse.json(
            { error: 'Player name is required' },
            { status: 400 }
          );
        }

        const playerData = await dataForSEOService.getPlayerKeywordData(
          playerName,
          locationCodes
        );

        return NextResponse.json({
          success: true,
          data: playerData
        });

      case 'test_connection':
        // Test connection with a simple keyword
        const testResults = await dataForSEOService.getKeywordSearchVolume(['football']);
        
        return NextResponse.json({
          success: true,
          message: 'DataForSEO connection successful',
          testData: testResults
        });

      case 'run_micro_test':
        // Import the Google Ads merch service
        const { googleAdsMerchService } = await import('@/lib/google-ads-merch-service');
        
        const { dateFrom, dateTo, useSandbox } = params;
        const microTestResults = await googleAdsMerchService.runMicroTest(dateFrom, dateTo, useSandbox);
        
        return NextResponse.json({
          success: true,
          message: `Micro test completed successfully using ${useSandbox ? 'Sandbox' : 'Live'} API`,
          data: microTestResults
        });

      case 'run_full_production_test':
        // Import the Google Ads merch service for full production run
        const { googleAdsMerchService: prodService } = await import('@/lib/google-ads-merch-service');
        
        const { dateFrom: prodDateFrom, dateTo: prodDateTo } = params;
        const productionResults = await prodService.runFullProductionTest(prodDateFrom, prodDateTo);
        
        return NextResponse.json({
          success: true,
          message: 'Full production test completed successfully',
          data: productionResults
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: search_volume, player_data, test_connection, or run_micro_test' },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    console.error('DataForSEO API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch data from DataForSEO',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}