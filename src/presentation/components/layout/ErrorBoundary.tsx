'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/50">
            <AlertTriangle className="text-red-500" size={32} />
          </div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">
            Something went wrong
          </h2>
          <p className="text-zinc-500 text-sm mb-8 max-w-xs leading-relaxed">
            We encountered an unexpected error. Don't worry, your data is safe.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all active:scale-95"
          >
            <RefreshCcw size={16} />
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
