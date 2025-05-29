import React, { useState } from "react";
import ImageUploader from "./components/ImageUploader";
import ImageProcessor from "./components/ImageProcessor";
import ResultDisplay from "./components/ResultDisplay";

const App = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [originalFileName, setOriginalFileName] = useState("");

    const handleImageSelect = (file) => {
        setSelectedImage(file);
        setProcessedImage(null);
        setError(null);
        if (file) {
            setOriginalFileName(file.name);
        } else {
            setOriginalFileName("");
        }
    };

    const handleProcessingComplete = (resultImageUrl) => {
        setProcessedImage(resultImageUrl);
        setIsProcessing(false);
        setError(null); 
    };

    const handleError = (errorMessage) => {
        setError(errorMessage);
        setProcessedImage(null); 
        setIsProcessing(false);
    };
    
    const handleSetIsProcessing = (status) => {
        setIsProcessing(status);
        if (status) { // If processing starts, clear previous results and errors
            setError(null);
            setProcessedImage(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-300">
            <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden">
                {/* Header Section */}
                <header className="bg-gradient-to-r from-primary to-indigo-600 p-6 text-center text-white">
                    <div className="flex items-center justify-center mb-2">
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="32" height="32"><rect width="256" height="256" fill="none"/><line x1="216" y1="128" x2="216" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="192" y1="152" x2="240" y2="152" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="80" y1="40" x2="80" y2="88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="56" y1="64" x2="104" y2="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="168" y1="184" x2="168" y2="216" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="152" y1="200" x2="184" y2="200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="144" y1="80" x2="176" y2="112" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><rect x="21.49" y="105.37" width="213.02" height="45.25" rx="8" transform="translate(-53.02 128) rotate(-45)" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/></svg>
                        <h1 className="text-3xl sm:text-4xl font-bold ml-3">
                            Background Remover Pro
                        </h1>
                    </div>
                    <p className="text-indigo-200 text-sm sm:text-base">
                        Effortlessly remove image backgrounds with precision, right in your browser.
                    </p>
                </header>

                {/* Main Content Area */}
                <main className="p-6 sm:p-8 space-y-8">
                    {/* Step 1: Upload */}
                    <section id="upload-section" className="p-6 bg-slate-50 rounded-lg shadow-inner">
                        <div className="flex items-center mb-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg mr-4 shadow-md">
                                1
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
                                    Upload Your Image
                                </h2>
                                <p className="text-sm text-gray-500">Drag & drop or click to select a file.</p>
                            </div>
                        </div>
                        <ImageUploader onImageSelect={handleImageSelect} />
                    </section>

                    {/* Step 2: Process */}
                    {selectedImage && (
                        <section id="process-section" className="p-6 bg-slate-50 rounded-lg shadow-inner">
                            <div className="flex items-center mb-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg mr-4 shadow-md">
                                    2
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
                                        Remove Background
                                    </h2>
                                    <p className="text-sm text-gray-500">Click the button to start the magic.</p>
                                </div>
                            </div>
                            <ImageProcessor
                                selectedImage={selectedImage}
                                onProcessingStart={() => handleSetIsProcessing(true)}
                                onProcessingComplete={handleProcessingComplete}
                                onError={handleError}
                            />
                        </section>
                    )}

                    {/* Step 3: Result */}
                    {(processedImage || error || isProcessing) && (
                         <section id="result-section" className="p-6 bg-slate-50 rounded-lg shadow-inner">
                            <div className="flex items-center mb-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg mr-4 shadow-md">
                                    3
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
                                        View & Download
                                    </h2>
                                     <p className="text-sm text-gray-500">Your processed image is ready.</p>
                                </div>
                            </div>
                            <ResultDisplay
                                processedImage={processedImage}
                                isLoading={isProcessing}
                                error={error}
                                originalFileName={originalFileName}
                            />
                        </section>
                    )}
                    
                    {/* Initial placeholder if no image is uploaded and nothing is processing */}
                    {!selectedImage && !isProcessing && !processedImage && !error && (
                        <div className="text-center py-10 px-6 bg-slate-50 rounded-lg shadow-inner">
                            <div className="mx-auto text-gray-400 w-fit mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="64" height="64"><rect width="256" height="256" fill="none"/><path d="M128,128V24a64,64,0,0,1,50,104" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><path d="M128,128H24A64,64,0,0,1,128,78" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><path d="M128,128V232A64,64,0,0,1,78,128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><path d="M128,128H232a64,64,0,0,1-104,50" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/></svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                Ready to Start?
                            </h3>
                            <p className="text-gray-500">
                                Upload an image to begin the background removal process.
                            </p>
                        </div>
                    )}

                </main>
            </div>

            {/* Footer */}
            <footer className="w-full max-w-3xl mt-8 text-center text-gray-500 text-xs sm:text-sm">
                <p>
                    &copy; {new Date().getFullYear()} Background Remover Pro. 
                    All image processing is done locally in your browser for privacy.
                </p>
                <p className="mt-1">
                    Powered by React & Tailwind CSS.
                </p>
            </footer>
        </div>
    );
};

export default App;
