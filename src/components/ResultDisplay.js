import React from "react";
import { saveAs } from "file-saver";

const ResultDisplay = ({ processedImage, isLoading, error, originalFileName }) => {
    const handleDownload = () => {
        if (processedImage) {
            // The processedImage is a data URL (e.g., "data:image/png;base64,...")
            // We can convert this data URL to a Blob and then save it.
            // The fetch API can handle data URLs directly.
            fetch(processedImage)
                .then(res => res.blob())
                .then(blob => {
                    let fileName = "processed-image.png";
                    if (originalFileName) {
                        const nameParts = originalFileName.split(".");
                        nameParts.pop(); // Remove original extension
                        const name = nameParts.join(".");
                        fileName = `${name}-no-bg.png`; // Always save as PNG for transparency
                    }
                    saveAs(blob, fileName);
                })
                .catch(downloadError => {
                    console.error("Error downloading the image:", downloadError);
                    // Optionally, display an error message to the user
                });
        }
    };

    if (isLoading) {
        return (
            <div className="w-full max-w-2xl mx-auto p-6 text-center">
                <div className="animate-spin mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="48" height="48" className="text-primary"><rect width="256" height="256" fill="none"/><line x1="128" y1="32" x2="128" y2="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="224" y1="128" x2="192" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="195.88" y1="195.88" x2="173.25" y2="173.25" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="128" y1="224" x2="128" y2="192" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="60.12" y1="195.88" x2="82.75" y2="173.25" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="32" y1="128" x2="64" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="60.12" y1="60.12" x2="82.75" y2="82.75" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/></svg>
                </div>
                <p className="text-gray-600">Preparing your image...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-2xl mx-auto p-6 text-center bg-red-50 rounded-lg border border-red-200">
                <div className="text-red-500 mb-3 mx-auto w-fit">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="32" height="32"><rect width="256" height="256" fill="none"/><path d="M128,24a104,104,0,1,0,104,104A104.11,104.11,0,0,0,128,24Zm37.66,130.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32L139.31,128Z" fill="currentColor"/></svg>
                </div>
                <p className="text-red-700 font-semibold text-lg">Processing Failed</p>
                <p className="text-red-600 text-sm mt-2">{error}</p>
            </div>
        );
    }

    if (!processedImage) {
        // This state means not loading, no error, but no processed image yet.
        // Could be initial state before any processing has been attempted or after an image is deselected.
        // App.js logic generally ensures this component might not be heavily relied upon in this specific state,
        // as it's usually shown when `processedImage` has a value.
        // However, to be robust, provide a sensible default.
        return (
            <div className="w-full max-w-2xl mx-auto p-6 text-center">
                <div className="bg-gray-100 rounded-lg p-8 border border-gray-200">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="48" height="48" className="text-gray-400 mx-auto"><rect width="256" height="256" fill="none"/><path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM96,176a16,16,0,1,1-16-16A16,16,0,0,1,96,176Zm20.22-87.43L160,136l44.22-51.59a8,8,0,0,1,13.56,6.16L180,170.61a8,8,0,0,1-7.05,5.39H160a8,8,0,0,1-5.42-2.06L128,144l-20,23.33V88a8,8,0,0,1,8-8h4.22A8,8,0,0,1,120.22,88.57Z" fill="currentColor"/></svg>
                    <p className="text-gray-500 mt-4">
                        Your processed image will appear here once ready.
                    </p>
                     <p className="text-sm text-gray-400 mt-2">
                        Upload an image and click "Remove Background" to start.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow-xl p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-5 text-center">
                    Your Image is Ready!
                </h2>
                
                <div className="relative group mb-6 border border-gray-200 rounded-lg overflow-hidden">
                    <img
                        src={processedImage} // This is now a data URL from canvas
                        alt="Processed image with background removed"
                        className="w-full h-auto max-h-[500px] object-contain rounded-md shadow-inner bg-slate-100" 
                        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Crect width='10' height='10' fill='%23f0f0f0'/%3E%3Crect x='10' y='10' width='10' height='10' fill='%23f0f0f0'/%3E%3Crect x='10' width='10' height='10' fill='%23e0e0e0'/%3E%3Crect y='10' width='10' height='10' fill='%23e0e0e0'/%3E%3C/svg%3E\")" }}
                    />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors duration-300 rounded-md pointer-events-none" />
                </div>

                <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <button
                        onClick={handleDownload}
                        className="w-full sm:w-auto flex items-center justify-center px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="20" height="20"><rect width="256" height="256" fill="none"/><path d="M74.34,144H40a8,8,0,0,0-8,8v40a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V152a8,8,0,0,0-8-8H181.66" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><polyline points="128 32 128 152 168 112 88 112 128 152" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/></svg>
                        <span className="ml-2.5 font-medium">Download Image</span>
                    </button>
                </div>

                <p className="text-center text-xs text-gray-500 mt-6">
                    The image has been processed locally in your browser.
                </p>
            </div>
        </div>
    );
};

export default ResultDisplay;
