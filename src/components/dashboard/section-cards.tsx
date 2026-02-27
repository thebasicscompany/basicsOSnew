import { TrendingUp, Users, Building2, Handshake, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useContacts } from "@/hooks/use-contacts";
import { useCompanies } from "@/hooks/use-companies";
import { useDeals } from "@/hooks/use-deals";

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export function SectionCards() {
  const { data: contacts, isPending: contactsPending } = useContacts({
    pagination: { page: 1, perPage: 1 },
  });
  const { data: companies, isPending: companiesPending } = useCompanies({
    pagination: { page: 1, perPage: 1 },
  });
  const { data: deals, isPending: dealsPending } = useDeals({
    pagination: { page: 1, perPage: 200 },
  });

  const pipelineValue = deals?.data.reduce((sum, d) => sum + (d.amount ?? 0), 0) ?? 0;
  const openDeals = deals?.data.filter((d) => !d.closingDate).length ?? 0;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Contacts */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Contacts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {contactsPending ? "—" : (contacts?.total ?? 0).toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Users className="size-3" />
              Contacts
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            All contacts in CRM <Users className="size-4" />
          </div>
          <div className="text-muted-foreground">Across all companies</div>
        </CardFooter>
      </Card>

      {/* Companies */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Companies</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {companiesPending ? "—" : (companies?.total ?? 0).toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Building2 className="size-3" />
              Accounts
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Active accounts <Building2 className="size-4" />
          </div>
          <div className="text-muted-foreground">Organizations tracked</div>
        </CardFooter>
      </Card>

      {/* Deals */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Open Deals</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {dealsPending ? "—" : openDeals.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp className="size-3" />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Deals in pipeline <Handshake className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {dealsPending ? "—" : `${deals?.total ?? 0} total deals`}
          </div>
        </CardFooter>
      </Card>

      {/* Pipeline value */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pipeline Value</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {dealsPending ? "—" : formatCurrency(pipelineValue)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <DollarSign className="size-3" />
              Revenue
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total deal value <DollarSign className="size-4" />
          </div>
          <div className="text-muted-foreground">Across all open deals</div>
        </CardFooter>
      </Card>
    </div>
  );
}
