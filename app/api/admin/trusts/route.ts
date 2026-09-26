import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

// GET all trusts
export async function GET() {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await query('SELECT * FROM "Trust" ORDER BY "createdAt" DESC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Fetch trusts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new trust
export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      trustName, 
      registrationNo, 
      establishmentYear, 
      presidentName, 
      presidentNo, 
      trusteesName, 
      trusteesNo 
    } = body;

    if (!trustName || !registrationNo) {
      return NextResponse.json({ error: 'Name and Registration No are required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO "Trust" 
      ("trustName", "registrationNo", "establishmentYear", "presidentName", "presidentNo", "trusteesName", "trusteesNo", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
      RETURNING *`,
      [
        trustName, 
        registrationNo, 
        establishmentYear || null, 
        presidentName || null, 
        presidentNo || null, 
        trusteesName || [], 
        trusteesNo || []
      ]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Create trust error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A trust with this registration number already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update trust
export async function PUT(request: Request) {
    try {
      const session = await getSessionFromCookies('SUPER_ADMIN');
      if (!session || session.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
  
      const body = await request.json();
      const { 
        id,
        trustName, 
        registrationNo, 
        establishmentYear, 
        presidentName, 
        presidentNo, 
        trusteesName, 
        trusteesNo 
      } = body;
  
      if (!id || !trustName || !registrationNo) {
        return NextResponse.json({ error: 'ID, Name and Registration No are required' }, { status: 400 });
      }
  
      const result = await query(
        `UPDATE "Trust" SET 
        "trustName" = $1, 
        "registrationNo" = $2, 
        "establishmentYear" = $3, 
        "presidentName" = $4, 
        "presidentNo" = $5, 
        "trusteesName" = $6, 
        "trusteesNo" = $7, 
        "updatedAt" = NOW() 
        WHERE id = $8 RETURNING *`,
        [
          trustName, 
          registrationNo, 
          establishmentYear || null, 
          presidentName || null, 
          presidentNo || null, 
          trusteesName || [], 
          trusteesNo || [],
          id
        ]
      );
  
      if (result.rowCount === 0) {
          return NextResponse.json({ error: 'Trust not found' }, { status: 404 });
      }

      return NextResponse.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update trust error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE trust
export async function DELETE(request: Request) {
    try {
      const session = await getSessionFromCookies('SUPER_ADMIN');
      if (!session || session.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
  
      const { id } = await request.json();
      if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  
      await query('DELETE FROM "Trust" WHERE id = $1', [id]);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Delete trust error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
