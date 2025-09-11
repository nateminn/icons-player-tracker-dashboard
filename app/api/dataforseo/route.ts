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

      case 'collect_all_data':
        // Single comprehensive data collection with all players, markets, and merch terms
        const { googleAdsMerchService: collectService } = await import('@/lib/google-ads-merch-service');
        const { dataStorageService } = await import('@/lib/data-storage-service');
        
        const { dateFrom: collectDateFrom, dateTo: collectDateTo } = params;
        const collectResults = await collectService.runFullProductionTest(collectDateFrom, collectDateTo);
        
        // Get the file path from the storage service
        const storagePath = dataStorageService.getStorageDirectory();
        const latestFile = `${collectResults.testType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.json`;
        const filePath = `${storagePath}/${latestFile}`;
        
        return NextResponse.json({
          success: true,
          message: 'Data collection completed successfully',
          data: {
            ...collectResults,
            filePath: filePath
          }
        });

      case 'run_labs_micro_test':
        // Import the DataForSEO Labs service (90% cheaper)
        const { dataForSEOLabsService } = await import('@/lib/dataforseo-labs-service');
        
        const { dateFrom: labsDateFrom, dateTo: labsDateTo, useSandbox: labsUseSandbox } = params;
        const labsMicroResults = await dataForSEOLabsService.runMicroTest(labsDateFrom, labsDateTo, labsUseSandbox);
        
        return NextResponse.json({
          success: true,
          message: `Labs API micro test completed successfully - cost: $${labsMicroResults.actualCost.toFixed(3)}`,
          data: labsMicroResults
        });

      case 'run_labs_full_production_test':
        // Import the DataForSEO Labs service for full production run (90% cheaper)
        const { dataForSEOLabsService: labsProdService } = await import('@/lib/dataforseo-labs-service');
        
        const { dateFrom: labsProdDateFrom, dateTo: labsProdDateTo } = params;
        const labsProductionResults = await labsProdService.runFullProductionTest(labsProdDateFrom, labsProdDateTo);
        
        return NextResponse.json({
          success: true,
          message: `Labs API production test completed successfully - cost: $${labsProductionResults.actualCost.toFixed(2)} (saved ~$16.86!)`,
          data: labsProductionResults
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: search_volume, player_data, test_connection, run_micro_test, run_labs_micro_test, or run_labs_full_production_test' },
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