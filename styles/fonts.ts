import { Cormorant_Garamond, Noto_Sans_JP } from 'next/font/google'
import localFont from 'next/font/local'

const mono = localFont({
  src: [
    {
      path: '../public/fonts/ServerMono/ServerMono-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--next-font-mono',
  preload: true,
  adjustFontFallback: 'Arial',
  fallback: [
    'ui-monospace',
    'SFMono-Regular',
    'Consolas',
    'Liberation Mono',
    'Menlo',
    'monospace',
  ],
})

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-display',
})

const japanese = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
  variable: '--font-japanese',
})

const fonts = [mono, display, japanese]
const fontsVariable = fonts.map((font) => font.variable).join(' ')

export { fontsVariable }
