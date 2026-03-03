import { Link, useLocation, useNavigate } from "react-router";
import { Plus } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import { useObjects } from "@/hooks/use-object-registry";
import { getObjectIcon } from "@/lib/object-icon-map";

export function ObjectRegistryNavSection() {
  const objects = useObjects();
  const navigate = useNavigate();

  if (objects.length === 0) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Records
      </SidebarGroupLabel>
      <SidebarGroupAction
        title="New record"
        onClick={() => {
          // Navigate to the first object with create param
          if (objects.length > 0) {
            navigate(`/objects/${objects[0].slug}?create=true`);
          }
        }}
      >
        <Plus className="size-4" />
      </SidebarGroupAction>
      <SidebarGroupContent>
        <SidebarMenu>
          {objects.map((obj) => (
            <ObjectNavItem
              key={obj.id}
              slug={obj.slug}
              label={obj.pluralName}
              iconSlug={obj.icon}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function ObjectNavItem({
  slug,
  label,
  iconSlug,
}: {
  slug: string;
  label: string;
  iconSlug: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const objectPath = `/objects/${slug}`;
  const isActive = location.pathname.startsWith(objectPath);
  const IconComponent = getObjectIcon(iconSlug);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
        <Link to={objectPath}>
          <HugeiconsIcon icon={IconComponent} className="size-4 shrink-0" />
          {label}
        </Link>
      </SidebarMenuButton>
      <SidebarMenuAction
        showOnHover
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          navigate(`${objectPath}?create=true`);
        }}
      >
        <Plus className="size-4" />
      </SidebarMenuAction>
    </SidebarMenuItem>
  );
}
