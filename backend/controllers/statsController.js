const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const TIMEZONE = 'Asia/Ho_Chi_Minh';

exports.getSummary = async (req, res) => {
  try {
    const period = req.query.period || 'week';

    // Thống kê cơ bản
    const [totalUsers, totalProducts, totalOrders] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments()
    ]);

    // Đơn hàng hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayOrders = await Order.find({
      createdAt: { $gte: today, $lt: tomorrow },
      orderStatus: 'confirmed'
    }).select('totalAmount');

    const todayOrdersCount = todayOrders.length;
    const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // ==================== BIỂU ĐỒ DOANH THU ====================
    let revenueChart = [];

    if (period === 'week') {
      // Tuần này (Thứ 2 → Chủ Nhật)
      const startOfWeek = new Date();
      const currentDay = startOfWeek.getDay() || 7;
      startOfWeek.setDate(startOfWeek.getDate() - currentDay + 1);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);

      const result = await Order.aggregate([
        { $match: { orderStatus: 'confirmed', createdAt: { $gte: startOfWeek, $lt: endOfWeek } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TIMEZONE } }, revenue: { $sum: "$totalAmount" } } },
        { $sort: { _id: 1 } }
      ]);

      const revenueMap = new Map(result.map((item) => [item._id, item.revenue]));
      const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      revenueChart = days.map((label, i) => {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + i);

        const dateKey = currentDate.toLocaleDateString('en-CA', {
          timeZone: TIMEZONE
        });

        return {
          label,
          revenue: revenueMap.get(dateKey) || 0
        };
      });

    } else if (period === 'month') {
      // Tháng này - Tính tuần theo ngày trong tháng (Tuần 1 = ngày 1-7, Tuần 2 = 8-14, ...)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const result = await Order.aggregate([
        { $match: { orderStatus: 'confirmed', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: { $dayOfMonth: "$createdAt" }, revenue: { $sum: "$totalAmount" } } },
        { $sort: { _id: 1 } }
      ]);

      // Gom thành 4 tuần
      const weeks = [0, 0, 0, 0];
      result.forEach(item => {
        const day = item._id;
        const weekIndex = Math.min(3, Math.floor((day - 1) / 7));
        weeks[weekIndex] += item.revenue;
      });

      revenueChart = weeks.map((revenue, i) => ({
        label: `Tuần ${i + 1}`,
        revenue
      }));

    } else if (period === 'year') {
      // Năm nay - theo tháng
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);

      const result = await Order.aggregate([
        { $match: { orderStatus: 'confirmed', createdAt: { $gte: startOfYear } } },
        { $group: { _id: { $month: "$createdAt" }, revenue: { $sum: "$totalAmount" } } },
        { $sort: { _id: 1 } }
      ]);

      revenueChart = Array.from({ length: 12 }, (_, i) => ({
        label: `T${i + 1}`,
        revenue: result.find(r => r._id === i + 1)?.revenue || 0
      }));
    }

    res.json({
      totalUsers,
      totalOrders,
      totalProducts,
      todayOrders: todayOrdersCount,
      todayRevenue,
      revenueChart
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
