import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useMockTicketSuccess, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  cardNumber: z.string().min(16, "Card number is required"),
  expiry: z.string().min(5, "Expiry is required"),
  cvc: z.string().min(3, "CVC is required"),
});

export default function CheckoutPage() {
  const { user, isLoading: authLoading, updateUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    } else if (!authLoading && user?.hasTicket) {
      setLocation("/theater");
    }
  }, [user, authLoading, setLocation]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", cardNumber: "", expiry: "", cvc: "" },
  });

  const mockTicket = useMockTicketSuccess();

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mockTicket.mutate(undefined, {
      onSuccess: (data) => {
        updateUser(data.user);
        toast({ title: "Payment Successful", description: "Your ticket has been issued." });
        setLocation("/theater");
      },
      onError: (err) => {
        toast({ title: "Payment Failed", description: (err as any).data?.error || "An error occurred", variant: "destructive" });
      }
    });
  };

  if (authLoading || !user || user.hasTicket) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
      
      <div className="w-full max-w-md z-10 space-y-6">
        <Link href="/">
          <Button variant="ghost" className="text-muted-foreground hover:text-primary mb-4 -ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lobby
          </Button>
        </Link>

        <Card className="bg-card border-primary/20 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <CardHeader className="space-y-1 pb-6 border-b border-border/50">
            <CardTitle className="text-2xl font-serif italic text-primary">Secure Checkout</CardTitle>
            <CardDescription className="text-muted-foreground">Midnight Reverie Admission • $15.00</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Cardholder Name</FormLabel>
                    <FormControl><Input placeholder="Jane Doe" {...field} className="bg-background border-border/50 focus-visible:ring-primary/50" data-testid="input-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="cardNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Card Number</FormLabel>
                    <FormControl><Input placeholder="4242 4242 4242 4242" {...field} className="bg-background font-mono border-border/50 focus-visible:ring-primary/50" data-testid="input-card" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="expiry" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Expiry</FormLabel>
                      <FormControl><Input placeholder="MM/YY" {...field} className="bg-background font-mono border-border/50 focus-visible:ring-primary/50" data-testid="input-expiry" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="cvc" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">CVC</FormLabel>
                      <FormControl><Input placeholder="123" {...field} className="bg-background font-mono border-border/50 focus-visible:ring-primary/50" type="password" data-testid="input-cvc" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                
                <div className="pt-6 space-y-4">
                  <div className="flex justify-between items-center text-sm border-t border-border/30 pt-4">
                    <span className="text-muted-foreground uppercase tracking-wider text-xs">Total</span>
                    <span className="text-2xl text-primary font-serif italic">$15.00</span>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg tracking-wide font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300"
                    disabled={mockTicket.isPending}
                    data-testid="button-submit-payment"
                  >
                    {mockTicket.isPending ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Lock className="mr-2 h-4 w-4" />
                    )}
                    Submit Payment
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}