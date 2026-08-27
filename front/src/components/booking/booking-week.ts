export function getCurrentBookingWeek(today = new Date()) {
  const currentDay = new Date(today);
  currentDay.setHours(0, 0, 0, 0);

  const daysSinceSaturday = (currentDay.getDay() + 1) % 7;
  const saturday = new Date(currentDay);
  saturday.setDate(currentDay.getDate() - daysSinceSaturday);

  const friday = new Date(saturday);
  friday.setDate(saturday.getDate() + 6);

  return { saturday, friday };
}
