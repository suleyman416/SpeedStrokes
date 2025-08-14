
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { InvokeLLM } from '../integrations/Core';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import TypingInterface from '../components/typing/TypingInterface';
import StatsDisplay from '../components/typing/StatsDisplay';
import InstallPrompt from '../components/ui/InstallPrompt';

export default function TypingPractice() {
  const [currentParagraph, setCurrentParagraph] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [startTime, setStartTime] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [bestWpm, setBestWpm] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [completionStats, setCompletionStats] = useState({ words: 0, time: 0 });
  
  const inputRef = useRef(null);

  const normalizeText = (text) => text.replace(/[\u2018\u2019]/g, "'").replace(/\u2026/g, '...');

  const generateParagraph = useCallback(async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: "Generate a typing practice paragraph with varied sentence lengths. Most should be 2-3 sentences, some 4 sentences, very few 1 sentence. Make it engaging and natural.",
          maxWords: 50
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.text && data.text.trim()) {
          setCurrentParagraph(data.text.trim());
        } else {
          throw new Error('Empty response');
        }
      } else {
        throw new Error('Failed to generate text');
      }
    } catch (error) {
      console.error('Error generating text:', error);
      // Fallback to predefined paragraphs with good variety
      const fallbacks = [
        "The sun rose over the mountains.", // 1 sentence - very short
        "Birds sang in the morning air. The flowers bloomed beautifully.", // 2 sentences - short
        "The river flowed gently through the valley. Fish swam beneath the surface. Trees lined the banks.", // 3 sentences - medium
        "Children played in the park nearby. Laughter echoed through the trees. The swings moved back and forth. Parents watched from benches.", // 4 sentences - medium-long
        "A gentle breeze rustled the leaves overhead. The afternoon sun cast long shadows across the path. Birds chirped melodiously in the branches. The air smelled of fresh grass and flowers. It was a perfect spring day." // 5 sentences - longer
      ];
      setCurrentParagraph(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
    }
    setIsGenerating(false);
    resetTyping();
  }, []);

  const resetTyping = useCallback(() => {
    setUserInput('');
    setStartTime(null);
    setIsCompleted(false);
    setWpm(0);
    setHasError(false);
    setCompletionStats({ words: 0, time: 0 });
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleInputChange = useCallback((value) => {
    if (isCompleted || isGenerating) return;
      
    const normalizedValue = normalizeText(value);
    setUserInput(normalizedValue);

    // Check if current input matches the paragraph up to this point
    const isCorrectSoFar = currentParagraph.startsWith(normalizedValue);
    
    if (isCorrectSoFar) {
      setHasError(false);

      if (!startTime && normalizedValue.length > 0) {
        setStartTime(Date.now());
      }

      if (startTime && normalizedValue.length > 0) {
        const timeElapsedInSeconds = (Date.now() - startTime) / 1000;
        const wordsTyped = normalizedValue.length / 5;
        const currentWpm = timeElapsedInSeconds > 0 ? Math.round((wordsTyped / timeElapsedInSeconds) * 60) : 0;
        setWpm(currentWpm);
        
        if (normalizedValue === currentParagraph) {
            const finalTimeInSeconds = (Date.now() - startTime) / 1000;
            const finalWordsTyped = currentParagraph.length / 5;
            const finalWpm = finalTimeInSeconds > 0 ? Math.round((finalWordsTyped / finalTimeInSeconds) * 60) : 0;
            setIsCompleted(true);
            if (finalWpm > bestWpm) {
                setBestWpm(finalWpm);
            }
            setCompletionStats({
                words: Math.round(finalWordsTyped),
                time: finalTimeInSeconds,
            });
        }
      }
    } else {
      setHasError(true);
    }
  }, [currentParagraph, startTime, isCompleted, isGenerating, bestWpm]);

  const nextParagraph = useCallback(() => {
    generateParagraph();
  }, [generateParagraph]);

  useEffect(() => {
    generateParagraph();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '1') {
        e.preventDefault();
        resetTyping();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (isCompleted) {
          nextParagraph();
        } else {
          generateParagraph();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetTyping, isCompleted, nextParagraph, generateParagraph]);

  // Handle PWA shortcuts
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    if (action === 'new') {
      generateParagraph();
    } else if (action === 'reset') {
      resetTyping();
    }
  }, [generateParagraph, resetTyping]);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex flex-col">
      <div className="container mx-auto px-4 py-4 max-w-4xl flex-1 flex flex-col">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-2"
        >
          <h1 className="text-3xl md:text-4xl font-light text-slate-800 tracking-tight">
            Speed<span className="font-medium text-blue-600">Strokes</span>
          </h1>
        </motion.div>

        {/* Stats Row */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-1"
        >
          <StatsDisplay 
            wpm={wpm}
            bestWpm={bestWpm}
          />
        </motion.div>

        {/* Main Typing Interface */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 flex flex-col"
        >
          <Card className="p-3 md:p-4 shadow-xl border-0 bg-white/80 backdrop-blur-sm flex-1 flex flex-col">
            <div className="flex-1 mb-2">
              <TypingInterface
                currentParagraph={currentParagraph}
                userInput={userInput}
                onInputChange={handleInputChange}
                isGenerating={isGenerating}
                isCompleted={isCompleted}
                hasError={hasError}
                completionStats={completionStats}
                inputRef={inputRef}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-1 mb-2">
              <Button
                variant="outline"
                onClick={resetTyping}
                className="px-6 py-2 rounded-full border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {isCompleted ? 'Again' : 'Reset'}
              </Button>
              
              <Button
                onClick={isCompleted ? nextParagraph : generateParagraph}
                className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {isCompleted ? 'Next' : 'New'}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Instructions */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-slate-400 text-sm mt-1"
        >
          <p>Press <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">1</kbd> for reset/again • <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">Enter</kbd> for new/next • Use backspace to fix mistakes</p>
        </motion.div>
      </div>
      
      {/* Install Prompt */}
      <InstallPrompt />
    </div>
  );
}
