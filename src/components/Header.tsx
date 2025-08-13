import { Link } from '@tanstack/react-router'
import { usePuterStore } from '@/lib/puter';

export default function Header() {
  const { auth } = usePuterStore();
  const isAuthenticated = auth?.isAuthenticated ?? false;

  return (
    <header className="p-2 flex gap-2 bg-white text-black justify-between">
      <nav className="flex flex-row">
        <div className="px-2 font-bold">
          <Link to="/">Home</Link>
        </div>
        {!isAuthenticated ? (
          <div className="px-2 font-bold">
            <Link to="/auth">Login</Link>
          </div>
        ) : (
          <div className="px-2 font-bold">
            <Link to="/auth">Logout</Link>
          </div>
        )}
      </nav>
    </header>
  )
}
