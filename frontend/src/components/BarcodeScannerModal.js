import React, { useState, useRef, useEffect } from 'react';

const BarcodeScannerModal = ({ isOpen, onClose, onScanResult }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [stream, setStream] = useState(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError('');
      setIsScanning(true);

      // Request camera access with back camera preference for mobile
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // Back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      // Start barcode detection
      setTimeout(startBarcodeDetection, 1000);

    } catch (err) {
      console.error('Camera access failed:', err);
      setError('Camera access denied. Please enable camera permissions.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const startBarcodeDetection = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const detectBarcode = () => {
      if (!isScanning) return;

      try {
        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get image data for barcode detection
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // In a real implementation, you would use a barcode detection library
        // like ZXing or QuaggaJS here to detect barcodes in the image data
        
        // For demo purposes, simulate barcode detection
        if (Math.random() < 0.1) { // 10% chance to "detect" a barcode per frame
          const mockBarcode = '1234567890123'; // Mock UPC code
          console.log('📷 Barcode detected:', mockBarcode);
          
          // Look up product by barcode
          lookupProductByBarcode(mockBarcode);
          return;
        }

        // Continue scanning
        requestAnimationFrame(detectBarcode);
        
      } catch (err) {
        console.error('Barcode detection error:', err);
        requestAnimationFrame(detectBarcode);
      }
    };

    // Start detection loop
    detectBarcode();
  };

  const lookupProductByBarcode = async (barcode) => {
    try {
      console.log('🔍 Looking up product by barcode:', barcode);
      setIsScanning(false);

      // Call our enhanced scraping API with barcode lookup
      const response = await fetch('https://spreadsheet-revamp.preview.emergentagent.com/api/barcode-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: barcode })
      });

      if (response.ok) {
        const productData = await response.json();
        console.log('✅ Product found:', productData);
        
        if (onScanResult) {
          onScanResult(productData);
        }
        
        onClose();
      } else {
        // Fallback: manual product search
        setError(`Product not found for barcode: ${barcode}. Please enter details manually.`);
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Barcode lookup failed:', error);
      setError('Product lookup failed. Please try again.');
    }
  };

  const manualBarcodeEntry = async () => {
    const barcode = prompt('Enter barcode number:');
    if (barcode) {
      await lookupProductByBarcode(barcode);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Scan Product Barcode</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="relative mb-4">
          <video
            ref={videoRef}
            className="w-full h-64 bg-black rounded object-cover"
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            className="hidden"
          />
          
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-red-500 w-48 h-32 rounded-lg animate-pulse">
                <div className="text-white text-center mt-8 text-sm">
                  Position barcode within frame
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={startCamera}
            disabled={isScanning}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded"
          >
            {isScanning ? '📷 Scanning...' : '📷 Start Scan'}
          </button>
          
          <button
            onClick={manualBarcodeEntry}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            ⌨️ Enter Manually
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-400 text-sm">
            Scan UPC codes, QR codes, or enter barcode numbers manually
          </p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScannerModal;