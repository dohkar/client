"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { logger } from "@/lib/utils/logger";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Логируем критичные ошибки React компонентов
    logger.error("ErrorBoundary caught an error:", error, errorInfo);
    // В production здесь можно отправить в систему мониторинга (Sentry и т.д.)
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className='flex min-h-screen items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>Что-то пошло не так</CardTitle>
          <CardDescription>
            Произошла непредвиденная ошибка. Пожалуйста, попробуйте обновить
            страницу.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {process.env.NODE_ENV === "development" && (
            <div className='rounded-md bg-muted p-4'>
              <p className='text-sm font-mono text-destructive'>
                {error.message}
              </p>
            </div>
          )}
          <div className='flex gap-2'>
            <Button onClick={resetError} variant='default'>
              Попробовать снова
            </Button>
            <Button onClick={() => window.location.reload()} variant='outline'>
              Обновить страницу
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { ErrorBoundary, type ErrorFallbackProps };
