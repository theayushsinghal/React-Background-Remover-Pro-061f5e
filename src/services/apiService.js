/**
 * @file src/services/apiService.js
 * @description Browser-based image processing utilities for background removal.
 * This service uses Canvas API and pixel manipulation for client-side background removal.
 */

// Maximum dimensions and total pixels for image processing to prevent browser issues.
const MAX_DIMENSION_SIDE = 8000; // Max width or height in pixels for canvas operations.
const MAX_TOTAL_IMAGE_PIXELS = 30000000; // E.g., approx 5500x5500 or 8000x3750 pixels.

/**
 * Removes the background from an image using client-side canvas and pixel manipulation.
 * This is a basic implementation and its effectiveness will vary depending on image complexity.
 *
 * @param {File} imageFile - The image file to process.
 * @param {Function} [onProgress=null] - Optional callback for progress updates (0-100).
 * @returns {Promise<string>} - A promise that resolves to the processed image data URL (PNG format).
 */
export const removeBackground = (imageFile, onProgress = null) => {
    return new Promise((resolve, reject) => {
        if (!imageFile) {
            return reject(new Error("No image file provided."));
        }

        // Initial synchronous validation (file type, file size in MB)
        try {
            validateImage(imageFile);
        } catch (validationError) {
            return reject(validationError);
        }

        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();

            img.onload = () => {
                // Dimension and total pixel validation (after image is loaded)
                if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                    return reject(new Error("Image has zero dimensions. Cannot process. Please upload a valid image."));
                }
                if (img.naturalWidth > MAX_DIMENSION_SIDE || img.naturalHeight > MAX_DIMENSION_SIDE) {
                    const errorMsg = `Image dimension (${img.naturalWidth}x${img.naturalHeight}px) exceeds the maximum allowed side of ${MAX_DIMENSION_SIDE}px. Please use a smaller image.`;
                    return reject(new Error(errorMsg));
                }
                const totalPixels = img.naturalWidth * img.naturalHeight;
                if (totalPixels > MAX_TOTAL_IMAGE_PIXELS) {
                     const errorMsg = `Image resolution (${img.naturalWidth}x${img.naturalHeight}px = ${totalPixels.toLocaleString()} pixels) is too high for browser processing. Maximum allowed is ${MAX_TOTAL_IMAGE_PIXELS.toLocaleString()} pixels.`;
                    return reject(new Error(errorMsg));
                }

                if (onProgress) onProgress(10); // Progress: Image loaded & dimensions validated

                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d", { willReadFrequently: true });

                if (!ctx) {
                    return reject(new Error("Failed to get canvas 2D context. Your browser may not support it."));
                }

                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;

                ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
                if (onProgress) onProgress(20); // Progress: Image drawn to canvas

                try {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    const { width, height } = canvas;

                    const samplePoints = [
                        [0, 0], [width - 1, 0],
                        [0, height - 1], [width - 1, height - 1],
                        [Math.floor(width / 2), 0], [Math.floor(width / 2), height - 1],
                        [0, Math.floor(height / 2)], [width - 1, Math.floor(height / 2)],
                    ];

                    let rSum = 0, gSum = 0, bSum = 0;
                    let validSamples = 0;

                    samplePoints.forEach(([x, y]) => {
                        const R_OFFSET = (Math.min(y, height - 1) * width + Math.min(x, width - 1)) * 4;
                        if (R_OFFSET + 3 < data.length) {
                            rSum += data[R_OFFSET];
                            gSum += data[R_OFFSET + 1];
                            bSum += data[R_OFFSET + 2];
                            validSamples++;
                        }
                    });
                    
                    const avgBgR = validSamples > 0 ? rSum / validSamples : (data.length > 0 ? data[0] : 0);
                    const avgBgG = validSamples > 0 ? gSum / validSamples : (data.length > 1 ? data[1] : 0);
                    const avgBgB = validSamples > 0 ? bSum / validSamples : (data.length > 2 ? data[2] : 0);
                    
                    if (onProgress) onProgress(30);

                    const colorMatchTolerance = 45;
                    let lastReportedPixelProgress = 30;
                    const totalPixelsToProcess = data.length / 4;

                    // Safety break for extremely long loops (though dimension checks should prevent this)
                    const MAX_ITERATIONS = MAX_TOTAL_IMAGE_PIXELS * 1.5; // A bit more than max pixels
                    let iterations = 0;

                    for (let i = 0; i < data.length; i += 4) {
                        iterations++;
                        if (iterations > MAX_ITERATIONS) {
                            console.warn("Exceeded maximum pixel processing iterations. Aborting.");
                            // This acts as a fallback if dimension checks were somehow bypassed or insufficient
                            // for a specific problematic image structure.
                            throw new Error("Image processing took too long and was aborted to prevent browser freeze. The image might be too complex or an unexpected error occurred.");
                        }

                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];

                        const diff = Math.sqrt(
                            Math.pow(r - avgBgR, 2) +
                            Math.pow(g - avgBgG, 2) +
                            Math.pow(b - avgBgB, 2)
                        );

                        if (diff < colorMatchTolerance) {
                            data[i + 3] = 0;
                        }

                        if (onProgress && totalPixelsToProcess > 0 && (i / 4) % Math.floor(totalPixelsToProcess / 100) === 0) {
                            const loopProgress = Math.floor(((i + 4) / data.length) * 60); // Pixel loop is 60% of progress (30 to 90)
                            const currentTotalProgress = 30 + loopProgress;
                            if (currentTotalProgress > lastReportedPixelProgress && currentTotalProgress <= 90) {
                                onProgress(currentTotalProgress);
                                lastReportedPixelProgress = currentTotalProgress;
                            }
                        }
                    }
                    if (onProgress) onProgress(95);

                    ctx.putImageData(imageData, 0, 0);
                    const resultDataUrl = canvas.toDataURL("image/png");

                    if (onProgress) onProgress(100);
                    resolve(resultDataUrl);

                } catch (processingError) {
                    console.error("Error during canvas image processing:", processingError);
                    reject(new Error(`Canvas processing error: ${processingError.message}`));
                }
            };

            img.onerror = (errorEvent) => {
                console.error("Image loading error:", errorEvent);
                reject(new Error("Failed to load the image. The file might be corrupt or an unsupported format."));
            };

            if (event.target && typeof event.target.result === "string") {
                img.src = event.target.result;
            } else {
                reject(new Error("Failed to read image data from FileReader."));
            }
        };

        reader.onerror = (errorEvent) => {
            console.error("FileReader error:", errorEvent);
            reject(new Error("Failed to read the image file."));
        };

        reader.readAsDataURL(imageFile);
    });
};

/**
 * Validates an image file before attempting to process it.
 * Checks for presence, type, and file size (MB).
 * Dimension checks are done later in `removeBackground` as they require loading the image.
 * @param {File} file - The image file to validate.
 * @returns {boolean} - Returns true if the file is valid according to these criteria.
 * @throws {Error} - Throws an error with a descriptive message if validation fails.
 */
export const validateImage = (file) => {
    if (!file) {
        throw new Error("No file selected.");
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
        throw new Error(`Invalid file type: "${file.type}". Please upload a JPEG, PNG, or WebP image.`);
    }

    const maxSizeInBytes = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSizeInBytes) {
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
        throw new Error(`File is too large (${fileSizeMB}MB). Maximum size for browser processing is 20MB.`);
    }
    // Note: Image dimension (width/height) and total pixel validation occurs asynchronously
    // within the `removeBackground` function itself, after the image is loaded,
    // as it's not possible to get dimensions synchronously from a File object.
    return true;
};
