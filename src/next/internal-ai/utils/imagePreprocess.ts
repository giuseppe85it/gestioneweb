import { detectLibrettoZoneCanvases } from "./librettoZoneDetection";
import { enhanceVinZoneCanvas } from "./librettoVinEnhance";

type OptimizedImageDebugResult = {
  base64: string;
  finalDataUrl: string;
  mimeType: "image/jpeg";
  preprocessDataUrl: string;
  vinDataUrl: string | null;
};

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

function clamp(value: number) {
  return Math.max(0, Math.min(255, value));
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossibile leggere l'immagine selezionata."));
    };
    image.src = url;
  });
}

function applySimpleSharpen(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return canvas;
  }

  const { width, height } = canvas;
  const sourceImage = context.getImageData(0, 0, width, height);
  const sourcePixels = sourceImage.data;
  const outputImage = context.createImageData(width, height);
  const outputPixels = outputImage.data;
  const kernel = [0, -1, 0, -1, 5.2, -1, 0, -1, 0];

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

function canvasToJpegDataUrl(canvas: HTMLCanvasElement, quality = 0.92) {
  return canvas.toDataURL("image/jpeg", quality);
}

function extractBase64(dataUrl: string) {
  const commaIndex = dataUrl.indexOf(",");
  return commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
}

export async function preprocessImage(file: File): Promise<HTMLCanvasElement> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Il preprocess richiede un file immagine.");
  }

  const image = await loadImage(file);
  const resizeRatio = image.width > 1600 ? 1600 / image.width : 1;
  const targetWidth = Math.max(1, Math.round(image.width * resizeRatio));
  const targetHeight = Math.max(1, Math.round(image.height * resizeRatio));
  const canvas = createCanvas(targetWidth, targetHeight);
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Canvas non disponibile per il preprocess.");
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  const imageData = context.getImageData(0, 0, targetWidth, targetHeight);
  const pixels = imageData.data;
  const contrastFactor = 1.25;
  const brightnessOffset = 255 * 0.1;
  const grayscaleMix = 0.18;

  for (let index = 0; index < pixels.length; index += 4) {
    let red = pixels[index];
    let green = pixels[index + 1];
    let blue = pixels[index + 2];

    red = clamp((red - 128) * contrastFactor + 128 + brightnessOffset);
    green = clamp((green - 128) * contrastFactor + 128 + brightnessOffset);
    blue = clamp((blue - 128) * contrastFactor + 128 + brightnessOffset);

    const grayscale = red * 0.299 + green * 0.587 + blue * 0.114;
    pixels[index] = clamp(red * (1 - grayscaleMix) + grayscale * grayscaleMix);
    pixels[index + 1] = clamp(green * (1 - grayscaleMix) + grayscale * grayscaleMix);
    pixels[index + 2] = clamp(blue * (1 - grayscaleMix) + grayscale * grayscaleMix);
  }

  context.putImageData(imageData, 0, 0);
  return applySimpleSharpen(canvas);
}

export async function buildOptimizedImageDebug(file: File): Promise<OptimizedImageDebugResult> {
  const preprocessCanvas = await preprocessImage(file);
  const detectedZones = detectLibrettoZoneCanvases(preprocessCanvas);
  const finalCanvas = detectedZones.mainCanvas;
  const vinCanvas = detectedZones.vinCanvas ? enhanceVinZoneCanvas(detectedZones.vinCanvas) : null;
  const preprocessDataUrl = canvasToJpegDataUrl(preprocessCanvas, 0.9);
  const finalDataUrl = canvasToJpegDataUrl(finalCanvas, 0.92);

  return {
    base64: extractBase64(finalDataUrl),
    finalDataUrl,
    mimeType: "image/jpeg",
    preprocessDataUrl,
    vinDataUrl: vinCanvas ? canvasToJpegDataUrl(vinCanvas, 0.94) : null,
  };
}

export async function buildOptimizedImage(file: File): Promise<string> {
  const optimized = await buildOptimizedImageDebug(file);
  return optimized.base64;
}
