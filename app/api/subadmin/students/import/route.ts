import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    const hasValidExtension = /\.(xlsx|xls)$/i.test(file.name);
    if (!allowedTypes.includes(file.type) && !hasValidExtension) {
      return NextResponse.json({ error: 'Only .xlsx or .xls files are allowed' }, { status: 400 });
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json({ error: 'Excel file must be 5MB or smaller' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];

    if (!rawData || rawData.length === 0) {
      return NextResponse.json({ error: 'Excel file is empty or missing headers' }, { status: 400 });
    }

    // Intelligent header row detection (scan first 10 rows for student column markers)
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(rawData.length, 10); i++) {
      const row = rawData[i];
      if (Array.isArray(row)) {
        const hasMarker = row.some((cell) => {
          const s = String(cell || '').trim().toLowerCase();
          return (
            s === 'student name' ||
            s === 'name' ||
            s === 'student code' ||
            s === 'gr sr no.' ||
            s === 'gr no.' ||
            s === 'admission date'
          );
        });
        if (hasMarker) {
          headerRowIndex = i;
          break;
        }
      }
    }

    const headerRow = (rawData[headerRowIndex] || []) as any[];
    const headers = headerRow.map((h) => (h !== null && h !== undefined ? String(h).trim() : ''));
    const rows = rawData.slice(headerRowIndex + 1);

    const maxRows = 2000;
    if (rows.length > maxRows) {
      return NextResponse.json({ error: `Please import ${maxRows} students or fewer at one time` }, { status: 400 });
    }

    // Map rows to structured objects (filtering out completely empty rows)
    const students = rows
      .filter((row: any) => Array.isArray(row) && row.some((cell) => cell !== null && cell !== undefined && String(cell).trim().length > 0))
      .map((row: any) => {
        const student: any = {};
        headers.forEach((header, index) => {
          if (header) {
            student[header] = row[index] !== undefined ? row[index] : null;
          }
        });
        return student;
      });

    return NextResponse.json({ 
      headers: headers.filter((h) => h && h.length > 0), 
      students 
    });

  } catch (error) {
    console.error('Excel import error:', error);
    return NextResponse.json({ error: 'Failed to process Excel file' }, { status: 500 });
  }
}
