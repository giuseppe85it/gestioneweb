function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

function clamp(value: number) {
  return Math.max(0, Math.min(255, value));
}

function sanitizeVinCharacters(value: string) {
  return value
    .toUpperCase()
    .split("")
    .filter((character) => {
      const code = character.charCodeAt(0);
      const isDigit = code >= 48 && code <= 57;
      const isLetter = code >= 65 && code <= 90;
      return isDigit || isLetter || character === "*";
    })
    .join("");
}

function isValidVinCharacter(character: string) {
  if (character === "*" || character === "I" || character === "O" || character === "Q") {
    return false;
  }

  const code = character.charCodeAt(0);
  return (code >= 48 && code <= 57) || (code >= 65 && code <= 90);
}

function countRepeatedCharacters(value: string) {
  const counts = new Map<string, number>();
  value.split("").forEach((character) => {
    counts.set(character, (counts.get(character) ?? 0) + 1);
  });
  return Math.max(...counts.values(), 0);
}

function applyStrongSharpen(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return canvas;
  }

  const { width, height } = canvas;
  const sourceImage = context.getImageData(0, 0, width, height);
  const sourcePixels = sourceImage.data;
  const outputImage = context.createImageData(width, height);
  const outputPixels = outputImage.data;
  const kernel = [0, -1.2, 0, -1.2, 5.8, -1.2, 0, -1.2, 0];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const targetIndex = (y * width + x) * 4;

      for (let channel = 0; channel < 3; channel += 1) {
        let value = 0;
        for (let kernelY = -1; kernelY <= 1; kernelY += 1) {
          for (let kernelX = -1; kernelX <= 1; kernelX += 1) {
            const sampleX = Math.max(0, Math.min(width - 1, x + kernelX));
            const sampleY = Math.max(0, Math.min(height - 1, y + kernelY));
            const sampleIndex = (sampleY * width + sampleX) * 4 + channel;
            const kernelIndex = (kernelY + 1) * 3 + (kernelX + 1);
            value += sourcePixels[sampleIndex] * kernel[kernelIndex];
          }
        }
        outputPixels[targetIndex + channel] = clamp(value);
      }

      outputPixels[targetIndex + 3] = sourcePixels[targetIndex + 3];
    }
  }

  context.putImageData(outputImage, 0, 0);
  return canvas;
}

export function enhanceVinZoneCanvas(sourceCanvas: HTMLCanvasElement) {
  const scaleFactor = sourceCanvas.width < 700 ? 2 : 1.5;
  const outputCanvas = createCanvas(sourceCanvas.width * scaleFactor, sourceCanvas.height * scaleFactor);
  const context = outputCanvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return sourceCanvas;
  }

  context.imageSmoothingEnabled = false;
  context.drawImage(sourceCanvas, 0, 0, outputCanvas.width, outputCanvas.height);
  const imageData = context.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
  const pixels = imageData.data;
  const contrastFactor = 1.55;
  const brightnessOffset = 6;

  for (let index = 0; index < pixels.length; index += 4) {
    const grayscale =
      pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114;
    let value = clamp((grayscale - 128) * contrastFactor + 128 + brightnessOffset);
    value = value > 164 ? 255 : value < 96 ? 0 : value;
    pixels[index] = value;
    pixels[index + 1] = value;
    pixels[index + 2] = value;
  }

  context.putImageData(imageData, 0, 0);
  return applyStrongSharpen(outputCanvas);
}

export function normalizeVinCandidate(value: string | null | undefined) {
  const sanitized = sanitizeVinCharacters(String(value ?? ""));
  if (sanitized.length !== 17) {
    return null;
  }
  if (sanitized.split("").some((character) => !isValidVinCharacter(character))) {
    return null;
  }
  if (countRepeatedCharacters(sanitized) > 6) {
    return null;
  }
  return sanitized;
}

export function extractVinCandidateFromText(value: string | null | undefined) {
  const sanitized = sanitizeVinCharacters(String(value ?? ""));
  if (sanitized.length < 17) {
    return null;
  }

  for (let start = 0; start <= sanitized.length - 17; start += 1) {
    const candidate = normalizeVinCandidate(sanitized.slice(start, start + 17));
    if (candidate) {
      return candidate;
    }
  }

  return null;
}
