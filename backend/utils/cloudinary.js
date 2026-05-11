const { v2: cloudinary } = require('cloudinary');
const { Readable } = require('stream');

let configured = false;

function ensureCloudinaryConfig() {
  if (configured) return;

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary environment variables are missing');
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  });

  configured = true;
}

function uploadBufferToCloudinary(buffer, options = {}) {
  ensureCloudinaryConfig();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_FOLDER || 'do_an/products',
        resource_type: 'image',
        ...options
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}

function uploadFileToCloudinary(filePath, options = {}) {
  ensureCloudinaryConfig();

  return cloudinary.uploader.upload(filePath, {
    folder: process.env.CLOUDINARY_FOLDER || 'do_an/products',
    resource_type: 'image',
    ...options
  });
}

function isCloudinaryUrl(url) {
  return typeof url === 'string' && url.includes('res.cloudinary.com');
}

function extractPublicIdFromUrl(url) {
  if (!isCloudinaryUrl(url)) return null;

  const uploadMarker = '/upload/';
  const uploadIndex = url.indexOf(uploadMarker);

  if (uploadIndex === -1) return null;

  const assetPath = url.slice(uploadIndex + uploadMarker.length);
  const segments = assetPath.split('/').filter(Boolean);
  const versionIndex = segments.findIndex((segment) => /^v\d+$/.test(segment));
  const publicIdSegments = versionIndex >= 0 ? segments.slice(versionIndex + 1) : segments;

  if (!publicIdSegments.length) return null;

  const filename = publicIdSegments.pop();
  const extensionIndex = filename.lastIndexOf('.');
  const basename = extensionIndex >= 0 ? filename.slice(0, extensionIndex) : filename;

  return [...publicIdSegments, basename].join('/');
}

async function deleteCloudinaryImage(url) {
  const publicId = extractPublicIdFromUrl(url);

  if (!publicId) return null;

  ensureCloudinaryConfig();
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}

module.exports = {
  uploadBufferToCloudinary,
  uploadFileToCloudinary,
  deleteCloudinaryImage,
  isCloudinaryUrl
};
