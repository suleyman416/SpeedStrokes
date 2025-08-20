
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
      // One-sentence texts - 20% (40 total) - Simple facts and observations
      "Lightning strikes somewhere on Earth every second.",
      "Honey never spoils or expires naturally.",
      "Bamboo grows faster than any other plant.",
      "Ravens remember human faces for years.",
      "Raindrops are perfectly round in zero gravity.",
      "Pearls form when oysters feel irritated.",
      "Snowflakes always have exactly six sides.",
      "Butterflies taste with their feet.",
      "The human heart beats one hundred thousand times daily.",
      "Octopuses have three hearts that pump blue blood.",
      "Bananas are berries, but strawberries are not.",
      "A single cloud can weigh over one million pounds.",
      "Sharks existed before trees appeared on Earth.",
      "Your brain uses twenty percent of your daily energy.",
      "Dolphins recognise themselves in mirrors.",
      "The human nose can distinguish over one trillion scents.",
      "Antarctica contains seventy percent of the world's fresh water.",
      "Bees communicate through elaborate dances.",
      "Trees in forests communicate through underground fungal networks.",
      "The aurora borealis paints the Arctic sky in ethereal green.",
      "Penguins can jump as high as six feet out of water.",
      "A group of flamingos is called a flamboyance.",
      "Elephants are the only mammals that cannot jump.",
      "A day on Venus is longer than its year.",
      "The shortest war in history lasted only thirty-eight minutes.",
      "A pineapple plant takes two years to grow one fruit.",
      "The average person spends six months of their life waiting for red lights.",
      "A group of hedgehogs is called a prickle.",
      "The Great Wall of China is not visible from space.",
      "A day on Mars is only thirty-seven minutes longer than Earth's.",
      "The average cloud weighs about one million pounds.",
      "A group of owls is called a parliament.",
      "The human body contains enough iron to make a three-inch nail.",
      "A group of crows is called a murder.",
      "The average person walks three times around the world in their lifetime.",
      "A group of jellyfish is called a smack.",
      "The human body sheds six hundred thousand skin particles every hour.",
      "A group of kangaroos is called a mob.",
      "The average person spends five years of their life eating.",
      "A group of zebras is called a dazzle.",
      "The human body contains enough carbon to fill nine hundred pencils.",
      "A group of giraffes is called a tower.",
      "The average person spends one year of their life looking for lost items.",
      
      // Two-sentence texts - 35% (70 total) - Quotes, facts, and simple stories
      "Winston Churchill once said, \"Success is not final, failure is not fatal.\" It is the courage to continue that counts most.",
      "Albert Einstein observed, \"Imagination is more important than knowledge.\" Knowledge is limited, but imagination circles the world.",
      "Maya Angelou wrote, \"If you do not like something, change it.\" If you cannot change it, change your attitude.",
      "Mark Twain quipped, \"The secret of getting ahead is getting started.\" The secret of getting started is breaking down complex tasks.",
      "Gandhi taught us, \"Be the change you wish to see.\" This simple phrase transformed millions of lives worldwide.",
      
      "Yesterday I walked past a bakery window display. The aroma of cinnamon rolls made my stomach growl loudly.",
      "My neighbour's cat sits on my fence every morning. It stares at me through the kitchen window while I eat breakfast.",
      "The old library downtown has squeaky wooden floors. Every footstep echoes through the silent reading rooms.",
      "Sarah found a twenty-pound note in her coat pocket. She had completely forgotten placing it there last winter.",
      "The corner cafe serves the best hot chocolate in town. Steam rises from the mug like tiny clouds.",
      
      "Why did the scarecrow win an award? Because he was outstanding in his field!",
      "I told my wife she was drawing her eyebrows too high. She looked surprised.",
      "What do you call a sleeping bull? A bulldozer!",
      "I used to hate facial hair. But then it grew on me.",
      "Why don't scientists trust atoms? Because they make up everything!",
      
      "Morning mist clings to the valley like silk. Dewdrops sparkle on spider webs between fence posts.",
      "The lighthouse beam sweeps across stormy waters. Waves crash against weathered rocks below the tower.",
      "Autumn leaves spiral down from bare branches. They create colourful carpets on cobblestone pathways.",
      "Fresh snow blankets the countryside in silence. Footprints mark the only disturbance across white fields.",
      "Wildflowers bloom in abandoned gardens. Nature slowly reclaims forgotten human settlements.",
      "The train whistle echoes through mountain tunnels. Passengers glimpse fleeting scenery through frosted windows.",
      "Campfire smoke drifts upward towards starlit skies. Crickets chirp their evening symphony around us.",
      "City lights twinkle like earthbound constellations. Traffic flows in rivers of red and white.",
      "Desert sands shift with every gentle breeze. Cacti stand sentinel against endless blue horizons.",
      "River stones have been polished smooth by time. Water babbles constantly over their rounded surfaces.",
      
      "The ancient oak tree has stood in the village square for over three hundred years. Children still climb its massive branches during summer holidays.",
      "A mysterious package arrived on my doorstep this morning. The return address was completely blank and unfamiliar.",
      "The old cinema closed its doors for the final time last weekend. Local residents gathered to share memories of their first dates there.",
      "My grandmother's recipe book contains handwritten notes from the nineteen-forties. Each page tells a story of wartime ingenuity and creativity.",
      "The abandoned railway station now serves as a community art gallery. Local artists display their work in the old waiting room.",
      
      "The street musician played classical violin outside the tube station. Commuters paused briefly to listen before rushing to catch their trains.",
      "A stray dog followed me home from the park yesterday. He now sleeps contentedly in my garden shed.",
      "The local pub has served the same landlord for twenty-five years. Regular customers know they can always find a friendly face there.",
      "The antique market opens every Sunday in the town square. Vendors display everything from vintage jewellery to old books.",
      "The community garden thrives behind the old church. Volunteers tend to vegetables and flowers throughout the growing season.",
      
      "The old windmill still turns slowly in the afternoon breeze. Its wooden sails creak softly as they catch the wind.",
      "The village pond freezes solid every winter. Children skate across its smooth surface during school holidays.",
      "The local bakery opens at dawn every morning. The smell of fresh bread drifts through the neighbourhood streets.",
      "The old bridge spans the river with graceful stone arches. Fishermen often gather there during summer evenings.",
      "The community centre hosts weekly knitting groups. Elderly residents teach traditional patterns to younger generations.",
      
      "The old telephone box now serves as a tiny library. Passers-by can borrow books and leave others in return.",
      "The village green hosts cricket matches every Saturday. Spectators bring picnics and cheer from deckchairs.",
      "The local museum displays artefacts from the Roman occupation. School children visit regularly for history lessons.",
      "The old mill stream still flows through the village centre. Ducks swim peacefully between the stone banks.",
      "The community orchard provides free fruit to local residents. Volunteers maintain the trees throughout the year.",
      
      "The old post office building now houses a small cafe. Customers enjoy coffee while admiring the original architecture.",
      "The village hall hosts monthly farmers' markets. Local producers sell fresh vegetables and homemade preserves.",
      "The old school building has been converted into flats. The playground now serves as a car park for residents.",
      "The local park contains a memorial to fallen soldiers. Poppies bloom around the stone monument every spring.",
      "The community allotments stretch along the railway embankment. Gardeners grow vegetables in raised beds.",
      
      "The old water tower dominates the village skyline. Its red brick structure stands as a landmark for miles around.",
      "The local library occupies a converted Victorian house. Students study quietly in the old drawing room.",
      "The village church bells ring every Sunday morning. Their sound echoes across the surrounding countryside.",
      "The old market square now serves as a car park. The cobblestones remain visible beneath the tarmac surface.",
      "The community woodland provides walking trails for residents. Ancient trees offer shade during summer months.",
      
      // Three-sentence texts - 35% (70 total) - Stories, quotes, and detailed facts
      "Shakespeare wrote, \"All the world's a stage, and all the men and women merely players.\" Each person has their exits and their entrances throughout life. We all play many parts during our brief time here.",
      "Martin Luther King Jr. declared, \"I have a dream that one day this nation will rise up.\" He envisioned a world where people are judged by character alone. His words still inspire social justice movements today.",
      "John F. Kennedy challenged America, \"Ask not what your country can do for you.\" Instead, ask what you can do for your country. This call to service motivated an entire generation.",
      "Theodore Roosevelt advised, \"Speak softly and carry a big stick.\" Diplomacy works best when backed by strength. This philosophy guided his presidency and foreign policy.",
      "Helen Keller observed, \"The only thing worse than being blind is having sight but no vision.\" She overcame incredible obstacles to become an inspiring teacher. Her life proves that limitations exist only in our minds.",
      
      "The old man fed pigeons in the park every Tuesday morning. Today, hundreds of birds waited expectantly on empty benches. He had passed away quietly in his sleep last weekend.",
      "Emma discovered a handwritten letter inside her grandmother's recipe book. The yellowed paper contained a love story from sixty years ago. She decided to find the author and deliver it personally.",
      "The antique shop owner polished a tarnished silver locket carefully. Inside, a faded photograph showed a young couple smiling. Someone would surely treasure this forgotten piece of history.",
      "Rain drummed against the cafe windows all afternoon. Customers lingered over coffee and conversations longer than usual. Nobody wanted to venture outside into the downpour.",
      "The lighthouse keeper climbed the spiral staircase one final time. Tomorrow, automated systems would replace his decades of faithful service. He turned off the light and walked away forever.",
      
      "A group of friends decided to start a band. They practised in someone's garage every weekend for months. Their first concert was played to an audience of three people.",
      "The neighbourhood children built an elaborate fort from cardboard boxes. They spent the entire summer defending it from imaginary invaders. By autumn, rain had reduced it to soggy fragments.",
      "Mrs Johnson planted tulip bulbs every October for thirty years. Each spring brought a rainbow of colours to her garden. This year, new owners will enjoy her beautiful legacy.",
      "The bookshop cat claimed the poetry section as his territory. Customers often found him sleeping on volumes of Wordsworth. He seemed to prefer romantic poets over modernists.",
      "Tom learnt to juggle during the first lockdown period. He started with tennis balls and progressed to flaming torches. Now he entertains children at birthday parties professionally.",
      
      "The ancient castle ruins stand proudly on the hilltop overlooking the village. Local historians believe it was built during the Norman conquest. Visitors can still see the remains of the great hall.",
      "The old steam train chugs slowly through the countryside every Sunday afternoon. Families gather at level crossings to wave at the passengers. The engine driver always sounds the whistle.",
      "The village pond freezes solid every winter and becomes a natural ice rink. Children enjoy skating across its smooth surface. Hot chocolate is served from a stall near the water's edge.",
      "The local theatre group performs Shakespeare in the park every summer. Audiences bring blankets and picnics to enjoy the open-air performances. The actors often incorporate the natural surroundings.",
      "The old mill stream flows gently through the village centre throughout the year. Ducks and swans swim peacefully between the stone banks. Local children feed the birds with bread.",
      
      "The community garden thrives behind the old church and provides fresh vegetables. Volunteers tend to the plants every morning before work begins. The harvest is shared equally among all participants.",
      "The village hall hosts monthly farmers' markets where local producers sell their goods. Customers can find everything from fresh eggs to homemade preserves. The atmosphere is always friendly and welcoming.",
      "The old telephone box now serves as a tiny library where passers-by can borrow books. Visitors are encouraged to leave a book when they take one. This system has been running successfully.",
      "The local museum displays artefacts from the Roman occupation of Britain. School children visit regularly for educational tours and workshops. The collection includes coins, pottery, and tools.",
      "The community woodland provides walking trails for residents throughout the year. Ancient oak trees offer shade during summer months and shelter during winter storms. Wildlife enthusiasts often spot deer and foxes.",
      
      "The old water tower dominates the village skyline and serves as a landmark for miles around. Its red brick structure was built during the Victorian era. Today it stands as a reminder of the village's industrial past.",
      "The local library occupies a converted Victorian house with original features intact. Students study quietly in the old drawing room. The building retains its historic charm while serving modern needs.",
      "The village church bells ring every Sunday morning and can be heard across the surrounding countryside. The sound has marked the beginning of the week for generations. Visitors often pause to listen to the familiar chimes.",
      "The old market square now serves as a car park but the cobblestones remain visible beneath the tarmac surface. Local historians have documented the square's importance in medieval trade routes. The area still hosts occasional markets.",
      "The community allotments stretch along the railway embankment and provide space for residents to grow their own food. Gardeners share tools and advice while working in their individual plots. The site has been in continuous use for fifty years.",
      
      "The street musician played classical violin outside the tube station during rush hour. Commuters paused briefly to listen before rushing to catch their trains. His music provided a moment of calm in the busy environment.",
      "A stray dog followed me home from the park yesterday. He now sleeps contentedly in my garden shed. Local animal shelters have been contacted to help find his original owners.",
      "The local pub has served the same landlord for twenty-five years. The building dates back to the seventeenth century. The landlord's family has owned the establishment for three generations.",
      "The antique market opens every Sunday in the town square. Vendors display everything from vintage jewellery to old books. Collectors travel from miles around to browse the unique items on offer.",
      "The old windmill still turns slowly in the afternoon breeze. Its wooden sails creak softly as they catch the wind. Visitors can climb to the top for panoramic views.",
      
      // Four-sentence texts - 10% (20 total) - Longer stories and detailed facts
      "Marie Curie became the first woman to win a Nobel Prize. Her research with radioactivity opened new frontiers in science. She faced discrimination but persevered with her work. Her discoveries continue to benefit medical treatments today.",
      "The old lighthouse keeper climbed the spiral staircase one final time. Tomorrow, automated systems would replace his decades of faithful service. He turned off the light and walked away forever. The village honoured him with a plaque.",
      "The ancient castle ruins stand proudly on the hilltop overlooking the village. Local historians believe it was built during the Norman conquest. Visitors can still see the remains of the great hall. The ruins attract tourists from miles around.",
      "The old steam train chugs slowly through the countryside every Sunday afternoon. Families gather at level crossings to wave at the passengers. The engine driver always sounds the whistle. Children love watching the vintage locomotive.",
      "The village pond freezes solid every winter and becomes a natural ice rink. Children enjoy skating across its smooth surface. Hot chocolate is served from a stall near the water's edge. The pond has been a gathering place for generations.",
      "The local theatre group performs Shakespeare in the park every summer. Audiences bring blankets and picnics to enjoy the open-air performances. The actors often incorporate the natural surroundings. The performances are always well-attended.",
      "The old mill stream flows gently through the village centre throughout the year. Ducks and swans swim peacefully between the stone banks. Local children feed the birds with bread. The stream has never dried up in living memory.",
      "The community garden thrives behind the old church and provides fresh vegetables. Volunteers tend to the plants every morning before work begins. The harvest is shared equally among all participants. This garden feeds twenty local families.",
      "The local library occupies a converted Victorian house with original features intact. Students study quietly in the old drawing room. The building retains its historic charm while serving modern needs. The library hosts weekly reading groups.",
      "A stray dog followed me home from the park yesterday. He now sleeps contentedly in my garden shed. Local animal shelters have been contacted to help find his owners. The dog appears to be well-fed and friendly.",
      
      "Marcus discovered an unmarked trail during his morning hike yesterday. The path led to a hidden waterfall cascading into a pool. He kept the location secret to preserve its beauty. Sometimes the best treasures are those we choose not to share.",
      
      "The ancient oak tree has witnessed centuries of local history. Its massive trunk provides shade for summer gatherings. Local children still climb its lower branches. The tree's age makes it the village's most beloved landmark.",
      "The old cinema closed its doors for the final time last weekend. Local residents gathered to share memories of their first dates there. The building will be converted into flats next month. The memories will live on in the community.",
      "The local bakery opens at dawn every morning. The smell of fresh bread drifts through the neighbourhood streets. Customers queue outside before the doors open. The baker's family has run this business for three generations.",
      "The village pond freezes solid every winter. Children skate across its smooth surface during school holidays. Hot chocolate is served from a stall near the water's edge. The pond has been a gathering place for generations.",
      "The old telephone box now serves as a tiny library. Passers-by can borrow books and leave others in return. This system has been running successfully for over five years. The community loves this creative reuse of space.",
      "The village green hosts cricket matches every Saturday. Spectators bring picnics and cheer from deckchairs. The local team has won the county championship three times. The green has been the heart of village life for centuries.",
      "The old mill stream flows gently through the village centre. Ducks and swans swim peacefully between the stone banks. Local children feed the birds with bread from the bakery. The stream has never dried up in living memory.",
      "The community garden thrives behind the old church. Volunteers tend to the plants every morning before work begins. The harvest is shared equally among all participants. This garden feeds twenty local families each year.",
      "The old post office building now houses a small cafe. Customers enjoy coffee while admiring the original architecture. The building retains its historic charm while serving modern needs. The cafe serves the best scones in the village.",
      "The village hall hosts monthly farmers' markets. Local producers sell fresh vegetables and homemade preserves. The atmosphere is always friendly and welcoming. Regular customers come from miles around.",
      "The old school building has been converted into flats. The playground now serves as a car park for residents. The building retains many original features from the nineteen-thirties. New families have brought life back to the old building.",
      "The local park contains a memorial to fallen soldiers. Poppies bloom around the stone monument every spring. The memorial was erected after the First World War. Local residents gather there for remembrance services.",
      "The old water tower dominates the village skyline. Its red brick structure was built during the Victorian era. Today it stands as a reminder of the village's industrial past. The tower is now a protected heritage building.",
      "The local library occupies a converted Victorian house. Students study quietly in the old drawing room. The building retains its historic charm while serving modern needs. The library hosts weekly reading groups for children.",
      "The village church bells ring every Sunday morning. Their sound can be heard across the surrounding countryside. The bells have marked the beginning of the week for generations. Visitors often pause to listen to the familiar chimes.",
      "The old market square now serves as a car park. The cobblestones remain visible beneath the tarmac surface. Local historians have documented the square's importance in medieval trade routes. The area still hosts occasional markets.",
      "The community woodland provides walking trails for residents. Ancient oak trees offer shade during summer months. Wildlife enthusiasts often spot deer and foxes in the woods. The woodland is managed by local conservation volunteers.",
      "A stray dog followed me home from the park yesterday. He now sleeps contentedly in my garden shed. Local animal shelters have been contacted to help find his owners. The dog appears to be well-fed and friendly.",
    ];
    
    // Shuffle the texts for better variety
    const shuffledTexts = [...allTexts].sort(() => Math.random() - 0.5);
    setTextPool(shuffledTexts);
  }, []);

  // Smart text selection - avoid immediate repeats
  const getNextText = useCallback(() => {
    if (textPool.length === 0) return "Mountains tower above the valley floor."; // Fallback
    
    // Find texts that haven't been used recently
    const availableTexts = textPool.filter(text => !usedTexts.has(text));
    
    // If all texts have been used, reset the used texts set
    if (availableTexts.length === 0) {
      setUsedTexts(new Set());
      // Reshuffle the pool for even more variety
      const reshuffled = [...textPool].sort(() => Math.random() - 0.5);
      setTextPool(reshuffled);
      return reshuffled[Math.floor(Math.random() * reshuffled.length)];
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
