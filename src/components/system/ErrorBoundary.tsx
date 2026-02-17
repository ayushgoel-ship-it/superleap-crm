/**
 * GLOBAL ERROR BOUNDARY
 * 
 * Catches all React errors and prevents white screen of death.
 * Shows user-friendly fallback UI.
 * Logs errors appropriately based on environment.
 */

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { ENV, logger } from '../../config/env';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: any) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  errorHash: string;
}

/**
 * ErrorBoundary component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorHash: ''
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorHash: generateErrorHash(error)
    };
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    // Log error
    logger.error('ErrorBoundary caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      errorHash: this.state.errorHash
    });
    
    // Update state with error info
    this.setState({
      errorInfo
    });
    
    // In production, send to error tracking service
    if (ENV.IS_PROD) {
      // TODO: Send to Sentry/DataDog/etc
      // sendErrorToTracking({
      //   error,
      //   errorInfo,
      //   errorHash: this.state.errorHash,
      //   userAgent: navigator.userAgent,
      //   url: window.location.href
      // });
    }
  }
  
  handleReload = () => {
    window.location.reload();
  };
  
  handleGoHome = () => {
    window.location.href = '/';
  };
  
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorHash: ''
    });
  };
  
  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.state.errorInfo);
      }
      
      // Default fallback UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-8">
            <div className="text-center">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              
              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>
              
              {/* Description */}
              <p className="text-gray-600 mb-6">
                We're sorry, but something unexpected happened. Our team has been notified.
              </p>
              
              {/* Error code (for support) */}
              <div className="bg-gray-100 rounded p-3 mb-6">
                <p className="text-xs text-gray-500 mb-1">Error Code</p>
                <p className="text-sm font-mono text-gray-700">{this.state.errorHash}</p>
              </div>
              
              {/* Dev-only: Show error details */}
              {ENV.SHOW_ERROR_DETAILS && this.state.error && (
                <details className="text-left mb-6">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                    Technical Details (Dev Only)
                  </summary>
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-xs">
                    <p className="font-bold text-red-900 mb-2">{this.state.error.message}</p>
                    <pre className="text-red-700 overflow-x-auto whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                    {this.state.errorInfo?.componentStack && (
                      <>
                        <p className="font-bold text-red-900 mt-3 mb-1">Component Stack:</p>
                        <pre className="text-red-700 overflow-x-auto whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}
              
              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleReload}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload App
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go to Home
                </Button>
                
                {ENV.IS_DEV && (
                  <Button
                    onClick={this.handleReset}
                    variant="outline"
                    className="text-xs"
                  >
                    Reset Error (Dev)
                  </Button>
                )}
              </div>
              
              {/* Support info */}
              <p className="text-xs text-gray-500 mt-6">
                If this problem persists, please contact support and provide the error code above.
              </p>
            </div>
          </Card>
        </div>
      );
    }
    
    return this.props.children;
  }
}

/**
 * Generate a short hash for error identification
 */
function generateErrorHash(error: Error): string {
  const message = error.message || 'unknown';
  const stack = error.stack || '';
  const combined = `${message}${stack}`;
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to hex and take first 8 characters
  const hashStr = Math.abs(hash).toString(16).toUpperCase();
  return `ERR-${hashStr.padStart(8, '0').slice(0, 8)}`;
}

/**
 * Hook to manually trigger error boundary
 */
export function useErrorHandler() {
  return (error: Error) => {
    throw error;
  };
}
