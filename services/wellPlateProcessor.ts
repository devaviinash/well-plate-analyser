import type { Point, WellResult, RGB } from '../types';

const NUM_ROWS = 8;
const NUM_COLS = 6;
// Further reduced radius factor for more conservative sampling, avoiding edges and glare spots near edges.
const WELL_RADIUS_FACTOR = 0.30; 

interface Lab { l: number; a: number; b: number; }

/**
 * Converts an RGB color value to the perceptually uniform CIE L*a*b* color space.
 * This is the standard for accurate color difference measurement.
 * The conversion is a two-step process: RGB -> XYZ -> L*a*b*.
 */
function rgbToLab(rgb: RGB): Lab {
    // Step 1: sRGB to linear RGB
    let r = rgb.r / 255;
    let g = rgb.g / 255;
    let b = rgb.b / 255;

    r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    
    // Step 2: Linear RGB to XYZ (using D65 illuminant reference)
    const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
    const y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
    const z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;
    
    // Step 3: XYZ to L*a*b*
    let varX = x / 0.95047; // Observer= 2°, Illuminant= D65
    let varY = y / 1.00000;
    let varZ = z / 1.08883;

    const f = (t: number) => (t > 0.008856) ? Math.pow(t, 1 / 3) : (7.787 * t) + (16 / 116);

    varX = f(varX);
    varY = f(varY);
    varZ = f(varZ);

    const l = (116 * varY) - 16;
    const a = 500 * (varX - varY);
    const b_lab = 200 * (varY - varZ);
    
    return { l: l, a: a, b: b_lab };
}

/**
 * Converts a CIE L*a*b* color value back to sRGB.
 * This is the reverse of the rgbToLab conversion.
 */
function labToRgb(lab: Lab): RGB {
    let y = (lab.l + 16) / 116;
    let x = lab.a / 500 + y;
    let z = y - lab.b / 200;

    const f_inv = (t: number) => (t > 0.206897) ? Math.pow(t, 3) : (t - 16 / 116) / 7.787;

    x = f_inv(x) * 0.95047;
    y = f_inv(y) * 1.00000;
    z = f_inv(z) * 1.08883;
    
    // XYZ to linear RGB (D65 illuminant)
    let r = x *  3.2404542 + y * -1.5371385 + z * -0.4985314;
    let g = x * -0.9692660 + y *  1.8760108 + z *  0.0415560;
    let b = x *  0.0556434 + y * -0.2040259 + z *  1.0572252;
    
    // Linear RGB to sRGB
    const toSrgb = (c: number) => (c > 0.0031308) ? (1.055 * Math.pow(c, 1 / 2.4) - 0.055) : (12.92 * c);
    
    r = toSrgb(r);
    g = toSrgb(g);
    b = toSrgb(b);

    // Clamp and scale to 0-255
    const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val * 255)));

    return { r: clamp(r), g: clamp(g), b: clamp(b) };
}

function getPixelData(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): RGB[] {
  radius = Math.max(1, Math.round(radius));
  const pixels: RGB[] = [];
  try {
    const imageData = ctx.getImageData(Math.round(x - radius), Math.round(y - radius), radius * 2, radius * 2);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const px = (i / 4) % (radius * 2);
      const py = Math.floor((i / 4) / (radius * 2));
      const dist = Math.sqrt(Math.pow(px - radius, 2) + Math.pow(py - radius, 2));
      if (dist <= radius) {
        pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
      }
    }
  } catch (e) {
    console.error("Error getting pixel data for well at", {x, y, radius}, e);
  }
  return pixels;
}

/**
 * Calculates a robust representative color by finding the median color in the CIELAB space.
 * This method is highly resistant to outliers like glare and shadows.
 */
