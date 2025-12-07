'use client';

import { useRef, useEffect, useState } from 'react';

interface DrawingCanvasProps {
  onDrawingComplete: (imageData: string) => void;
  word: string;
  disabled?: boolean;
  onSubmit?: () => void;
}

export default function DrawingCanvas({ onDrawingComplete, word, disabled = false, onSubmit }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Set default styles
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
  }, [color, brushSize]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
    }
  };

  const handleSubmit = () => {
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      onDrawingComplete(canvas.toDataURL());
      if (onSubmit) {
        onSubmit();
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || disabled) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB'];

  return (
    <div className="flex flex-col items-center gap-8 relative">
      {/* Enhanced Christmas Decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        {/* Snowflakes */}
        <div className="absolute top-2 left-8 w-2 h-2 text-red-500 opacity-20" style={{ transform: 'rotate(45deg)' }}>
          <div className="w-full h-px bg-current absolute top-1/2"></div>
          <div className="w-full h-px bg-current absolute top-1/2 rotate-90"></div>
        </div>
        <div className="absolute top-6 right-8 w-2 h-2 text-green-500 opacity-20" style={{ transform: 'rotate(45deg)' }}>
          <div className="w-full h-px bg-current absolute top-1/2"></div>
          <div className="w-full h-px bg-current absolute top-1/2 rotate-90"></div>
        </div>
        <div className="absolute bottom-6 left-8 w-2 h-2 text-red-500 opacity-20" style={{ transform: 'rotate(45deg)' }}>
          <div className="w-full h-px bg-current absolute top-1/2"></div>
          <div className="w-full h-px bg-current absolute top-1/2 rotate-90"></div>
        </div>
        <div className="absolute bottom-2 right-8 w-2 h-2 text-green-500 opacity-20" style={{ transform: 'rotate(45deg)' }}>
          <div className="w-full h-px bg-current absolute top-1/2"></div>
          <div className="w-full h-px bg-current absolute top-1/2 rotate-90"></div>
        </div>

        {/* Ornaments */}
        <div className="absolute top-4 left-12 w-1.5 h-1.5 bg-red-500 rounded-full opacity-20"></div>
        <div className="absolute top-8 right-12 w-1.5 h-1.5 bg-green-500 rounded-full opacity-20"></div>
        <div className="absolute bottom-8 left-12 w-1.5 h-1.5 bg-red-500 rounded-full opacity-20"></div>
        <div className="absolute bottom-4 right-12 w-1.5 h-1.5 bg-green-500 rounded-full opacity-20"></div>

        {/* Stars */}
        <div className="absolute top-0 left-1/2 text-yellow-400 opacity-15 text-xs" style={{ transform: 'translateX(-50%) rotate(45deg)' }}>✦</div>
      </div>

      <div className="text-center relative z-10 mb-4">
        <h2 className="text-xl font-light text-gray-900 mb-3 relative inline-block">
          <span className="absolute -left-8 top-1 text-red-500 opacity-40 text-lg animate-pulse" style={{ transform: 'rotate(45deg)' }}>✦</span>
          Draw this:
          <span className="absolute -right-8 top-1 text-green-500 opacity-40 text-lg animate-pulse" style={{ transform: 'rotate(45deg)', animationDelay: '1s' }}>✦</span>
        </h2>
        <div className="relative inline-block">
          <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-green-600 px-8 py-2 filter drop-shadow-sm transform hover:scale-105 transition-transform duration-300">
            {word}
          </p>
          <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        </div>
        {disabled && <p className="text-xs text-gray-400 mt-2 uppercase tracking-widest">Viewing mode</p>}
      </div>

      <div className="border-2 border-gray-300 p-3 shadow-lg relative z-10 rounded-lg bg-gradient-to-br from-white to-gray-50">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="cursor-crosshair touch-none"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      {!disabled && (
        <div className="flex flex-col gap-6 w-full max-w-2xl relative z-10">
          <div className="flex items-center gap-6 justify-center flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">Color</span>
              <div className="flex gap-1">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 ${color === c ? 'ring-2 ring-gray-900 ring-offset-1' : ''
                      }`}
                    style={{ backgroundColor: c }}
                    type="button"
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">Size</span>
              <input
                type="range"
                min="2"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-20"
              />
              <span className="text-xs text-gray-500 w-6">{brushSize}</span>
            </div>
            <button
              onClick={clearCanvas}
              className="px-4 py-1.5 border border-gray-300 hover:border-gray-900 text-xs text-gray-700 transition-colors"
              type="button"
            >
              Clear
            </button>
          </div>
          <div className="flex justify-center mt-4">
            <button
              onClick={handleSubmit}
              disabled={!hasDrawn}
              className="px-8 py-2 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 disabled:from-gray-200 disabled:to-gray-200 disabled:cursor-not-allowed text-white text-sm font-normal transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none rounded-lg"
              type="button"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

