import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useVerifyStream, getVerifyStreamQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, PlayCircle } from "lucide-react";

const SHOWTIME_UNIX = 1752969600000; // Saturday, July 19, 2026 at 8:00 PM EST

export default function TheaterPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [timeRemaining, setTimeRemaining] = useState<number>(Math.max(0, SHOWTIME_UNIX - Date.now()));

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    } else if (!authLoading && user && !user.hasTicket) {
      setLocation("/checkout");
    }
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(Math.max(0, SHOWTIME_UNIX - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: stream, isLoading: streamLoading, error } = useVerifyStream({
    query: {
      enabled: !!user && user.hasTicket && timeRemaining === 0,
      retry: false,
      queryKey: getVerifyStreamQueryKey(),
    }
  });

  const isBeforeShowtime = timeRemaining > 0;

  if (authLoading || (streamLoading && !isBeforeShowtime)) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-primary/70 font-serif italic tracking-wide">Opening the curtains...</p>
      </div>
    );
  }

  if (!user || !user.hasTicket) return null;

  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

  return (
    <div className="min-h-screen bg-black text-foreground flex flex-col">
      <header className="p-6 flex items-center justify-between z-10 absolute top-0 w-full bg-gradient-to-b from-black/80 to-transparent">
        <Link href="/">
          <Button variant="ghost" className="text-primary hover:text-primary-foreground hover:bg-primary/20 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Lobby
          </Button>
        </Link>
        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-serif italic text-primary tracking-wide">Midnight Reverie</h1>
          <p className="text-xs text-primary/60 uppercase tracking-[0.2em] mt-1">Live Stream</p>
        </div>
        <div className="w-24"></div> {/* Spacer for centering */}
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 pt-24 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black">
        {isBeforeShowtime ? (
          <div className="w-full max-w-5xl space-y-16 text-center mt-12">
            <div className="space-y-6">
              <h2 className="text-primary font-serif italic text-3xl md:text-5xl">The Stage is Being Set</h2>
              <p className="text-muted-foreground text-lg uppercase tracking-widest">
                The curtain rises on July 19, 2026 at 8:00 PM EST
              </p>
            </div>
            
            <div className="flex justify-center gap-4 md:gap-8 font-mono text-primary">
              <div className="flex flex-col items-center bg-card/40 p-4 md:p-6 rounded-lg border border-primary/20 min-w-[80px] md:min-w-[120px]">
                <span className="text-4xl md:text-6xl font-bold">{days.toString().padStart(2, '0')}</span>
                <span className="text-xs uppercase tracking-widest text-muted-foreground mt-2">Days</span>
              </div>
              <div className="flex flex-col items-center bg-card/40 p-4 md:p-6 rounded-lg border border-primary/20 min-w-[80px] md:min-w-[120px]">
                <span className="text-4xl md:text-6xl font-bold">{hours.toString().padStart(2, '0')}</span>
                <span className="text-xs uppercase tracking-widest text-muted-foreground mt-2">Hours</span>
              </div>
              <div className="flex flex-col items-center bg-card/40 p-4 md:p-6 rounded-lg border border-primary/20 min-w-[80px] md:min-w-[120px]">
                <span className="text-4xl md:text-6xl font-bold">{minutes.toString().padStart(2, '0')}</span>
                <span className="text-xs uppercase tracking-widest text-muted-foreground mt-2">Mins</span>
              </div>
              <div className="flex flex-col items-center bg-card/40 p-4 md:p-6 rounded-lg border border-primary/20 min-w-[80px] md:min-w-[120px]">
                <span className="text-4xl md:text-6xl font-bold">{seconds.toString().padStart(2, '0')}</span>
                <span className="text-xs uppercase tracking-widest text-muted-foreground mt-2">Secs</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
              <div className="aspect-video rounded overflow-hidden border border-primary/20 opacity-60 hover:opacity-100 transition-opacity">
                <img src="https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=800&q=80" alt="Stage preview 1" className="w-full h-full object-cover" />
              </div>
              <div className="aspect-video rounded overflow-hidden border border-primary/20 opacity-60 hover:opacity-100 transition-opacity">
                <img src="https://images.unsplash.com/photo-1516307365426-bea591f05011?w=800&q=80" alt="Stage preview 2" className="w-full h-full object-cover" />
              </div>
              <div className="aspect-video rounded overflow-hidden border border-primary/20 opacity-60 hover:opacity-100 transition-opacity">
                <img src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80" alt="Stage preview 3" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center max-w-md space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
              <PlayCircle className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-serif text-foreground">Transmission Interrupted</h2>
            <p className="text-muted-foreground">{(error as any)?.data?.error || "We could not establish a secure connection to the stage. Please try again."}</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 border-primary/50 text-primary hover:bg-primary/10">
              Reconnect
            </Button>
          </div>
        ) : stream ? (
          <div className="w-full max-w-6xl aspect-video bg-black rounded-lg overflow-hidden border border-primary/10 shadow-[0_0_50px_rgba(var(--primary),0.1)] relative group">
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none transition-opacity duration-700 group-hover:opacity-0">
               <div className="text-center">
                  <PlayCircle className="h-16 w-16 text-primary/50 mx-auto mb-4" />
                  <p className="text-primary/70 font-serif italic tracking-widest text-lg">The show is about to begin</p>
               </div>
            </div>
            <video 
              src={stream.url} 
              controls 
              autoPlay
              className="w-full h-full object-contain relative z-10"
              data-testid="video-player"
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}