function getRobustAverageColor(pixels: RGB[]): RGB {
    if (pixels.length === 0) {
        return { r: 0, g: 0, b: 0 };
    }
    if (pixels.length === 1) {
        return pixels[0];
    }

    // Convert all pixels to LAB space for perceptually uniform analysis
    const labPixels = pixels.map(rgbToLab);
    
    // Separate L*, a*, b* channels and sort them to find the median
    const l_values = labPixels.map(p => p.l).sort((a, b) => a - b);
    const a_values = labPixels.map(p => p.a).sort((a, b) => a - b);
    const b_values = labPixels.map(p => p.b).sort((a, b) => a - b);

    // Find the median of each channel. The median is a robust measure of central tendency.
    const mid = Math.floor(l_values.length / 2);
    const medianL = l_values.length % 2 === 0 ? (l_values[mid - 1] + l_values[mid]) / 2 : l_values[mid];
    const medianA = a_values.length % 2 === 0 ? (a_values[mid - 1] + a_values[mid]) / 2 : a_values[mid];
    const medianB = b_values.length % 2 === 0 ? (b_values[mid - 1] + b_values[mid]) / 2 : b_values[mid];
    
    // Reconstruct the median color in LAB space and convert back to RGB for display and further processing
    const medianLabColor: Lab = { l: medianL, a: medianA, b: medianB };
    
    return labToRgb(medianLabColor);
}

export async function processWellPlate(
  imageUrl: string,
  a1: Point,
  h6: Point,
  minColorPoint: Point,
  maxColorPoint: Point,
): Promise<WellResult[]> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "Anonymous";
    image.src = imageUrl;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }
      ctx.drawImage(image, 0, 0);
      
      const dx = (h6.x - a1.x) / (NUM_COLS - 1);
      const dy = (h6.y - a1.y) / (NUM_ROWS - 1);
      const radius = Math.min(Math.abs(dx), Math.abs(dy)) * WELL_RADIUS_FACTOR;

      // Get robust median RGB colors from user-selected reference points
      const minColorPixels = getPixelData(ctx, minColorPoint.x, minColorPoint.y, radius);
      const maxColorPixels = getPixelData(ctx, maxColorPoint.x, maxColorPoint.y, radius);

      if (minColorPixels.length === 0 || maxColorPixels.length === 0) {
        return reject(new Error('Could not sample reference colors. Please ensure calibration points are inside wells.'));
      }
      
      const minRefRgb = getRobustAverageColor(minColorPixels);
      const maxRefRgb = getRobustAverageColor(maxColorPixels);

      const labMin = rgbToLab(minRefRgb);
      const labMax = rgbToLab(maxRefRgb);

      const gradientVector = {
          l: labMax.l - labMin.l,
          a: labMax.a - labMin.a,
          b: labMax.b - labMin.b
      };
      const gradientMagSq = Math.pow(gradientVector.l, 2) + Math.pow(gradientVector.a, 2) + Math.pow(gradientVector.b, 2);

      const results: WellResult[] = [];
      
      for (let row = 0; row < NUM_ROWS; row++) {
        for (let col = 0; col < NUM_COLS; col++) {
          const centerX = a1.x + col * dx;
          const centerY = a1.y + row * dy;
          
          const pixels = getPixelData(ctx, centerX, centerY, radius);
          const avgColor = getRobustAverageColor(pixels);

          let intensity = 0;
          let cellCount = 0;

          if (pixels.length > 0 && gradientMagSq > 1e-6) {
              const labWell = rgbToLab(avgColor);

              const wellVector = {
                  l: labWell.l - labMin.l,
                  a: labWell.a - labMin.a,
                  b: labWell.b - labMin.b
              };

              const dotProduct = (wellVector.l * gradientVector.l) + (wellVector.a * gradientVector.a) + (wellVector.b * gradientVector.b);
              
              intensity = dotProduct / gradientMagSq;
              intensity = Math.max(0, Math.min(1, intensity));
              
              // Apply a quadratic "ease-in" curve. This is very flat near zero, ensuring that
              // colors very close to the reference blue are mapped robustly to a cell count of 0.
              cellCount = Math.pow(intensity, 2) * 10000;
          }
          
          results.push({
            id: `${String.fromCharCode(65 + row)}${col + 1}`,
            row,
            col,
            center: { x: centerX, y: centerY },
            avgColor,
            intensity,
            cellCount
          });
        }
      }
      resolve(results);
    };
    image.onerror = (err) => reject(err);
  });
}