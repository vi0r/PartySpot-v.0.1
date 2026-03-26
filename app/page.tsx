import Link from 'next/link';

export default function WelcomePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-6 bg-black relative overflow-hidden text-center">
      {/* Background image - using inline style for maximum reliability */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url("/bg-welcome.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.6
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        <h1 className="text-6xl font-black italic tracking-tighter text-white mb-2 drop-shadow-2xl">
          PartySpot
        </h1>
        <p className="text-zinc-300 text-lg font-medium mb-12 drop-shadow-md">
          Cologne&apos;s Nightlife in Your Pocket
        </p>

        <div className="w-full max-w-xs space-y-4">
          <div className="bg-black/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center justify-center gap-2">
              Are you ready? 😎
            </h2>
            <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
              Explore the best secret parties and club events in Cologne.
            </p>
            
            <div className="space-y-3">
              <Link 
                href="/feed" 
                className="w-full block bg-white text-black font-extrabold py-4 rounded-2xl hover:bg-zinc-200 transition-all active:scale-[0.98]"
              >
                Start Exploring
              </Link>
              <Link 
                href="/auth" 
                className="w-full block bg-white/5 text-white font-bold py-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-all active:scale-[0.98]"
              >
                Log In / Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-0 right-0 text-center text-[10px] text-white/50 uppercase tracking-[0.2em] font-bold">
        18+ Only • Play Safe • Party Hard
      </div>
    </main>
  );
}
