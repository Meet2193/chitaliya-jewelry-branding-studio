import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, Move, Maximize2, RotateCcw, Sparkles, Eye, Ruler } from 'lucide-react';

interface ImageData {
  file: File;
  url: string;
  width: number;
  height: number;
}

interface LogoSettings {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  sizePercentage: number;
  margin: number;
  position: string;
}

type PositionPreset = 'TL' | 'TC' | 'TR' | 'CL' | 'C' | 'CR' | 'BL' | 'BC' | 'BR';

function App() {
  const [jewelryImage, setJewelryImage] = useState<ImageData | null>(null);
  const [logoImage, setLogoImage] = useState<ImageData | null>(null);
  const [logoSettings, setLogoSettings] = useState<LogoSettings>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    opacity: 100,
    sizePercentage: 15,
    margin: 20,
    position: 'TR'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const positionPresets: { key: PositionPreset; label: string }[] = [
    { key: 'TL', label: 'TL' },
    { key: 'TC', label: 'TC' },
    { key: 'TR', label: 'TR' },
    { key: 'CL', label: 'CL' },
    { key: 'C', label: 'C' },
    { key: 'CR', label: 'CR' },
    { key: 'BL', label: 'BL' },
    { key: 'BC', label: 'BC' },
    { key: 'BR', label: 'BR' }
  ];

  const getPositionLabel = (position: string) => {
    const labels: { [key: string]: string } = {
      'TL': 'Top Left',
      'TC': 'Top Center',
      'TR': 'Top Right',
      'CL': 'Center Left',
      'C': 'Center',
      'CR': 'Center Right',
      'BL': 'Bottom Left',
      'BC': 'Bottom Center',
      'BR': 'Bottom Right'
    };
    return labels[position] || 'Custom';
  };

  const calculatePositionFromPreset = useCallback((preset: PositionPreset, jewelryWidth: number, jewelryHeight: number, logoWidth: number, logoHeight: number, margin: number) => {
    let x = 0, y = 0;

    switch (preset) {
      case 'TL':
        x = margin;
        y = margin;
        break;
      case 'TC':
        x = (jewelryWidth - logoWidth) / 2;
        y = margin;
        break;
      case 'TR':
        x = jewelryWidth - logoWidth - margin;
        y = margin;
        break;
      case 'CL':
        x = margin;
        y = (jewelryHeight - logoHeight) / 2;
        break;
      case 'C':
        x = (jewelryWidth - logoWidth) / 2;
        y = (jewelryHeight - logoHeight) / 2;
        break;
      case 'CR':
        x = jewelryWidth - logoWidth - margin;
        y = (jewelryHeight - logoHeight) / 2;
        break;
      case 'BL':
        x = margin;
        y = jewelryHeight - logoHeight - margin;
        break;
      case 'BC':
        x = (jewelryWidth - logoWidth) / 2;
        y = jewelryHeight - logoHeight - margin;
        break;
      case 'BR':
        x = jewelryWidth - logoWidth - margin;
        y = jewelryHeight - logoHeight - margin;
        break;
    }

    return { x: Math.max(0, Math.min(x, jewelryWidth - logoWidth)), y: Math.max(0, Math.min(y, jewelryHeight - logoHeight)) };
  }, []);

  const updateLogoPosition = useCallback((preset: PositionPreset) => {
    if (!jewelryImage || !logoImage) return;

    const logoWidth = (jewelryImage.width * logoSettings.sizePercentage) / 100;
    const logoHeight = (logoImage.height * logoWidth) / logoImage.width;

    const { x, y } = calculatePositionFromPreset(preset, jewelryImage.width, jewelryImage.height, logoWidth, logoHeight, logoSettings.margin);

    setLogoSettings(prev => ({
      ...prev,
      position: preset,
      x,
      y,
      width: logoWidth,
      height: logoHeight
    }));
  }, [jewelryImage, logoImage, logoSettings.sizePercentage, logoSettings.margin, calculatePositionFromPreset]);

  const updateLogoSize = useCallback((percentage: number) => {
    if (!jewelryImage || !logoImage) return;

    const logoWidth = (jewelryImage.width * percentage) / 100;
    const logoHeight = (logoImage.height * logoWidth) / logoImage.width;

    setLogoSettings(prev => {
      const { x, y } = calculatePositionFromPreset(prev.position as PositionPreset, jewelryImage.width, jewelryImage.height, logoWidth, logoHeight, prev.margin);
      return {
        ...prev,
        sizePercentage: percentage,
        width: logoWidth,
        height: logoHeight,
        x,
        y
      };
    });
  }, [jewelryImage, logoImage, calculatePositionFromPreset]);

  const updateMargin = useCallback((margin: number) => {
    if (!jewelryImage || !logoImage) return;

    setLogoSettings(prev => {
      const { x, y } = calculatePositionFromPreset(prev.position as PositionPreset, jewelryImage.width, jewelryImage.height, prev.width, prev.height, margin);
      return {
        ...prev,
        margin,
        x,
        y
      };
    });
  }, [jewelryImage, logoImage, calculatePositionFromPreset]);

  const handleFileUpload = useCallback((file: File, type: 'jewelry' | 'logo') => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const imageData: ImageData = {
          file,
          url: e.target?.result as string,
          width: img.width,
          height: img.height
        };

        if (type === 'jewelry') {
          setJewelryImage(imageData);
        } else {
          setLogoImage(imageData);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, type: 'jewelry' | 'logo') => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0], type);
    }
  }, [handleFileUpload]);

  const updateCanvas = useCallback(() => {
    if (!jewelryImage || !logoImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = jewelryImage.width;
    canvas.height = jewelryImage.height;

    const jewelryImg = new Image();
    jewelryImg.onload = () => {
      ctx.drawImage(jewelryImg, 0, 0);

      const logoImg = new Image();
      logoImg.onload = () => {
        ctx.globalAlpha = logoSettings.opacity / 100;
        ctx.drawImage(
          logoImg,
          logoSettings.x,
          logoSettings.y,
          logoSettings.width,
          logoSettings.height
        );
        ctx.globalAlpha = 1;

        updatePreviewCanvas();
      };
      logoImg.src = logoImage.url;
    };
    jewelryImg.src = jewelryImage.url;
  }, [jewelryImage, logoImage, logoSettings]);

  const updatePreviewCanvas = useCallback(() => {
    if (!canvasRef.current || !previewCanvasRef.current) return;

    const sourceCanvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    const ctx = previewCanvas.getContext('2d');
    if (!ctx) return;

    const maxWidth = 400;
    const scale = Math.min(maxWidth / sourceCanvas.width, maxWidth / sourceCanvas.height);
    const previewWidth = sourceCanvas.width * scale;
    const previewHeight = sourceCanvas.height * scale;

    previewCanvas.width = previewWidth;
    previewCanvas.height = previewHeight;

    ctx.drawImage(sourceCanvas, 0, 0, previewWidth, previewHeight);
  }, []);

  const downloadImage = useCallback(() => {
    if (!canvasRef.current) return;

    setIsProcessing(true);
    
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.download = `chitaliya-branded-jewelry-${Date.now()}.png`;
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      setIsProcessing(false);
    }, 'image/png');
  }, []);

  const resetPosition = useCallback(() => {
    updateLogoPosition('TR');
  }, [updateLogoPosition]);

  useEffect(() => {
    if (jewelryImage && logoImage) {
      updateLogoPosition(logoSettings.position as PositionPreset);
    }
  }, [jewelryImage, logoImage, updateLogoPosition]);

  useEffect(() => {
    updateCanvas();
  }, [updateCanvas]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-2 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Chitaliya Jewelry Branding Studio</h1>
                <p className="text-sm text-gray-600">Professional logo placement for your jewelry</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Images</h2>
              
              {/* Jewelry Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jewelry Product Image
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'jewelry')}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-yellow-400 transition-colors cursor-pointer"
                >
                  {jewelryImage ? (
                    <div className="space-y-2">
                      <img
                        src={jewelryImage.url}
                        alt="Jewelry"
                        className="mx-auto h-20 w-20 object-cover rounded"
                      />
                      <p className="text-sm text-gray-600">
                        {jewelryImage.width} × {jewelryImage.height}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Drag & drop your jewelry image here
                      </p>
                    </div>
                  )}
                  <input
                    id="jewelry-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'jewelry')}
                    className="hidden"
                  />
                </div>
                <button
                  onClick={() => document.getElementById('jewelry-upload')?.click()}
                  className="mt-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                >
                  Choose File
                </button>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Logo
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'logo')}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-yellow-400 transition-colors cursor-pointer"
                >
                  {logoImage ? (
                    <div className="space-y-2">
                      <img
                        src={logoImage.url}
                        alt="Logo"
                        className="mx-auto h-20 w-20 object-contain rounded"
                      />
                      <p className="text-sm text-gray-600">
                        {logoImage.width} × {logoImage.height}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Drag & drop your logo here
                      </p>
                    </div>
                  )}
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo')}
                    className="hidden"
                  />
                </div>
                <button
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  className="mt-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                >
                  Choose File
                </button>
              </div>
            </div>

            {/* Enhanced Logo Settings */}
            {jewelryImage && logoImage && (
              <div className="space-y-4">
                {/* Position Settings */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Move className="h-5 w-5 mr-2" />
                    Position
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {positionPresets.map((preset) => (
                      <button
                        key={preset.key}
                        onClick={() => updateLogoPosition(preset.key)}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          logoSettings.position === preset.key
                            ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    Currently: <span className="font-medium">{getPositionLabel(logoSettings.position)}</span>
                  </p>
                </div>

                {/* Size Settings */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Maximize2 className="h-5 w-5 mr-2" />
                    Size
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">Logo Size</label>
                      <span className="text-sm font-medium text-gray-900">{logoSettings.sizePercentage}%</span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="5"
                        max="50"
                        value={logoSettings.sizePercentage}
                        onChange={(e) => updateLogoSize(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>5%</span>
                        <span>50%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Opacity Settings */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Opacity
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">Logo Opacity</label>
                      <span className="text-sm font-medium text-gray-900">{logoSettings.opacity}%</span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={logoSettings.opacity}
                        onChange={(e) => setLogoSettings(prev => ({ ...prev, opacity: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>10%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Margin Settings */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Ruler className="h-5 w-5 mr-2" />
                    Margin
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">Edge Distance</label>
                      <span className="text-sm font-medium text-gray-900">{logoSettings.margin}px</span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={logoSettings.margin}
                        onChange={(e) => updateMargin(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0px</span>
                        <span>100px</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <button
                    onClick={resetPosition}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Top Right
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
                {jewelryImage && logoImage && (
                  <button
                    onClick={downloadImage}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </span>
                    )}
                  </button>
                )}
              </div>

              <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[400px] flex items-center justify-center">
                {jewelryImage && logoImage ? (
                  <div className="relative">
                    <canvas
                      ref={previewCanvasRef}
                      className="max-w-full max-h-[500px] object-contain rounded-lg shadow-lg"
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      {jewelryImage.width} × {jewelryImage.height}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <Sparkles className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-lg font-medium">Upload both images to see the preview</p>
                    <p className="text-sm">Your branded jewelry image will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hidden canvas for full resolution processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #f59e0b;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #f59e0b;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}

export default App;