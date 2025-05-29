import React, { useState, useCallback } from "react";
import { removeBackground, validateImage } from "../services/apiService";

// Define maximum dimension for canvas processing to prevent performance issues / crashes
const MAX_IMAGE_DIMENSION = 8000; // Max width or height in pixels

const ImageProcessor = ({ selectedImage, onProcessingComplete, onError, onProcessingStart }) => {
    const [progress, setProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const checkImageDimensions = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    if (img.naturalWidth > MAX_IMAGE_DIMENSION || img.naturalHeight > MAX_IMAGE_DIMENSION) {
                        reject(new Error(`Image dimensions (${img.naturalWidth}x${img.naturalHeight}px) are too large. Maximum allowed dimension (width or height) is ${MAX_IMAGE_DIMENSION}px. Please use a smaller image.`));
                    } else if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                        reject(new Error("Image has zero dimensions. Please upload a valid image."));
                    }
                    else {
                        resolve(); // Dimensions are within acceptable limits
                    }
                };
                img.onerror = () => {
                    reject(new Error("Could not load image to check dimensions. The file might be corrupt or an unsupported format."));
                };
                if (event.target && typeof event.target.result === "string") {
                    img.src = event.target.result;
                } else {
                    reject(new Error("Failed to read image data for dimension check."));
                }
            };
            reader.onerror = () => {
                reject(new Error("Failed to read the image file for dimension check."));
            };
            reader.readAsDataURL(file);
        });
    };

    const processImage = useCallback(async () => {
        if (!selectedImage) {
            if (onError) onError("No image selected for processing.");
            return;
        }

        if (onProcessingStart) onProcessingStart();
        setIsProcessing(true);
        setProgress(0);
        if (onError) onError(null); // Reset previous errors

        try {
            // Step 1: Validate file type and size (from apiService)
            validateImage(selectedImage);

            // Step 2: Validate image dimensions before attempting canvas operations
            await checkImageDimensions(selectedImage);
            setProgress(5); // Small progress increment after dimension check

            // Step 3: Process the image using the browser-based utility from apiService
            const processedImageUrl = await removeBackground(
                selectedImage,
                (progressPercent) => {
                    // Scale progress from removeBackground (0-100) to fit within 5-100 range here
                    setProgress(5 + Math.floor(progressPercent * 0.95));
                }
            );

            // Notify parent component of successful processing
            if (onProcessingComplete) onProcessingComplete(processedImageUrl);

        } catch (error) {
            console.error("Image processing error:", error);
            if (onError) onError(error.message || "An unknown error occurred during image processing.");
            setProgress(0); // Reset progress on error
        } finally {
            setIsProcessing(false);
        }
    }, [selectedImage, onProcessingStart, onProcessingComplete, onError]);

    if (!selectedImage) {
        return null;
    }

    return (
        <div className="w-full max-w-2xl mx-auto p-4">
            <div className="bg-white rounded-xl shadow-lg p-6">
                {!isProcessing ? (
                    <button
                        onClick={processImage}
                        className="w-full flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        disabled={isProcessing}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="20" height="20"><rect width="256" height="256" fill="none"/><line x1="216" y1="128" x2="216" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="192" y1="152" x2="240" y2="152" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="80" y1="40" x2="80" y2="88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="56" y1="64" x2="104" y2="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="168" y1="184" x2="168" y2="216" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="152" y1="200" x2="184" y2="200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="144" y1="80" x2="176" y2="112" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><rect x="21.49" y="105.37" width="213.02" height="45.25" rx="8" transform="translate(-53.02 128) rotate(-45)" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/></svg>
                        <span className="ml-2 font-medium">Remove Background (Local)</span>
                    </button>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center">
                            <div className="animate-spin mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="24" height="24"><rect width="256" height="256" fill="none"/><line x1="128" y1="32" x2="128" y2="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="224" y1="128" x2="192" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="195.88" y1="195.88" x2="173.25" y2="173.25" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="128" y1="224" x2="128" y2="192" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="60.12" y1="195.88" x2="82.75" y2="173.25" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="32" y1="128" x2="64" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="60.12" y1="60.12" x2="82.75" y2="82.75" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/></svg>
                            </div>
                            <span className="text-gray-700 font-medium">
                                Processing Locally... {progress}%
                            </span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div 
                                className="bg-primary h-2.5 rounded-full transition-all duration-150 ease-linear"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        
                        <p className="text-sm text-gray-500 text-center">
                            Please wait, your browser is working its magic.
                            Larger images or complex backgrounds may take a moment.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageProcessor;
