import { Home, Truck, Users, Package, Calendar, Building2, MapPin, UserCircle, LogOut, FileUp } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Spedizioni",
    url: "/spedizioni",
    icon: Package,
  },
  {
    title: "Importa DDT",
    url: "/importa-ddt",
    icon: FileUp,
  },
  {
    title: "Pianificazione",
    url: "/pianificazione",
    icon: Calendar,
  },
  {
    title: "Giri",
    url: "/giri",
    icon: Truck,
  },
];

const anagraficheItems = [
  {
    title: "Committenti",
    url: "/committenti",
    icon: Building2,
  },
  {
    title: "Destinatari",
    url: "/destinatari",
    icon: MapPin,
  },
  {
    title: "Autisti",
    url: "/autisti",
    icon: UserCircle,
  },
  {
    title: "Mezzi",
    url: "/mezzi",
    icon: Truck,
  },
];

export function AppSidebar() {
  const [location, navigate] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    navigate("/login");
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center">
            <Truck className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">TMS Bergamo</h1>
            <p className="text-xs text-muted-foreground">Gestionale Trasporti</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principale</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <a href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2" />

        <SidebarGroup>
          <SidebarGroupLabel>Anagrafiche</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {anagraficheItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <a href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Esci
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
