import { useState, useRef, DragEvent } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { compressImage } from "../utils/imageCompression";

interface ImageDropZoneProps {
  currentImage?: string;
  onImageChange: (image: string) => void;
  disabled?: boolean;
  productName?: string;
}

export function ImageDropZone({
  currentImage,
  onImageChange,
  disabled = false,
  productName = "Product",
}: ImageDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragging to false if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((file) => file.type.startsWith("image/"));

    if (imageFile) {
      await processImage(imageFile);
    } else {
      alert("Please drop an image file (JPG, PNG, GIF, etc.)");
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processImage(file);
    }
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    try {
      const compressedImage = await compressImage(file);
      onImageChange(compressedImage);
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Failed to process image. Please try a different image or a smaller file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveImage = () => {
    onImageChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="relative">
      {currentImage ? (
        // Show current image with remove option
        <div className="relative group">
          <div className="w-full h-32 rounded-lg overflow-hidden border-2 border-gray-200 bg-white">
            <img
              src={currentImage}
              alt={productName}
              className="w-full h-full object-cover"
            />
          </div>
          {!disabled && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 rounded-lg flex items-center justify-center pointer-events-none">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2 pointer-events-auto">
                <button
                  type="button"
                  onClick={handleClick}
                  className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                  title="Change image"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-lg"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Show drop zone
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`
            w-full h-32 rounded-lg border-2 border-dashed
            flex flex-col items-center justify-center gap-2
            transition-all duration-200 cursor-pointer
            ${
              disabled
                ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                : isDragging
                ? "border-blue-500 bg-blue-50 scale-105"
                : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
            }
            ${isProcessing ? "opacity-50 cursor-wait" : ""}
          `}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600">Processing image...</p>
            </>
          ) : (
            <>
              <div
                className={`p-2 rounded-full ${
                  isDragging ? "bg-blue-100" : "bg-gray-200"
                }`}
              >
                {isDragging ? (
                  <ImageIcon className="w-6 h-6 text-blue-600" />
                ) : (
                  <Upload className="w-6 h-6 text-gray-500" />
                )}
              </div>
              <p className="text-sm text-gray-600 text-center px-2">
                {isDragging ? (
                  <span className="font-semibold text-blue-600">Drop image here</span>
                ) : (
                  <>
                    <span className="font-semibold text-blue-600">Click to upload</span>
                    {" or drag and drop"}
                  </>
                )}
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        disabled={disabled || isProcessing}
        className="hidden"
      />
    </div>
  );
}