import { NextRequest, NextResponse } from 'next/server';

// In-memory game state (in production, use a database)
let gameState: any = null;

export async function GET() {
  return NextResponse.json({ gameState });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameState: newGameState } = body;
    
    if (newGameState) {
      gameState = newGameState;
      return NextResponse.json({ success: true, gameState });
    }
    
    return NextResponse.json({ success: false, error: 'Invalid game state' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}

