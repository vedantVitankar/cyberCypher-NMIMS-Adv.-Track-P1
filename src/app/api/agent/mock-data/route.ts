// Mock Data API - Generate test data for demonstration
import { NextRequest, NextResponse } from 'next/server';
import { generateMockData, clearMockData, simulateMigrationCrisis } from '@/lib/agent/mock-data';

// Generate mock data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    if (body.action === 'clear') {
      await clearMockData();
      return NextResponse.json({
        success: true,
        message: 'Mock data cleared',
      });
    }

    if (body.action === 'crisis') {
      const { data: merchants } = await (await import('@/lib/supabase')).supabase
        .from('merchants')
        .select('id')
        .limit(5);

      if (merchants && merchants.length > 0) {
        await simulateMigrationCrisis(merchants.map(m => m.id));
        return NextResponse.json({
          success: true,
          message: 'Migration crisis simulated',
          affected_merchants: merchants.length,
        });
      } else {
        return NextResponse.json(
          { error: 'No merchants found. Generate mock data first.' },
          { status: 400 }
        );
      }
    }

    // Default: generate mock data
    const result = await generateMockData({
      merchants: body.merchants || 8,
      tickets: body.tickets || 15,
      apiErrors: body.apiErrors || 20,
      webhookFailures: body.webhookFailures || 10,
      checkoutFailures: body.checkoutFailures || 12,
    });

    return NextResponse.json({
      success: true,
      message: 'Mock data generated',
      ...result,
    });
  } catch (error) {
    console.error('Mock data error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
