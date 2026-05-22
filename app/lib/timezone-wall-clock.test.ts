import { describe, expect, it } from "vitest";

import {
  calendarYYYYMMDDInTimeZone,
  wallClockHourMinute,
} from "./timezone-wall-clock";

describe("timezone-wall-clock", () => {
  it("jour calendaire CET", () => {
    const now = new Date("2024-01-15T04:05:43.000Z");
    expect(calendarYYYYMMDDInTimeZone(now, "Europe/Paris")).toBe("2024-01-15");
  });

  it("heure murale CET (réveil métro)", () => {
    const now = new Date("2024-01-15T13:05:43.000Z");
    expect(wallClockHourMinute(now, "Europe/Paris")).toEqual({
      hour: 14,
      minute: 5,
    });
  });
});
