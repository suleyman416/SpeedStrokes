
import React from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '../../components/ui/skeleton';

export default function TypingInterface({ 
  currentParagraph, 
  userInput, 
  onInputChange, 
  isGenerating, 
  isCompleted, 
  hasError,
  completionStats,
  inputRef 
}) {
  const firstErrorIndex = React.useMemo(() => {
    if (!hasError) return -1;
    for (let i = 0; i < userInput.length; i++) {
        if (userInput[i] !== currentParagraph[i]) {
            return i;
        }
    }
    return userInput.length;
  }, [hasError, userInput, currentParagraph]);

  const renderCharacter = (char, index) => {
    let className = "text-lg ";
    
    if (index < userInput.length) {
      const isCorrect = userInput[index] === char;
      const isPastError = hasError && index >= firstErrorIndex;
      
      if (isCorrect && !isPastError) {
        className += "text-green-600";
      } else {
        className += "text-red-500 bg-red-100/70 rounded px-0.5";
      }
    } else if (index === userInput.length) {
      className += "text-slate-800 bg-blue-100 rounded animate-pulse px-0.5";
    } else {
      className += "text-slate-400";
    }

    return (
      <span key={index} className={className + " transition-colors duration-150"}>
        {char}
      </span>
    );
  };

  return (
    <div className="space-y-1 h-full flex flex-col">
      {/* Paragraph Display */}
      <div className="relative flex-1 max-h-[35vh]">
        {isGenerating ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-left p-2 bg-slate-50/50 rounded-2xl border border-slate-100 h-full min-h-[50px] max-h-[30vh] flex items-center"
            onClick={() => inputRef.current?.focus()}
          >
            <div className="font-mono tracking-wide leading-tight w-full">
              {currentParagraph.split('').map((char, index) => renderCharacter(char, index))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="relative">
        <textarea
          ref={inputRef}
          value={userInput}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={isGenerating ? "Generating new text..." : "Start typing here..."}
          disabled={isGenerating || isCompleted}
          className={`w-full min-h-[64px] max-h-[200px] p-3 text-lg font-mono leading-relaxed bg-white border-2 rounded-2xl focus:ring-4 focus:ring-blue-100 transition-all duration-200 resize-none placeholder:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed overflow-y-auto ${
            hasError 
              ? 'border-red-400 focus:border-red-400 bg-red-50/30' 
              : 'border-slate-200 focus:border-blue-400'
          }`}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          style={{ height: 'auto' }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
        />
        
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-green-50/90 rounded-2xl flex items-center justify-center backdrop-blur-sm"
          >
            <div className="text-center">
              <div className="text-lg font-medium text-green-700">Text completed</div>
              <div className="text-sm text-green-600">
                {completionStats.words} words in {completionStats.time.toFixed(1)} seconds
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}