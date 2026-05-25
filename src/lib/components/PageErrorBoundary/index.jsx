import React from 'react';
import PageErrorFallback from './PageErrorFallback';

export default class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, componentStack: '', errorAt: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error, errorAt: new Date().toISOString() };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ componentStack: errorInfo?.componentStack || '' });
    console.error('PageErrorBoundary caught:', error, errorInfo);
  }

  handleTryAgain = () => {
    this.setState({ hasError: false, error: null, componentStack: '', errorAt: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <PageErrorFallback
        error={this.state.error}
        errorAt={this.state.errorAt}
        componentStack={this.state.componentStack}
        onTryAgain={this.handleTryAgain}
      />
    );
  }
}
