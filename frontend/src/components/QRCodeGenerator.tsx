"use client";

import type React from "react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QRCodeGeneratorProps {
  data: string;
  size?: number;
  className?: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  data,
  size = 200,
  className = "",
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        setLoading(true);
        setError("");

        const url = await QRCode.toDataURL(data, {
          width: size,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });

        setQrCodeUrl(url);
      } catch (err) {
        console.error("Error generating QR code:", err);
        setError("Failed to generate QR code");
      } finally {
        setLoading(false);
      }
    };

    if (data) {
      generateQRCode();
    }
  }, [data, size]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <p className="text-red-500 text-sm text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <img
        src={qrCodeUrl || "/placeholder.svg"}
        alt="QR Code"
        className="rounded-lg shadow-sm"
        style={{ width: size, height: size }}
      />
    </div>
  );
};

export default QRCodeGenerator;
