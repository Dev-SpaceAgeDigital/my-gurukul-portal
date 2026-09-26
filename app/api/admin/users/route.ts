import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { getSessionFromCookies } from '@/lib/auth';

// GET all users (Superadmin only)
export async function GET() {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await query('SELECT id, email, name, role, "createdAt" FROM "User" ORDER BY "createdAt" DESC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new user (Superadmin only)
export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { email, password, name, role } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    await query(
      'INSERT INTO "User" (email, password, name, role, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW())',
      [email, hashedPassword, name, role]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Create user error:', error);
    if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE user (Superadmin only)
export async function DELETE(request: Request) {
    try {
      const session = await getSessionFromCookies('SUPER_ADMIN');
      if (!session || session.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
  
      const { id } = await request.json();
      if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

      if (id === session.userId) {
          return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
      }
  
      await query('DELETE FROM "User" WHERE id = $1', [id]);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Delete user error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
