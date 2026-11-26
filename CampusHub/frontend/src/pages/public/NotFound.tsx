import { Link } from 'react-router-dom'

import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <div>
        <p className="text-6xl font-semibold text-navy-900">404</p>
        <p className="mt-2 text-muted-foreground">The page you're looking for doesn't exist or has moved.</p>
      </div>
      <Button asChild><Link to="/">Back to home</Link></Button>
    </div>
  )
}
