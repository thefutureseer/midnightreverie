import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetVenue,
  useBuyWatchPartyTicket,
  useVerifyGuestStream,
  useSellPhysicalTicket,
  useJoinVenueWaitlist,
  getGetVenueQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User as UserIcon,
  PlayCircle,
  Lock,
  BellRing,
  CheckCircle2,
  Ticket,
  Users,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const purchaseSchema = z.object({
  guestName: z.string().min(1, "Name is required"),
  guestEmail: z.string().email("Valid email is required"),
});

const accessSchema = z.object({
  email: z.string().email("Valid email is required"),
});

const waitlistSchema = z.object({
  email: z.string().email("Valid email is required"),
});

// ── Status badge config ───────────────────────────────────────────────────────
const statusConfig = {
  Locked: {
    label: "Locked",
    description: "Virtual tickets unlock when the physical venue sells out",
    badgeClass: "bg-zinc-700 text-zinc-100 border-zinc-600",
    icon: Lock,
  },
  WaitlistOnly: {
    label: "Waitlist Only",
    description: "Virtual sales aren't open yet — join the waitlist to be first in line",
    badgeClass: "bg-amber-900/80 text-amber-200 border-amber-700",
    icon: BellRing,
  },
  Open: {
    label: "On Sale Now",
    description: "Virtual tickets are available — the physical venue is sold out!",
    badgeClass: "bg-emerald-900/80 text-emerald-200 border-emerald-600",
    icon: Ticket,
  },
  Closed: {
    label: "Sales Closed",
    description: "Virtual ticket sales for this event have closed",
    badgeClass: "bg-red-900/80 text-red-200 border-red-700",
    icon: AlertCircle,
  },
};

