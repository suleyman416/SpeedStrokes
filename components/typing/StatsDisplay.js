import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/ui/card';

export default function StatsDisplay({ wpm, bestWpm }) {
  return (
    <div className="flex justify-center gap-8 mb-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="px-8 py-6 text-center border-0 bg-white/60 backdrop-blur-sm shadow-lg">
          <div className="text-4xl font-bold text-slate-700 mb-1">
            {wpm}
          </div>
          <div className="text-sm text-slate-500 font-medium">
            WPM
          </div>
        </Card>
      </motion.div>
      
      {bestWpm > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="px-8 py-6 text-center border-0 bg-amber-50/60 backdrop-blur-sm shadow-lg border border-amber-100">
            <div className="text-4xl font-bold text-amber-600 mb-1">
              {bestWpm}
            </div>
            <div className="text-sm text-amber-700 font-medium">
              Best WPM
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}