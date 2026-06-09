import { Component, type PropsWithChildren, type ErrorInfo } from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
} /**
   * The ErrorBoundary class.
   */

/**
 * The ErrorBoundary class.
 */
export class ErrorBoundary extends Component<PropsWithChildren, State> {
  /**
   * Constructor.
   * @param props - Props.
   */
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Get derived state from error.
   * @param error - Error.
   * @returns The result.
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * Component did catch.
   * @param error - Error.
   * @param info - Info.
   * @returns The result.
   */
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Unhandled render error:', error, info.componentStack);
  }

  /**
   * Render.
   * @returns The result.
   */
  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="h-screen w-screen bg-[#050506] flex flex-col items-center justify-center gap-6 font-mono text-center px-8">
        <div className="text-primary text-[10px] uppercase tracking-[0.5em] animate-pulse">
          System Failure
        </div>
        <h1>Critical System Failure</h1>
        <p className="text-muted-foreground text-xs uppercase tracking-[0.3em] max-w-sm">
          Nodal link severed. All combat protocols offline.
        </p>
        {this.state.error && (
          <details className="text-left mt-2 max-w-lg w-full">
            <summary className="text-[10px] text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-primary transition-colors">
              Error Details
            </summary>
            <pre className="mt-2 text-[9px] text-destructive bg-black/50 p-3 rounded overflow-auto max-h-40 whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
          </details>
        )}
        <button
          aria-label="Reboot System"
          onClick={() => this.setState({ hasError: false, error: null })}
          className="mt-4 px-6 py-2 border border-primary text-primary text-[10px] uppercase tracking-[0.4em] hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Reboot System
        </button>
      </div>
    );
  }
}
