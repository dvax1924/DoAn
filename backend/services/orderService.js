const Product = require('../models/Product');

function getItemProductId(item) {
  if (!item) return null;
  if (item.product && typeof item.product === 'object') {
    return item.product._id || item.product.id || null;
  }
  return item.product || null;
}

async function validateAndBuildOrderItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Don hang khong co san pham hop le');
  }

  let totalAmount = 0;
  const orderItems = [];

  for (const item of items) {
    const quantity = Number(item.qty);
    const productId = getItemProductId(item);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('So luong san pham khong hop le');
    }

    if (!productId) {
      throw new Error('Khong tim thay san pham hop le');
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Khong tim thay san pham');
    }

    const variant = product.variants.find((existingVariant) => existingVariant.size === item.variant?.size);
    if (!variant) {
      throw new Error('Lua chon san pham khong ton tai');
    }

    if (variant.stock < quantity) {
      throw new Error('San pham khong du hang');
    }

    const itemPrice = Number(product.price);
    if (Number.isNaN(itemPrice) || itemPrice < 0) {
      throw new Error('Gia san pham khong hop le');
    }

    orderItems.push({
      product: product._id,
      variant: {
        size: variant.size
      },
      qty: quantity,
      price: itemPrice
    });

    totalAmount += itemPrice * quantity;
  }

  return { orderItems, totalAmount };
}

async function restoreInventoryItem(item) {
  const productId = getItemProductId(item);
  if (!productId || !item?.variant?.size || !item?.qty) return;

  await Product.updateOne(
    {
      _id: productId,
      'variants.size': item.variant.size
    },
    {
      $inc: { 'variants.$.stock': Number(item.qty) }
    }
  );
}

async function reserveInventory(orderItems = []) {
  const reservedItems = [];

  try {
    for (const item of orderItems) {
      const result = await Product.updateOne(
        {
          _id: item.product,
          variants: {
            $elemMatch: {
              size: item.variant?.size,
              stock: { $gte: Number(item.qty) }
            }
          }
        },
        {
          $inc: { 'variants.$.stock': -Number(item.qty) }
        }
      );

      if (!result.modifiedCount) {
        throw new Error('San pham khong du hang');
      }

      reservedItems.push(item);
    }

    return { success: true };
  } catch (error) {
    await Promise.allSettled(reservedItems.map(restoreInventoryItem));
    return { success: false, message: error.message };
  }
}

async function restoreInventoryForItems(items = []) {
  await Promise.all(items.map(restoreInventoryItem));
}

async function releaseOrderInventory(order) {
  if (!order?.inventoryAdjusted) {
    return false;
  }

  await restoreInventoryForItems(order.items || []);
  order.inventoryAdjusted = false;
  await order.save();

  return true;
}

module.exports = {
  validateAndBuildOrderItems,
  reserveInventory,
  restoreInventoryForItems,
  releaseOrderInventory
};
