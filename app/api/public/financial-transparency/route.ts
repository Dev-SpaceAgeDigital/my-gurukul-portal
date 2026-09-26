import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

type AllocationKey = 'scholarships' | 'salaries' | 'infrastructure' | 'administration' | 'initiatives';

const allocationMeta: Record<AllocationKey, { iconKey: string; label: string; color: string; desc: string }> = {
  scholarships: {
    iconKey: 'IconBackpack',
    label: 'Student Scholarships',
    color: '#1A6B5A',
    desc: 'Tuition, books, uniform and stationery for eligible students',
  },
  salaries: {
    iconKey: 'IconTeacher',
    label: 'Teacher Salaries',
    color: '#F5A623',
    desc: 'Qualified, experienced faculty retained and fairly paid',
  },
  infrastructure: {
    iconKey: 'IconConstruction',
    label: 'Infrastructure',
    color: '#2E8B6E',
    desc: 'Classrooms, labs, library and facility maintenance',
  },
  administration: {
    iconKey: 'IconClipboard',
    label: 'Administration',
    color: '#9CA3AF',
    desc: 'Office operations, compliance, auditing and management',
  },
  initiatives: {
    iconKey: 'IconPlant',
    label: 'New Initiatives',
    color: '#7C3AED',
    desc: 'Digital classrooms, new school planning and community welfare',
  },
};

const fallbackPercent: Record<AllocationKey, number> = {
  scholarships: 45,
  salaries: 28,
  infrastructure: 15,
  administration: 7,
  initiatives: 5,
};

function toNumber(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function classifyExpense(type: string, title: string, description: string): AllocationKey {
  const text = `${type} ${title} ${description}`.toLowerCase();
  if (text.includes('salary') || text.includes('teacher') || text.includes('faculty') || text.includes('staff') || text.includes('payroll')) return 'salaries';
  if (text.includes('admin') || text.includes('office') || text.includes('audit') || text.includes('compliance') || text.includes('management')) return 'administration';
  if (text.includes('digital') || text.includes('initiative') || text.includes('community') || text.includes('welfare') || text.includes('planning') || text.includes('event')) return 'initiatives';
  if (text.includes('scholar') || text.includes('tuition') || text.includes('books') || text.includes('uniform') || text.includes('stationery')) return 'scholarships';
  return 'infrastructure';
}

export async function GET() {
  try {
    const totals: Record<AllocationKey, number> = {
      scholarships: 0,
      salaries: 0,
      infrastructure: 0,
      administration: 0,
      initiatives: 0,
    };
    const transactionTotals: Record<AllocationKey, number> = {
      scholarships: 0,
      salaries: 0,
      infrastructure: 0,
      administration: 0,
      initiatives: 0,
    };

    const studentAidRes = await pool.query('SELECT COALESCE(SUM("aidPaidAmount"), 0) as total FROM "Student"');
    const totalStudentAid = toNumber(studentAidRes.rows[0]?.total);

    const transactionTableExistsRes = await pool.query(`SELECT to_regclass('"Transaction"') as table_name`);
    const hasTransactionTable = Boolean(transactionTableExistsRes.rows[0]?.table_name);

    const expenseRes = hasTransactionTable
      ? await pool.query(`
          WITH transaction_expense_payments AS (
            SELECT "referenceId", COALESCE(SUM(amount), 0) as paid
            FROM "Transaction"
            WHERE status = 'SUCCESS' AND "referenceId" IS NOT NULL
            GROUP BY "referenceId"
          )
          SELECT
            e.type,
            e.title,
            e.description,
            GREATEST(COALESCE(e."paidAmount", 0) - COALESCE(t.paid, 0), 0) as amount
          FROM "Expense" e
          LEFT JOIN transaction_expense_payments t ON t."referenceId" = e.id::text
          WHERE COALESCE(e."paidAmount", 0) > 0
        `)
      : await pool.query(`
          SELECT type, title, description, COALESCE("paidAmount", 0) as amount
          FROM "Expense"
          WHERE COALESCE("paidAmount", 0) > 0
        `);

    expenseRes.rows.forEach((row) => {
      totals[classifyExpense(row.type || '', row.title || '', row.description || '')] += toNumber(row.amount);
    });

    if (hasTransactionTable) {
      const transactionRes = await pool.query(`
        SELECT type, COALESCE(SUM(amount), 0) as amount
        FROM "Transaction"
        WHERE status = 'SUCCESS'
        GROUP BY type
      `);

      transactionRes.rows.forEach((row) => {
        const type = String(row.type || '').toUpperCase();
        const amount = toNumber(row.amount);
        if (['ZAKAT', 'LILLAH', 'SADKA', 'SADAQAH', 'FINANCIAL_AID'].includes(type)) transactionTotals.scholarships += amount;
        else if (type === 'CONSTRUCTION') transactionTotals.infrastructure += amount;
        else if (type === 'EVENT' || type === 'CSR') transactionTotals.initiatives += amount;
      });
    }

    totals.scholarships += Math.max(totalStudentAid - transactionTotals.scholarships, 0);
    totals.scholarships += transactionTotals.scholarships;
    totals.infrastructure += transactionTotals.infrastructure;
    totals.initiatives += transactionTotals.initiatives;

    const totalSpent = Object.values(totals).reduce((sum, amount) => sum + amount, 0);
    const keys = Object.keys(allocationMeta) as AllocationKey[];
    const calculatedPercents = totalSpent > 0
      ? keys.reduce<Record<AllocationKey, number>>((acc, key) => {
          acc[key] = Math.floor((totals[key] / totalSpent) * 100);
          return acc;
        }, {} as Record<AllocationKey, number>)
      : fallbackPercent;

    if (totalSpent > 0) {
      const assigned = Object.values(calculatedPercents).reduce((sum, percent) => sum + percent, 0);
      const remaining = 100 - assigned;
      const rankedByRemainder = [...keys].sort((a, b) => {
        const aRemainder = ((totals[a] / totalSpent) * 100) - calculatedPercents[a];
        const bRemainder = ((totals[b] / totalSpent) * 100) - calculatedPercents[b];
        return bRemainder - aRemainder;
      });

      for (let i = 0; i < remaining; i += 1) {
        calculatedPercents[rankedByRemainder[i % rankedByRemainder.length]] += 1;
      }
    }

    const allocations = keys.map((key) => {
      const amount = totals[key];
      const percent = calculatedPercents[key];
      return {
        ...allocationMeta[key],
        percent,
        pct: percent,
        amount,
        amountSpent: amount > 0 ? `₹${amount.toLocaleString('en-IN')}` : null,
      };
    });

    return NextResponse.json({
      success: true,
      allocations,
      summary: {
        totalStudentAidPaid: totals.scholarships,
        totalInfrastructureSpent: totals.infrastructure,
        totalSpent,
        auditedBy: 'Vadodara Charity Commissioner Office',
        complianceYear: '2024-25',
      },
    }, { headers });
  } catch (error: any) {
    console.error('Error fetching financial transparency data:', error);
    return NextResponse.json({ error: 'Failed to fetch financial transparency data' }, { status: 500, headers });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers });
}
