import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

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
    console.error('Uncaught error inside Yaazhi application:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            backgroundColor: 'var(--yz-bg-canvas)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              backgroundColor: 'var(--yz-bg-surface)',
              borderRadius: 'var(--yz-radius-xl)',
              padding: '2.5rem 2rem',
              border: '1px solid var(--yz-border)',
              boxShadow: 'var(--yz-shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: 'var(--yz-status-out-stock-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--yz-status-out-stock)',
                marginBottom: '1rem',
              }}
            >
              <AlertCircle size={28} />
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--yz-text-primary)' }}>
              Something went wrong
            </h2>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--yz-text-secondary)',
                marginTop: '0.5rem',
                marginBottom: '1.5rem',
                lineHeight: 1.5,
              }}
            >
              An unexpected interface error occurred. Refreshing the boutique workspace will restore operational view.
            </p>

            <Button
              variant="primary"
              icon={<RefreshCw size={16} />}
              onClick={() => window.location.reload()}
            >
              Refresh Workspace
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
