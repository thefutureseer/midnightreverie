import { useState } from "react";
import { useParams } from "wouter";
import { useGetVenue, useBuyWatchPartyTicket, useVerifyGuestStream, getGetVenueQueryKey } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, AlertCircle, Calendar, Clock, MapPin, User as UserIcon, PlayCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const purchaseSchema = z.object({
  guestName: z.string().min(1, "Name is required"),
  guestEmail: z.string().email("Valid email is required"),
});

const accessSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export default function VenuePage() {
  const params = useParams<{ venueId: string }>();
  const venueId = params.venueId || "";
  
  const { data: venue, isLoading: venueLoading, error: venueError } = useGetVenue(venueId, {
    query: {
      enabled: !!venueId,
      queryKey: getGetVenueQueryKey(venueId),
    }
  });

  const buyTicket = useBuyWatchPartyTicket();
  const verifyStream = useVerifyGuestStream();

  const [ticketSuccess, setTicketSuccess] = useState<{
    guestName: string;
    guestEmail: string;
    paid: number;
  } | null>(null);
  
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const [streamAccess, setStreamAccess] = useState<{
    url: string;
    type: string;
  } | null>(null);
  
  const [streamError, setStreamError] = useState<string | null>(null);

  const purchaseForm = useForm<z.infer<typeof purchaseSchema>>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { guestName: "", guestEmail: "" },
  });

  const accessForm = useForm<z.infer<typeof accessSchema>>({
    resolver: zodResolver(accessSchema),
    defaultValues: { email: "" },
  });

  const onPurchaseSubmit = (values: z.infer<typeof purchaseSchema>) => {
    setPurchaseError(null);
    buyTicket.mutate(
      { venueId, data: values },
      {
        onSuccess: (res) => {
          setTicketSuccess({
            guestName: res.ticket.guestName,
            guestEmail: res.ticket.guestEmail,
            paid: res.ticket.purchasedAtPrice,
          });
        },
        onError: (err) => {
          const msg = (err as any).data?.error as string | undefined;
          if (msg) {
            setPurchaseError(msg.includes("exists") ? "A ticket with this email already exists for this venue" : msg);
          } else {
            setPurchaseError("An error occurred during purchase");
          }
        }
      }
    );
  };

  const onAccessSubmit = (values: z.infer<typeof accessSchema>) => {
    setStreamError(null);
    verifyStream.mutate(
      { data: { email: values.email, venueId } },
      {
        onSuccess: (res) => {
          setStreamAccess({ url: res.streamUrl, type: res.streamType });
        },
        onError: (err) => {
          setStreamError((err as any).data?.error || "No ticket found for this email");
        }
      }
    );
  };

  if (venueLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-primary/70 font-serif italic tracking-wide">Loading Venue...</p>
      </div>
    );
  }

  if (venueError || !venue) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-serif text-foreground">Venue Not Found</h2>
        <p className="text-muted-foreground">The watch party you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 md:p-8 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

      <div className="w-full max-w-4xl z-10 space-y-12">
        {/* SECTION A - Venue Header */}
        <div className="text-center space-y-4">
          <p className="text-primary tracking-[0.2em] text-sm font-bold uppercase">Watch Party</p>
          <h1 className="text-4xl md:text-6xl font-serif italic font-bold tracking-tight text-foreground">{venue.venueName}</h1>
          
          <div className="flex flex-wrap justify-center gap-4 text-muted-foreground pt-4">
            {venue.performerName && (
              <div className="flex items-center gap-1.5"><UserIcon className="h-4 w-4 text-primary/70" /> {venue.performerName}</div>
            )}
            {venue.showDate && (
              <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-primary/70" /> {venue.showDate}</div>
            )}
            {venue.showTime && (
              <div className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary/70" /> {venue.showTime}</div>
            )}
            {venue.location && (
              <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary/70" /> {venue.location}</div>
            )}
          </div>
          
          {venue.description && (
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto pt-2 leading-relaxed">
              {venue.description}
            </p>
          )}
        </div>

        {venue.images && venue.images.length > 0 && (
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar">
            {venue.images.map((img, i) => (
              <div key={i} className="shrink-0 w-72 h-48 rounded-lg overflow-hidden snap-center border border-primary/20">
                <img src={img} alt={`Venue image ${i+1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* SECTION B - Tiered Pricing */}
        <Card className="bg-card/50 backdrop-blur border-primary/20 shadow-xl overflow-hidden relative">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
           <CardContent className="pt-6 space-y-6">
             <div className="text-center space-y-2">
               <h3 className="text-2xl font-serif italic text-primary">Dynamic Pricing</h3>
               <p className="text-muted-foreground max-w-lg mx-auto">
                 Buy now — as more people join, the price drops for everyone!
               </p>
             </div>

             <div className="space-y-4">
               <div className="flex justify-between items-end">
                 <div>
                   <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Current Tier</p>
                   <p className="text-xl font-medium text-foreground">{venue.tierInfo.tierLabel}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Price</p>
                   <p className="text-3xl font-serif text-primary">${venue.tierInfo.currentPrice.toFixed(2)}</p>
                 </div>
               </div>

               <div className="space-y-2">
                 <Progress 
                   value={venue.tierInfo.nextTierAt ? (venue.ticketsSold / venue.tierInfo.nextTierAt) * 100 : 100} 
                   className="h-3"
                 />
                 <div className="flex justify-between text-xs text-muted-foreground font-mono">
                   <span>{venue.ticketsSold} tickets sold</span>
                   <span>
                     {venue.tierInfo.nextTierAt ? `Next tier at ${venue.tierInfo.nextTierAt}` : "Maximum discount reached"}
                   </span>
                 </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs mt-4 pt-4 border-t border-border/30">
                 <div className="p-2 rounded bg-background/50 border border-border/50 text-muted-foreground">1-10: Full Price</div>
                 <div className="p-2 rounded bg-background/50 border border-border/50 text-muted-foreground">11-25: 10% off</div>
                 <div className="p-2 rounded bg-background/50 border border-border/50 text-muted-foreground">26-50: 20% off</div>
                 <div className="p-2 rounded bg-background/50 border border-border/50 text-muted-foreground">51+: 30% off</div>
               </div>
             </div>
           </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* SECTION C - Purchase Form */}
          <Card className="bg-card border-primary/20 shadow-xl">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-xl font-serif italic text-primary">Get Your Ticket</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {ticketSuccess ? (
                <div className="space-y-4 text-center py-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary mb-2">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-serif text-foreground">You're in, {ticketSuccess.guestName}!</h3>
                  <p className="text-muted-foreground">
                    You paid <strong className="text-primary">${ticketSuccess.paid.toFixed(2)}</strong>.
                  </p>
                  <p className="text-sm bg-background p-3 rounded border border-primary/20 mt-4">
                    Check your email address (<strong className="text-foreground">{ticketSuccess.guestEmail}</strong>) at the gate below to access the stream.
                  </p>
                </div>
              ) : (
                <Form {...purchaseForm}>
                  <form onSubmit={purchaseForm.handleSubmit(onPurchaseSubmit)} className="space-y-4">
                    <FormField control={purchaseForm.control} name="guestName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl><Input placeholder="Jane Doe" {...field} className="bg-background border-border/50" data-testid="input-guest-name" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={purchaseForm.control} name="guestEmail" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl><Input placeholder="jane@example.com" type="email" {...field} className="bg-background border-border/50" data-testid="input-guest-email" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {purchaseError && (
                      <div className="p-3 bg-destructive/10 text-destructive text-sm rounded border border-destructive/20">
                        {purchaseError}
                      </div>
                    )}

                    <div className="pt-4 space-y-4">
                      <div className="flex justify-between items-center text-sm border-t border-border/30 pt-4">
                        <span className="text-muted-foreground uppercase tracking-wider">Your Price Today</span>
                        <span className="text-2xl text-primary font-serif italic">${venue.tierInfo.currentPrice.toFixed(2)}</span>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full h-12 text-base tracking-wide font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                        disabled={buyTicket.isPending}
                        data-testid="button-buy-ticket"
                      >
                        {buyTicket.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Reserve My Spot — ${venue.tierInfo.currentPrice.toFixed(2)}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>

          {/* SECTION D - Stream Access Gate */}
          <div className="space-y-6">
            <Card className="bg-card border-primary/20 shadow-xl">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-xl font-serif italic text-primary">Already have a ticket? Access the Stream</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...accessForm}>
                  <form onSubmit={accessForm.handleSubmit(onAccessSubmit)} className="space-y-4">
                    <FormField control={accessForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ticket Email</FormLabel>
                        <FormControl><Input placeholder="Enter the email you used to buy" type="email" {...field} className="bg-background border-border/50" data-testid="input-stream-email" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    {streamError && (
                      <div className="p-3 bg-destructive/10 text-destructive text-sm rounded border border-destructive/20">
                        {streamError}
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      variant="outline"
                      className="w-full h-12 border-primary/50 text-primary hover:bg-primary/10"
                      disabled={verifyStream.isPending}
                      data-testid="button-enter-stream"
                    >
                      {verifyStream.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                      Enter Stream
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {streamAccess && (
              <Card className="bg-black border-primary shadow-[0_0_30px_rgba(var(--primary),0.15)] overflow-hidden">
                <div className="aspect-video w-full bg-black relative">
                  <video 
                    src={streamAccess.url} 
                    controls 
                    autoPlay
                    className="w-full h-full object-contain"
                    data-testid="video-stream-player"
                  />
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
