import React, { useState, useRef, useEffect } from "react";
import type { Point } from "../types";

type Step = "a1" | "h6" | "minColor" | "maxColor" | "done";

interface PlateAnalyzerProps {
   imageFile: File;
   onAnalysisComplete: (
      a1: Point,
      h6: Point,
      minColor: Point,
      maxColor: Point
   ) => void;
   onCancel: () => void;
}

export const PlateAnalyzer: React.FC<PlateAnalyzerProps> = ({
   imageFile,
   onAnalysisComplete,
   onCancel,
}) => {
   const [imageUrl, setImageUrl] = useState<string>("");
   const [step, setStep] = useState<Step>("a1");

   const [a1, setA1] = useState<Point | null>(null);
   const [h6, setH6] = useState<Point | null>(null);
   const [minColor, setMinColor] = useState<Point | null>(null);
   const [maxColor, setMaxColor] = useState<Point | null>(null);

   const [crosshair, setCrosshair] = useState<Point | null>(null);
   const imageRef = useRef<HTMLImageElement>(null);

   useEffect(() => {
      if (imageFile) {
         const url = URL.createObjectURL(imageFile);
         setImageUrl(url);
         return () => URL.revokeObjectURL(url);
      }
   }, [imageFile]);

   const getRelativeCoords = (e: React.MouseEvent<HTMLImageElement>): Point => {
      const rect = e.currentTarget.getBoundingClientRect();
      // Calculate the click position relative to the image
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      return { x, y };
   };

   const getAbsoluteCoords = (relativePoint: Point): Point => {
      if (!imageRef.current) return relativePoint;
      const { naturalWidth, offsetWidth, naturalHeight, offsetHeight } =
         imageRef.current;
      const scaleX = naturalWidth / offsetWidth;
      const scaleY = naturalHeight / offsetHeight;
      return {
         x: relativePoint.x * scaleX,
         y: relativePoint.y * scaleY,
      };
   };

   const handleClick = (e: React.MouseEvent<HTMLImageElement>) => {
      const coords = getRelativeCoords(e);
      switch (step) {
         case "a1":
            setA1(coords);
            setStep("h6");
            break;
         case "h6":
            setH6(coords);
            setStep("minColor");
            break;
         case "minColor":
            setMinColor(coords);
            setStep("maxColor");
            break;
         case "maxColor":
            setMaxColor(coords);
            setStep("done");
            break;
      }
   };

   const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
      setCrosshair(getRelativeCoords(e));
   };

   const handleMouseLeave = () => {
      setCrosshair(null);
   };

   const handleAnalyze = () => {
      if (a1 && h6 && minColor && maxColor) {
         onAnalysisComplete(
            getAbsoluteCoords(a1),
            getAbsoluteCoords(h6),
            getAbsoluteCoords(minColor),
            getAbsoluteCoords(maxColor)
         );
      }
   };

   const handleResetPoints = () => {
      setA1(null);
      setH6(null);
      setMinColor(null);
      setMaxColor(null);
      setStep("a1");
   };

   const getDotStyle = (point: Point | null): React.CSSProperties => {
      if (!point) return { display: "none" };
      return {
         position: "absolute",
         left: `${point.x}px`,
         top: `${point.y}px`,
         transform: "translate(-50%, -50%)",
         pointerEvents: "none",
      };
   };

   const getCrosshairStyle = (): React.CSSProperties => {
      if (!crosshair) return { display: "none" };
      return {
         position: "absolute",
         pointerEvents: "none",
         top: 0,
         left: 0,
         width: "100%",
         height: "100%",
      };
   };

   // More detailed instructions for each step
   const instructions = {
      a1: {
         title: "Step 1: Mark Well A1",
         description:
            "Click on the center of well A1 (top-left corner of plate)",
      },
      h6: {
         title: "Step 2: Mark Well H6",
         description:
            "Click on the center of well H6 (bottom-right of the 6-column section)",
      },
      minColor: {
         title: "Step 3: Select Minimum Density",
         description:
            "Click a well representing 0% density (typically blue/clear)",
      },
      maxColor: {
         title: "Step 4: Select Maximum Density",
         description:
            "Click a well representing 100% density (typically dark pink/purple)",
      },
      done: {
         title: "Ready to Analyze",
         description:
            "All points have been marked. Click 'Analyze' to process the plate.",
      },
   };

   const currentInstruction = instructions[step];

   // Legend for the dots
   const renderLegend = () => {
      return (
         <div className="flex flex-wrap gap-3 md:gap-4 mt-2 mb-3 text-xs md:text-sm">
            <div className="flex items-center">
               <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
               <span>Well A1 {a1 ? "✓" : ""}</span>
            </div>
            <div className="flex items-center">
               <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
               <span>Well H6 {h6 ? "✓" : ""}</span>
            </div>
            <div className="flex items-center">
               <div className="w-3 h-3 bg-cyan-400 rounded-full mr-1"></div>
               <span>Min Density {minColor ? "✓" : ""}</span>
            </div>
            <div className="flex items-center">
               <div className="w-3 h-3 bg-fuchsia-500 rounded-full mr-1"></div>
               <span>Max Density {maxColor ? "✓" : ""}</span>
            </div>
         </div>
      );
   };

   return (
      <div className="space-y-3 md:space-y-4">
         <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <h2 className="text-lg md:text-xl font-bold text-blue-800 dark:text-blue-300">
               {currentInstruction.title}
            </h2>
            <p className="text-sm md:text-base text-blue-700 dark:text-blue-400 mt-1">
               {currentInstruction.description}
            </p>
         </div>

         {renderLegend()}

         <div
            className="relative flex justify-center items-center border rounded-lg overflow-hidden shadow-md cursor-crosshair w-full"
            onMouseLeave={handleMouseLeave}
         >
            <div className="relative inline-block">
               <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Well Plate"
                  onClick={handleClick}
                  onMouseMove={handleMouseMove}
                  className="block max-h-[60vh]"
               />

               {a1 && (
                  <div
                     style={getDotStyle(a1)}
                     className="w-3 h-3 bg-red-500 rounded-full border-2 border-white"
                  ></div>
               )}
               {h6 && (
                  <div
                     style={getDotStyle(h6)}
                     className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white"
                  ></div>
               )}
               {minColor && (
                  <div
                     style={getDotStyle(minColor)}
                     className="w-3 h-3 bg-cyan-400 rounded-full border-2 border-white"
                  ></div>
               )}
               {maxColor && (
                  <div
                     style={getDotStyle(maxColor)}
                     className="w-3 h-3 bg-fuchsia-500 rounded-full border-2 border-white"
                  ></div>
               )}

               {crosshair && step !== "done" && (
                  <div
                     style={getCrosshairStyle()}
                     className="pointer-events-none"
                  >
                     <div
                        className="absolute top-0 left-0 h-full w-px bg-white/50"
                        style={{ left: `${crosshair.x}px` }}
                     ></div>
                     <div
                        className="absolute top-0 left-0 w-full h-px bg-white/50"
                        style={{ top: `${crosshair.y}px` }}
                     ></div>
                  </div>
               )}
            </div>
         </div>

         <div className="flex flex-wrap gap-2 md:gap-4">
            <button
               onClick={handleAnalyze}
               disabled={step !== "done"}
               className="px-3 py-2 md:px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm md:text-base"
            >
               Analyze Plate
            </button>
            <button
               onClick={handleResetPoints}
               className="px-3 py-2 md:px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors text-sm md:text-base"
            >
               Reset Points
            </button>
            <button
               onClick={onCancel}
               className="px-3 py-2 md:px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors text-sm md:text-base"
            >
               Cancel
            </button>
         </div>
      </div>
   );
};
