"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose, isOpen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>("");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError("");

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setHasPermission(true);
        setIsScanning(true);

        // Start scanning for QR codes
        scanForQRCode();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check permissions.");
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const scanForQRCode = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      setTimeout(scanForQRCode, 100);
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for QR code detection
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Here you would typically use a QR code detection library
    // For now, we'll simulate QR code detection
    simulateQRDetection(imageData);

    // Continue scanning
    if (isScanning) {
      setTimeout(scanForQRCode, 100);
    }
  };

  const simulateQRDetection = (imageData: ImageData) => {
    // This is a placeholder for actual QR code detection
    // In a real implementation, you would use a library like jsQR

    // Simulate finding a QR code occasionally
    if (Math.random() < 0.01) {
      // 1% chance per frame
      const mockQRData = `GREENMART_PRODUCT_${Math.floor(
        Math.random() * 1000
      )}`;
      handleQRCodeDetected(mockQRData);
    }
  };

  const handleQRCodeDetected = (data: string) => {
    setIsScanning(false);
    onScan(data);
  };

  const handleManualInput = () => {
    const input = prompt("Enter QR code data manually:");
    if (input) {
      handleQRCodeDetected(input);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative w-full h-full max-w-md max-h-screen bg-black">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-black bg-opacity-50">
          <h3 className="text-white font-semibold">Scan QR Code</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative w-full h-full flex items-center justify-center">
          {hasPermission === null && (
            <div className="text-white text-center">
              <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Requesting camera access...</p>
            </div>
          )}

          {hasPermission === false && (
            <div className="text-white text-center p-4">
              <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">{error}</p>
              <button
                onClick={startCamera}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg mb-2"
              >
                Try Again
              </button>
              <br />
              <button
                onClick={handleManualInput}
                className="text-green-400 hover:text-green-300 underline"
              >
                Enter manually
              </button>
            </div>
          )}

          {hasPermission && (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />

              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Scanning frame */}
                  <div className="w-64 h-64 border-2 border-green-500 rounded-lg relative">
                    {/* Corner indicators */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>

                    {/* Scanning line animation */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-green-500 animate-pulse"></div>
                  </div>

                  <p className="text-white text-center mt-4">
                    Position QR code within the frame
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50">
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleManualInput}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Manual Entry
            </button>
            <button
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default QRScanner;
