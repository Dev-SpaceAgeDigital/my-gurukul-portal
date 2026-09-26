import ImageKit, { toFile } from '@imagekit/nodejs';
import sharp from 'sharp';

const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.replace(/"/g, '');

if (!privateKey) {
  throw new Error('ImageKit privateKey environment variable is missing. Please verify your .env configurations.');
}

const imagekit = new ImageKit({
  privateKey,
});

const sanitizeFolderPath = (path: string) => {
  return path
    .split('/')
    .map(segment => 
      segment
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
    )
    .join('/');
};

export async function uploadMedia(file: Buffer, fileName: string, folder: string, isImage: boolean) {
  let bufferToUpload = file;
  let finalFileName = fileName;

  if (isImage) {
    // Convert to webp
    bufferToUpload = await sharp(file)
      .webp({ quality: 80 })
      .toBuffer();
    
    // Ensure filename ends with .webp
    finalFileName = fileName.replace(/\.[^/.]+$/, "") + ".webp";
  }

  try {
    // Convert Buffer to compatible File object using SDK's toFile utility
    const fileObject = await toFile(bufferToUpload, finalFileName);

    const result = await imagekit.files.upload({
      file: fileObject,
      fileName: finalFileName,
      folder: sanitizeFolderPath(folder),
    });
    
    return {
      secure_url: result.url,
      public_id: result.fileId,
    };
  } catch (error) {
    console.error('ImageKit upload error:', error);
    throw error;
  }
}

export async function deleteMedia(fileIdOrUrl: string) {
  try {
    if (fileIdOrUrl.startsWith('http://') || fileIdOrUrl.startsWith('https://')) {
      // It's a full URL. Parse it to find the name and path inside ImageKit.
      const parsedUrl = new URL(fileIdOrUrl);
      const pathname = parsedUrl.pathname;
      
      const pathSegments = pathname.split('/').filter(Boolean);
      // Remove the endpoint ID (the first path segment if it matches 'lfyksselh')
      if (pathSegments[0] === 'lfyksselh') {
        pathSegments.shift();
      }
      
      const fileName = pathSegments[pathSegments.length - 1];
      const folderPath = '/' + pathSegments.slice(0, -1).join('/');

      // Search for the file by name and path
      const response = await imagekit.assets.list({
        searchQuery: `name = "${fileName}"`,
        path: folderPath,
      });

      if (response && response.length > 0) {
        const item = response[0];
        if ('fileId' in item && item.fileId) {
          return await imagekit.files.delete(item.fileId);
        }
      }
      
      console.warn(`File not found in ImageKit for URL: ${fileIdOrUrl} (parsed name: ${fileName}, path: ${folderPath})`);
      return null;
    } else {
      // It is already a fileId
      return await imagekit.files.delete(fileIdOrUrl);
    }
  } catch (error) {
    console.error('ImageKit delete error:', error);
    throw error;
  }
}

export default imagekit;
