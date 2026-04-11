'use client';

import React, { useState } from 'react';
import { X, Loader2, Upload, MapPin, Type, FileText, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'club' | 'event';
  onSuccess: () => void;
  editData?: any;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function AddContentModal({ isOpen, onClose, type, onSuccess, editData }: AddContentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    image_url: '',
    address: '',
    category: 'Club',
    club_id: ''
  });

  React.useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || '',
        title: editData.title || '',
        description: editData.description || '',
        image_url: editData.image_url || editData.media_url || '',
        address: editData.address || '',
        category: editData.category || 'Club',
        club_id: editData.club_id || ''
      });
    } else {
      setFormData({
        name: '',
        title: '',
        description: '',
        image_url: '',
        address: '',
        category: 'Club',
        club_id: ''
      });
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (!editData?.id || !confirm('Are you sure you want to delete this?')) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from(type === 'club' ? 'clubs' : 'events')
        .delete()
        .eq('id', editData.id);
      
      if (error) throw error;
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const geocodeAddress = async (address: string) => {
    if (!MAPBOX_TOKEN) return null;
    try {
      const query = encodeURIComponent(`${address}, Cologne, Germany`);
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&limit=1`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return { lat, lng };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (type === 'club') {
        let coords = null;
        if (!editData || formData.address !== editData.address) {
          coords = await geocodeAddress(formData.address);
          if (!coords) throw new Error('Could not find coordinates for this address.');
        }

        const payload = {
          name: formData.name,
          description: formData.description,
          image_url: formData.image_url,
          address: formData.address,
          category: formData.category,
          ...(coords ? { lat: coords.lat, lng: coords.lng } : {})
        };

        const { error } = editData 
          ? await supabase.from('clubs').update(payload).eq('id', editData.id)
          : await supabase.from('clubs').insert(payload);
        
        if (error) throw error;
      } else {
        const payload = {
          title: formData.title,
          description: formData.description,
          media_url: formData.image_url,
          club_id: formData.club_id,
          is_official: true
        };

        const { error } = editData
          ? await supabase.from('events').update(payload).eq('id', editData.id)
          : await supabase.from('events').insert(payload);
        
        if (error) throw error;
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-[430px] bg-zinc-950 border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">
            {editData ? 'Edit' : 'Add New'} {type}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors font-bold text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {type === 'club' ? (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Club Name</label>
                <div className="relative">
                  <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 pl-12 text-white placeholder-zinc-600 focus:border-white/20 outline-none transition-all"
                    placeholder="e.g. Bootshaus"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Address in Cologne</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    required
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 pl-12 text-white placeholder-zinc-600 focus:border-white/20 outline-none transition-all"
                    placeholder="e.g. Auenweg 173"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Event Title</label>
                <div className="relative">
                  <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 pl-12 text-white placeholder-zinc-600 focus:border-white/20 outline-none transition-all"
                    placeholder="e.g. Techno Night"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Club ID</label>
                <div className="relative">
                   <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                   <input
                    required
                    value={formData.club_id}
                    onChange={e => setFormData({ ...formData, club_id: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 pl-12 text-white placeholder-zinc-600 focus:border-white/20 outline-none transition-all"
                    placeholder="Paste club UUID"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Image URL</label>
            <div className="relative">
              <Upload className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                value={formData.image_url}
                onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 pl-12 text-white placeholder-zinc-600 focus:border-white/20 outline-none transition-all"
                placeholder="https://images.unsplash.com/..."
              />
            </div>
          </div>

          {type === 'club' && (
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Category / Vibe</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-sm text-white focus:outline-none focus:border-pink-500/50 transition-all appearance-none"
              >
                <option value="Club">Club (General)</option>
                <option value="Techno">Techno</option>
                <option value="House">House</option>
                <option value="Hip Hop">Hip Hop</option>
                <option value="Latin">Latin</option>
                <option value="Pop">Pop</option>
                <option value="Bar">Bar / Lounge</option>
                <option value="Electronic">Electronic</option>
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-white placeholder-zinc-600 focus:border-white/20 outline-none transition-all min-h-[80px] resize-none"
              placeholder="Tell us more about it..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            {editData && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 bg-zinc-900 text-red-500 font-bold py-5 rounded-3xl hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                DELETE
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`flex-[2] bg-white text-black font-black py-5 rounded-3xl hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center shadow-xl shadow-white/5`}
            >
              {loading ? <Loader2 className="animate-spin text-black" size={24} /> : (editData ? 'SAVE CHANGES' : `PUBLISH ${type.toUpperCase()}`)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