export default function VenuePage() {
  const params = useParams<{ venueId: string }>();
  const venueId = params.venueId || "";
  const queryClient = useQueryClient();

  const { data: venue, isLoading: venueLoading, error: venueError } = useGetVenue(venueId, {
    query: {
      enabled: !!venueId,
      queryKey: getGetVenueQueryKey(venueId),
    },
  });

  const buyTicket = useBuyWatchPartyTicket();
  const verifyStream = useVerifyGuestStream();
  const sellPhysical = useSellPhysicalTicket();
  const joinWaitlist = useJoinVenueWaitlist();

  const [ticketSuccess, setTicketSuccess] = useState<{
    guestName: string;
    guestEmail: string;
    paid: number;
  } | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const [streamAccess, setStreamAccess] = useState<{ url: string; type: string } | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

  const [waitlistSuccess, setWaitlistSuccess] = useState<string | null>(null);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  const purchaseForm = useForm<z.infer<typeof purchaseSchema>>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { guestName: "", guestEmail: "" },
  });

  const accessForm = useForm<z.infer<typeof accessSchema>>({
    resolver: zodResolver(accessSchema),
    defaultValues: { email: "" },
  });

  const waitlistForm = useForm<z.infer<typeof waitlistSchema>>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: { email: "" },
  });

  const invalidateVenue = () =>
    queryClient.invalidateQueries({ queryKey: getGetVenueQueryKey(venueId) });

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
          invalidateVenue();
        },
        onError: (err) => {
          const msg = (err as any).data?.error as string | undefined;
          setPurchaseError(msg ?? "An error occurred during purchase");
        },
      }
    );
  };

  const onAccessSubmit = (values: z.infer<typeof accessSchema>) => {
    setStreamError(null);
    verifyStream.mutate(
      { data: { email: values.email, venueId } },
      {
        onSuccess: (res) => setStreamAccess({ url: res.streamUrl, type: res.streamType }),
        onError: (err) => setStreamError((err as any).data?.error || "No ticket found for this email"),
      }
    );
  };

  const onWaitlistSubmit = (values: z.infer<typeof waitlistSchema>) => {
    setWaitlistError(null);
    setWaitlistSuccess(null);
    joinWaitlist.mutate(
      { venueId, data: { email: values.email } },
      {
        onSuccess: (res) => {
          setWaitlistSuccess(res.message);
          waitlistForm.reset();
          invalidateVenue();
        },
        onError: (err) => {
          setWaitlistError((err as any).data?.error ?? "Failed to join waitlist");
        },
      }
    );
  };

  const onSimulatePhysicalSale = () => {
    sellPhysical.mutate(
      { venueId },
      {
        onSuccess: () => invalidateVenue(),
        onError: () => {},
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

  const status = venue.virtualSalesStatus as keyof typeof statusConfig;
  const sConfig = statusConfig[status] ?? statusConfig.Locked;
  const StatusIcon = sConfig.icon;
  const physicalProgress = venue.totalPhysicalSeats > 0
    ? Math.min(100, (venue.physicalSeatsSold / venue.totalPhysicalSeats) * 100)
    : 0;
  const physicalRemaining = venue.totalPhysicalSeats - venue.physicalSeatsSold;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 md:p-8 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

      <div className="w-full max-w-4xl z-10 space-y-10">
        <Link href="/">
          <Button variant="ghost" className="text-muted-foreground hover:text-primary -ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lobby
          </Button>
        </Link>

        {/* SECTION A - Venue Header */}
        <div className="text-center space-y-4">
          <p className="text-primary tracking-[0.2em] text-sm font-bold uppercase">Watch Party</p>
          <h1 className="text-4xl md:text-6xl font-serif italic font-bold tracking-tight text-foreground">
            {venue.venueName}
          </h1>

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
                <img src={img} alt={`Venue image ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* SECTION B - Sell-Out Trigger Status Banner */}
        {venue.totalPhysicalSeats > 0 && (
          <Card className="bg-card/50 backdrop-blur border-primary/20 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <CardContent className="pt-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">Virtual Sales Status</p>
                  <div className="flex items-center gap-2">
                    <Badge className={`${sConfig.badgeClass} border text-xs px-2.5 py-1 font-semibold`}>
                      <StatusIcon className="h-3 w-3 mr-1.5" />
                      {sConfig.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{sConfig.description}</p>
                </div>

                {status !== "Open" && status !== "Closed" && venue.virtualWaitlistCount > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-background/60 border border-border/50 rounded px-3 py-2">
                    <Users className="h-4 w-4 text-primary/60" />
                    <span><strong className="text-foreground">{venue.virtualWaitlistCount}</strong> on waitlist</span>
                  </div>
                )}
              </div>

              {/* Physical sell-out progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                  <span>Physical seats sold: {venue.physicalSeatsSold.toLocaleString()} / {venue.totalPhysicalSeats.toLocaleString()}</span>
                  <span>
                    {status === "Open"
                      ? "Sold out — virtual sales open!"
                      : `${physicalRemaining.toLocaleString()} remaining`}
                  </span>
                </div>
                <Progress value={physicalProgress} className="h-2" />
              </div>

              {/* Demo control — simulate physical ticket sales */}
              {status !== "Open" && status !== "Closed" && (
                <div className="border-t border-border/30 pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">Demo Panel</p>
                    <p className="text-xs text-muted-foreground">
                      Simulate physical ticket sales at {venue.location ?? "the venue"} to watch virtual sales unlock.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-primary/40 text-primary hover:bg-primary/10"
                    onClick={onSimulatePhysicalSale}
                    disabled={sellPhysical.isPending}
                    data-testid="button-simulate-physical-sale"
                  >
                    {sellPhysical.isPending
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      : <Ticket className="h-3.5 w-3.5 mr-1.5" />}
                    Sell 1 Physical Ticket
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* SECTION C - Tiered Pricing */}
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
                <div className="p-2 rounded bg-background/50 border border-border/50 text-muted-foreground">1–10: Full Price</div>
                <div className="p-2 rounded bg-background/50 border border-border/50 text-muted-foreground">11–25: 10% off</div>
                <div className="p-2 rounded bg-background/50 border border-border/50 text-muted-foreground">26–50: 20% off</div>
                <div className="p-2 rounded bg-background/50 border border-border/50 text-muted-foreground">51+: 30% off</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* SECTION D - Purchase / Waitlist / Locked panel */}
          <Card className="bg-card border-primary/20 shadow-xl">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-xl font-serif italic text-primary">
                {status === "Open" ? "Get Your Ticket" : status === "Closed" ? "Sales Closed" : "Join the Waitlist"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">

              {/* ── Open: buy form ─────────────────────────────────────── */}
              {status === "Open" && (
                <>
                  {ticketSuccess ? (
                    <div className="space-y-4 text-center py-4">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary mb-2">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-serif text-foreground">You're in, {ticketSuccess.guestName}!</h3>
                      <p className="text-muted-foreground">
                        You paid <strong className="text-primary">${ticketSuccess.paid.toFixed(2)}</strong>.
                      </p>
                      <p className="text-sm bg-background p-3 rounded border border-primary/20 mt-4">
                        Use your email (<strong className="text-foreground">{ticketSuccess.guestEmail}</strong>) at the stream gate below to access the show.
                      </p>
                    </div>
                  ) : (
                    <Form {...purchaseForm}>
                      <form onSubmit={purchaseForm.handleSubmit(onPurchaseSubmit)} className="space-y-4">
                        <FormField control={purchaseForm.control} name="guestName" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Jane Doe" {...field} className="bg-background border-border/50" data-testid="input-guest-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={purchaseForm.control} name="guestEmail" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input placeholder="jane@example.com" type="email" {...field} className="bg-background border-border/50" data-testid="input-guest-email" />
                            </FormControl>
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
                </>
              )}

              {/* ── Locked / WaitlistOnly: waitlist form ───────────────── */}
              {(status === "Locked" || status === "WaitlistOnly") && (
                <div className="space-y-5">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-background/60 border border-border/50">
                    <Lock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="space-y-1 text-sm">
                      <p className="font-medium text-foreground">Virtual tickets are not yet on sale</p>
                      <p className="text-muted-foreground">
                        {venue.totalPhysicalSeats > 0
                          ? `${physicalRemaining.toLocaleString()} physical seats must sell before virtual streaming opens. Join the waitlist to be notified the moment tickets drop.`
                          : "Join the waitlist to be notified when virtual tickets become available."}
                      </p>
                    </div>
                  </div>

                  {waitlistSuccess ? (
                    <div className="flex items-center gap-3 p-4 bg-emerald-950/40 border border-emerald-700/50 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                      <p className="text-sm text-emerald-300">{waitlistSuccess}</p>
                    </div>
                  ) : (
                    <Form {...waitlistForm}>
                      <form onSubmit={waitlistForm.handleSubmit(onWaitlistSubmit)} className="space-y-4">
                        <FormField control={waitlistForm.control} name="email" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Email</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="jane@example.com"
                                type="email"
                                {...field}
                                className="bg-background border-border/50"
                                data-testid="input-waitlist-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        {waitlistError && (
                          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded border border-destructive/20">
                            {waitlistError}
                          </div>
                        )}

                        <Button
                          type="submit"
                          className="w-full h-12 text-base tracking-wide font-semibold"
                          disabled={joinWaitlist.isPending}
                          data-testid="button-join-waitlist"
                        >
                          {joinWaitlist.isPending
                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            : <BellRing className="mr-2 h-4 w-4" />}
                          Notify Me When Tickets Open
                        </Button>
                      </form>
                    </Form>
                  )}
                </div>
              )}

              {/* ── Closed ─────────────────────────────────────────────── */}
              {status === "Closed" && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-background/60 border border-border/50">
                  <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-foreground">Sales have closed</p>
                    <p className="text-muted-foreground">Virtual ticket sales for this event are no longer available.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION E - Stream Access Gate */}
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
                        <FormControl>
                          <Input
                            placeholder="Enter the email you used to buy"
                            type="email"
                            {...field}
                            className="bg-background border-border/50"
                            data-testid="input-stream-email"
                          />
                        </FormControl>
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
