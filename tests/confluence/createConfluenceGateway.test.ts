import type { ConfluenceConfig } from "@config/confluenceConfig";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const CloudConfluenceClient = vi.fn(function CloudConfluenceClient(
    this: unknown,
  ) {});
  const OnPremConfluenceClient = vi.fn(function OnPremConfluenceClient(
    this: unknown,
  ) {});

  const CloudGateway = vi.fn(function CloudGateway(this: unknown) {
    return { kind: "cloudGateway" };
  });
  const OnPremGateway = vi.fn(function OnPremGateway(this: unknown) {
    return { kind: "onPremGateway" };
  });

  return {
    CloudConfluenceClient,
    OnPremConfluenceClient,
    CloudGateway,
    OnPremGateway,
  };
});

vi.mock("@cloud/cloudConfluenceClient", () => ({
  CloudConfluenceClient: mocks.CloudConfluenceClient,
}));
vi.mock("@cloud/cloudGateway", () => ({
  CloudGateway: mocks.CloudGateway,
}));
vi.mock("@onprem/onpremConfluenceClient", () => ({
  OnPremConfluenceClient: mocks.OnPremConfluenceClient,
}));
vi.mock("@onprem/onpremGateway", () => ({
  OnPremGateway: mocks.OnPremGateway,
}));

import { createConfluenceGateway } from "@confluence";

describe("confluence/createConfluenceGateway", () => {
  beforeEach(() => {
    mocks.CloudConfluenceClient.mockClear();
    mocks.CloudGateway.mockClear();
    mocks.OnPremConfluenceClient.mockClear();
    mocks.OnPremGateway.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("hosting=cloud なら cloud 側を生成する", () => {
    // Arrange
    const cfg = {
      hosting: "cloud",
      baseUrl: "x",
    } as unknown as ConfluenceConfig;

    // Act
    const actual = createConfluenceGateway(cfg);

    // Assert
    expect(mocks.CloudConfluenceClient).toHaveBeenCalledTimes(1);
    expect(mocks.CloudGateway).toHaveBeenCalledTimes(1);
    expect(mocks.OnPremConfluenceClient).not.toHaveBeenCalled();
    expect(mocks.OnPremGateway).not.toHaveBeenCalled();

    expect(actual).toEqual({ kind: "cloudGateway" });
  });

  it("hosting=cloud 以外なら onprem 側を生成する", () => {
    // Arrange
    const cfg = {
      hosting: "onprem",
      baseUrl: "x",
    } as unknown as ConfluenceConfig;

    // Act
    const actual = createConfluenceGateway(cfg);

    // Assert
    expect(mocks.OnPremConfluenceClient).toHaveBeenCalledTimes(1);
    expect(mocks.OnPremGateway).toHaveBeenCalledTimes(1);
    expect(mocks.CloudConfluenceClient).not.toHaveBeenCalled();
    expect(mocks.CloudGateway).not.toHaveBeenCalled();

    expect(actual).toEqual({ kind: "onPremGateway" });
  });

  it.each(["unknown-hosting", "", "CLOUD"])(
    "hosting が想定外 (%s) でも onprem 分岐として扱う",
    (hosting) => {
      // Arrange
      const cfg = { hosting, baseUrl: "x" } as unknown as ConfluenceConfig;

      // Act
      const actual = createConfluenceGateway(cfg);

      // Assert
      expect(mocks.OnPremConfluenceClient).toHaveBeenCalledTimes(1);
      expect(mocks.OnPremGateway).toHaveBeenCalledTimes(1);
      expect(mocks.CloudConfluenceClient).not.toHaveBeenCalled();
      expect(mocks.CloudGateway).not.toHaveBeenCalled();

      expect(actual).toEqual({ kind: "onPremGateway" });
    },
  );
});
