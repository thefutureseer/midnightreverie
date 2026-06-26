import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useVerifyStream } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, PlayCircle } from "lucide-react";

export default function TheaterPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    } else if (!authLoading && user && !user.hasTicket) {
      setLocation("/checkout");
    }
  }, [user, authLoading, setLocation]);

  const { data: stream, isLoading: streamLoading, error } = useVerifyStream({
    query: {
      enabled: !!user && user.hasTicket,
      retry: false,
    }
  });

  if (authLoading || streamLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-primary/70 font-serif italic tracking-wide">Opening the curtains...</p>
      </div>
    );
  }

  if (!user || !user.hasTicket) return null;

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
      
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 pt-24 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black">
        {error ? (
          <div className="text-center max-w-md space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
              <PlayCircle className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-serif text-foreground">Transmission Interrupted</h2>
            <p className="text-muted-foreground">{error?.error || "We could not establish a secure connection to the stage. Please try again."}</p>
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