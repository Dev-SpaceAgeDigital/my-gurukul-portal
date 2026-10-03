import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'edutrust-media';

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export const sanitizePath = (segment: string) =>
  segment.replace(/[^a-zA-Z0-9._\-]/g, '_').replace(/_+/g, '_').toLowerCase();

export type MediaCategory =
  | 'branding'
  | 'students'
  | 'alumni'
  | 'memories'
  | 'community-posts'
  | 'causes'
  | 'general';

export interface MultiTenantStoragePathOptions {
  trustId: string;
  schoolId?: string | null;
  academicYear?: string | null;
  category?: MediaCategory;
  fileName?: string;
}

/**
 * Builds standard Trust -> School -> Academic Year hierarchical path:
 * e.g. trusts/trust_01/schools/school_01/years/2024-2025/alumni/avatar_123.webp
 */
export function buildMultiTenantStoragePath({
  trustId,
  schoolId,
  academicYear,
  category = 'branding',
  fileName = 'media.webp',
}: MultiTenantStoragePathOptions): string {
  const cleanTrust = sanitizePath(trustId);
  const baseName = sanitizePath(fileName.replace(/\.[^/.]+$/, ''));
  const ext = fileName.split('.').pop() || 'webp';
  const cleanFileName = `${baseName}_${randomUUID()}.${ext}`;

  // 1. Trust Level (Logos, Seals, Signatures)
  if (!schoolId) {
    return `trusts/${cleanTrust}/branding/${cleanFileName}`;
  }

  const cleanSchool = sanitizePath(schoolId);

  // 2. School Level Branding
  if (category === 'branding' || !academicYear) {
    return `trusts/${cleanTrust}/schools/${cleanSchool}/branding/${cleanFileName}`;
  }

  // 3. School + Academic Year Partition
  const cleanYear = sanitizePath(academicYear);
  return `trusts/${cleanTrust}/schools/${cleanSchool}/years/${cleanYear}/${category}/${cleanFileName}`;
}

/**
 * Main upload utility with automatic WebP optimization and Supabase Storage delivery
 */
export async function uploadMedia(
  file: Buffer,
  fileName: string,
  folderOrOptions: string | MultiTenantStoragePathOptions,
  isImage: boolean = true,
  customMimeType?: string
): Promise<{ secure_url: string; public_id: string }> {
  let bufferToUpload = file;
  let finalFileName = fileName;

  const getMimeTypeFromExt = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'mp4': return 'video/mp4';
      case 'webm': return 'video/webm';
      case 'mov': return 'video/quicktime';
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'webp': return 'image/webp';
      default: return 'application/octet-stream';
    }
  };

  if (isImage) {
    try {
      bufferToUpload = await sharp(file).webp({ quality: 80 }).toBuffer();
      finalFileName = fileName.replace(/\.[^/.]+$/, '') + '.webp';
    } catch {
      // If sharp fails to convert, keep original buffer
      bufferToUpload = file;
    }
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase Storage is not configured. Please verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  try {
    const mimeType = customMimeType || (isImage ? 'image/webp' : getMimeTypeFromExt(finalFileName));
    let storagePath = '';

    if (typeof folderOrOptions === 'object') {
      storagePath = buildMultiTenantStoragePath({
        ...folderOrOptions,
        fileName: finalFileName,
      });
    } else {
      // String folder path
      const baseName = sanitizePath(finalFileName.replace(/\.[^/.]+$/, ''));
      const ext = isImage ? 'webp' : (finalFileName.split('.').pop() || 'bin');
      const uniqueFileName = `${baseName}_${randomUUID()}.${ext}`;
      storagePath = `${folderOrOptions.split('/').map(sanitizePath).join('/')}/${uniqueFileName}`;
    }

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, bufferToUpload, { contentType: mimeType, upsert: true });

    if (error) {
      console.error('[Storage] Supabase upload error:', error);
      throw error;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    return {
      secure_url: urlData.publicUrl,
      public_id: storagePath,
    };
  } catch (error) {
    console.error('[Storage] Upload failed:', error);
    throw error;
  }
}

/**
 * Deletes media from Supabase Storage by public URL or storage path
 */
export async function deleteMedia(fileIdOrUrl: string): Promise<void> {
  if (!fileIdOrUrl) return;

  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    let storagePath = fileIdOrUrl;

    if (fileIdOrUrl.startsWith('http://') || fileIdOrUrl.startsWith('https://')) {
      const url = new URL(fileIdOrUrl);
      const marker = `/object/public/${BUCKET}/`;
      const markerIdx = url.pathname.indexOf(marker);
      if (markerIdx !== -1) {
        storagePath = decodeURIComponent(url.pathname.slice(markerIdx + marker.length));
      } else {
        return;
      }
    }

    const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
    if (error) {
      console.warn('[Storage] Supabase delete warning:', error);
    }
  } catch (err) {
    console.warn('[Storage] Supabase delete error:', err);
  }
}

export default { uploadMedia, deleteMedia, buildMultiTenantStoragePath };
