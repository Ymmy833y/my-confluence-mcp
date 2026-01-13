import { authHeaders } from "@utils/auth";
import { describe, expect, it } from "vitest";

describe("utils/auth", () => {
  describe("authHeaders", () => {
    it("kind=bearer のとき Bearer トークンの Authorization ヘッダを返す", () => {
      // Arrange
      const auth = {
        kind: "bearer",
        token: "abc123",
      } as const;

      // Act
      const actual = authHeaders(auth);

      // Assert
      expect(actual).toEqual({ Authorization: "Bearer abc123" });
    });

    it("kind=basic のとき email:apiToken を base64 化した Basic Authorization ヘッダを返す", () => {
      // Arrange
      const auth = {
        kind: "basic",
        email: "user@example.com",
        apiToken: "token-xyz",
      } as const;

      const expectedToken = Buffer.from("user@example.com:token-xyz").toString(
        "base64",
      );

      // Act
      const actual = authHeaders(auth);

      // Assert
      expect(actual).toEqual({ Authorization: `Basic ${expectedToken}` });
    });

    it("kind が bearer/basic 以外のとき空オブジェクトを返す", () => {
      // Arrange
      const auth = {
        kind: "none",
      } as unknown as { kind: string };

      // Act
      const actual = authHeaders(auth as never);

      // Assert
      expect(actual).toEqual({});
    });
  });
});
