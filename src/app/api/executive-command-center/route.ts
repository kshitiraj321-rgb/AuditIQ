import { NextResponse } from 'next/server';
import { getMockExecutiveProfile } from '@/lib/executiveMockData';

export async function GET() {
  return NextResponse.json(getMockExecutiveProfile());
}
