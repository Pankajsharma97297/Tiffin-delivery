const dayOrder = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const getCurrentDayKey = (date = new Date()) => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "Asia/Kolkata",
  })
    .format(date)
    .toUpperCase();
};

const getRelativeDayLabel = (offset) => {
  if (offset === 0) {
    return "Today";
  }
  if (offset === 1) {
    return "Tomorrow";
  }
  return "Upcoming";
};

const normalizeSchedule = (schedule, date = new Date()) => {
  const currentDay = getCurrentDayKey(date);
  const currentIndex = dayOrder.indexOf(currentDay);

  return [...schedule]
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((item) => ({
      ...item,
      active: item.day === currentDay,
      dayOffset: (dayOrder.indexOf(item.day) - currentIndex + 7) % 7,
    }));
};

const buildMealFromScheduleItem = (item, fallback = {}, offset = 0) => {
  const title = item?.title || item?.meal || fallback.title || fallback.name;

  if (!title) {
    return null;
  }

  const mealType = item?.mealType || fallback.mealType || "";
  const generatedMeta = `${mealType} · ${getRelativeDayLabel(offset)}${
    offset === 0 ? " by 12:30 PM" : ""
  }`;
  const meta = item?.meta || fallback.meta || (mealType ? generatedMeta : "");

  return {
    icon: item?.icon || fallback.icon || "",
    title,
    status:
      item?.status ||
      fallback.status ||
      "",
    meta,
    chef: item?.chef || fallback.chef || "",
  };
};

const buildMealsFromSchedule = (schedule, fallbackMeals = {}) => {
  const normalized = normalizeSchedule(schedule);
  const today =
    normalized.find((item) => item.dayOffset === 0) || normalized[0];
  const next =
    normalized.find((item) => item.dayOffset === 1) || normalized[1] || today;
  const tomorrow = normalized.find((item) => item.dayOffset === 1) || next;

  return {
    schedule: normalized,
    meals: {
      today: buildMealFromScheduleItem(today, fallbackMeals.today, 0),
      next: buildMealFromScheduleItem(next, fallbackMeals.next, 1),
      tomorrow: buildMealFromScheduleItem(tomorrow, fallbackMeals.tomorrow, 1),
    },
  };
};

module.exports = {
  buildMealsFromSchedule,
  dayOrder,
  getCurrentDayKey,
};
