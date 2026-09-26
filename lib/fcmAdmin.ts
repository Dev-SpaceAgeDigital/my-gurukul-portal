import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import pool from '@/lib/db';

if (!getApps().length) {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (privateKey && clientEmail && projectId) {
    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (err) {
      console.error('Firebase Admin init error:', err);
    }
  }
}

export async function sendPushToUsers(
  userIds: string[], 
  title: string, 
  body: string, 
  link?: string | null,
  iconUrl?: string | null
) {
  try {
    if (!getApps().length || !userIds || userIds.length === 0) return;

    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "UserFcmToken" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT NOT NULL,
        "role" VARCHAR(50) NOT NULL,
        token TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Fetch tokens for target users
    const res = await pool.query(
      'SELECT DISTINCT token FROM "UserFcmToken" WHERE "userId" = ANY($1)',
      [userIds]
    );

    const tokens: string[] = res.rows.map((r) => r.token).filter(Boolean);
    if (tokens.length === 0) return;

    const finalIcon = iconUrl || '/my-gurukul.png';

    const messaging = getMessaging();
    await messaging.sendEachForMulticast({
      tokens,
      notification: { 
        title, 
        body,
        imageUrl: finalIcon,
      },
      webpush: {
        notification: {
          title,
          body,
          icon: finalIcon,
          badge: finalIcon,
        },
      },
      data: { 
        link: link || '/',
        title,
        body,
        icon: finalIcon,
      },
    });
  } catch (error) {
    console.error('Push notification send error:', error);
  }
}
