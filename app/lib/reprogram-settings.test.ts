import { beforeEach, describe, expect, it, vi } from "vitest";

const redisMock = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock("@/app/lib/redis-client", () => ({
  createRedis: () => redisMock,
}));

import {
  reprogramEffectiveTimeZone,
  saveReminderTimezone,
} from "./reprogram-settings";

describe("reprogram-settings", () => {
  beforeEach(() => {
    redisMock.get.mockReset();
    redisMock.set.mockReset();
  });

  it("préfère le fuseau navigateur courant au fuseau déjà stocké", async () => {
    redisMock.get.mockResolvedValue("Europe/Paris");

    await expect(reprogramEffectiveTimeZone("Asia/Tokyo")).resolves.toBe(
      "Asia/Tokyo",
    );
    expect(redisMock.get).not.toHaveBeenCalled();
  });

  it("utilise le fuseau stocké uniquement si le navigateur n'est pas valide", async () => {
    redisMock.get.mockResolvedValue("Europe/Paris");

    await expect(reprogramEffectiveTimeZone("not-a-timezone")).resolves.toBe(
      "Europe/Paris",
    );
  });

  it("écrase le fuseau Redis avec le fuseau courant", async () => {
    redisMock.set.mockResolvedValue("OK");

    await expect(saveReminderTimezone("Asia/Tokyo")).resolves.toBe(true);
    expect(redisMock.set).toHaveBeenCalledWith(
      "reprogram:reminder-timezone",
      "Asia/Tokyo",
      { ex: 60 * 60 * 24 * 380 },
    );
  });
});
