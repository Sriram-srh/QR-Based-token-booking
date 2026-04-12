import { NextRequest, NextResponse } from 'next/server';
import { createStudent, getActiveStudents } from '@/lib/db-service';
import { AuthError, requireRole } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    requireRole(request, 'admin');
    const rows = await getActiveStudents();

    const students = rows.map((row: any) => ({
      id: row.id,
      user_id: row.users?.id,
      name: row.users?.name || 'Unknown',
      email: row.users?.email || '',
      registerNumber: row.register_number || '',
      hostel: row.hostel || '',
      room: row.room || '',
      phone: row.phone || '',
      photoUrl: row.photo_url || '/placeholder-student.jpg',
    }));

    return NextResponse.json({ success: true, students });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[v0] Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    requireRole(request, 'admin');
    const { name, email, registerNumber, hostel, room, phone, photoUrl } = await request.json();

    // Validate required fields
    if (!name || !email || !registerNumber || !hostel || !room) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, registerNumber, hostel, room' },
        { status: 400 }
      );
    }

    // Create student with automatic user account
    const result = await createStudent(
      name,
      email,
      registerNumber,
      hostel,
      room,
      phone || '',
      photoUrl || undefined
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create student' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Student created successfully with login credentials',
        student: result.student,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[v0] Error in student creation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
