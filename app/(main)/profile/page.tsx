'use client';

import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();

  const handleLogout = () => {
    // For now, just redirect to welcome screen
    router.push('/');
  };

  return (
    <div className="flex flex-col h-full p-6 mt-12">
      <h1 className="text-2xl font-bold mb-6 text-white">Profile</h1>
      <div className="h-24 w-24 rounded-full bg-zinc-800 mx-auto mb-4 border-2 border-zinc-700 shadow-xl overflow-hidden flex items-center justify-center text-2xl font-black text-zinc-500">
        U
      </div>
      <h2 className="text-xl font-bold text-center text-white">User123</h2>
      <p className="text-zinc-500 text-center mb-8">Cologne, Germany</p>
      
      <div className="space-y-2 mt-8">
        <button className="w-full text-left p-4 bg-zinc-900 rounded-xl text-white font-medium hover:bg-zinc-800 transition-colors">Settings</button>
        <button className="w-full text-left p-4 bg-zinc-900 rounded-xl text-white font-medium hover:bg-zinc-800 transition-colors">Saved Events</button>
        <button 
          onClick={handleLogout}
          className="w-full text-left p-4 bg-zinc-900 text-red-500 rounded-xl font-bold hover:bg-red-500/10 transition-colors"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
