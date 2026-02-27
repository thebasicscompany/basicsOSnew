import { Card, CardContent, CardHeader, CardTitle } from "basics-os/src/components/ui/card";

export function MCPViewerApp() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>View Custom MCP</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Custom MCP viewer coming soon. Connect to MCP servers and view tools and responses.
        </p>
      </CardContent>
    </Card>
  );
}
