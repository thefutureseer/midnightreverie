import { Link } from "wouter";
import { DemoTipBox } from "@/components/DemoTipBox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Ticket } from "lucide-react";

export default function LobbyPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      
      <div className="w-full max-w-2xl z-10 space-y-12">
        <div className="text-center space-y-4">
          <p className="text-primary tracking-[0.3em] text-sm font-bold uppercase">One Night Only</p>
          <h1 className="text-5xl md:text-7xl font-serif italic font-bold tracking-tight">Midnight Reverie</h1>
          <p className="text-xl md:text-2xl text-muted-foreground italic max-w-lg mx-auto">
            An intimate virtual performance experience
          </p>
        </div>

        <Card className="bg-card/50 backdrop-blur border-primary/20 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <CardContent className="p-0 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center md:text-left">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground uppercase tracking-widest">Date</p>
                <p className="text-xl font-medium">Saturday, July 19, 2026</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground uppercase tracking-widest">Time</p>
                <p className="text-xl font-medium">8:00 PM EST</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground uppercase tracking-widest">Admission</p>
                <p className="text-xl font-medium text-primary">$15.00</p>
              </div>
            </div>

            <div className="pt-6 border-t border-border/50 text-center text-muted-foreground leading-relaxed">
              Join us for an unforgettable evening of live performance, streamed exclusively to ticketed audiences.
            </div>

            <div className="flex flex-col items-center gap-4 pt-4">
              {user ? (
                user.hasTicket ? (
                  <Link href="/theater" className="w-full">
                    <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wide h-14 text-lg" data-testid="button-enter-theater">
                      Enter Theater
                    </Button>
                  </Link>
                ) : (
                  <Link href="/checkout" className="w-full">
                    <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wide h-14 text-lg group" data-testid="button-buy-ticket">
                      <Ticket className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                      Purchase Ticket
                    </Button>
                  </Link>
                )
              ) : (
                <div className="w-full space-y-4">
                  <Link href="/checkout" className="w-full block">
                    <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wide h-14 text-lg group" data-testid="button-buy-ticket">
                      <Ticket className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                      Purchase Ticket
                    </Button>
                  </Link>
                  <p className="text-sm text-center text-muted-foreground">
                    Already have an account? <Link href="/login" className="text-primary hover:underline underline-offset-4">Sign in</Link>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="max-w-md mx-auto">
          <DemoTipBox />
        </div>
      </div>
    </div>
  );
}