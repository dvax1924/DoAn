const Product = require('../models/Product');
const Category = require('../models/Category');
const { io } = require('../socket');

// ====================== GET ALL CATEGORIES (Public) ======================
exports.getCategories = async (req, res) => {
  try {
    const [categories, productCounts] = await Promise.all([
      Category.find({ isActive: true })
        .sort({ createdAt: -1 })
        .lean(),
      Product.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const productCountMap = new Map(
      productCounts.map(({ _id, count }) => [String(_id), count])
    );

    const categoriesWithCounts = categories.map(category => ({
      ...category,
      productCount: productCountMap.get(String(category._id)) || 0
    }));
    
    res.json({ success: true, count: categoriesWithCounts.length, categories: categoriesWithCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== GET CATEGORY BY ID (Public) ======================
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== ADMIN: CREATE CATEGORY ======================
exports.createCategory = async (req, res) => {
  try {
    const { name, description, image } = req.body;

    const slug = name.toLowerCase().trim().replace(/ /g, '-');

    const category = await Category.create({
      name,
      slug,
      description,
      image
    });

    // 🔔 Thông báo real-time cập nhật danh mục
    io.emit('categoryUpdated');

    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== ADMIN: UPDATE CATEGORY ======================
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, image, isActive } = req.body;
    
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }

    if (name) {
      category.name = name;
      category.slug = name.toLowerCase().trim().replace(/ /g, '-');
    }
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    // 🔔 Thông báo real-time cập nhật danh mục
    io.emit('categoryUpdated');

    res.json({ success: true, message: 'Cập nhật danh mục thành công', category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== ADMIN: DELETE CATEGORY (có migrate) ======================
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { newCategoryId } = req.body || {};   // danh mục mới để chuyển sản phẩm sang

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }

    // Đếm số sản phẩm đang thuộc danh mục này
    const productCount = await Product.countDocuments({ category: id });

    if (productCount === 0) {
      // Không có sản phẩm → xóa luôn
      await category.deleteOne();
      // 🔔 Thông báo real-time cập nhật danh mục
      io.emit('categoryUpdated');

      return res.json({ success: true, message: 'Đã xóa danh mục thành công' });
    }

    // Có sản phẩm → bắt buộc phải chọn danh mục mới
    if (!newCategoryId) {
      return res.status(400).json({
        success: false,
        message: `Danh mục này đang có ${productCount} sản phẩm. Vui lòng chọn danh mục mới để chuyển sản phẩm sang trước khi xóa.`
      });
    }

    // Kiểm tra danh mục mới có tồn tại không
    const newCategory = await Category.findById(newCategoryId);
    if (!newCategory) {
      return res.status(400).json({ success: false, message: 'Danh mục mới không tồn tại' });
    }

    // Migrate (chuyển) tất cả sản phẩm sang danh mục mới
    await Product.updateMany(
      { category: id },
      { category: newCategoryId }
    );

    // Xóa danh mục cũ
    await category.deleteOne();

    // 🔔 Thông báo real-time cập nhật danh mục
    io.emit('categoryUpdated');

    res.json({
      success: true,
      message: `Đã chuyển ${productCount} sản phẩm sang danh mục "${newCategory.name}" và xóa danh mục cũ thành công`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
