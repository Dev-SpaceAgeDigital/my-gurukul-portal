import { NextResponse } from 'next/server';
import { generateTotpSetup } from '@/lib/auth/totp2fa';

export async function POST(req: Request) {
  try {
    const { email, role } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const serviceName = role ? `EduTrust OS (${role})` : 'EduTrust OS';
    const setup = await generateTotpSetup(email, serviceName);

    return NextResponse.json({
      success: true,
      secret: setup.secret,
      qrCodeUrl: setup.qrCodeUrl,
      backupCodes: setup.backupCodes,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
