'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/infrastructure/services/supabase';
import { Send, X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export default function EventComments({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
    
    // Realtime subscription for new comments
    const channel = supabase
      .channel(`comments-${eventId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'event_comments', 
        filter: `event_id=eq.${eventId}` 
      }, () => {
        fetchComments();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('event_comments')
      .select(`
        id,
        content,
        created_at,
        user_id,
        profiles (username, display_name, avatar_url)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (!error && data) setComments(data as any);
  };

  const postComment = async () => {
    if (!newComment.trim()) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('event_comments')
      .insert({
        event_id: eventId,
        user_id: user.id,
        content: newComment.trim()
      });

    if (!error) {
      setNewComment('');
      fetchComments();
    }
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-x-0 bottom-0 z-[1001] bg-zinc-950 border-t border-white/10 rounded-t-[2.5rem] flex flex-col max-h-[85vh] max-w-[430px] mx-auto"
    >
      <div className="flex items-center justify-between p-6 border-b border-white/5">
        <h3 className="text-white font-black uppercase italic tracking-tighter flex items-center gap-2">
          <MessageCircle size={18} />
          Comments
        </h3>
        <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        {comments.length === 0 && (
          <div className="text-center py-10 space-y-2 opacity-30">
            <MessageCircle className="mx-auto" size={40} />
            <p className="text-xs font-black uppercase tracking-widest">No comments yet</p>
          </div>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 overflow-hidden shrink-0 border border-white/5">
              <img 
                src={comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${comment.profiles?.username || 'U'}&background=111&color=fff`} 
                className="w-full h-full object-cover" 
                alt="" 
              />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-white uppercase tracking-tight">
                  {comment.profiles?.display_name || comment.profiles?.username}
                </p>
                <span className="text-[9px] text-zinc-600 font-bold">
                  {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-zinc-400 font-medium leading-relaxed italic">
                {comment.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-white/5 pb-[env(safe-area-inset-bottom,24px)]">
        <div className="relative">
          <input 
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && postComment()}
            placeholder="Add a comment..."
            className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm text-white focus:border-white/20 transition-all outline-none italic font-medium"
          />
          <button 
            onClick={postComment}
            disabled={loading || !newComment.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black disabled:opacity-30 transition-all active:scale-95"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
