import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  Settings,
  Truck,
  Users,
  Wrench,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import axonLogo from "@/assets/axon-logo.png.asset.json";

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Empresas", url: "/empresas", icon: Building2 },
  { title: "Operadores", url: "/operadores", icon: Users },
  { title: "Máquinas", url: "/maquinas", icon: Truck },
  { title: "Checklists", url: "/checklists", icon: ClipboardCheck },
  { title: "Alertas", url: "/alertas", icon: Bell },
  { title: "OS", url: "/os", icon: Wrench },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (router) => router.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <img
            src={axonLogo.url}
            alt="Axon"
            className="size-9 shrink-0 rounded-md object-contain ring-1 ring-sidebar-border"
          />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">AxonCheck</p>
              <p className="truncate text-xs text-muted-foreground">Diário de Bordo</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const active = currentPath === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="size-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}