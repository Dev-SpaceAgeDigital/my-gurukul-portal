/**
 * File Security & Upload Constraints
 */

export const UPLOAD_LIMITS = {
  IMAGE: {
    maxCount: 2,
    maxSizeBytes: 5 * 1024 * 1024, // 5MB per image
    maxSizeMB: 5,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    acceptString: '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp',
    label: 'Up to 2 images (JPG, PNG, WEBP — Max 5MB each)',
  },
  VIDEO: {
    maxCount: 1,
    maxSizeBytes: 30 * 1024 * 1024, // 30MB
    maxSizeMB: 30,
    allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    allowedExtensions: ['mp4', 'webm', 'mov'],
    acceptString: '.mp4,.webm,.mov,video/mp4,video/webm,video/quicktime',
    label: '1 Video file (MP4, WEBM — Max 30MB) or YouTube URL',
  },
  PDF: {
    maxCount: 1,
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    maxSizeMB: 10,
    allowedMimeTypes: ['application/pdf'],
    allowedExtensions: ['pdf'],
    acceptString: '.pdf,application/pdf',
    label: '1 PDF Document / Certificate (Max 10MB)',
  },
};

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateUploadFiles(
  files: File[],
  type: 'IMAGE' | 'VIDEO' | 'PDF'
): FileValidationResult {
  const config = UPLOAD_LIMITS[type];
  if (!config) return { isValid: false, error: 'Invalid media upload type' };

  if (files.length === 0) {
    return { isValid: true };
  }

  if (files.length > config.maxCount) {
    return {
      isValid: false,
      error: `You can upload a maximum of ${config.maxCount} ${type === 'IMAGE' ? 'images' : 'file'} at a time.`,
    };
  }

  for (const file of files) {
    // 1. Check size
    if (file.size > config.maxSizeBytes) {
      const actualSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return {
        isValid: false,
        error: `File "${file.name}" (${actualSizeMB}MB) exceeds the maximum allowed size of ${config.maxSizeMB}MB.`,
      };
    }

    // 2. Check extension & MIME
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const hasValidExt = (config.allowedExtensions as readonly string[]).includes(ext);
    const hasValidMime = file.type ? (config.allowedMimeTypes as readonly string[]).includes(file.type.toLowerCase()) : true;

    if (!hasValidExt || !hasValidMime) {
      return {
        isValid: false,
        error: `File "${file.name}" is not a supported format. Allowed formats: ${config.allowedExtensions.map((e) => '.' + e).join(', ')}`,
      };
    }
  }

  return { isValid: true };
}
