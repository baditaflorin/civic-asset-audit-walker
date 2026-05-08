import { describe, expect, it } from "vitest";
import { matchMatrix, renderAprilTagMatrix } from "./aprilTag";

describe("AprilTag matching", () => {
  it("matches a rendered tag matrix", () => {
    const matrix = renderAprilTagMatrix(23).map((row) =>
      row.map((pixel) => (pixel === "b" ? "b" : "w"))
    );

    const detection = matchMatrix(matrix);

    expect(detection?.tagId).toBe(23);
    expect(detection?.assetTag).toBe("CAW-36H11-000023");
    expect(detection?.hammingDistance).toBe(0);
  });
});
