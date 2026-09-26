/**
 * Legacy ImageKit Compatibility Shim
 * All media operations are now handled natively via Supabase Storage
 */
import { uploadMedia as supabaseUploadMedia, deleteMedia as supabaseDeleteMedia } from './storage';

export async function uploadMedia(file: Buffer, fileName: string, folder: string, isImage: boolean = true) {
  return supabaseUploadMedia(file, fileName, folder, isImage);
}

export async function deleteMedia(fileIdOrUrl: string) {
  return supabaseDeleteMedia(fileIdOrUrl);
}

export default {
  uploadMedia,
  deleteMedia,
};
