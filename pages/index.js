
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
    setCurrentParagraph('');
    setUserInput('');
    
    const topics = [
      'daily life and routines',
      'family and friends', 
      'food and cooking',
      'weather and seasons',
      'pets and animals',
      'school and learning',
      'work and jobs',
      'sports and games',
      'movies and books',
      'music and songs',
      'travel and places',
      'cars and driving',
      'home and garden',
      'shopping and stores',
      'health and exercise'
    ];
    
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    const numSentences = Math.floor(Math.random() * 4) + 2; // 2-5 sentences
    const randomSeed = Math.random().toString(36).substring(7);
    
    try {
      const response = await InvokeLLM({
        prompt: `Write a simple, natural paragraph about ${randomTopic} using common, everyday words. 
        
        Requirements:
        - Exactly ${numSentences} sentences
        - Use simple, common vocabulary that most people know
        - Keep sentences shorter and easy to read
        - Write in a conversational, natural style
        - Avoid complex or technical words
        - Include everyday situations and experiences
        - Total length should be 120-280 characters
        - Random variation: ${randomSeed}
        
        Return only the paragraph text.`,
      });
      
      setCurrentParagraph(normalizeText(response.trim()));
    } catch (error) {
      const fallbacks = [
        "The cat spent the entire morning sitting by the living room window watching birds fly around the backyard. She seemed completely fascinated by their movements and would occasionally make little chirping sounds. My neighbor's bird feeder attracts all kinds of colorful birds throughout the day.",
        "We ordered pizza for dinner last night and it was absolutely delicious. The cheese was perfectly melted and the crust was crispy on the outside but soft on the inside. Everyone at the table agreed it was the best pizza we had ever ordered from that restaurant.",
        "The rain started pouring down just as I was walking home from the grocery store. I ran to the front door as quickly as possible but still got completely soaked by the time I reached the porch. My shoes were covered in mud from the wet ground and I had to leave them outside to dry.",
        "My friend called me yesterday afternoon to discuss the details for the upcoming party. We talked for over an hour about what food to bring and how to decorate the venue. She mentioned that we should arrive early to help set up the decorations and arrange the tables."
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
            Type<span className="font-medium text-blue-600">Flow</span>
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
