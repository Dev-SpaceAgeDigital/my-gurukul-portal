import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET all subadmins (with School info)
export async function GET() {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await query(`
      SELECT u.id, u.name, u.email, u."phoneNo", u.address, u.relation, u."schoolId", s."schoolName"
      FROM "User" u
      LEFT JOIN "School" s ON u."schoolId" = s.id
      WHERE u.role = 'SUB_ADMIN'
      ORDER BY u."createdAt" DESC
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Fetch subadmins error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new subadmin
export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      name, 
      email, 
      password, 
      phoneNo, 
      address, 
      schoolId, 
      relation 
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, Email, and Password are required' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO "User" 
      (id, name, email, password, role, "phoneNo", address, "schoolId", relation, "createdAt", "updatedAt") 
      VALUES (gen_random_uuid(), $1, $2, $3, 'SUB_ADMIN', $4, $5, $6, $7, NOW(), NOW()) 
      RETURNING id, name, email, "phoneNo", address, relation, "schoolId"`,
      [name, email, hashedPassword, phoneNo || null, address || null, schoolId || null, relation || null]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Create subadmin error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update subadmin
export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      id,
      name, 
      email, 
      password, 
      phoneNo, 
      address, 
      schoolId, 
      relation 
    } = body;

    if (!id || !name || !email) {
      return NextResponse.json({ error: 'ID, Name, and Email are required' }, { status: 400 });
    }

    let updateQuery = `
      UPDATE "User" SET 
      name = $1, 
      email = $2, 
      "phoneNo" = $3, 
      address = $4, 
      "schoolId" = $5, 
      relation = $6, 
      "updatedAt" = NOW()
    `;
    const params = [name, email, phoneNo || null, address || null, schoolId || null, relation || null];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += `, password = $7 WHERE id = $8`;
      params.push(hashedPassword, id);
    } else {
      updateQuery += ` WHERE id = $7`;
      params.push(id);
    }

    const result = await query(updateQuery + ' RETURNING *', params);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Subadmin not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Update subadmin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE subadmin
export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await query('DELETE FROM "User" WHERE id = $1 AND role = "SUB_ADMIN"', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete subadmin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
