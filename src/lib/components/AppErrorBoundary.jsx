import React from 'react';

function getErrorMessage(error) {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (typeof error.message === 'string' && error.message.trim()) return error.message.trim();
  return 'Unknown error';
}

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      componentStack: '',
      errorAt: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      errorAt: new Date().toISOString(),
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      componentStack: errorInfo?.componentStack || '',
    });

    // Keep diagnostics available in devtools/log collectors.
    console.error('AppErrorBoundary caught an error:', error, errorInfo);
  }

  handleTryAgain = () => {
    this.setState({
      hasError: false,
      error: null,
      componentStack: '',
      errorAt: null,
    });
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090d15] p-5 text-white">
        <div className="w-full max-w-2xl rounded-2xl border border-red-500/30 bg-[#111827]/85 p-5 shadow-2xl backdrop-blur">
          <p className="text-xs uppercase tracking-[0.16em] text-red-300/85">Application Error</p>
          <h1 className="mt-2 text-xl font-semibold text-white">Something went wrong</h1>
          <p className="mt-2 text-sm text-white/80">
            TradeDesk hit an unexpected issue. You can try again or reload the app.
          </p>

          <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2">
            <p className="text-sm text-red-100">{getErrorMessage(this.state.error)}</p>
            {this.state.errorAt ? (
              <p className="mt-1 text-[11px] text-red-100/70">Time: {this.state.errorAt}</p>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={this.handleTryAgain}
              className="rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/30"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
            >
              Reload App
            </button>
          </div>

          {this.state.componentStack ? (
            <details className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
              <summary className="cursor-pointer text-xs text-white/70">Technical details</summary>
              <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap break-words text-[11px] text-white/65">
                {this.state.componentStack}
              </pre>
            </details>
          ) : null}
        </div>
      </div>
    );
  }
}
