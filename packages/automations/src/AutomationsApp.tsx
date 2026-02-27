import { Card, CardContent, CardHeader, CardTitle } from "basics-os/src/components/ui/card";

export function AutomationsApp() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Automations</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Automation rules, triggers, and actions. Full implementation coming soon.
        </p>
      </CardContent>
    </Card>
  );
}
