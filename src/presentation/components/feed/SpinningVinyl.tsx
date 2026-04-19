'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music } from 'lucide-react';

interface SpinningVinylProps {
  imageUrl?: string;
  size?: number;
  isSpinning?: boolean;
}

export default function SpinningVinyl({ 
  imageUrl, 
  size = 72, 
  isSpinning = true 
}: SpinningVinylProps) {
  
  return (
    <div 
      className="relative flex items-center justify-center shrink-0" 
      style={{ width: size, height: size }}
    >
      {/* JUMPING NOTES PARTICLES */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        <NoteParticles />
      </div>

      {/* THE VINYL RECORD */}
      <motion.div
        animate={isSpinning ? { rotate: 360 } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="relative w-full h-full rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden"
        style={{
          background: `
            radial-gradient(circle, #111 20%, #000 21%, #000 24%, #111 25%, #111 28%, #000 29%, #000 32%, #111 33%, #111 36%, #000 37%, #000 40%, #111 41%, #333 100%)
          `,
        }}
      >
        {/* Grooves / Reflections */}
        <div className="absolute inset-0 opacity-20 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.1)_90deg,transparent_180deg,rgba(255,255,255,0.1)_270deg,transparent_360deg)]" />
        
        {/* Center Label (The Avatar) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="rounded-full overflow-hidden border-4 border-black bg-zinc-800"
            style={{ width: size * 0.45, height: size * 0.45 }}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-zinc-800" />
            )}
          </div>
          {/* Hole */}
          <div className="absolute w-2 h-2 bg-black rounded-full shadow-inner" />
        </div>
      </motion.div>
    </div>
  );
}

function NoteParticles() {
  const [notes, setNotes] = React.useState<{id: number, x: number, delay: number}[]>([]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setNotes(prev => [
        ...prev.slice(-5), // Keep last 5
        { id: Date.now(), x: Math.random() * 40 - 20, delay: Math.random() * 0.5 }
      ]);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {notes.map(note => (
        <motion.div
          key={note.id}
          initial={{ y: 0, opacity: 0, scale: 0.5, x: note.x }}
          animate={{ y: -60, opacity: [0, 1, 0], scale: 1, rotate: 15 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 3, ease: "easeOut" }}
          className="absolute left-1/2 top-0 -translate-x-1/2 text-white/40"
        >
          <Music size={14} />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
