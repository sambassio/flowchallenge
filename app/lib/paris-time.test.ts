import { describe, expect, it } from "vitest";

import { getParisHourMinute, getParisYYYYMMDD } from "./paris-time";

describe("fuseau Europe/Paris (Intl)", () => {
  it("hiver CET : 2024-01-15 13h05 UTC → 14h05 Paris même jour civil", () => {
    const now = new Date("2024-01-15T13:05:43.000Z");
    expect(getParisYYYYMMDD(now)).toBe("2024-01-15");
    expect(getParisHourMinute(now)).toEqual({ hour: 14, minute: 5 });
  });

  it("été CEST : 2024-06-15 12h UTC → 14h00 Paris", () => {
    const now = new Date("2024-06-15T12:00:15.000Z");
    expect(getParisYYYYMMDD(now)).toBe("2024-06-15");
    expect(getParisHourMinute(now)).toEqual({ hour: 14, minute: 0 });
  });
});
