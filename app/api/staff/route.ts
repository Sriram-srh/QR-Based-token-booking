import { NextRequest } from 'next/server';
import { GET as adminGet, PATCH as adminPatch, POST as adminPost } from '@/app/api/admin/staff/route';

// Compatibility alias for direct verification calls like /api/staff
export async function GET(request: NextRequest) {
  return adminGet(request);
}

export async function POST(request: NextRequest) {
  return adminPost(request);
}

export async function PATCH(request: NextRequest) {
  return adminPatch(request);
}
