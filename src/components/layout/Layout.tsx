import { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Search, Layers, List, User } from 'lucide-react';
import { useAccountStore, startAutoSync } from '../../stores/accountStore';
import { useDataStore } from '../../stores/dataStore';
import { SearchModal } from '../search/SearchModal';

export function Layout() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pin = useAccountStore(s => s.pin);
  const { chapters, isLoading, loadData } = useDataStore();

  // Start cloud sync (pull on boot, debounced push on changes) once
  useEffect(() => {
    startAutoSync();
  }, []);

  // Load data immediately on app start if not already loaded
  useEffect(() => {
    if (chapters.length === 0 && !isLoading) {
      loadData();
    }
  }, [chapters, isLoading, loadData]);

  // Listen globally for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center px-4">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="font-extrabold text-2xl italic tracking-tight text-primary">Disce!</span>
          </Link>

          <div className="flex flex-1 items-center space-x-3 justify-end">
            <nav className="flex items-center space-x-2 sm:space-x-3">
              {/* Quick Search Button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center space-x-2 text-xs sm:text-sm font-medium px-2.5 py-1.5 rounded-lg border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Quick Search</span>
                <kbd className="hidden sm:inline-block px-1 py-0.2 text-[10px] font-mono bg-muted/80 rounded border border-border/80 text-muted-foreground">
                  Ctrl K
                </kbd>
              </button>

              <Link to="/chapters" className="flex items-center space-x-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-2 py-1">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline-block">Chapters</span>
              </Link>

              <Link to="/decks" className="flex items-center space-x-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-2 py-1">
                <Layers className="h-4 w-4" />
                <span className="hidden sm:inline-block">Decks</span>
              </Link>

              <Link to="/account" className="flex items-center space-x-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-2 py-1" title={pin ? 'Account (signed in)' : 'Account'}>
                <User className="h-4 w-4" />
                <span className="hidden sm:inline-block">{pin ? 'Account' : 'Sign in'}</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8 max-w-6xl">
        <Outlet />
      </main>

      {/* Global Modals */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
