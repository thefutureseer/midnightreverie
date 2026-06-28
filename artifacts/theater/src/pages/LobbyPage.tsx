import { Link } from "wouter";
import { DemoTipBox } from "@/components/DemoTipBox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useListVenues, getListVenuesQueryKey } from "@workspace/api-client-react";
import { Ticket, Calendar, Clock, MapPin, Users, ArrowRight, Loader2 } from "lucide-react";

export default function LobbyPage() {
  const { user } = useAuth();

  const { data: venues, isLoading: venuesLoading } = useListVenues({
    query: { queryKey: getListVenuesQueryKey() }
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

      <div className="w-full max-w-3xl z-10 space-y-14 py-12">

        {/* Hero */}
        <div className="text-center space-y-4">
          <p className="text-primary tracking-[0.3em] text-sm font-bold uppercase">One Night Only</p>
          <h1 className="text-5xl md:text-7xl font-serif italic font-bold tracking-tight">Midnight Reverie</h1>
          <p className="text-xl md:text-2xl text-muted-foreground italic max-w-lg mx-auto">
            An intimate virtual performance experience
          </p>
        </div>

        {/* Main show card */}
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
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline underline-offset-4">Sign in</Link>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Watch Party Venues */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-serif italic text-primary">Watch Parties</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Host-organized viewing parties — group discounts apply as seats fill up
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10 text-xs">
                Host a Party
              </Button>
            </Link>
          </div>

          {venuesLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
            </div>
          ) : venues && venues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {venues.map((venue) => (
                <Link key={venue.id} href={`/venue/${venue.id}`}>
                  <Card className="bg-card border-primary/15 hover:border-primary/40 transition-all duration-200 cursor-pointer group h-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent group-hover:via-primary/60 transition-all" />
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-serif text-foreground group-hover:text-primary transition-colors leading-snug">
                        {venue.venueName}
                      </CardTitle>
                      {venue.performerName && (
                        <p className="text-sm text-primary/80 font-medium">{venue.performerName}</p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                        {venue.showDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-primary/60" />
                            {venue.showDate}
                          </span>
                        )}
                        {venue.showTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-primary/60" />
                            {venue.showTime}
                          </span>
                        )}
                        {venue.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-primary/60" />
                            {venue.location}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/30">
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-serif text-primary">
                            ${venue.tierInfo.currentPrice.toFixed(2)}
                          </span>
                          {venue.tierInfo.discount > 0 && (
                            <span className="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded font-medium">
                              {venue.tierInfo.discount}% off
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {venue.seatsRemaining} left
                          <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform text-primary/50" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-border/30 rounded-lg bg-card/30">
              <p className="text-muted-foreground text-sm">No watch parties yet.</p>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mt-3 text-primary hover:text-primary">
                  Be the first to host one
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="max-w-md mx-auto">
          <DemoTipBox />
        </div>
      </div>
    </div>
  );
}
