import { NextRequest, NextResponse } from 'next/server';
import { dataStorageService } from '@/lib/data-storage-service';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (id) {
      // Get specific stored result
      const result = dataStorageService.getStoredResult(id);
      if (!result) {
        return NextResponse.json(
          { error: 'Stored result not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: result });
    } else {
      // Get all stored results
      const results = dataStorageService.getAllStoredResults();
      return NextResponse.json({ 
        success: true, 
        data: results,
        storageDirectory: dataStorageService.getStorageDirectory()
      });
    }
  } catch (error: unknown) {
    console.error('Stored data API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve stored data',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}