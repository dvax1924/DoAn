const TIMEZONE = 'Asia/Ho_Chi_Minh';
const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function getVietnamDateParts(date = new Date()) {
  const vietnamDate = new Date(date.getTime() + VIETNAM_UTC_OFFSET_MS);

  return {
    year: vietnamDate.getUTCFullYear(),
    monthIndex: vietnamDate.getUTCMonth(),
    day: vietnamDate.getUTCDate(),
    weekDay: vietnamDate.getUTCDay() || 7
  };
}

function vietnamLocalDateToUtc(year, monthIndex, day) {
  return new Date(Date.UTC(year, monthIndex, day) - VIETNAM_UTC_OFFSET_MS);
}

function formatVietnamDateKey(date) {
  return new Date(date.getTime() + VIETNAM_UTC_OFFSET_MS).toISOString().slice(0, 10);
}

function getVietnamDayRange(date = new Date()) {
  const { year, monthIndex, day } = getVietnamDateParts(date);
  const start = vietnamLocalDateToUtc(year, monthIndex, day);
  const end = new Date(start.getTime() + DAY_MS);

  return {
    start,
    end,
    dateKey: formatVietnamDateKey(start)
  };
}

function getVietnamWeekRange(date = new Date()) {
  const { year, monthIndex, day, weekDay } = getVietnamDateParts(date);
  const start = vietnamLocalDateToUtc(year, monthIndex, day - weekDay + 1);
  const end = new Date(start.getTime() + 7 * DAY_MS);

  return { start, end };
}

function getVietnamMonthRange(date = new Date()) {
  const { year, monthIndex } = getVietnamDateParts(date);
  const start = vietnamLocalDateToUtc(year, monthIndex, 1);
  const end = vietnamLocalDateToUtc(year, monthIndex + 1, 1);

  return { start, end };
}

function getVietnamYearRange(date = new Date()) {
  const { year } = getVietnamDateParts(date);
  const start = vietnamLocalDateToUtc(year, 0, 1);
  const end = vietnamLocalDateToUtc(year + 1, 0, 1);

  return { start, end };
}

module.exports = {
  TIMEZONE,
  DAY_MS,
  formatVietnamDateKey,
  getVietnamDayRange,
  getVietnamWeekRange,
  getVietnamMonthRange,
  getVietnamYearRange
};
