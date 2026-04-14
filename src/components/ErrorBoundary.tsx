import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#0a0a0a] text-cyber-blue p-6 font-mono">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse" />
            <AlertTriangle className="w-16 h-16 text-red-500 relative z-10" />
          </div>
          <h1 className="text-xl font-black tracking-tighter mb-2 uppercase">System Critical Error</h1>
          <p className="text-xs text-gray-500 mb-8 max-w-md text-center leading-relaxed">
            Neural link disrupted. Core subroutines have encountered an unrecoverable exception. 
            Manual reboot will restore the tactical interface.
          </p>
          <div className="bg-black/50 border border-red-500/30 p-4 rounded mb-8 w-full max-w-md overflow-hidden">
            <div className="text-[10px] text-red-400/70 mb-1 uppercase tracking-widest">Error Log</div>
            <div className="text-[10px] text-red-500 break-all font-bold">
              {this.state.error?.message || 'Unknown System Fault'}
            </div>
          </div>
          <button 
            onClick={this.handleReset}
            className="flex items-center gap-2 px-6 py-2 bg-cyber-blue text-black font-black text-xs rounded hover:bg-white transition-all shadow-[0_0_15px_#00ffff]"
          >
            <RefreshCw className="w-4 h-4" /> REBOOT SYSTEM
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
