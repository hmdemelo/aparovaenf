import { SignupForm } from '@/features/auth/signup-form'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  const target = next && next.startsWith('/') ? next : '/'

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-bold text-emerald-600">
          aprovaenf
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Crie sua conta e ganhe mais 3 questões grátis
        </p>
        <SignupForm next={target} />
      </div>
    </main>
  )
}
