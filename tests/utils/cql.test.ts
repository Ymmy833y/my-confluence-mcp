import { validateCql } from "@utils/cql.js";
import { describe, expect, it } from "vitest";

describe("utils/cql", () => {
  describe("validateCql", () => {
    it.each([
      'title = "Hello"',
      "NOT type = page",
      'status NOT IN ("a","b")',
      'title = "a AND b" OR space = ABC',
      'title = "ORDER BY created" AND space = ABC',
      "title = abc ORDER BY created DESC",
      "tItLe = abc aNd space = ABC",
      "title = a AND space = ABC",
      "title = a OR space = ABC",
      "type IN (page, blogpost)",
      "type != page",
      "title = ORDER",
      "title = a ORDER created",
    ] as const)("有効なCQLは ok: true を返す: %s", (cql) => {
      // Arrange

      // Act
      const actual = validateCql(cql);

      // Assert
      expect(actual).toEqual({ ok: true });
    });

    it.each([
      { cql: "   ", expected: { ok: false, message: "CQL is empty" } },
      {
        cql: "AND title = a",
        expected: { ok: false, message: "Empty condition" },
      },
      {
        cql: "OR title = a",
        expected: { ok: false, message: "Empty condition" },
      },

      { cql: "title", expected: { ok: false, message: "Missing operator" } },
      {
        cql: "= a",
        expected: { ok: false, message: "Missing left operand (A)" },
      },
      {
        cql: "a =",
        expected: { ok: false, message: "Missing right operand (B)" },
      },
      {
        cql: "NOT",
        expected: { ok: false, message: "NOT must be followed by a condition" },
      },
      {
        cql: "title = a AND",
        expected: {
          ok: false,
          message: '"AND" must be followed by a condition',
        },
      },
      {
        cql: "title = a OR",
        expected: {
          ok: false,
          message: '"OR" must be followed by a condition',
        },
      },
      {
        cql: "title = a ORDER BY   ",
        expected: {
          ok: false,
          message: "ORDER BY must have a following expression",
        },
      },
      {
        cql: "ORDER BY created",
        expected: { ok: false, message: "Missing condition before ORDER BY" },
      },
      {
        cql: "title = a ORDER BY created ORDER BY updated",
        expected: { ok: false, message: "Multiple ORDER BY is not allowed" },
      },
      {
        cql: "status NOTIN (a)",
        expected: { ok: false, message: "Missing operator" },
      },
      {
        cql: "a = b NOT c = d",
        expected: {
          ok: false,
          message: `Unexpected keyword "NOT" inside a condition`,
        },
      },
      {
        cql: "a NOT= b",
        expected: {
          ok: false,
          message: `Unexpected keyword "NOT" inside a condition`,
        },
      },
    ] as const)("不正なCQLはエラーを返す: %s", ({ cql, expected }) => {
      // Arrange

      // Act
      const actual = validateCql(cql);

      // Assert
      expect(actual).toEqual(expected);
    });
  });
});
