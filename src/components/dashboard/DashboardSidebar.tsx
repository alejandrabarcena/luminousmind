import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Target,
  Heart,
  Sparkles,
  BarChart3,
  Brain,
  Download,
  Shield,
  LayoutDashboard,
} from "lucide-react";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Proyectos Creativos", url: "/projects", icon: Target },
  { title: "Rituales de Bienestar", url: "/wellness", icon: Heart },
  { title: "Inspiración Diaria", url: "/inspiration", icon: Sparkles },
  { title: "Mi Progreso", url: "/stats", icon: BarChart3 },
  { title: "Evaluación TDA/TDAH", url: "/assessment", icon: Brain },
  { title: "Instalar App", url: "/install", icon: Download },
];

const adminItem = { title: "Administración", url: "/admin", icon: Shield };

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { isAdmin } = useUserRole();

  const isActive = (path: string) => pathname === path;

  const items = isAdmin ? [...navItems, adminItem] : navItems;

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <SidebarGroup defaultOpen>
          <SidebarGroupLabel className="font-poppins text-xs uppercase tracking-wide text-muted-foreground">
            Menú
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && (
                        <span className="font-raleway text-sm font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
