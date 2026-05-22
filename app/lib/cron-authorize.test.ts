import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authorizeCron } from "./cron-authorize";

describe("authorizeCron", () => {
  let savedSecret: string | undefined;
  let savedNodeEnv: string | undefined;

  beforeEach(() => {
    savedSecret = process.env.CRON_SECRET;
    savedNodeEnv = process.env.NODE_ENV;
    delete process.env.CRON_SECRET;
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (savedSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = savedSecret;
    }
    process.env.NODE_ENV = savedNodeEnv ?? "test";
  });

  it("accepte Bearer quand CRON_SECRET est défini", () => {
    process.env.NODE_ENV = "production";
    process.env.CRON_SECRET = "cron-test-secret-value";
    expect(authorizeCron("Bearer cron-test-secret-value")).toBe(true);
    expect(authorizeCron("Bearer wrong")).toBe(false);
    expect(authorizeCron(null)).toBe(false);
    expect(authorizeCron("Basic x")).toBe(false);
  });

  it("refuse tout en production sans CRON_SECRET", () => {
    process.env.NODE_ENV = "production";
    delete process.env.CRON_SECRET;
    expect(authorizeCron("Bearer pretend")).toBe(false);
  });
});
