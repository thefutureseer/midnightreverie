import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function DemoTipBox() {
  return (
    <Alert className="bg-card border-primary/30 text-primary-foreground">
      <AlertTitle className="text-primary font-bold tracking-wider uppercase text-xs mb-3">
        Demo Mode — Instant Access
      </AlertTitle>
      <AlertDescription className="space-y-2 text-sm text-foreground/80 font-mono">
        <div className="flex flex-col sm:flex-row justify-between border-b border-primary/10 pb-2">
          <span>viewer@test.com / password123</span>
          <span className="text-primary/80 text-xs mt-1 sm:mt-0">Has ticket</span>
        </div>
        <div className="flex flex-col sm:flex-row justify-between border-b border-primary/10 pb-2 pt-1">
          <span>windowshopper@test.com / password123</span>
          <span className="text-muted-foreground text-xs mt-1 sm:mt-0">Needs ticket</span>
        </div>
        <div className="flex flex-col sm:flex-row justify-between border-b border-primary/10 pb-2 pt-1">
          <span>host@test.com / password123</span>
          <span className="text-primary/80 text-xs mt-1 sm:mt-0">Licensed Host</span>
        </div>
        <div className="pt-2 text-xs text-muted-foreground space-y-0.5">
          <div className="font-semibold text-primary/60 uppercase tracking-widest mb-1">Watch Party Guest Access</div>
          <div>alice@example.com — Gary Owen watch party</div>
          <div>marcus@example.com — Gary Owen watch party</div>
          <div>priya@example.com — Gary Owen watch party</div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
