import React from "react";

export const AppInfo: React.FC = () => {
   return (
      <div className="p-3 md:p-5 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-6 text-sm md:text-base">
         <h2 className="text-lg md:text-xl font-bold text-blue-700 dark:text-blue-300 mb-2">
            Welcome to AI Well Plate Analyzer
         </h2>

         <p className="mb-3 text-gray-700 dark:text-gray-300">
            This tool helps you analyze 96-well culture plates by processing
            images to determine cell density and calculate results for each
            well.
         </p>

         <div className="border-l-4 border-blue-500 dark:border-blue-400 pl-3 md:pl-4 py-1 mb-3">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200">
               How it works:
            </h3>
            <ol className="list-decimal list-inside mt-1 text-gray-700 dark:text-gray-300 space-y-1">
               <li>Upload a clear image of your 96-well plate</li>
               <li>Mark reference points (A1 and H6 wells)</li>
               <li>
                  Select calibration points for minimum and maximum color
                  intensity
               </li>
               <li>View detailed analysis results for all wells</li>
            </ol>
         </div>

         <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-4">
            <p>
               <span className="font-semibold">Best practices:</span> Use
               well-lit, high contrast images with minimal glare or shadows for
               optimal results.
            </p>
            <p className="mt-1">
               <span className="font-semibold">Note:</span> Results are
               calculated based on color intensity and should be validated with
               standard laboratory methods.
            </p>
         </div>
      </div>
   );
};
