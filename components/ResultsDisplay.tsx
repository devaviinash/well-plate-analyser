import React, { useRef, useEffect, useCallback, useState } from "react";
import type { WellResult, Point } from "../types";
import { DownloadIcon, StartOverIcon } from "./icons";

interface ResultsDisplayProps {
   results: WellResult[];
   imageUrl: string;
   a1: Point;
   h6: Point;
   onReset: () => void;
}

const NUM_ROWS = 8;
const NUM_COLS = 6;

// Helper component to render a single grid table
const ResultsGrid: React.FC<{
   title: string;
   data: number[][];
   formatter: (value: number) => string | number;
}> = ({ title, data, formatter }) => {
   const rowHeaders = Array.from({ length: NUM_ROWS }, (_, i) =>
      String.fromCharCode(65 + i)
   );
   const colHeaders = Array.from({ length: NUM_COLS }, (_, i) => i + 1);

   return (
      <div className="flex-1 flex flex-col">
         <h3 className="text-xl font-bold text-center mb-2">{title}</h3>
         <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
            <table className="w-full text-sm text-center text-gray-500 dark:text-gray-400">
               <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                  <tr>
                     <th scope="col" className="px-2 py-2"></th>
                     {colHeaders.map((header) => (
                        <th key={header} scope="col" className="px-2 py-2">
                           {header}
                        </th>
                     ))}
                  </tr>
               </thead>
               <tbody>
                  {data.map((row, rowIndex) => (
                     <tr
                        key={rowIndex}
                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                     >
                        <th
                           scope="row"
                           className="px-2 py-2 font-medium text-gray-900 dark:text-white"
                        >
                           {rowHeaders[rowIndex]}
                        </th>
                        {row.map((cell, colIndex) => (
                           <td key={colIndex} className="px-2 py-2">
                              {formatter(cell)}
                           </td>
                        ))}
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );
};

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
   results,
   imageUrl,
   a1,
   h6,
   onReset,
}) => {
   const imageRef = useRef<HTMLImageElement>(null);
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const [renderError, setRenderError] = useState<string | null>(null);
   // Ensure the radius calculation always results in a positive value by using absolute values
   const radius = Math.max(
      5,
      Math.min(
         Math.abs(h6.x - a1.x) / (NUM_COLS - 1),
         Math.abs(h6.y - a1.y) / (NUM_ROWS - 1)
      ) * 0.4
   );

   const draw = useCallback(() => {
      const canvas = canvasRef.current;
      const image = imageRef.current;

      if (!canvas || !image) {
         console.warn("Canvas or image ref not available");
         return;
      }

      if (!image.complete) {
         console.log("Image not yet loaded, waiting...");
         return;
      }

      try {
         const ctx = canvas.getContext("2d");
         if (!ctx) {
            setRenderError("Could not get canvas context");
            console.error("Could not get canvas context");
            return;
         }

         // Reset any previous canvas state
         canvas.width = image.offsetWidth;
         canvas.height = image.offsetHeight;

         // Safety check to ensure image dimensions are valid
         if (
            image.offsetWidth === 0 ||
            image.offsetHeight === 0 ||
            image.naturalWidth === 0 ||
            image.naturalHeight === 0
         ) {
            console.warn("Image dimensions are zero, can't render");
            return;
         }

         // Calculate scaling factors safely with fallbacks
         let scaleX = 1;
         let scaleY = 1;

         if (image.offsetWidth > 0 && image.naturalWidth > 0) {
            scaleX = image.naturalWidth / image.offsetWidth;
         }

         if (image.offsetHeight > 0 && image.naturalHeight > 0) {
            scaleY = image.naturalHeight / image.offsetHeight;
         }

         // Ensure scaleX and scaleY are never zero to avoid division by zero
         scaleX = Math.max(0.1, scaleX);
         scaleY = Math.max(0.1, scaleY);

         console.log("Drawing wells with scales:", {
            scaleX,
            scaleY,
            displayRadius: radius / scaleX,
         });

         results.forEach((well) => {
            const { center, avgColor, id } = well;

            // Ensure the coordinates are valid
            const displayX = isFinite(center.x / scaleX)
               ? center.x / scaleX
               : 0;
            const displayY = isFinite(center.y / scaleY)
               ? center.y / scaleY
               : 0;

            // Ensure the radius is positive and reasonable
            const displayRadius = Math.max(
               3,
               isFinite(radius / scaleX) ? radius / scaleX : 5
            );

            ctx.beginPath();
            ctx.arc(displayX, displayY, displayRadius, 0, 2 * Math.PI);
            ctx.strokeStyle = `rgba(${avgColor.r}, ${avgColor.g}, ${avgColor.b}, 0.9)`;
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.font = "bold 11px sans-serif";
            const text = `${id}`;
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.textAlign = "center";
            ctx.fillText(text, displayX, displayY + 4);
         });

         // Clear any previous errors since we've successfully rendered
         if (renderError) setRenderError(null);
      } catch (err) {
         console.error("Error rendering canvas:", err);
         setRenderError(
            err instanceof Error
               ? err.message
               : "Unknown error rendering results"
         );
      }
   }, [results, radius, renderError]);

   useEffect(() => {
      const image = imageRef.current;
      if (!image) return;

      const handleLoad = () => {
         console.log("Image loaded successfully");
         // Wait a tick to ensure React has finished rendering
         setTimeout(() => {
            try {
               draw();
            } catch (err) {
               console.error("Error in draw after load:", err);
               setRenderError(
                  err instanceof Error ? err.message : "Error drawing results"
               );
            }
         }, 0);
      };

      const handleError = (err: Event | string) => {
         console.error("Image load error:", err);
         setRenderError("Failed to load image. Please try again.");
      };

      // Add event listeners
      image.addEventListener("load", handleLoad);
      image.addEventListener("error", handleError);

      // Call draw immediately if the image is already loaded
      if (image.complete) {
         console.log("Image already complete, drawing immediately");
         try {
            draw();
         } catch (err) {
            console.error("Error in immediate draw:", err);
            setRenderError(
               err instanceof Error ? err.message : "Error drawing results"
            );
         }
      }

      // Handle window resize events
      const handleResize = () => {
         console.log("Window resized, redrawing");
         try {
            draw();
         } catch (err) {
            console.error("Error in resize draw:", err);
            setRenderError(
               err instanceof Error
                  ? err.message
                  : "Error drawing results after resize"
            );
         }
      };
      window.addEventListener("resize", handleResize);

      // Clean up event listeners
      return () => {
         image.removeEventListener("load", handleLoad);
         image.removeEventListener("error", handleError);
         window.removeEventListener("resize", handleResize);
      };
   }, [draw]);

   const processResultsIntoGrid = useCallback(
      (dataKey: "intensity" | "cellCount") => {
         const grid: number[][] = Array(NUM_ROWS)
            .fill(0)
            .map(() => Array(NUM_COLS).fill(0));
         results.forEach((well) => {
            if (well.row < NUM_ROWS && well.col < NUM_COLS) {
               grid[well.row][well.col] =
                  dataKey === "intensity"
                     ? well.intensity * 100
                     : well.cellCount;
            }
         });
         return grid;
      },
      [results]
   );

   const percentageData = processResultsIntoGrid("intensity");
   const cellCountData = processResultsIntoGrid("cellCount");

   const downloadCSV = () => {
      const rowHeaders = Array.from({ length: NUM_ROWS }, (_, i) =>
         String.fromCharCode(65 + i)
      );
      const colHeaders = Array.from({ length: NUM_COLS }, (_, i) => i + 1);

      let csvContent = "Percentage Cells (%)\n";
      csvContent += `,${colHeaders.join(",")}\n`;
      percentageData.forEach((row, rowIndex) => {
         csvContent += `${rowHeaders[rowIndex]},${row
            .map((val) => val.toFixed(0))
            .join(",")}\n`;
      });

      csvContent += "\nEstimated Cell Count (0-10,000)\n";
      csvContent += `,${colHeaders.join(",")}\n`;
      cellCountData.forEach((row, rowIndex) => {
         csvContent += `${rowHeaders[rowIndex]},${row
            .map((val) => Math.round(val))
            .join(",")}\n`;
      });

      const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "well_plate_analysis.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   return (
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold">Analysis Results</h2>
            <div className="flex gap-2">
               <button
                  onClick={downloadCSV}
                  className="flex items-center justify-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
               >
                  <DownloadIcon className="w-5 h-5 mr-2" />
                  Download CSV
               </button>
               <button
                  onClick={onReset}
                  className="flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
               >
                  <StartOverIcon className="w-5 h-5 mr-2" />
                  Start Over
               </button>
            </div>
         </div>

         {renderError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:text-red-100">
               <strong className="font-bold">Error: </strong>
               <span className="block sm:inline">{renderError}</span>
            </div>
         )}

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="relative w-full rounded-lg overflow-hidden shadow-md">
               <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Analyzed Well Plate"
                  className="w-full h-auto block"
                  crossOrigin="anonymous"
               />
               <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
               />
            </div>

            <div className="flex flex-col gap-8">
               <ResultsGrid
                  title="Percentage Cells (%)"
                  data={percentageData}
                  formatter={(val) => val.toFixed(0)}
               />
               <ResultsGrid
                  title="Estimated Cell Count (0-10,000)"
                  data={cellCountData}
                  formatter={(val) => Math.round(val).toLocaleString()}
               />
            </div>
         </div>
      </div>
   );
};
