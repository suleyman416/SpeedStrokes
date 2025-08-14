
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
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [bestWpm, setBestWpm] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [completionStats, setCompletionStats] = useState({ words: 0, time: 0 });
  const [usedTexts, setUsedTexts] = useState(new Set()); // Track used texts
  const [textPool, setTextPool] = useState([]); // Pool of available texts
  const inputRef = useRef(null);

  // Initialize text pool with all available texts
  useEffect(() => {
    const allTexts = [
      // Very short texts (1 sentence)
      "The sun rose over the mountains.",
      "Coffee brewing in the kitchen.",
      "Stars twinkled in the night sky.",
      "Wind howled through the trees.",
      "The phone rang unexpectedly.",
      "Birds sang in the morning air.",
      "The cat stretched lazily.",
      "Rain fell softly outside.",
      "The clock ticked steadily.",
      "A dog barked in the distance.",
      
      // Short texts (2 sentences)
      "Birds sang in the morning air. The flowers bloomed beautifully.",
      "The cat stretched lazily. Sunlight warmed the windowsill.",
      "The dog wagged its tail excitedly. Treats were hidden in the cupboard.",
      "An old friend was calling. The conversation lasted for hours.",
      "The movie theater was packed with excited viewers. Popcorn popped in the background.",
      "The beach was crowded with summer visitors. Children built sandcastles near the water's edge.",
      "The library was filled with students studying quietly. Books were scattered across tables.",
      "The garden was full of colorful flowers. Bees buzzed between the blossoms.",
      "The kitchen smelled of freshly baked bread. My grandmother's recipe called for simple ingredients.",
      "The art gallery featured works from local artists. Each painting told a unique story.",
      
      // Medium texts (3 sentences)
      "The river flowed gently through the valley. Fish swam beneath the surface. Trees lined the banks.",
      "Raindrops tapped against the window pane. The street below was empty and quiet. A few cars drove by slowly.",
      "Music played softly from the radio. The melody was familiar and comforting. Memories flooded back from years ago.",
      "Everyone settled into their seats. The lights dimmed slowly. The movie began with a dramatic opening scene.",
      "Seagulls soared overhead searching for food. The waves crashed rhythmically against the shore. Families enjoyed picnics on the sand.",
      "Some people typed on laptops while others read physical books. The atmosphere was peaceful and focused. Knowledge seemed to hang in the air.",
      "Butterflies danced in the warm air. Everything seemed alive and vibrant. The garden was a perfect place for meditation.",
      "The dough had risen perfectly overnight. I could hear the timer ticking down. Soon the golden crust would be ready to enjoy.",
      "Visitors moved slowly from piece to piece. Some stopped to read the descriptions. The atmosphere encouraged quiet contemplation.",
      "The melody was familiar and comforting. Memories flooded back from years ago. It felt like being transported to another time.",
      
      // Medium-long texts (4 sentences)
      "Children played in the park nearby. Laughter echoed through the trees. The swings moved back and forth. Parents watched from benches.",
      "The library was filled with students studying quietly. Books were scattered across tables. Some people typed on laptops while others read physical books. The atmosphere was peaceful and focused.",
      "The garden was full of colorful flowers. Bees buzzed between the blossoms. Butterflies danced in the warm air. Everything seemed alive and vibrant.",
      "The kitchen smelled of freshly baked bread. My grandmother's recipe called for simple ingredients but created something magical. The dough had risen perfectly overnight. I could hear the timer ticking down.",
      "The beach was crowded with summer visitors. Children built sandcastles near the water's edge. Seagulls soared overhead searching for food. The waves crashed rhythmically against the shore.",
      "The old bookstore had a mysterious atmosphere. Dust motes danced in the sunlight streaming through the windows. Shelves were packed with books of every genre imaginable. The owner knew exactly where to find any title.",
      "The art gallery featured works from local artists. Each painting told a unique story through color and composition. Visitors moved slowly from piece to piece. Some stopped to read the descriptions.",
      "The movie theater was packed with excited viewers. Popcorn popped in the background. Everyone settled into their seats. The lights dimmed slowly.",
      "The garden was full of colorful flowers. Bees buzzed between the blossoms. Butterflies danced in the warm air. Everything seemed alive and vibrant.",
      "The library was filled with students studying quietly. Books were scattered across tables. Some people typed on laptops while others read physical books.",
      
      // Longer texts (5 sentences)
      "A gentle breeze rustled the leaves overhead. The afternoon sun cast long shadows across the path. Birds chirped melodiously in the branches. The air smelled of fresh grass and flowers. It was a perfect spring day.",
      "The kitchen smelled of freshly baked bread. My grandmother's recipe called for simple ingredients but created something magical. The dough had risen perfectly overnight. I could hear the timer ticking down. Soon the golden crust would be ready to enjoy.",
      "The old bookstore had a mysterious atmosphere. Dust motes danced in the sunlight streaming through the windows. Shelves were packed with books of every genre imaginable. The owner knew exactly where to find any title. It felt like stepping into another world entirely.",
      "The art gallery featured works from local artists. Each painting told a unique story through color and composition. Visitors moved slowly from piece to piece. Some stopped to read the descriptions. The atmosphere encouraged quiet contemplation.",
      "The beach was crowded with summer visitors. Children built sandcastles near the water's edge. Seagulls soared overhead searching for food. The waves crashed rhythmically against the shore. Families enjoyed picnics on the sand.",
      "The library was filled with students studying quietly. Books were scattered across tables. Some people typed on laptops while others read physical books. The atmosphere was peaceful and focused. Knowledge seemed to hang in the air.",
      "The garden was full of colorful flowers. Bees buzzed between the blossoms. Butterflies danced in the warm air. Everything seemed alive and vibrant. The garden was a perfect place for meditation.",
      "The movie theater was packed with excited viewers. Popcorn popped in the background. Everyone settled into their seats. The lights dimmed slowly. The movie began with a dramatic opening scene.",
      "The kitchen smelled of freshly baked bread. My grandmother's recipe called for simple ingredients but created something magical. The dough had risen perfectly overnight. I could hear the timer ticking down.",
      "The art gallery featured works from local artists. Each painting told a unique story through color and composition. Visitors moved slowly from piece to piece. Some stopped to read the descriptions."
    ];
    
    // Shuffle the texts for better variety
    const shuffledTexts = [...allTexts].sort(() => Math.random() - 0.5);
    setTextPool(shuffledTexts);
  }, []);

  // Smart text selection - avoid immediate repeats
  const getNextText = useCallback(() => {
    if (textPool.length === 0) return "The sun rose over the mountains."; // Fallback
    
    // Find texts that haven't been used recently
    const availableTexts = textPool.filter(text => !usedTexts.has(text));
    
    // If all texts have been used, reset the used texts set
    if (availableTexts.length === 0) {
      setUsedTexts(new Set());
      return textPool[Math.floor(Math.random() * textPool.length)];
    }
    
    // Pick a random unused text
    const selectedText = availableTexts[Math.floor(Math.random() * availableTexts.length)];
    
    // Mark this text as used
    setUsedTexts(prev => new Set([...prev, selectedText]));
    
    return selectedText;
  }, [textPool, usedTexts]);

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
      // Use smart text selection from our expanded pool
      const selectedText = getNextText();
      setCurrentParagraph(selectedText);
    }
    setIsGenerating(false);
    resetTyping();
  }, [getNextText]);

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
          className="text-center text-slate-400 text-sm mt-3"
        >
          <p>Press <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">1</kbd> for reset/again • <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">Enter</kbd> for new/next • Use backspace to fix mistakes</p>
        </motion.div>
      </div>
      
      {/* Install Prompt */}
      <InstallPrompt />
    </div>
  );
}
