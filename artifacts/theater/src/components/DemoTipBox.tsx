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
        <div className="flex flex-col sm:flex-row justify-between pt-1">
          <span>windowshopper@test.com / password123</span>
          <span className="text-muted-foreground text-xs mt-1 sm:mt-0">Needs ticket</span>
        </div>
      </AlertDescription>
    </Alert>
  );
}