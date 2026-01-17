import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for MVP (replace with Redis/DB in production)
const codeStore = new Map<string, { code?: string; files?: Record<string, any>; version: number; timestamp: number }>();

// Clean up old entries (older than 1 hour)
function cleanupOldEntries() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [key, value] of codeStore.entries()) {
    if (value.timestamp < oneHourAgo) {
      codeStore.delete(key);
    }
  }
}

// POST: Store code for preview
export async function POST(request: NextRequest) {
  try {
    const { taskId, code, files } = await request.json();
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId is required' },
        { status: 400 }
      );
    }
    
    // Clean up periodically
    if (Math.random() < 0.1) {
      cleanupOldEntries();
    }
    
    // Get current version or start at 1
    const existing = codeStore.get(taskId);
    const version = existing ? existing.version + 1 : 1;
    
    // Store the code and files
    codeStore.set(taskId, {
      code,
      files,
      version,
      timestamp: Date.now(),
    });
    
    return NextResponse.json({ 
      success: true, 
      taskId, 
      version,
      previewUrl: `/preview/${taskId}?v=${version}`
    });
  } catch (error) {
    console.error('Preview API error:', error);
    return NextResponse.json(
      { error: 'Failed to store code' },
      { status: 500 }
    );
  }
}

// GET: Retrieve stored code
export async function GET(request: NextRequest) {
  try {
    const taskId = request.nextUrl.searchParams.get('taskId');
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId is required' },
        { status: 400 }
      );
    }
    
    const stored = codeStore.get(taskId);
    
    if (!stored) {
      return NextResponse.json(
        { error: 'Code not found for taskId' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      code: stored.code,
      files: stored.files,
      version: stored.version,
    });
  } catch (error) {
    console.error('Preview API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve code' },
      { status: 500 }
    );
  }
}
