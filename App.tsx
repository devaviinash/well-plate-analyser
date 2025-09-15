import React, { useState, useCallback, useEffect } from "react";
import { ImageUploader } from "./components/ImageUploader";
import { PlateAnalyzer } from "./components/PlateAnalyzer";
import { ResultsDisplay } from "./components/ResultsDisplay";
import { ThemeToggle } from "./components/ThemeToggle";
import { processWellPlate } from "./services/wellPlateProcessor";
import type { WellResult, Point } from "./types";

type AppState = "uploading" | "analyzing" | "processing" | "results" | "error";

function App() {
   const [appState, setAppState] = useState<AppState>("uploading");
   const [imageFile, setImageFile] = useState<File | null>(null);
   const [imageUrl, setImageUrl] = useState<string>("");
   const [results, setResults] = useState<WellResult[]>([]);
   const [error, setError] = useState<string>("");
   const [a1, setA1] = useState<Point>({ x: 0, y: 0 });
   const [h6, setH6] = useState<Point>({ x: 0, y: 0 });
   const [minColorPoint, setMinColorPoint] = useState<Point>({ x: 0, y: 0 });
   const [maxColorPoint, setMaxColorPoint] = useState<Point>({ x: 0, y: 0 });
   const [darkMode, setDarkMode] = useState<boolean>(() => {
      // Initialize with user's preferred theme or system preference
      if (typeof window !== "undefined") {
         // Check for saved preference
         const savedTheme = localStorage.getItem("theme");
         if (savedTheme) {
            return savedTheme === "dark";
         }
         // If no saved preference, use system preference
         return window.matchMedia("(prefers-color-scheme: dark)").matches;
      }
      return false;
   });

   const handleImageUpload = useCallback(
      (file: File) => {
         // Revoke previous object URL if it exists to prevent memory leaks
         if (imageUrl) {
            URL.revokeObjectURL(imageUrl);
         }
         setImageFile(file);
         const newImageUrl = URL.createObjectURL(file);
         setImageUrl(newImageUrl);
         setAppState("analyzing");
      },
      [imageUrl]
   );

   const handleAnalysisComplete = useCallback(
      async (
         a1Point: Point,
         h6Point: Point,
         minColorP: Point,
         maxColorP: Point
      ) => {
         if (!imageUrl) return;
         setA1(a1Point);
         setH6(h6Point);
         setMinColorPoint(minColorP);
         setMaxColorPoint(maxColorP);
         setAppState("processing");
         try {
            // Clone the current imageUrl to a local variable to ensure it doesn't change during processing
            const currentImageUrl = imageUrl;
            const wellResults = await processWellPlate(
               currentImageUrl,
               a1Point,
               h6Point,
               minColorP,
               maxColorP
            );
            setResults(wellResults);
            setAppState("results");
         } catch (e) {
            console.error("Analysis failed:", e);
            const errorMessage =
               e instanceof Error
                  ? e.message
                  : "Analysis failed. Please try again.";
            setError(errorMessage);
            setAppState("error");
         }
      },
      [imageUrl]
   );

   const handleReset = useCallback(() => {
      // First update state, then clean up resources
      setAppState("uploading");
      setImageFile(null);
      setResults([]);
      setError("");
      setA1({ x: 0, y: 0 });
      setH6({ x: 0, y: 0 });
      setMinColorPoint({ x: 0, y: 0 });
      setMaxColorPoint({ x: 0, y: 0 });

      // Delay URL revocation to ensure components have time to finish using the image
      // This prevents the screen from going blank immediately
      if (imageUrl) {
         // Use a small timeout to ensure React has finished rendering before we revoke the URL
         setTimeout(() => {
            URL.revokeObjectURL(imageUrl);
            setImageUrl("");
         }, 100);
      }
   }, [imageUrl]);

   // Add effect to log state changes (this helps with debugging)
   useEffect(() => {
      console.log(`App state changed to: ${appState}`);
   }, [appState]);

   // Toggle dark mode
   const toggleDarkMode = useCallback(() => {
      setDarkMode((prevMode) => !prevMode);
   }, []);

   useEffect(() => {
      if (results.length > 0) {
         console.log(`Results updated: ${results.length} wells processed`);
      }
   }, [results]);

   useEffect(() => {
      if (imageUrl) {
         console.log(`Image URL updated: ${imageUrl.substring(0, 20)}...`);
      }

      // Clean up object URLs when component unmounts or when URL changes
      return () => {
         if (imageUrl) {
            console.log(
               `Cleaning up image URL on unmount: ${imageUrl.substring(
                  0,
                  20
               )}...`
            );
            URL.revokeObjectURL(imageUrl);
         }
      };
   }, [imageUrl]);

   const renderContent = () => {
      switch (appState) {
         case "uploading":
            return <ImageUploader onImageUpload={handleImageUpload} />;
         case "analyzing":
            if (!imageFile) {
               handleReset(); // Should not happen
               return null;
            }
            return (
               <PlateAnalyzer
                  imageFile={imageFile}
                  onAnalysisComplete={handleAnalysisComplete}
                  onCancel={handleReset}
               />
            );
         case "processing":
            return (
               <div className="flex flex-col items-center justify-center p-4 md:p-8">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-center mb-4">
                     <svg
                        className="animate-spin mr-3 h-6 w-6 md:h-8 md:w-8 text-blue-600 dark:text-blue-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                     >
                        <circle
                           className="opacity-25"
                           cx="12"
                           cy="12"
                           r="10"
                           stroke="currentColor"
                           strokeWidth="4"
                        ></circle>
                        <path
                           className="opacity-75"
                           fill="currentColor"
                           d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                     </svg>
                     <div>
                        <p className="font-semibold text-blue-800 dark:text-blue-300">
                           Analyzing well plate...
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                           Calculating color intensities and generating results
                           for all 48 wells
                        </p>
                     </div>
                  </div>
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400 max-w-md">
                     <p>
                        This process might take a few moments depending on the
                        image complexity.
                     </p>
                     <p className="mt-2">
                        Results will include color intensity, estimated cell
                        count, and statistical analysis for each well.
                     </p>
                  </div>
               </div>
            );
         case "results":
            return (
               <ResultsDisplay
                  results={results}
                  imageUrl={imageUrl}
                  a1={a1}
                  h6={h6}
                  onReset={handleReset}
               />
            );
         case "error":
            return (
               <div className="flex flex-col items-center justify-center p-4 md:p-8 text-center">
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-4 max-w-lg">
                     <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 text-red-500 mx-auto mb-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                     </svg>
                     <h2 className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">
                        Analysis Error
                     </h2>
                     <p className="text-red-600 dark:text-red-400 mt-2 text-sm md:text-base">
                        {error}
                     </p>
                  </div>

                  <div className="space-y-3 max-w-lg">
                     <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base">
                        Try these troubleshooting steps:
                     </p>
                     <ul className="list-disc list-inside text-sm md:text-base text-gray-700 dark:text-gray-300 text-left">
                        <li>
                           Ensure your image has good lighting and contrast
                        </li>
                        <li>
                           Make sure you've correctly marked A1 and H6 wells
                        </li>
                        <li>
                           Select clearer minimum and maximum color reference
                           points
                        </li>
                        <li>Try using an image with less glare or shadows</li>
                     </ul>

                     <button
                        onClick={handleReset}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors text-sm md:text-base"
                     >
                        Try Again
                     </button>
                  </div>
               </div>
            );
         default:
            return null;
      }
   };

   return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
         <header className="bg-white dark:bg-gray-800 shadow-md">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
               <div>
                  <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                     AI Well Plate Analyzer
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                     Analyze cell culture plates with precision
                  </p>
               </div>
               <ThemeToggle
                  darkMode={darkMode}
                  toggleDarkMode={toggleDarkMode}
               />
            </div>
         </header>
         <main className="max-w-7xl mx-auto py-4 md:py-6 sm:px-6 lg:px-8">
            <div className="px-3 md:px-4 py-4 md:py-6 sm:px-0">
               <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-3 sm:p-5 md:p-7">
                  {renderContent()}
               </div>
            </div>
         </main>
         <footer className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
            <p>
               Developed by{" "}
               <span className="font-semibold">Sowmya & Anusha</span> | Guided
               by <span className="font-semibold">Sagar Sir</span> <br /> Built
               with React & Typescript
            </p>
            <p className="text-xs mt-1">
               © {new Date().getFullYear()} - Anusha Thakur
            </p>
         </footer>
      </div>
   );
}

export default App;
