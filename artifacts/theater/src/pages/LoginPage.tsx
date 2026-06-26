import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLogin } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DemoTipBox } from "@/components/DemoTipBox";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function LoginPage() {
  const { user, login: authLogin } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useLogin();

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        authLogin(data.token, data.user);
        toast({ title: "Welcome back." });
      },
      onError: (err) => {
        toast({ title: "Login failed", description: err.error, variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      
      <div className="w-full max-w-md z-10 space-y-6">
        <Link href="/">
          <Button variant="ghost" className="text-muted-foreground hover:text-primary mb-4 -ml-4 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lobby
          </Button>
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif italic text-primary tracking-wide">Sign In</h1>
          <p className="text-muted-foreground mt-2">Return to the performance</p>
        </div>

        <Card className="bg-card/80 backdrop-blur border-primary/20 shadow-xl">
          <CardContent className="pt-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground uppercase text-xs tracking-widest">Email</FormLabel>
                    <FormControl><Input type="email" placeholder="viewer@test.com" {...field} className="bg-background/50 border-border/50 focus-visible:ring-primary/50 h-12" data-testid="input-email" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground uppercase text-xs tracking-widest">Password</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" {...field} className="bg-background/50 border-border/50 focus-visible:ring-primary/50 h-12" data-testid="input-password" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-md tracking-wide mt-4"
                  disabled={loginMutation.isPending}
                  data-testid="button-submit-login"
                >
                  {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </Form>
            <div className="mt-8 text-center text-sm text-muted-foreground border-t border-border/30 pt-6">
              Don't have an account? <Link href="/signup" className="text-primary hover:underline underline-offset-4">Register here</Link>
            </div>
          </CardContent>
        </Card>

        <DemoTipBox />
      </div>
    </div>
  );
}