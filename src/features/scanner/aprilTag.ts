import { AprilTagFamily, type AprilTagConfig, type Pixel } from "apriltag";
import tag36h11 from "apriltag/families/36h11.json";
import { tagFromAprilTagId } from "../../lib/schema";

type PixelMatrix = Pixel[][];
type BinaryMatrix = Array<Array<"b" | "w">>;

const family = new AprilTagFamily(tag36h11 as AprilTagConfig);
const MAX_SCAN_ID = Math.min(family.codes.length, 700);
const GRID_SIZE = family.size;

export type AprilTagDetection = {
  tagId: number;
  assetTag: string;
  rotation: number;
  hammingDistance: number;
  confidence: number;
  matrix: BinaryMatrix;
};

export function renderAprilTagMatrix(tagId: number): PixelMatrix {
  if (tagId < 0 || tagId >= family.codes.length) {
    throw new RangeError(`AprilTag id must be between 0 and ${family.codes.length - 1}.`);
  }

  return family.render(tagId);
}

export function renderAprilTagSvg(tagId: number, cellSize = 18): string {
  const matrix = renderAprilTagMatrix(tagId);
  const size = matrix.length * cellSize;
  const cells = matrix
    .flatMap((row, y) =>
      row.map((pixel, x) => {
        if (pixel === "x") {
          return "";
        }
        const fill = pixel === "b" ? "#111827" : "#ffffff";
        return `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="${fill}"/>`;
      })
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${cells}</svg>`;
}

export function decodeCenteredAprilTag(imageData: ImageData): AprilTagDetection | null {
  const cropSize = Math.floor(Math.min(imageData.width, imageData.height) * 0.64);
  const startX = Math.floor((imageData.width - cropSize) / 2);
  const startY = Math.floor((imageData.height - cropSize) / 2);
  const matrix = sampleMatrix(imageData, startX, startY, cropSize);

  return matchMatrix(matrix);
}

export function matchMatrix(matrix: BinaryMatrix, maxDistance = 8): AprilTagDetection | null {
  let best: AprilTagDetection | undefined;

  for (let tagId = 0; tagId < MAX_SCAN_ID; tagId += 1) {
    const target = toBinary(renderAprilTagMatrix(tagId));
    const rotations = rotatedVariants(matrix);

    for (let rotationIndex = 0; rotationIndex < rotations.length; rotationIndex += 1) {
      const candidate = rotations[rotationIndex];
      const distance = hammingDistance(candidate, target);
      if (!best || distance < best.hammingDistance) {
        best = {
          tagId,
          assetTag: tagFromAprilTagId(tagId),
          rotation: rotationIndex * 90,
          hammingDistance: distance,
          confidence: 1 - distance / (GRID_SIZE * GRID_SIZE),
          matrix
        };
      }
    }
  }

  return best && best.hammingDistance <= maxDistance ? best : null;
}

function sampleMatrix(
  imageData: ImageData,
  startX: number,
  startY: number,
  cropSize: number
): BinaryMatrix {
  const luminance = cropLuminance(imageData, startX, startY, cropSize);
  const threshold = otsuThreshold(luminance.values);
  const cellSize = cropSize / GRID_SIZE;
  const matrix: BinaryMatrix = [];

  for (let y = 0; y < GRID_SIZE; y += 1) {
    const row: Array<"b" | "w"> = [];
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const samples: number[] = [];
      for (const offsetY of [0.38, 0.5, 0.62]) {
        for (const offsetX of [0.38, 0.5, 0.62]) {
          const px = Math.min(cropSize - 1, Math.max(0, Math.floor((x + offsetX) * cellSize)));
          const py = Math.min(cropSize - 1, Math.max(0, Math.floor((y + offsetY) * cellSize)));
          samples.push(luminance.at(px, py));
        }
      }
      const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
      row.push(average < threshold ? "b" : "w");
    }
    matrix.push(row);
  }

  return matrix;
}

function cropLuminance(imageData: ImageData, startX: number, startY: number, cropSize: number) {
  const values = new Uint8Array(cropSize * cropSize);

  for (let y = 0; y < cropSize; y += 1) {
    for (let x = 0; x < cropSize; x += 1) {
      const sourceX = startX + x;
      const sourceY = startY + y;
      const index = (sourceY * imageData.width + sourceX) * 4;
      const red = imageData.data[index] ?? 0;
      const green = imageData.data[index + 1] ?? 0;
      const blue = imageData.data[index + 2] ?? 0;
      values[y * cropSize + x] = Math.round(red * 0.299 + green * 0.587 + blue * 0.114);
    }
  }

  return {
    values,
    at: (x: number, y: number) => values[y * cropSize + x] ?? 255
  };
}

function otsuThreshold(values: Uint8Array): number {
  const histogram = new Array<number>(256).fill(0);
  values.forEach((value) => {
    histogram[value] += 1;
  });

  const total = values.length;
  let sum = 0;
  for (let i = 0; i < 256; i += 1) {
    sum += i * histogram[i];
  }

  let sumBackground = 0;
  let weightBackground = 0;
  let maxVariance = 0;
  let threshold = 128;

  for (let i = 0; i < 256; i += 1) {
    weightBackground += histogram[i];
    if (weightBackground === 0) {
      continue;
    }

    const weightForeground = total - weightBackground;
    if (weightForeground === 0) {
      break;
    }

    sumBackground += i * histogram[i];
    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (sum - sumBackground) / weightForeground;
    const variance =
      weightBackground * weightForeground * (meanBackground - meanForeground) ** 2;

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = i;
    }
  }

  return threshold;
}

function toBinary(matrix: PixelMatrix): BinaryMatrix {
  return matrix.map((row) => row.map((pixel) => (pixel === "b" ? "b" : "w")));
}

function rotatedVariants(matrix: BinaryMatrix): BinaryMatrix[] {
  const r90 = rotateClockwise(matrix);
  const r180 = rotateClockwise(r90);
  const r270 = rotateClockwise(r180);
  return [matrix, r90, r180, r270];
}

function rotateClockwise(matrix: BinaryMatrix): BinaryMatrix {
  return matrix[0].map((_, x) => matrix.map((row) => row[x]).reverse());
}

function hammingDistance(a: BinaryMatrix, b: BinaryMatrix): number {
  let distance = 0;
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (a[y][x] !== b[y][x]) {
        distance += 1;
      }
    }
  }
  return distance;
}
