import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbMonitor, { checkMongoDbHealth } from '@/lib/db-monitor';

// API route to check database status - admin only
export async function GET() {
  try {
    // Get the current session
    const session = await auth();
    
    // Only allow admin users to access this endpoint
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    // Get current database status
    const dbStatus = dbMonitor.getDbStatus();
    
    // Check current health if MongoDB URI is available
    let currentHealth = false;
    if (process.env.MONGODB_URI) {
      currentHealth = await checkMongoDbHealth(process.env.MONGODB_URI);
    }
    
    return NextResponse.json({
      status: 'success',
      data: {
        ...dbStatus,
        currentHealth,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error: any) {
    console.error('Error in DB status API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get database status',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
