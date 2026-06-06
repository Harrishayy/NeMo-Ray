import { NextRequest, NextResponse } from 'next/server';
import { filterSitefinderPayload, loadSitefinderPayload } from '@/lib/data/sitefinder';
import type { TransmissionType } from '@/types/sitefinder';

const TRANSMISSION_TYPES = new Set<TransmissionType>(['GSM', 'UMTS', 'TETRA', 'GSM-R', 'LTE', 'UNKNOWN']);

export function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const operator = search.get('operator') || undefined;
  const transtypeParam = search.get('transtype')?.toUpperCase();
  const transtype = TRANSMISSION_TYPES.has(transtypeParam as TransmissionType)
    ? (transtypeParam as TransmissionType)
    : undefined;
  const limitParam = Number(search.get('limit'));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.floor(limitParam) : undefined;

  return NextResponse.json(
    filterSitefinderPayload(loadSitefinderPayload(), {
      operator,
      transtype,
      limit,
    })
  );
}
