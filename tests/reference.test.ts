import { describe, expect, it } from "vitest";
import { generateReference } from "@/lib/reference";

describe("generateReference", () => {
  it("returns a short readable feedback reference", () => {
    const reference = generateReference();
    expect(reference).toMatch(/^FB-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
    expect(reference).toHaveLength(9);
  });
});
