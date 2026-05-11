const fs = require('fs');
const path = require('path');

const Product = require('../models/Product');
const { io } = require('../socket');
const {
  uploadBufferToCloudinary,
  deleteCloudinaryImage,
  isCloudinaryUrl
} = require('../utils/cloudinary');

function parseJsonArray(value, fallback = []) {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  return JSON.parse(value);
}

function sanitizeFilename(filename) {
  return filename
    .toLowerCase()
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'image';
}

async function uploadProductImages(files = []) {
  const uploadedUrls = [];

  for (const file of files) {
    const result = await uploadBufferToCloudinary(file.buffer, {
      public_id: `${Date.now()}-${sanitizeFilename(file.originalname)}`,
      use_filename: false,
      unique_filename: false,
      overwrite: false
    });

    uploadedUrls.push(result.secure_url);
  }

  return uploadedUrls;
}

function deleteLocalImage(imagePath) {
  if (typeof imagePath !== 'string' || !imagePath.startsWith('/uploads/')) return;

  const relativePath = imagePath.replace(/^\//, '');
  const fullPath = path.join(__dirname, '..', relativePath);

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

async function deleteProductImageAsset(imagePath) {
  if (isCloudinaryUrl(imagePath)) {
    await deleteCloudinaryImage(imagePath);
    return;
  }

  deleteLocalImage(imagePath);
}

exports.createProduct = async (req, res) => {
  const uploadedImages = [];

  try {
    const { name, description, category, price, variants, tags, isFeatured } = req.body;
    const images = req.files?.length ? await uploadProductImages(req.files) : [];
    uploadedImages.push(...images);

    const slug = name.toLowerCase().trim().replace(/ /g, '-');

    const product = await Product.create({
      name,
      slug,
      description,
      category,
      price: Number(price),
      images,
      variants: JSON.parse(variants || '[]'),
      tags: tags ? tags.split(',') : [],
      isFeatured: isFeatured === 'true' || false
    });

    const populatedProduct = await Product.findById(product._id).populate('category', 'name');
    io.emit('productCreated', { product: populatedProduct });

    res.status(201).json({ success: true, product });
  } catch (error) {
    if (uploadedImages.length) {
      await Promise.allSettled(uploadedImages.map(deleteProductImageAsset));
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { category, search, sort, limit = 20, page = 1 } = req.query;

    let query = { isActive: true };
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * Number(limit);

    let sortOption = { createdAt: -1 };
    if (sort === 'price-low') sortOption = { price: 1 };
    if (sort === 'price-high') sortOption = { price: -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };

    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .populate('category', 'name')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: products.length,
      totalCount,
      products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product) return res.status(404).json({ success: false, message: 'Khong tim thay san pham' });

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  const newlyUploadedImages = [];

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Khong tim thay san pham' });
    }

    const { name, description, category, price, isActive, variants, imagesToDelete } = req.body;

    if (name) {
      product.name = name;
      product.slug = name.toLowerCase().trim().replace(/ /g, '-');
    }
    if (description !== undefined) product.description = description;
    if (category) product.category = category;
    if (price !== undefined) product.price = Number(price);
    if (isActive !== undefined) product.isActive = isActive === 'true' || isActive === true;

    if (variants) {
      product.variants = JSON.parse(variants);
    }

    if (imagesToDelete) {
      const imagesToDeleteArray = parseJsonArray(imagesToDelete, []);
      product.images = product.images.filter((img) => !imagesToDeleteArray.includes(img));
      await Promise.allSettled(imagesToDeleteArray.map(deleteProductImageAsset));
    }

    if (req.files && req.files.length > 0) {
      const newImagePaths = await uploadProductImages(req.files);
      newlyUploadedImages.push(...newImagePaths);
      product.images = [...product.images, ...newImagePaths];
    }

    await product.save();

    const populatedProduct = await Product.findById(product._id).populate('category', 'name');
    io.emit('productUpdated', { product: populatedProduct });

    res.json({
      success: true,
      message: 'Cap nhat san pham thanh cong',
      product
    });
  } catch (error) {
    if (newlyUploadedImages.length) {
      await Promise.allSettled(newlyUploadedImages.map(deleteProductImageAsset));
    }

    console.error('Loi updateProduct:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Cap nhat that bai'
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Khong tim thay san pham' });
    }

    const productId = product._id;
    await Promise.allSettled(product.images.map(deleteProductImageAsset));
    await product.deleteOne();

    io.emit('productDeleted', { productId });

    res.json({ success: true, message: 'Xoa san pham thanh cong' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateInventory = async (req, res) => {
  try {
    const { variants } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Khong tim thay san pham' });
    }

    if (!variants || !Array.isArray(variants)) {
      return res.status(400).json({ success: false, message: 'Du lieu variants khong hop le' });
    }

    product.variants = product.variants.map((existingVariant) => {
      const updatedVariant = variants.find((v) => v.size === existingVariant.size);

      if (updatedVariant && typeof updatedVariant.stock === 'number') {
        existingVariant.stock = updatedVariant.stock;
      }
      return existingVariant;
    });

    await product.save();

    res.json({
      success: true,
      message: 'Cap nhat ton kho thanh cong',
      product
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
