import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
  return (
    <nav className="fixed w-full z-50 bg-slate-50/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo_placeholder.png"
            alt="Logo"
            width={40}
            height={40}
            className="rounded-lg"
            priority
          />
          <span className="font-bold text-xl tracking-tight text-slate-900">
            SaaS<span className="text-primary">Medical</span>
          </span>
        </Link>
      </div>
    </nav>
  )
}
