# Pixel Utility

A minimalist, high-performance, and private-by-design suite of image tools that feels native to your operating system. Designed with the latest Apple interface guidelines in mind.

## 🛠 Features

### 1. HEIC to JPG Converter
- **Batch Processing**: Drop multiple `.heic` or `.heif` files to convert them simultaneously.
- **High Fidelity**: Converts Apple's High Efficiency Image Format to high-quality JPEGs without losing essential details.
- **Smart Downloads**: Automatically provides a ZIP archive for multiple files or a direct image download for single conversions.

### 2. Professional Image Compressor
- **Granular Controls**: Adjust target file size (MB) and maximum dimensions (pixels) to find the perfect balance between quality and weight.
- **Advanced Algorithms**: Uses `browser-image-compression` for state-of-the-art client-side optimization.
- **Real-time Feedback**: Displays compression ratios and space saved for every image.

## 🔒 Privacy First

Pixel Utility is **100% serverless**. 
- **No Uploads**: Your images are processed entirely within your browser's memory.
- **No Tracking**: We don't track your files, your data, or your usage.
- **Offline Ready**: Once loaded, the utility can function without an active internet connection.

## 🎨 Design Philosophy

Inspired by the latest macOS and iOS aesthetics:
- **SF-like Typography**: Using Inter for clean, legible text.
- **Glassmorphism**: Subtle backdrops and blurs that adapt to your environment.
- **Fluid Motion**: Smooth transitions and subtle pulses for processing states.
- **Native Components**: Segmented controls and range sliders that feel familiar.

## 🚀 Tech Stack

- **React 19**: Modern UI framework.
- **Tailwind CSS**: Utility-first styling for precise Apple-like spacing.
- **heic2any**: Powerful local HEIC decoding.
- **browser-image-compression**: Professional-grade compression.
- **JSZip**: Efficient client-side archiving.

---
*Your images never leave your device. Secure, fast, and free.*