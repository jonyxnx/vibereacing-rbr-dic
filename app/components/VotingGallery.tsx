'use client';

import { useState, useEffect } from 'react';

interface Drawing {
  id: string;
  imageData: string;
  word: string;
  author: string;
  votes: number;
}

interface VotingGalleryProps {
  drawings: Drawing[];
  onVote: (drawingId: string) => void;
  userVote: string | null;
  disabled?: boolean;
}

export default function VotingGallery({ drawings, onVote, userVote, disabled = false }: VotingGalleryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(userVote);

  useEffect(() => {
    setSelectedId(userVote);
  }, [userVote]);

  const handleVote = (drawingId: string) => {
    if (disabled || selectedId === drawingId) return;
    setSelectedId(drawingId);
    onVote(drawingId);
  };

  if (drawings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-500">No drawings to vote on yet. Waiting for players to finish...</p>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      {/* Enhanced Christmas Decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        {/* Snowflakes */}
        <div className="absolute top-8 left-8 w-2.5 h-2.5 text-red-500 opacity-20" style={{ transform: 'rotate(45deg)' }}>
          <div className="w-full h-px bg-current absolute top-1/2"></div>
          <div className="w-full h-px bg-current absolute top-1/2 rotate-90"></div>
          <div className="w-full h-px bg-current absolute top-1/2 rotate-45"></div>
        </div>
        <div className="absolute top-12 right-12 w-2 h-2 text-green-500 opacity-20" style={{ transform: 'rotate(45deg)' }}>
          <div className="w-full h-px bg-current absolute top-1/2"></div>
          <div className="w-full h-px bg-current absolute top-1/2 rotate-90"></div>
        </div>
        <div className="absolute bottom-12 left-12 w-2.5 h-2.5 text-red-500 opacity-20" style={{ transform: 'rotate(45deg)' }}>
          <div className="w-full h-px bg-current absolute top-1/2"></div>
          <div className="w-full h-px bg-current absolute top-1/2 rotate-90"></div>
          <div className="w-full h-px bg-current absolute top-1/2 rotate-45"></div>
        </div>
        <div className="absolute bottom-8 right-8 w-2 h-2 text-green-500 opacity-20" style={{ transform: 'rotate(45deg)' }}>
          <div className="w-full h-px bg-current absolute top-1/2"></div>
          <div className="w-full h-px bg-current absolute top-1/2 rotate-90"></div>
        </div>
        
        {/* Ornaments */}
        <div className="absolute top-6 left-6 w-2 h-2 bg-red-500 rounded-full opacity-25"></div>
        <div className="absolute top-10 right-10 w-1.5 h-1.5 bg-green-500 rounded-full opacity-25"></div>
        <div className="absolute bottom-10 left-10 w-2 h-2 bg-red-500 rounded-full opacity-25"></div>
        <div className="absolute bottom-6 right-6 w-1.5 h-1.5 bg-green-500 rounded-full opacity-25"></div>
        
        {/* Stars */}
        <div className="absolute top-4 left-1/4 text-yellow-400 opacity-15 text-xs" style={{ transform: 'rotate(45deg)' }}>✦</div>
        <div className="absolute top-4 right-1/4 text-yellow-400 opacity-15 text-xs" style={{ transform: 'rotate(45deg)' }}>✦</div>
      </div>
      
      <div className="relative z-10">
        <h2 className="text-lg font-light text-center mb-12 text-gray-900 relative">
          <span className="absolute -left-8 top-0 text-red-500 opacity-30 text-sm" style={{ transform: 'rotate(45deg)' }}>✦</span>
          Vote
          <span className="absolute -right-8 top-0 text-green-500 opacity-30 text-sm" style={{ transform: 'rotate(45deg)' }}>✦</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {drawings.map((drawing) => (
          <div
            key={drawing.id}
            onClick={() => handleVote(drawing.id)}
            className={`relative border-2 cursor-pointer transition-all duration-300 bg-gradient-to-br from-white to-gray-50 shadow-md rounded-lg overflow-hidden ${
              selectedId === drawing.id
                ? 'border-gray-900 shadow-xl scale-105 ring-2 ring-gray-900 ring-opacity-20'
                : 'border-gray-200 hover:border-gray-400 hover:shadow-xl hover:scale-102'
            } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <div className="aspect-video bg-gray-50 relative overflow-hidden">
              <img
                src={drawing.imageData}
                alt={`Drawing of ${drawing.word} by ${drawing.author}`}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-1">{drawing.word}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">{drawing.author}</p>
                <div className="flex items-center gap-3">
                  {selectedId === drawing.id && (
                    <span className="text-xs text-gray-900">Selected</span>
                  )}
                  <span className="text-xs text-gray-900">{drawing.votes}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
        {selectedId && !disabled && (
          <div className="mt-12 text-center">
            <p className="text-xs text-gray-500">Vote submitted</p>
          </div>
        )}
      </div>
    </div>
  );
}

