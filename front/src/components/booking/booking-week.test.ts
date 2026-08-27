import { describe, expect, it } from "vitest";
import { getCurrentBookingWeek } from "./booking-week";

describe("getCurrentBookingWeek", () => {
  it("returns Saturday through Friday when today is in the middle of the week", () => {
    const { saturday, friday } = getCurrentBookingWeek(new Date(2026, 7, 27, 14));

    expect(saturday).toEqual(new Date(2026, 7, 22));
    expect(friday).toEqual(new Date(2026, 7, 28));
  });

  it("keeps Saturday and Friday inside their current booking week", () => {
    expect(getCurrentBookingWeek(new Date(2026, 7, 22, 14)).saturday).toEqual(new Date(2026, 7, 22));
    expect(getCurrentBookingWeek(new Date(2026, 7, 28, 14)).friday).toEqual(new Date(2026, 7, 28));
  });
});
