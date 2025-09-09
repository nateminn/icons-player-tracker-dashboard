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

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: search_volume, player_data, or test_connection' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('DataForSEO API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch data from DataForSEO',
        details: error.message,
        success: false
      },
      { status: 500 }
    );
  }
}