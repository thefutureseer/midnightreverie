import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function NavBar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location === path;

  const navLink = (href: string, label: string) => (
    <Link href={href}>
      <span
        className={`text-sm tracking-wide transition-colors cursor-pointer ${
          isActive(href)
            ? "text-primary font-semibold"
            : "text-muted-foreground hover:text-foreground"
        }`}
        onClick={() => setMobileOpen(false)}
      >
        {label}
      </span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/15 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/">
          <span className="font-serif italic text-primary text-lg tracking-wide cursor-pointer whitespace-nowrap">
            Midnight Reverie
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {navLink("/", "Home")}
          {navLink("/dashboard", "Host a Party")}
          {user?.hasTicket && navLink("/theater", "Enter Theater")}
        </nav>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                {user.name}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary h-8 text-xs"
                onClick={logout}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground h-8 text-xs"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-xs font-semibold"
                >
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-muted-foreground hover:text-foreground p-1"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-primary/10 bg-background px-4 py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            {navLink("/", "Home")}
            {navLink("/dashboard", "Host a Party")}
            {user?.hasTicket && navLink("/theater", "Enter Theater")}
          </div>
          <div className="border-t border-border/40 pt-4 flex flex-col gap-2">
            {user ? (
              <>
                <p className="text-xs text-muted-foreground">{user.name}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary/30 text-primary hover:bg-primary/10 w-full"
                  onClick={() => { logout(); setMobileOpen(false); }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
