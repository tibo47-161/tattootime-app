import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Home,
  Tag,
  Clock,
  Ban,
  Shield
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCalendarSubmenuOpen, setIsCalendarSubmenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const mainNavItems = [
    { to: '/', label: 'Dashboard', icon: <Home className="h-5 w-5" />, exact: true },
    { 
      label: 'Kalender', 
      icon: <Calendar className="h-5 w-5" />, 
      submenu: true,
      items: [
        { to: '/appointments', label: 'Termine', icon: <Calendar className="h-4 w-4" /> },
        { to: '/appointment-types', label: 'Terminarten', icon: <Tag className="h-4 w-4" /> },
        { to: '/working-hours', label: 'Arbeitszeiten', icon: <Clock className="h-4 w-4" /> },
        { to: '/blocked-times', label: 'Sperrzeiten', icon: <Ban className="h-4 w-4" /> },
      ]
    },
    { to: '/customers', label: 'Kunden', icon: <Users className="h-5 w-5" /> },
    { to: '/settings', label: 'Einstellungen', icon: <Settings className="h-5 w-5" /> },
    { to: '/admin-users', label: 'Benutzerverwaltung', icon: <Shield className="h-5 w-5" /> },
  ];

  const NavItems = () => (
    <>
      {mainNavItems.map((item, index) => 
        item.submenu ? (
          <Collapsible
            key={`submenu-${index}`}
            open={isCalendarSubmenuOpen}
            onOpenChange={setIsCalendarSubmenuOpen}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <button
                className={`flex items-center justify-between w-full px-4 py-2 mt-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200`}
              >
                <div className="flex items-center">
                  {item.icon}
                  <span className="mx-4">{item.label}</span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-4 w-4 transition-transform ${isCalendarSubmenuOpen ? 'transform rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4">
              {item.items.map((subItem) => (
                <NavLink
                  key={subItem.to}
                  to={subItem.to}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 mt-1 text-sm transition-colors duration-200 ${
                      isActive
                        ? 'bg-primary text-primary-foreground rounded-md'
                        : 'text-gray-600 hover:bg-gray-100 rounded-md'
                    }`
                  }
                >
                  {subItem.icon}
                  <span className="mx-4">{subItem.label}</span>
                </NavLink>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 mt-2 text-sm font-semibold transition-colors duration-200 ${
                isActive
                  ? 'bg-primary text-primary-foreground rounded-md'
                  : 'text-gray-600 hover:bg-gray-100 rounded-md'
              }`
            }
            end={item.exact}
          >
            {item.icon}
            <span className="mx-4">{item.label}</span>
          </NavLink>
        )
      )}
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-semibold text-gray-800">TattooTime</h1>
            </div>
            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                <NavItems />
              </nav>
            </div>
            <div className="px-3 mt-6">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </Button>
            </div>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="md:hidden">
          <div className="flex items-center justify-between bg-white px-4 py-2 border-b border-gray-200">
            <h1 className="text-lg font-semibold text-gray-800">TattooTime</h1>
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[240px]">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between py-2">
                    <h2 className="text-lg font-semibold">Menü</h2>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <nav className="flex-1 mt-4">
                    <NavItems />
                  </nav>
                  <div className="mt-auto py-4">
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Abmelden
                    </Button>
                    <div className="flex items-center mt-4 pt-4 border-t">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

