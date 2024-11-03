// src/app/api/test/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('GET request received', request);
  
  return NextResponse.json(
    { message: 'API endpoint working' },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    }
  );
}

export async function POST() {
  return NextResponse.json({ message: 'POST received' });
}