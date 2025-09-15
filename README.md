# AI Well Plate Analyzer

<div align="center">
<img width="1200" height="475" alt="AI Well Plate Analyzer Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## About

AI Well Plate Analyzer is a modern web application designed for laboratory researchers and scientists to analyze 96-well culture plates efficiently. The tool uses image processing and color analysis to provide quantitative measurements of cell density across all wells.

**Developer:** Anusha & Sowmya

**Last Updated:** September 2025

## Features

-  **Intuitive Image Upload**: Drag and drop or select images of 96-well plates
-  **Precise Calibration**: Mark reference points and color standards for accurate analysis
-  **Automated Processing**: AI-powered analysis of color intensity in each well
-  **Comprehensive Results**: Detailed data including color intensity, estimated cell count, and statistical analysis
-  **Dark Mode Support**: Toggle between light and dark themes for comfortable viewing
-  **Mobile Responsive**: Optimized for both desktop and mobile devices

## How It Works

1. **Upload**: Upload a clear image of your 96-well plate
2. **Calibrate**: Mark reference wells (A1 and H6) to establish the grid
3. **Set Standards**: Define minimum and maximum color intensity points for calibration
4. **Analyze**: The system automatically processes all wells based on calibration
5. **View Results**: Review detailed data tables and visualizations of the results

## Ideal Applications

-  Cell proliferation assays
-  Bacterial growth studies
-  Colorimetric assays
-  Enzyme activity assays
-  Protein quantification
-  Drug sensitivity testing

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## View in AI Studio

View your app in AI Studio: https://ai.studio/apps/drive/1xEtHrwi1EOGsDtWUR4CEjydZ3lV0K2uz

## Best Practices for Accurate Results

-  Use well-lit, high-contrast images
-  Avoid glare or shadows on the plate
-  Ensure the plate is centered in the image
-  Select clearly defined minimum and maximum intensity wells
-  Validate results with standard laboratory methods

## Technologies Used

-  React
-  TypeScript
-  Tailwind CSS
-  Vite
-  AI Image Processing

## License

This project is proprietary and intended for educational and research purposes.

---

&copy; 2025 Anusha. All rights reserved.
