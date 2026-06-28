import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { usePurchaseHostLicense, useGetHostDashboard, useCreateVenue, getGetHostDashboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Loader2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

const venueSchema = z.object({
  venueName: z.string().min(1, "Venue name is required"),
  performerName: z.string().optional(),
  showDate: z.string().optional(),
  showTime: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  capacitySeats: z.coerce.number().min(1, "Capacity is required"),
  ticketPriceChargedByHost: z.coerce.number().min(0, "Base price is required"),
});

export default function HostDashboardPage() {
  const { user, isLoading: authLoading, updateUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  const purchaseLicense = usePurchaseHostLicense();
  const { data: dashboardData, isLoading: dashboardLoading } = useGetHostDashboard({
    query: {
      enabled: !!user?.isHost,
      queryKey: getGetHostDashboardQueryKey(),
    }
  });

  const createVenue = useCreateVenue();

  const form = useForm<z.infer<typeof venueSchema>>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      venueName: "",
      performerName: "",
      showDate: "",
      showTime: "",
      location: "",
      description: "",
      capacitySeats: 50,
      ticketPriceChargedByHost: 10,
    },
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const onPurchaseLicense = () => {
    purchaseLicense.mutate(undefined, {
      onSuccess: (data) => {
        updateUser(data.user);
        queryClient.invalidateQueries({ queryKey: getGetHostDashboardQueryKey() });
        toast({ title: "License Purchased", description: "You are now a licensed host." });
      },
      onError: (err) => {
        toast({ title: "Purchase Failed", description: (err as any).data?.error || "Failed to purchase license.", variant: "destructive" });
      }
    });
  };

  const onSubmitVenue = (values: z.infer<typeof venueSchema>) => {
    createVenue.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetHostDashboardQueryKey() });
        toast({ title: "Venue Created", description: "Your watch party venue is live." });
        form.reset();
      },
      onError: (err) => {
        toast({ title: "Creation Failed", description: (err as any).data?.error || "Failed to create venue.", variant: "destructive" });
      }
    });
  };

  const handleCopyLink = (venueId: string) => {
    const link = `${window.location.origin}/venue/${venueId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(venueId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Link Copied", description: "Venue link copied to clipboard." });
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col p-6 md:p-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />

      <div className="w-full max-w-5xl mx-auto z-10 space-y-8">
        <Link href="/">
          <Button variant="ghost" className="text-muted-foreground hover:text-primary -ml-4 mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lobby
          </Button>
        </Link>

        <h1 className="text-4xl font-serif italic text-primary">Host Dashboard</h1>

        {!user.isHost ? (
          <Card className="bg-card border-primary/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-serif italic text-primary">Become a Host</CardTitle>
              <CardDescription className="text-base text-foreground/80">
                Unlock the ability to create official watch party venues and invite guests. Host licenses require a one-time fee.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-serif text-primary mb-6">$15.00</div>
              <Button 
                size="lg" 
                className="w-full sm:w-auto font-semibold tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={onPurchaseLicense}
                disabled={purchaseLicense.isPending}
                data-testid="button-purchase-license"
              >
                {purchaseLicense.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Purchase Host License
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Create Venue Form */}
                <Card className="bg-card border-primary/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-2xl font-serif italic text-primary">Create New Venue</CardTitle>
                    <CardDescription>Setup a new watch party for an upcoming show.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmitVenue)} className="space-y-4">
                        <FormField control={form.control} name="venueName" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Venue Name</FormLabel>
                            <FormControl><Input placeholder="The Grand Theater" {...field} className="bg-background border-border/50" data-testid="input-venue-name" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={form.control} name="performerName" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Performer Name</FormLabel>
                              <FormControl><Input placeholder="Optional" {...field} className="bg-background border-border/50" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="location" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl><Input placeholder="Virtual / Physical" {...field} className="bg-background border-border/50" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={form.control} name="showDate" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Show Date</FormLabel>
                              <FormControl><Input placeholder="e.g. Saturday, July 19, 2026" {...field} className="bg-background border-border/50" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="showTime" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Show Time</FormLabel>
                              <FormControl><Input placeholder="e.g. 8:00 PM EST" {...field} className="bg-background border-border/50" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={form.control} name="capacitySeats" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Capacity (Seats)</FormLabel>
                              <FormControl><Input type="number" {...field} className="bg-background border-border/50" data-testid="input-capacity" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="ticketPriceChargedByHost" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Base Ticket Price ($)</FormLabel>
                              <FormControl><Input type="number" step="0.01" {...field} className="bg-background border-border/50" data-testid="input-base-price" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>

                        <FormField control={form.control} name="description" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl><Textarea placeholder="Describe the watch party..." {...field} className="bg-background border-border/50" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <Button 
                          type="submit" 
                          className="w-full sm:w-auto mt-4 font-semibold tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground"
                          disabled={createVenue.isPending}
                          data-testid="button-create-venue"
                        >
                          {createVenue.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                          Publish Venue
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Summary */}
              <div className="space-y-8">
                <Card className="bg-card border-primary/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-serif italic text-primary">Revenue Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {dashboardLoading ? (
                      <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : dashboardData ? (
                      <>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground uppercase tracking-widest">Total Guest Revenue</p>
                          <p className="text-3xl font-serif text-foreground">${dashboardData.totalRevenue.toFixed(2)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground uppercase tracking-widest">Platform Earnings</p>
                          <p className="text-xl font-serif text-primary/80">${dashboardData.platformRevenue.toFixed(2)}</p>
                        </div>
                        <p className="text-xs text-muted-foreground italic border-t border-border/50 pt-4 mt-4">
                          Note: Platform receives $15 host license + 3% of all guest ticket sales.
                        </p>
                      </>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Venue Listings */}
            <div className="space-y-4 pt-4">
              <h2 className="text-2xl font-serif italic text-primary">Your Venues</h2>
              {dashboardLoading ? (
                 <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : dashboardData?.venues.length === 0 ? (
                <div className="text-muted-foreground p-8 text-center border border-border/50 rounded-lg bg-card/50">
                  No venues created yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {dashboardData?.venues.map(venue => {
                    const revenueSummary = dashboardData.revenueSummaries?.find(s => s.venueId === venue.id);
                    const progressVal = venue.tierInfo.nextTierAt 
                      ? (venue.ticketsSold / venue.tierInfo.nextTierAt) * 100 
                      : (venue.ticketsSold / venue.capacitySeats) * 100;
                    
                    return (
                      <Card key={venue.id} className="bg-card border-primary/20 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                        <CardHeader className="pb-4">
                          <CardTitle className="text-xl font-serif text-primary truncate">{venue.venueName}</CardTitle>
                          <CardDescription className="space-y-1 mt-2">
                            {venue.performerName && <div><span className="font-medium text-foreground/80">Performer:</span> {venue.performerName}</div>}
                            {(venue.showDate || venue.showTime) && <div><span className="font-medium text-foreground/80">When:</span> {venue.showDate} {venue.showTime}</div>}
                            {venue.location && <div><span className="font-medium text-foreground/80">Where:</span> {venue.location}</div>}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                          <div className="grid grid-cols-2 gap-4 bg-background/50 p-4 rounded-md border border-border/30">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">Tickets Sold</p>
                              <p className="text-lg font-medium">{venue.ticketsSold} / {venue.capacitySeats}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">Current Price</p>
                              <p className="text-lg font-medium text-primary">${venue.tierInfo.currentPrice.toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{venue.tierInfo.tierLabel}</span>
                              <span className="text-muted-foreground">{venue.tierInfo.nextTierAt ? `Next tier at ${venue.tierInfo.nextTierAt}` : 'Max discount'}</span>
                            </div>
                            <Progress value={Math.min(progressVal, 100)} className="h-2" />
                          </div>

                          {revenueSummary && (
                            <div className="flex justify-between text-sm pt-4 border-t border-border/30">
                              <span className="text-muted-foreground">Guest Revenue: <span className="text-foreground">${revenueSummary.guestRevenue.toFixed(2)}</span></span>
                              <span className="text-muted-foreground">Platform Cut: <span className="text-foreground">${revenueSummary.platformCut.toFixed(2)}</span></span>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="bg-background/30 pt-4">
                          <div className="w-full flex items-center justify-between border border-primary/20 rounded px-3 py-2 bg-background">
                            <span className="text-xs text-muted-foreground truncate mr-2">
                              {window.location.origin}/venue/{venue.id}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 shrink-0 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => handleCopyLink(venue.id)}
                              data-testid={`button-copy-link-${venue.id}`}
                            >
                              {copiedId === venue.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
