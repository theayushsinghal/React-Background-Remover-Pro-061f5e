import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

const ImageUploader = ({ onImageSelect }) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            
            // Create preview URL
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
            
            // Pass the file to parent component
            onImageSelect(file);
        }
    }, [onImageSelect]);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".jpeg", ".jpg", ".png", ".webp"]
        },
        multiple: false,
        onDragEnter: () => setIsDragging(true),
        onDragLeave: () => setIsDragging(false),
        onDropAccepted: () => setIsDragging(false)
    });

    return (
        <div className="w-full max-w-2xl mx-auto p-4">
            <div
                {...getRootProps()}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 
                    ${isDragging 
                        ? "border-primary bg-primary/10" 
                        : "border-gray-300 hover:border-primary hover:bg-gray-50"}`}
            >
                <input {...getInputProps()} />
                
                {!previewUrl ? (
                    <div className="space-y-4">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="64" height="64"><rect width="256" height="256" fill="none"/><path d="M100,208H72A56,56,0,1,1,85.92,97.74" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><polyline points="124 160 156 128 188 160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="156" y1="208" x2="156" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><path d="M80,128a80,80,0,1,1,156,25.05" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/></svg>
                        <h3 className="text-lg font-semibold text-gray-700">
                            Drag & Drop your image here
                        </h3>
                        <p className="text-sm text-gray-500">
                            or click to select a file
                        </p>
                        <p className="text-xs text-gray-400">
                            Supports: JPG, JPEG, PNG, WebP
                        </p>
                    </div>
                ) : (
                    <div className="relative group">
                        <img 
                            src={previewUrl}
                            alt="Preview"
                            className="max-h-[400px] w-auto mx-auto rounded-lg shadow-md"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                            <p className="text-white font-medium">
                                Click or drag to change image
                            </p>
                        </div>
                    </div>
                )}
            </div>
            
            {previewUrl && (
                <button
                    onClick={() => {
                        setPreviewUrl(null);
                        onImageSelect(null);
                    }}
                    className="mt-4 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-300"
                >
                    Remove Selected Image
                </button>
            )}
        </div>
    );
};

export default ImageUploader;
