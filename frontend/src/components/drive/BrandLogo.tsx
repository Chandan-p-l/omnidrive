import { cn } from '@/lib/utils'

export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-slate-900 shadow-md shadow-blue-500/10 ring-1 ring-white/10', className)}>
      <img src="/logo.png" alt="OmniDrive logo" className="h-full w-full object-cover" />
    </div>
  )
}
