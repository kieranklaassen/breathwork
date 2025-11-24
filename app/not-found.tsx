import { Link } from '~/components/link'

export default function NotFound() {
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
          息 · Lost
        </p>
        <h1
          className="mb-2 text-7xl font-light"
          style={{
            fontFamily: 'serif',
            fontStyle: 'italic',
            color: 'rgba(248, 180, 196, 0.8)',
          }}
        >
          404
        </h1>
        <p
          className="mb-6 text-2xl font-light"
          style={{ fontFamily: 'serif', fontStyle: 'italic' }}
        >
          Page Not Found
        </p>
        <p
          className="mb-10 text-base"
          style={{ color: 'rgba(232, 224, 228, 0.7)' }}
        >
          Like wind through bamboo, the path you seek has drifted away.
        </p>

        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '1rem 2.5rem',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            background:
              'linear-gradient(135deg, rgba(248, 180, 196, 0.15) 0%, rgba(201, 184, 224, 0.1) 100%)',
            border: '1px solid rgba(248, 180, 196, 0.4)',
            color: '#e8e0e4',
            textDecoration: 'none',
            transition: 'all 0.3s ease',
          }}
        >
          Return to Breathe
        </Link>

        <div className="mt-16" style={{ fontSize: '2rem' }}>
          🌸
        </div>
      </div>
    </div>
  )
}
