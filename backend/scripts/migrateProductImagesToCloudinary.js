require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const Product = require('../models/Product');
const {
  uploadFileToCloudinary,
  deleteCloudinaryImage,
  isCloudinaryUrl
} = require('../utils/cloudinary');

function parseArgs(argv) {
  const options = {
    dryRun: false,
    deleteLocal: false,
    limit: null,
    productId: null
  };

  argv.forEach((arg) => {
    if (arg === '--dry-run') options.dryRun = true;
    if (arg === '--delete-local') options.deleteLocal = true;

    if (arg.startsWith('--limit=')) {
      const parsedLimit = Number(arg.split('=')[1]);
      if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
        options.limit = parsedLimit;
      }
    }

    if (arg.startsWith('--product=')) {
      options.productId = arg.split('=')[1] || null;
    }
  });

  return options;
}

function isLocalUploadPath(imagePath) {
  return typeof imagePath === 'string' && imagePath.startsWith('/uploads/');
}

function resolveLocalImagePath(imagePath) {
  return path.join(__dirname, '..', imagePath.replace(/^\//, ''));
}

function sanitizeSegment(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function buildPublicId(product, imagePath, index) {
  const filename = path.basename(imagePath);
  const productSlug = sanitizeSegment(product.slug || product._id);
  const imageName = sanitizeSegment(filename) || `image-${index + 1}`;
  return `${productSlug}-${imageName}`;
}

function createSummary() {
  return {
    productsScanned: 0,
    productsWithLocalImages: 0,
    localImagesFound: 0,
    uploadsSucceeded: 0,
    uploadsFailed: 0,
    missingFiles: 0,
    productsUpdated: 0,
    localFilesDeleted: 0
  };
}

async function migrateProduct(product, options, summary) {
  summary.productsScanned += 1;

  const images = Array.isArray(product.images) ? product.images : [];
  const localImages = images.filter(isLocalUploadPath);

  if (!localImages.length) {
    return;
  }

  summary.productsWithLocalImages += 1;
  summary.localImagesFound += localImages.length;

  const nextImages = [...images];
  const uploadedForRollback = [];
  let changed = false;

  for (let index = 0; index < images.length; index += 1) {
    const imagePath = images[index];

    if (!isLocalUploadPath(imagePath) || isCloudinaryUrl(imagePath)) {
      continue;
    }

    const absolutePath = resolveLocalImagePath(imagePath);

    if (!fs.existsSync(absolutePath)) {
      summary.missingFiles += 1;
      console.warn(`[missing] ${product._id} ${imagePath}`);
      continue;
    }

    if (options.dryRun) {
      console.log(`[dry-run] ${product._id} ${imagePath}`);
      continue;
    }

    try {
      const result = await uploadFileToCloudinary(absolutePath, {
        public_id: buildPublicId(product, imagePath, index),
        use_filename: false,
        unique_filename: false,
        overwrite: false
      });

      nextImages[index] = result.secure_url;
      uploadedForRollback.push(result.secure_url);
      summary.uploadsSucceeded += 1;
      changed = true;

      if (options.deleteLocal) {
        fs.unlinkSync(absolutePath);
        summary.localFilesDeleted += 1;
      }

      console.log(`[uploaded] ${product._id} ${imagePath} -> ${result.secure_url}`);
    } catch (error) {
      summary.uploadsFailed += 1;
      console.error(`[failed] ${product._id} ${imagePath}: ${error.message}`);
    }
  }

  if (!changed || options.dryRun) {
    return;
  }

  try {
    product.images = nextImages;
    await product.save();
    summary.productsUpdated += 1;
  } catch (error) {
    await Promise.allSettled(uploadedForRollback.map((url) => deleteCloudinaryImage(url)));
    throw new Error(`Failed to save product ${product._id}: ${error.message}`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const summary = createSummary();

  await connectDB();

  const query = options.productId
    ? { _id: options.productId }
    : { images: { $exists: true, $ne: [] } };

  let cursor = Product.find(query).sort({ createdAt: 1 });

  if (options.limit) {
    cursor = cursor.limit(options.limit);
  }

  const products = await cursor;

  if (!products.length) {
    console.log('No products found for migration.');
    return;
  }

  for (const product of products) {
    await migrateProduct(product, options, summary);
  }

  console.log('Migration summary:');
  console.log(JSON.stringify({
    mode: options.dryRun ? 'dry-run' : 'write',
    deleteLocal: options.deleteLocal,
    limit: options.limit,
    productId: options.productId,
    ...summary
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
