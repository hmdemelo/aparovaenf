import type { Metadata } from 'next'
import { Bricolage_Grotesque, Hanken_Grotesk } from 'next/font/google'
import './globals.css'

const bricolageGrotesque = Bricolage_Grotesque({
  variable: '--font-bricolage-grotesque',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const hankenGrotesk = Hanken_Grotesk({
  variable: '--font-hanken-grotesk',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'aprovaenf — Questões comentadas para concursos da saúde',
    template: '%s — aprovaenf',
  },
  description:
    'Resolva questões comentadas para Enfermeiro(a) e Técnico em enfermagem, no seu ritmo e direto do celular. Comece grátis, sem cadastro.',
  applicationName: 'aprovaenf',
  openGraph: {
    title: 'aprovaenf — Questões comentadas para concursos da saúde',
    description:
      'Feed de questões comentadas por especialistas para concursos da área da saúde. Comece grátis.',
    url: appUrl,
    siteName: 'aprovaenf',
    locale: 'pt_BR',
    type: 'website',
  },
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${bricolageGrotesque.variable} ${hankenGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
