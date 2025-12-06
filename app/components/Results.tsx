'use client';

interface Drawing {
  id: string;
  imageData: string;
  word: string;
  author: string;
  votes: number;
}

interface ResultsProps {
  drawings: Drawing[];
  onNewRound: () => void;
}

export default function Results({ drawings, onNewRound }: ResultsProps) {
  const sortedDrawings = [...drawings].sort((a, b) => b.votes - a.votes);
  const winner = sortedDrawings[0];
  const isTie = sortedDrawings.length > 1 && sortedDrawings[0].votes === sortedDrawings[1].votes;

  return (
    <div className="w-full relative">
      {/* Enhanced Christmas Decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        {/* Snowflakes */}
        <div className="absolute top-8 left-8 w-3 h-3 text-red-500 opacity-20" style={{ transform: 'rotate(45deg)' }}>
          <div className="w-full h-px bg-current absolute top-1/2"></div>
          <div className="w-full h-px bg-current absolute top-1/2 rotate-90"></div>
          <div className="w-full h-px bg-current absolute top-1/2 rotate-45"></div>
          <div className="w-full h-px bg-current absolute top-1/2 -rotate-45"></div>
        </div>
        <div className="absolute top-12 right-12 w-2.5 h-2.5 text-green-500 opacity-20" style={{ transform: 'rotate(45deg)' }}>
          <div className="w-full h-px bg-current absolute top-1/2"></div>
          <div className="w-full h-px bg-current absolute top-1/2 rotate-90"></div>
          <div className="w-full h-px bg-current absolute top-1/2 rotate-45"></div>
        </div>
        <div className="absolute bottom-12 left-12 w-3 h-3 text-red-500 opacity-20" style={{ transform: 'rotate(45deg)' }}>
          <div className="w-full h-px bg-current absolute top-1/2"></div>
          <div className="w-full h-px bg-current absolute top-1/2 rotate-90"></div>
          <div className="w-full h-px bg-current absolute top-1/2 rotate-45"></div>
          <div className="w-full h-px bg-current absolute top-1/2 -rotate-45"></div>
        </div>
        <div className="absolute bottom-8 right-8 w-2.5 h-2.5 text-green-500 opacity-20" style={{ transform: 'rotate(45deg)' }}>
          <div className="w-full h-px bg-current absolute top-1/2"></div>
          <div className="w-full h-px bg-current absolute top-1/2 rotate-90"></div>
          <div className="w-full h-px bg-current absolute top-1/2 rotate-45"></div>
        </div>
        
        {/* Ornaments */}
        <div className="absolute top-6 left-6 w-2 h-2 bg-red-500 rounded-full opacity-25"></div>
        <div className="absolute top-10 right-10 w-1.5 h-1.5 bg-green-500 rounded-full opacity-25"></div>
        <div className="absolute bottom-10 left-10 w-2 h-2 bg-red-500 rounded-full opacity-25"></div>
        <div className="absolute bottom-6 right-6 w-1.5 h-1.5 bg-green-500 rounded-full opacity-25"></div>
        <div className="absolute top-1/3 left-6 w-1.5 h-1.5 bg-red-500 rounded-full opacity-20"></div>
        <div className="absolute bottom-1/3 right-6 w-1.5 h-1.5 bg-green-500 rounded-full opacity-20"></div>
        
        {/* Stars */}
        <div className="absolute top-4 left-1/4 text-yellow-400 opacity-15 text-sm" style={{ transform: 'rotate(45deg)' }}>✦</div>
        <div className="absolute top-4 right-1/4 text-yellow-400 opacity-15 text-sm" style={{ transform: 'rotate(45deg)' }}>✦</div>
        <div className="absolute bottom-4 left-1/3 text-yellow-400 opacity-15 text-sm" style={{ transform: 'rotate(45deg)' }}>✦</div>
        <div className="absolute bottom-4 right-1/3 text-yellow-400 opacity-15 text-sm" style={{ transform: 'rotate(45deg)' }}>✦</div>
      </div>
      
      <div className="relative z-10">
        <div className="text-center mb-12">
          {isTie ? (
            <h2 className="text-lg font-light text-gray-900 mb-2 relative">
              <span className="absolute -left-8 top-0 text-red-500 opacity-30 text-sm" style={{ transform: 'rotate(45deg)' }}>✦</span>
              Tie
              <span className="absolute -right-8 top-0 text-green-500 opacity-30 text-sm" style={{ transform: 'rotate(45deg)' }}>✦</span>
            </h2>
          ) : (
            <>
              <h2 className="text-lg font-light text-gray-900 mb-2 relative">
                <span className="absolute -left-8 top-0 text-red-500 opacity-30 text-sm" style={{ transform: 'rotate(45deg)' }}>✦</span>
                Winner
                <span className="absolute -right-8 top-0 text-green-500 opacity-30 text-sm" style={{ transform: 'rotate(45deg)' }}>✦</span>
              </h2>
              <p className="text-sm text-gray-500">{winner?.author}</p>
            </>
          )}
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {sortedDrawings.map((drawing, index) => (
          <div
            key={drawing.id}
            className={`relative border-2 bg-gradient-to-br from-white to-gray-50 shadow-md rounded-lg overflow-hidden transition-all duration-300 ${
              index === 0 && !isTie
                ? 'border-gray-900 shadow-xl scale-105 ring-2 ring-yellow-400 ring-opacity-30'
                : 'border-gray-200 hover:shadow-lg'
            }`}
          >
            <div className="aspect-video bg-gray-50 relative overflow-hidden">
              <img
                src={drawing.imageData}
                alt={`Drawing of ${drawing.word} by ${drawing.author}`}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">#{index + 1}</span>
                <span className="text-xs text-gray-900">{drawing.votes}</span>
              </div>
              <p className="text-xs text-gray-500 mb-1">{drawing.word}</p>
              <p className="text-xs text-gray-400">{drawing.author}</p>
            </div>
          </div>
        ))}
      </div>

        <div className="text-center">
          <button
            onClick={onNewRound}
            className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-normal transition-colors"
          >
            New round
          </button>
        </div>
      </div>
    </div>
  );
}

