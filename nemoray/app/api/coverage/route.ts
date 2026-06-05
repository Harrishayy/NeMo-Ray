import { NextRequest, NextResponse } from 'next/server';
import { generateRadioMap, LONDON_DEAD_ZONES } from '@/lib/data/mockSionna';
import { generateMastSites } from '@/lib/data/mockCellTowers';
import { generateProposals } from '@/lib/data/mockProposals';

export async function GET(request: NextRequest) {
  const seed = Number(request.nextUrl.searchParams.get('seed') ?? '42') || 42;

  const radioMap = generateRadioMap(seed);
  const mastSites = generateMastSites(50, seed);
  const deadZones = LONDON_DEAD_ZONES;
  const proposals = generateProposals(deadZones, seed);

  return NextResponse.json({ radioMap, mastSites, deadZones, proposals });
}
