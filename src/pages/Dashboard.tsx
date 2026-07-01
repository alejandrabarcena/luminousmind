import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import {
  Target, Heart, Sparkles, LogOut, User, BarChart3, Download, Shield, Brain, Search, Command,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import logoImage from '@/assets/logo.png';


const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const searchItems = [
    { title: "Dashboard", link: "/dashboard", icon: Search },
    { title: "Proyectos Creativos", link: "/projects", icon: Target },
    { title: "Rituales de Bienestar", link: "/wellness", icon: Heart },
    { title: "Inspiración Diaria y Desafíos", link: "/inspiration", icon: Sparkles },
    { title: "Mi Progreso", link: "/stats", icon: BarChart3 },
    { title: "Evaluación TDA/TDAH", link: "/assessment", icon: Brain },
    { title: "Instalar App", link: "/install", icon: Download },
    ...(isAdmin ? [{ title: "Administración", link: "/admin", icon: Shield }] : []),
  ];

  const handleSelect = useCallback((link: string) => {
    setOpen(false);
    navigate(link);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!user) return null;

  const quickActions = [
    {
      icon: <Target className="h-6 w-6" />,
      title: "Proyectos Creativos",
      description: "Organiza tus ideas y proyectos",
      color: "bg-gradient-creative",
      available: true,
      link: "/projects"
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: "Rituales de Bienestar",
      description: "Tu rutina diaria de autocuidado",
      color: "bg-gradient-wellness",
      available: true,
      link: "/wellness"
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Inspiración Diaria y Desafíos",
      description: "Actividades creativas y contenido motivacional",
      color: "bg-gradient-calm",
      available: true,
      link: "/inspiration"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Mi Progreso",
      description: "Estadísticas y rachas",
      color: "bg-gradient-to-br from-purple-500 to-indigo-500",
      available: true,
      link: "/stats"
    },
    {
      icon: <Brain className="h-6 w-6" />,
      title: "Evaluación TDA/TDAH",
      description: "Cuestionario diario con gráficos",
      color: "bg-gradient-to-br from-pink-500 to-fuchsia-600",
      available: true,
      link: "/assessment"
    },
    {
      icon: <Download className="h-6 w-6" />,
      title: "Instalar App",
      description: "Añade Luminous a tu pantalla",
      color: "bg-gradient-to-br from-gray-700 to-gray-900",
      available: true,
      link: "/install"
    },
    ...(isAdmin ? [{
      icon: <Shield className="h-6 w-6" />,
      title: "Administración",
      description: "Gestión de usuarios y roles",
      color: "bg-gradient-to-br from-red-500 to-orange-500",
      available: true,
      link: "/admin"
    }] : [])
  ];


  return (
    <>
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-page">
        <DashboardSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-16 px-4 md:px-6 border-b border-border bg-card flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="-ml-1" />
              <Link to="/" className="flex items-center gap-2 md:hidden">
                <img src={logoImage} alt="Luminous Mind" className="h-8 w-8 object-contain" />
                <span className="text-lg font-bold font-poppins bg-gradient-primary bg-clip-text text-transparent">
                  Luminous Mind
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 md:h-10 md:w-auto md:px-3 justify-center gap-2 text-muted-foreground"
                onClick={() => setOpen(true)}
                aria-label="Buscar sección"
              >
                <Search className="h-4 w-4" />
                <span className="hidden md:inline text-sm">Buscar...</span>
                <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <Command className="h-3 w-3" />K
                </kbd>
              </Button>
              <Link
                to="/profile"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <User className="h-5 w-5" />
                <span className="font-medium hidden md:inline text-sm">{user.email}</span>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-5 w-5 mr-2" />
                <span className="hidden md:inline">Cerrar Sesión</span>
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-4 md:p-8 lg:p-12">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Welcome */}
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold font-poppins text-foreground">
                  ¡Hola! 👋
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground font-raleway">
                  Bienvenido a tu espacio de creatividad y bienestar
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.link}
                    className={!action.available ? 'pointer-events-none' : ''}
                  >
                    <Card
                      className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full ${
                        action.available ? 'cursor-pointer hover:-translate-y-1' : 'opacity-75'
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center text-white mb-3`}>
                          {action.icon}
                        </div>
                        <CardTitle className="text-lg font-poppins flex items-center justify-between">
                          {action.title}
                          {!action.available && (
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full font-normal">
                              Próximamente
                            </span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground font-raleway text-sm">
                          {action.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Placeholder Content */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8 md:p-12 text-center">
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-gradient-primary rounded-full mx-auto flex items-center justify-center">
                      <Sparkles className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold font-poppins text-foreground">
                      Tu viaje comienza aquí
                    </h3>
                    <p className="text-muted-foreground font-raleway max-w-md mx-auto">
                      Pronto podrás crear proyectos creativos, establecer rituales de bienestar
                      y recibir inspiración diaria personalizada.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>

    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar sección... (ej. TDA, Evaluación)" />
      <CommandList>
        <CommandEmpty>No se encontró ninguna sección.</CommandEmpty>
        <CommandGroup heading="Secciones del dashboard">
          {searchItems.map((item) => (
            <CommandItem
              key={item.title}
              onSelect={() => handleSelect(item.link)}
              className="cursor-pointer"
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default Dashboard;
