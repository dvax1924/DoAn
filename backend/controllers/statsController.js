const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const {
  TIMEZONE,
  formatVietnamDateKey,
  getVietnamDayRange,
  getVietnamWeekRange,
  getVietnamMonthRange,
  getVietnamYearRange
} = require('../utils/vietnamTime');

function buildConfirmedRevenueDateStages(start, end) {
  return [
    {
      $match: {
        orderStatus: 'confirmed'
      }
    },
    {
      $addFields: {
        revenueDate: { $ifNull: ['$confirmedAt', '$createdAt'] }
      }
    },
    {
      $match: {
        revenueDate: { $gte: start, $lt: end }
      }
    }
  ];
}

function buildTodayConfirmedOrderQuery(start, end) {
  return {
    orderStatus: 'confirmed',
    $or: [
      { confirmedAt: { $gte: start, $lt: end } },
      {
        confirmedAt: { $exists: false },
        createdAt: { $gte: start, $lt: end }
      },
      {
        confirmedAt: null,
        createdAt: { $gte: start, $lt: end }
      }
    ]
  };
}

exports.getSummary = async (req, res) => {
  try {
    const period = req.query.period || 'week';

    const [totalUsers, totalProducts, totalOrders] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments()
    ]);

    const { start: startOfToday, end: startOfTomorrow } = getVietnamDayRange();

    const todayOrders = await Order.find(
      buildTodayConfirmedOrderQuery(startOfToday, startOfTomorrow)
    ).select('totalAmount');

    const todayOrdersCount = todayOrders.length;
    const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    let revenueChart = [];

    if (period === 'week') {
      const { start: startOfWeek, end: endOfWeek } = getVietnamWeekRange();

      const result = await Order.aggregate([
        ...buildConfirmedRevenueDateStages(startOfWeek, endOfWeek),
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$revenueDate',
                timezone: TIMEZONE
              }
            },
            revenue: { $sum: '$totalAmount' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      const revenueMap = new Map(result.map((item) => [item._id, item.revenue]));
      const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      revenueChart = days.map((label, i) => {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + i);

        return {
          label,
          revenue: revenueMap.get(formatVietnamDateKey(currentDate)) || 0
        };
      });
    } else if (period === 'month') {
      const { start: startOfMonth, end: endOfMonth } = getVietnamMonthRange();

      const result = await Order.aggregate([
        ...buildConfirmedRevenueDateStages(startOfMonth, endOfMonth),
        {
          $group: {
            _id: {
              $dayOfMonth: {
                date: '$revenueDate',
                timezone: TIMEZONE
              }
            },
            revenue: { $sum: '$totalAmount' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      const weeks = [0, 0, 0, 0];
      result.forEach((item) => {
        const weekIndex = Math.min(3, Math.floor((item._id - 1) / 7));
        weeks[weekIndex] += item.revenue;
      });

      revenueChart = weeks.map((revenue, i) => ({
        label: `Tuần ${i + 1}`,
        revenue
      }));
    } else if (period === 'year') {
      const { start: startOfYear, end: endOfYear } = getVietnamYearRange();

      const result = await Order.aggregate([
        ...buildConfirmedRevenueDateStages(startOfYear, endOfYear),
        {
          $group: {
            _id: {
              $month: {
                date: '$revenueDate',
                timezone: TIMEZONE
              }
            },
            revenue: { $sum: '$totalAmount' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      revenueChart = Array.from({ length: 12 }, (_, i) => ({
        label: `T${i + 1}`,
        revenue: result.find((item) => item._id === i + 1)?.revenue || 0
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
