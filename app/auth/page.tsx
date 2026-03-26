import Link from 'next/link';

export default function AuthPage() {
  return (
    <div className="flex-1 flex flex-col p-6 mt-12 bg-black">
      <h1 className="text-3xl font-bold mb-6 text-white">Log In to PartySpot</h1>
      <div className="space-y-4">
        <input 
          type="email" 
          placeholder="Email" 
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none transition-colors"
        />
        <input 
          type="password" 
          placeholder="Password" 
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none transition-colors"
        />
        <button className="w-full bg-white text-black font-bold rounded-xl p-4 mt-4 hover:bg-gray-200 transition-colors">
          Sign In
        </button>
        <button className="w-full bg-zinc-800 text-white font-bold rounded-xl p-4 mt-2 hover:bg-zinc-700 transition-colors">
          Create Account
        </button>
      </div>
      <Link href="/" className="mt-8 text-center text-zinc-500 hover:text-white transition-colors">
        Cancel & Go Back
      </Link>
    </div>
  );
}
