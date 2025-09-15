import React, { useState, useCallback } from "react";
import { UploadIcon } from "./icons";
import { AppInfo } from "./AppInfo";

interface ImageUploaderProps {
   onImageUpload: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
   onImageUpload,
}) => {
   const [isDragging, setIsDragging] = useState(false);

   const handleFile = useCallback(
      (file: File | null | undefined) => {
         if (file && file.type.startsWith("image/")) {
            onImageUpload(file);
         } else {
            alert("Please upload a valid image file.");
         }
      },
      [onImageUpload]
   );

   const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
   };

   const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
   };

   const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
   };

   const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFile(e.dataTransfer.files?.[0]);
   };

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFile(e.target.files?.[0]);
   };

   return (
      <div className="flex flex-col items-center justify-center p-3 md:p-6">
         <AppInfo />

         <label
            htmlFor="file-upload"
            className={`relative flex flex-col items-center justify-center w-full max-w-xl h-48 md:h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors
          ${
             isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-800"
          }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
         >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
               <UploadIcon className="w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4 text-blue-500 dark:text-blue-400" />
               <p className="mb-1 md:mb-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
               </p>
               <p className="text-xs text-gray-500 dark:text-gray-500">
                  PNG, JPG, GIF up to 10MB
               </p>
            </div>
            <input
               id="file-upload"
               type="file"
               className="hidden"
               accept="image/*"
               onChange={handleFileChange}
            />
         </label>

         <div className="mt-6 text-center px-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
               Upload a high-quality image of your 96-well plate to begin
               analysis.
            </p>
         </div>
      </div>
   );
};
