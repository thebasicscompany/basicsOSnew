import { Link, useLocation, useNavigate } from "react-router";
import { PlusIcon } from "@phosphor-icons/react";
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
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
      <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
        Objects
      </SidebarGroupLabel>
      <SidebarGroupAction
        title="New record"
        onClick={() => {
          if (objects.length > 0) {
            navigate(`/objects/${objects[0].slug}?create=true`);
          }
        }}
      >
        <PlusIcon className="size-4" />
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
  const objectPath = `/objects/${slug}`;
  const isActive = location.pathname.startsWith(objectPath);
  const IconComponent = getObjectIcon(iconSlug);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
        <Link to={objectPath}>
          <IconComponent className="size-4 shrink-0" />
          {label}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
