function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

function copyCanvas(source: HTMLCanvasElement) {
  const canvas = createCanvas(source.width, source.height);
  const context = canvas.getContext("2d");
  if (context) {
    context.drawImage(source, 0, 0);
  }
  return canvas;
}

function isMeaningfulPixel(
  red: number,
  green: number,
  blue: number,
  alpha: number,
  whiteThreshold: number,
) {
  if (alpha < 12) {
    return false;
  }

  const luminance = red * 0.299 + green * 0.587 + blue * 0.114;
  const colorSpread = Math.max(red, green, blue) - Math.min(red, green, blue);
  return luminance < whiteThreshold || colorSpread > 18;
}

function cropCanvas(
  sourceCanvas: HTMLCanvasElement,
  left: number,
  top: number,
  width: number,
  height: number,
) {
  const croppedCanvas = createCanvas(width, height);
  const croppedContext = croppedCanvas.getContext("2d");
  if (!croppedContext) {
    return copyCanvas(sourceCanvas);
  }

  croppedContext.drawImage(
    sourceCanvas,
    left,
    top,
    width,
    height,
    0,
    0,
    width,
    height,
  );
  return croppedCanvas;
}

function findBoundingBox(
  sourceCanvas: HTMLCanvasElement,
  minimumRowRatio: number,
  minimumColumnRatio: number,
) {
  const context = sourceCanvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return null;
  }

  const { width, height } = sourceCanvas;
  const imageData = context.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const rowHits = new Array<number>(height).fill(0);
  const columnHits = new Array<number>(width).fill(0);
  const whiteThreshold = 244;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      if (
        isMeaningfulPixel(
          pixels[index],
          pixels[index + 1],
          pixels[index + 2],
          pixels[index + 3],
          whiteThreshold,
        )
      ) {
        rowHits[y] += 1;
        columnHits[x] += 1;
      }
    }
  }

  const minimumRowHits = Math.max(8, Math.round(width * minimumRowRatio));
  const minimumColumnHits = Math.max(8, Math.round(height * minimumColumnRatio));
  const top = rowHits.findIndex((count) => count >= minimumRowHits);
  const left = columnHits.findIndex((count) => count >= minimumColumnHits);
  let bottom = rowHits.length - 1;
  let right = columnHits.length - 1;

  while (bottom >= 0 && rowHits[bottom] < minimumRowHits) {
    bottom -= 1;
  }
  while (right >= 0 && columnHits[right] < minimumColumnHits) {
    right -= 1;
  }

  if (top < 0 || left < 0 || bottom <= top || right <= left) {
    return null;
  }

  return { bottom, left, right, top };
}

function detectVinZoneCanvas(mainCanvas: HTMLCanvasElement) {
  const { width, height } = mainCanvas;
  const candidateLeft = Math.max(0, Math.round(width * 0.16));
  const candidateTop = Math.max(0, Math.round(height * 0.28));
  const candidateWidth = Math.max(1, Math.round(width * 0.76));
  const candidateHeight = Math.max(1, Math.round(height * 0.28));
  const candidateCanvas = cropCanvas(
    mainCanvas,
    candidateLeft,
    candidateTop,
    Math.min(candidateWidth, width - candidateLeft),
    Math.min(candidateHeight, height - candidateTop),
  );

  const vinBox = findBoundingBox(candidateCanvas, 0.008, 0.01);
  if (!vinBox) {
    return candidateCanvas;
  }

  const vinPaddingX = Math.max(10, Math.round((vinBox.right - vinBox.left) * 0.08));
  const vinPaddingY = Math.max(8, Math.round((vinBox.bottom - vinBox.top) * 0.35));
  const cropLeft = Math.max(0, vinBox.left - vinPaddingX);
  const cropTop = Math.max(0, vinBox.top - vinPaddingY);
  const cropRight = Math.min(candidateCanvas.width, vinBox.right + vinPaddingX);
  const cropBottom = Math.min(candidateCanvas.height, vinBox.bottom + vinPaddingY);

  return cropCanvas(
    candidateCanvas,
    cropLeft,
    cropTop,
    Math.max(1, cropRight - cropLeft),
    Math.max(1, cropBottom - cropTop),
  );
}

export type DetectedLibrettoZones = {
  mainCanvas: HTMLCanvasElement;
  vinCanvas: HTMLCanvasElement | null;
};

export function detectLibrettoZoneCanvases(sourceCanvas: HTMLCanvasElement): DetectedLibrettoZones {
  const context = sourceCanvas.getContext("2d", { willReadFrequently: true });
  if (!context || !sourceCanvas.width || !sourceCanvas.height) {
    return {
      mainCanvas: copyCanvas(sourceCanvas),
      vinCanvas: null,
    };
  }

  const boundingBox = findBoundingBox(sourceCanvas, 0.015, 0.015);
  if (!boundingBox) {
    return {
      mainCanvas: copyCanvas(sourceCanvas),
      vinCanvas: null,
    };
  }

  const paddingX = Math.max(12, Math.round((boundingBox.right - boundingBox.left) * 0.025));
  const paddingY = Math.max(12, Math.round((boundingBox.bottom - boundingBox.top) * 0.025));
  const cropLeft = Math.max(0, boundingBox.left - paddingX);
  const cropTop = Math.max(0, boundingBox.top - paddingY);
  const cropRight = Math.min(sourceCanvas.width, boundingBox.right + paddingX);
  const cropBottom = Math.min(sourceCanvas.height, boundingBox.bottom + paddingY);
  const mainCanvas = cropCanvas(
    sourceCanvas,
    cropLeft,
    cropTop,
    Math.max(1, cropRight - cropLeft),
    Math.max(1, cropBottom - cropTop),
  );

  return {
    mainCanvas,
    vinCanvas: detectVinZoneCanvas(mainCanvas),
  };
}

export function detectLibrettoZones(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  return detectLibrettoZoneCanvases(sourceCanvas).mainCanvas;
}
