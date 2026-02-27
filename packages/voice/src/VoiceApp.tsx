import { Card, CardContent, CardHeader, CardTitle } from "basics-os/src/components/ui/card";

export function VoiceApp() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Launch Voice Native</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Voice Native (Wispr) integration coming soon. This will enable voice commands and
          voice-to-CRM actions.
        </p>
      </CardContent>
    </Card>
  );
}
