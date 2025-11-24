'use client'

import { useEffect } from 'react'
import { Link } from '~/components/link'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Global error boundary caught:', error)
  }, [error])

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{
        background:
          'linear-gradient(180deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)',
        color: '#e8e0e4',
      }}
    >
      <div className="max-w-md text-center">
        <p
          className="mb-4 text-sm tracking-[0.3em] uppercase"
          style={{ color: 'rgba(248, 180, 196, 0.6)' }}
        >
          息 · Error
        </p>
        <h1
          className="mb-6 text-4xl font-light"
          style={{ fontFamily: 'serif', fontStyle: 'italic' }}
        >
          Something went wrong
        </h1>
        <p
          className="mb-8 text-base"
          style={{ color: 'rgba(232, 224, 228, 0.7)' }}
        >
          Like a disrupted breath, sometimes we need to pause and begin again.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className="mb-8 text-left">
            <summary
              className="cursor-pointer text-sm"
              style={{ color: 'rgba(248, 180, 196, 0.6)' }}
            >
              Error Details
            </summary>
            <pre
              className="mt-3 overflow-auto rounded-lg p-4 text-xs"
              style={{
                background: 'rgba(248, 180, 196, 0.05)',
                border: '1px solid rgba(248, 180, 196, 0.15)',
                color: 'rgba(232, 224, 228, 0.8)',
              }}
            >
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={reset}
            type="button"
            style={{
              padding: '0.875rem 2rem',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              background:
                'linear-gradient(135deg, rgba(248, 180, 196, 0.15) 0%, rgba(201, 184, 224, 0.1) 100%)',
              border: '1px solid rgba(248, 180, 196, 0.4)',
              color: '#e8e0e4',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            Try Again
          </button>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '0.875rem 2rem',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              background: 'transparent',
              border: '1px solid rgba(232, 224, 228, 0.2)',
              color: 'rgba(232, 224, 228, 0.7)',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
            }}
          >
            Return Home
          </Link>
        </div>

        <div className="mt-16" style={{ fontSize: '2rem' }}>
          🌸
        </div>
      </div>
    </div>
  )
}
