// src/utils/imageProcessing.js

/**
 * @file Contains utility functions for client-side image processing using the Canvas API.
 * These functions include color detection, alpha channel manipulation, basic edge detection,
 * image validation, and preprocessing steps like resizing.
 */

// --- Constants for validation and resizing ---
export const MAX_PROCESSING_DIMENSION_SIDE = 4000; // Max width or height for an image to be processed directly or resized to.
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
export const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
export const DEFAULT_OUTPUT_MIME_TYPE = "image/png"; // Ensures transparency support after processing.
export const DEFAULT_OUTPUT_QUALITY = 0.92; // For lossy formats like JPEG/WebP.

// --- NEW VALIDATION AND PREPROCESSING FUNCTIONS ---

/**
 * Validates an image file based on its type and size.
 * @param {File} file - The image file to validate.
 * @param {object} [options] - Validation options.
 * @param {number} [options.maxFileSize=MAX_FILE_SIZE_BYTES] - Maximum allowed file size in bytes.
 * @param {string[]} [options.allowedTypes=VALID_IMAGE_TYPES] - Array of allowed MIME types.
 * @throws {Error} If validation fails.
 * @returns {true} If validation passes.
 */
export function validateImageFile(file, options = {}) {
    const {
        maxFileSize = MAX_FILE_SIZE_BYTES,
        allowedTypes = VALID_IMAGE_TYPES
    } = options;

    if (!file) {
        throw new Error("No file provided for validation.");
    }
    if (!(file instanceof File)) {
        throw new Error("Invalid input: Expected a File object.");
    }
    if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type: "${file.type}". Allowed types: ${allowedTypes.join(", ")}.`);
    }
    if (file.size > maxFileSize) {
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
        const maxFileSizeMB = (maxFileSize / 1024 / 1024).toFixed(2);
        throw new Error(`File is too large (${fileSizeMB}MB). Maximum allowed size is ${maxFileSizeMB}MB.`);
    }
    return true;
}

/**
 * Loads a File object or a data/object URL into an HTMLImageElement.
 * @param {File | string} fileOrUrl - The File object or image URL (data URL, object URL, or regular URL).
 * @returns {Promise<HTMLImageElement>} A promise that resolves with the loaded HTMLImageElement.
 * @throws {Error} If loading fails.
 */
export function loadImageElement(fileOrUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        // If the image source is from a different origin and that origin doesn't have CORS headers,
        // the canvas can become tainted, preventing toDataURL() or getImageData().
        // For File objects or data URLs, this is not an issue. For external URLs, it could be.
        // If processing external URLs, `img.crossOrigin = "Anonymous";` might be needed.
        // However, since we primarily deal with user-uploaded Files (converted to data URLs),
        // crossOrigin is not strictly necessary here.

        img.onload = () => resolve(img);
        img.onerror = (err) => {
            console.error("Image loading error:", err, img.src.substring(0,100)); // Log part of src for debugging
            reject(new Error("Failed to load image. It might be corrupt, an unsupported format, or a network issue if URL."));
        };
        
        if (typeof fileOrUrl === "string") {
            img.src = fileOrUrl;
        } else if (fileOrUrl instanceof File) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target && typeof e.target.result === "string") {
                    img.src = e.target.result;
                } else {
                     reject(new Error("FileReader did not return a valid string result for the image."));
                }
            };
            reader.onerror = (fileReaderError) => {
                console.error("FileReader error:", fileReaderError);
                reject(new Error("Failed to read file using FileReader."));
            };
            reader.readAsDataURL(fileOrUrl);
        } else {
            reject(new Error("Invalid input for loadImageElement: Expected a File object or a URL string."));
        }
    });
}

/**
 * Preprocesses an image file: validates, loads, and resizes if necessary.
 * @param {File} file - The image File object to process.
 * @param {object} [options] - Preprocessing options.
 * @param {number} [options.maxFileSize=MAX_FILE_SIZE_BYTES] - Max file size for initial validation.
 * @param {string[]} [options.allowedTypes=VALID_IMAGE_TYPES] - Allowed MIME types for validation.
 * @param {number} [options.targetMaxSide=MAX_PROCESSING_DIMENSION_SIDE] - Target maximum side length (width or height) for resizing.
 * @param {string} [options.outputMimeType=DEFAULT_OUTPUT_MIME_TYPE] - Desired output MIME type (e.g., "image/png", "image/jpeg").
 * @param {number} [options.outputQuality=DEFAULT_OUTPUT_QUALITY] - Quality for lossy formats (0.0 to 1.0).
 * @returns {Promise<{dataUrl: string, width: number, height: number, wasResized: boolean, originalWidth: number, originalHeight: number, mimeType: string}>}
 *          A promise resolving to an object with the processed image's data URL, dimensions, and processing info.
 * @throws {Error} If any step of validation or processing fails.
 */
export async function ensureProcessableImage(file, options = {}) {
    const {
        maxFileSize = MAX_FILE_SIZE_BYTES,
        allowedTypes = VALID_IMAGE_TYPES,
        targetMaxSide = MAX_PROCESSING_DIMENSION_SIDE,
        outputMimeType = DEFAULT_OUTPUT_MIME_TYPE,
        outputQuality = DEFAULT_OUTPUT_QUALITY
    } = options;

    // 1. Synchronous file validation (type, size)
    validateImageFile(file, { maxFileSize, allowedTypes }); // Throws on error

    // 2. Load image to get actual dimensions
    const imageElement = await loadImageElement(file);
    const originalWidth = imageElement.naturalWidth;
    const originalHeight = imageElement.naturalHeight;

    if (originalWidth === 0 || originalHeight === 0) {
        throw new Error("Image has zero dimensions and cannot be processed.");
    }

    // 3. Determine if resize is needed
    let newWidth = originalWidth;
    let newHeight = originalHeight;
    let wasResized = false;

    if (originalWidth > targetMaxSide || originalHeight > targetMaxSide) {
        wasResized = true;
        if (originalWidth > originalHeight) {
            newWidth = targetMaxSide;
            newHeight = Math.round((originalHeight / originalWidth) * targetMaxSide);
        } else {
            newHeight = targetMaxSide;
            newWidth = Math.round((originalWidth / originalHeight) * targetMaxSide);
        }
        // Ensure dimensions are at least 1px
        newWidth = Math.max(1, newWidth);
        newHeight = Math.max(1, newHeight);
    }

    // 4. Create canvas, draw (resized or original), and get data URL
    const canvas = document.createElement("canvas");
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Failed to get 2D context for image preprocessing.");
    }
    
    // Improve drawing quality for downscaling if significant resize happened
    if (wasResized && (originalWidth / newWidth > 2 || originalHeight / newHeight > 2) ) {
        ctx.imageSmoothingQuality = "high";
    } else {
        ctx.imageSmoothingQuality = "medium"; // Or 'low' for performance, 'high' for quality
    }
    ctx.imageSmoothingEnabled = true;
    
    ctx.drawImage(imageElement, 0, 0, newWidth, newHeight);

    let dataUrl;
    try {
        dataUrl = canvas.toDataURL(outputMimeType, (outputMimeType === "image/jpeg" || outputMimeType === "image/webp") ? outputQuality : undefined);
    } catch (e) {
        console.error("Canvas toDataURL error:", e);
        throw new Error(`Failed to convert canvas to data URL. MIME type: ${outputMimeType}. Error: ${e.message}`);
    }

    return {
        dataUrl,
        width: newWidth,
        height: newHeight,
        wasResized,
        originalWidth,
        originalHeight,
        mimeType: outputMimeType
    };
}


// --- EXISTING PIXEL MANIPULATION FUNCTIONS ---

/**
 * Calculates the Euclidean distance between two RGB colors.
 * @param {{r: number, g: number, b: number}} color1 - The first color {r, g, b} (0-255).
 * @param {{r: number, g: number, b: number}} color2 - The second color {r, g, b} (0-255).
 * @returns {number} The distance between the two colors.
 */
export function calculateRgbDistance(color1, color2) {
    return Math.sqrt(
        Math.pow(color1.r - color2.r, 2) +
        Math.pow(color1.g - color2.g, 2) +
        Math.pow(color1.b - color2.b, 2)
    );
}

/**
 * Retrieves the RGBA color of a specific pixel from ImageData.
 * @param {ImageData} imageData - The ImageData object.
 * @param {number} x - The x-coordinate of the pixel.
 * @param {number} y - The y-coordinate of the pixel.
 * @param {number} width - The width of the image (for index calculation).
 * @returns {{r: number, g: number, b: number, a: number} | null} The pixel's color {r,g,b,a}, or null if out of bounds.
 */
export function getPixelColor(imageData, x, y, width) {
    if (x < 0 || x >= width || y < 0 || y >= imageData.height) {
        return null; // Out of bounds
    }
    const index = (Math.floor(y) * width + Math.floor(x)) * 4;
    const data = imageData.data;
    if (index + 3 >= data.length) return null; // Boundary check
    return { r: data[index], g: data[index + 1], b: data[index + 2], a: data[index + 3] };
}

/**
 * Sets the alpha value of a pixel at a given index in ImageData.data.
 * @param {ImageData} imageData - The ImageData object (its .data property will be modified).
 * @param {number} pixelStartIndex - The starting index of the pixel in the imageData.data array (e.g., (y * width + x) * 4).
 * @param {number} alphaValue - The new alpha value (0-255). 0 is fully transparent, 255 is fully opaque.
 */
export function setPixelAlpha(imageData, pixelStartIndex, alphaValue) {
    if (pixelStartIndex >= 0 && pixelStartIndex + 3 < imageData.data.length) {
        imageData.data[pixelStartIndex + 3] = Math.max(0, Math.min(255, alphaValue));
    }
}

/**
 * Samples pixel colors from specified points in the image data and computes the average RGB color.
 * @param {ImageData} imageData - The ImageData object.
 * @param {number} width - The width of the image.
 * @param {number} height - The height of the image.
 * @param {Array<[number, number]>} samplePoints - An array of [x, y] coordinates to sample. Coordinates should be within image bounds.
 * @returns {{r: number, g: number, b: number} | null} The average RGB color, or null if no valid samples found.
 */
export function sampleAverageColor(imageData, width, height, samplePoints) {
    let rSum = 0, gSum = 0, bSum = 0;
    let validSamples = 0;
    const data = imageData.data;

    for (const [x, y] of samplePoints) {
        const currentX = Math.floor(x);
        const currentY = Math.floor(y);

        if (currentX >= 0 && currentX < width && currentY >= 0 && currentY < height) {
            const index = (currentY * width + currentX) * 4;
            if (index + 2 < data.length) { // Ensure we can read R, G, B
                rSum += data[index];
                gSum += data[index + 1];
                bSum += data[index + 2];
                validSamples++;
            }
        }
    }

    if (validSamples === 0) {
        return null;
    }

    return {
        r: Math.round(rSum / validSamples),
        g: Math.round(gSum / validSamples),
        b: Math.round(bSum / validSamples),
    };
}

/**
 * Modifies ImageData in place, making pixels of a target color (within a tolerance) transparent.
 * @param {ImageData} imageData - The ImageData object to modify.
 * @param {{r: number, g: number, b: number}} targetRgb - The RGB color to target for transparency.
 * @param {number} tolerance - The acceptable color distance from targetRgb. Higher values are more lenient (e.g., 0-100).
 * @param {function(number):void} [onProgress] - Optional callback for progress updates (percentage 0-100).
 */
export function manipulateAlphaByColorMatch(imageData, targetRgb, tolerance, onProgress) {
    const data = imageData.data;
    const totalPixels = data.length / 4;
    let lastReportedProgress = -1; // Start at -1 to ensure 0% is reported if onProgress is provided

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const distance = calculateRgbDistance({ r, g, b }, targetRgb);

        if (distance <= tolerance) {
            data[i + 3] = 0; // Make transparent
        }

        if (onProgress) {
            const processedPixels = (i / 4) + 1;
            const progress = Math.floor((processedPixels / totalPixels) * 100);
            if (progress > lastReportedProgress) {
                onProgress(progress);
                lastReportedProgress = progress;
            }
        }
    }
    // Ensure 100% is reported if it wasn't hit exactly
    if (onProgress && lastReportedProgress < 100 && totalPixels > 0) {
        onProgress(100);
    } else if (onProgress && totalPixels === 0) {
        onProgress(100); // Handle empty image case
    }
}

/**
 * Converts ImageData to grayscale in place.
 * Uses the luminosity method for grayscale conversion: Gray = 0.299*R + 0.587*G + 0.114*B.
 * @param {ImageData} imageData - The ImageData object to modify.
 */
export function convertToGrayscaleInPlace(imageData) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const grayscale = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        data[i] = grayscale;
        data[i + 1] = grayscale;
        data[i + 2] = grayscale;
        // Alpha (data[i+3]) remains unchanged
    }
}

// Sobel kernels for edge detection
const SOBEL_X_KERNEL = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
];

const SOBEL_Y_KERNEL = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
];

/**
 * Applies a 3x3 convolution kernel to a single channel of a pixel in ImageData.
 * Handles image boundaries by clamping coordinates (edge replication).
 * @private
 * @param {Uint8ClampedArray} sourceData - The source image data array (e.g., from a grayscale image).
 * @param {number} x - The x-coordinate of the center pixel for convolution.
 * @param {number} y - The y-coordinate of the center pixel for convolution.
 * @param {number} width - The width of the source image.
 * @param {number} height - The height of the source image.
 * @param {Array<Array<number>>} kernel - The 3x3 convolution kernel.
 * @returns {number} The convolved pixel value for the specified channel (implicitly red/gray).
 */
function _applyConvolutionKernelToGrayscale(sourceData, x, y, width, height, kernel) {
    let sum = 0;
    for (let ky = -1; ky <= 1; ky++) { // Kernel Y
        for (let kx = -1; kx <= 1; kx++) { // Kernel X
            const pixelX = Math.min(width - 1, Math.max(0, x + kx)); // Clamp X
            const pixelY = Math.min(height - 1, Math.max(0, y + ky)); // Clamp Y
            
            const pixelIndex = (pixelY * width + pixelX) * 4;
            // For grayscale, R, G, and B channels are the same. Use Red channel (index 0).
            const pixelValue = sourceData[pixelIndex]; 
            const kernelValue = kernel[ky + 1][kx + 1];
            sum += pixelValue * kernelValue;
        }
    }
    return sum;
}

/**
 * Applies Sobel edge detection to an ImageData object.
 * The source image is first converted to grayscale.
 * Returns a new ImageData object representing the edge magnitudes (as a grayscale image).
 * @param {ImageData} sourceImageData - The original ImageData.
 * @param {number} width - The width of the image.
 * @param {number} height - The height of the image.
 * @returns {ImageData} A new ImageData object containing the Sobel edge map. Returns source if context fails.
 */
export function applySobelFilter(sourceImageData, width, height) {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });

    if (!tempCtx) {
        console.error("Failed to get 2D context for Sobel filter processing.");
        // Fallback: return a copy of the original ImageData or an empty one
        const fallbackImageData = new ImageData(width, height);
        if (sourceImageData && sourceImageData.data) fallbackImageData.data.set(sourceImageData.data);
        return fallbackImageData;
    }

    const grayscaleImageData = tempCtx.createImageData(width, height);
    if (sourceImageData && sourceImageData.data) { // Ensure sourceImageData.data exists
      grayscaleImageData.data.set(sourceImageData.data);
      convertToGrayscaleInPlace(grayscaleImageData);
    } else {
      // Handle case where sourceImageData is problematic (e.g., null or no data)
      // Fill with black or some default
      for(let i=0; i<grayscaleImageData.data.length; i+=4) {
        grayscaleImageData.data[i] = 0;
        grayscaleImageData.data[i+1] = 0;
        grayscaleImageData.data[i+2] = 0;
        grayscaleImageData.data[i+3] = 255;
      }
    }
    const grayscaleData = grayscaleImageData.data;

    const outputImageData = tempCtx.createImageData(width, height);
    const outputData = outputImageData.data;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const gx = _applyConvolutionKernelToGrayscale(grayscaleData, x, y, width, height, SOBEL_X_KERNEL);
            const gy = _applyConvolutionKernelToGrayscale(grayscaleData, x, y, width, height, SOBEL_Y_KERNEL);

            const magnitude = Math.sqrt(gx * gx + gy * gy);
            const clampedMagnitude = Math.min(255, Math.max(0, Math.round(magnitude)));

            const outputIndex = (y * width + x) * 4;
            outputData[outputIndex] = clampedMagnitude;     // Red
            outputData[outputIndex + 1] = clampedMagnitude; // Green
            outputData[outputIndex + 2] = clampedMagnitude; // Blue
            outputData[outputIndex + 3] = 255;              // Alpha (fully opaque)
        }
    }
    return outputImageData;
}
