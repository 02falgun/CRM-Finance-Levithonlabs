'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  FileSignature, 
  Receipt, 
  Wallet, 
  Percent, 
  ShieldAlert, 
  FileSpreadsheet, 
  UserCog, 
  Settings, 
  Menu, 
  X, 
  Bell, 
  Building2, 
  ChevronLeft, 
  ChevronRight,
  LogOut
} from 'lucide-react';
import { 
  isAuthenticated, 
  getSessionUser, 
  getSessionTenant, 
  clearSession, 
  hasPermission,
  UserSession,
  TenantContext
} from '../../lib/auth';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [tenant, setTenant] = useState<TenantContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    } else {
      setUser(getSessionUser());
      setTenant(getSessionTenant());
      setLoading(false);
    }
  }, [router]);

  const handleSignOut = () => {
    clearSession();
    router.push('/login');
  };

  const menuItems: SidebarItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', href: '/dashboard/customers', icon: Users },
    { name: 'Leads', href: '/dashboard/leads', icon: Target },
    { name: 'Quotations', href: '/dashboard/quotations', icon: FileSignature },
    { name: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
    { name: 'Payments', href: '/dashboard/payments', icon: Wallet },
    { name: 'Tax Config', href: '/dashboard/tax', icon: Percent },
    { name: 'eBilling Log', href: '/dashboard/ebilling', icon: ShieldAlert },
    { name: 'Reports', href: '/dashboard/reports', icon: FileSpreadsheet },
    { name: 'Users & Roles', href: '/dashboard/users', icon: UserCog },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const menuPermissions: Record<string, string> = {
    'Customers': 'lead:read',
    'Leads': 'lead:read',
    'Quotations': 'invoice:read',
    'Invoices': 'invoice:read',
    'Payments': 'invoice:read',
    'Tax Config': 'invoice:read',
    'eBilling Log': 'invoice:read',
    'Reports': 'report:read',
    'Users & Roles': 'user:read',
    'Settings': 'user:write',
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen bg-slate-950 items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-t-[#E86D1F] border-r-transparent border-slate-800 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading Session...</p>
        </div>
      </div>
    );
  }

  const filteredMenuItems = menuItems.filter(item => {
    if (item.name === 'Dashboard') return true;
    const reqPerm = menuPermissions[item.name];
    if (!reqPerm) return true;
    if (item.name === 'Customers') {
      return hasPermission('lead:read') || hasPermission('invoice:read');
    }
    return hasPermission(reqPerm);
  });

  const activeItem = menuItems.find(item => pathname === item.href);
  let isUnauthorized = false;
  if (activeItem && activeItem.name !== 'Dashboard') {
    const reqPerm = menuPermissions[activeItem.name];
    if (activeItem.name === 'Customers') {
      isUnauthorized = !hasPermission('lead:read') && !hasPermission('invoice:read');
    } else if (reqPerm) {
      isUnauthorized = !hasPermission(reqPerm);
    }
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const getInitials = (nameStr: string) => {
    return nameStr
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  if (isUnauthorized) {
    return (
      <div className="flex h-screen bg-[#F8F8F8] items-center justify-center text-[#111111] p-6 font-sans">
        <div className="text-center space-y-4 max-w-sm bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-black text-[#111111] uppercase">Access Denied</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your current role profile does not carry permissions required to view the <span className="font-bold">{activeItem?.name}</span> registry.
          </p>
          <button 
            onClick={() => router.push('/dashboard')} 
            className="w-full text-xs bg-[#111111] hover:bg-[#E86D1F] text-white py-2.5 rounded-xl font-bold transition-all shadow-md"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F8F8] overflow-hidden text-[#111111] antialiased font-sans">
      <aside 
        className={`hidden lg:flex flex-col bg-white border-r border-slate-200/80 transition-all duration-300 ease-in-out relative ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200/80">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#111111] flex items-center justify-center shrink-0">
              <span className="text-white font-extrabold text-sm tracking-widest">L</span>
            </div>
            {sidebarOpen && (
              <span className="font-extrabold text-sm tracking-tight text-[#111111] whitespace-nowrap animate-in fade-in duration-200">
                Levithon<span className="text-[#E86D1F]">Labs</span>
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-[#111111] text-white shadow-md shadow-slate-900/10' 
                    : 'text-slate-500 hover:text-[#E86D1F] hover:bg-slate-50'
                }`}
              >
                <item.icon className={`h-4.5 w-4.5 shrink-0 ${
                  isActive ? 'text-[#E86D1F]' : 'text-slate-400 group-hover:text-[#E86D1F]'
                }`} />
                {sidebarOpen && <span>{item.name}</span>}
                {isActive && sidebarOpen && (
                  <span className="absolute left-0 top-3 w-1 h-4 bg-[#E86D1F] rounded-r" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200/80 flex justify-between items-center">
          {sidebarOpen && (
            <button
              onClick={handleSignOut}
              className="text-[10px] text-rose-600 hover:text-rose-700 font-extrabold flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-all uppercase tracking-wide border border-transparent hover:border-rose-100"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          )}
          <button 
            onClick={toggleSidebar} 
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-[#111111] border border-slate-200/60 shadow-sm"
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/40 backdrop-blur-sm">
          <aside className="w-64 bg-white h-full flex flex-col border-r border-slate-200/80 animate-in slide-in-from-left duration-250">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#111111] flex items-center justify-center">
                  <span className="text-white font-extrabold text-sm">L</span>
                </div>
                <span className="font-extrabold text-sm text-[#111111]">
                  Levithon<span className="text-[#E86D1F]">Labs</span>
                </span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1 text-slate-400 hover:text-[#111111]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
              {filteredMenuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                      isActive 
                        ? 'bg-[#111111] text-white' 
                        : 'text-slate-500 hover:text-[#E86D1F] hover:bg-slate-50'
                    }`}
                  >
                    <item.icon className={`h-4.5 w-4.5 ${
                      isActive ? 'text-[#E86D1F]' : 'text-slate-400'
                    }`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-200/80">
              <button
                onClick={handleSignOut}
                className="w-full text-center text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center justify-center gap-1.5 py-2.5 rounded-lg hover:bg-rose-50 border border-slate-200/60 transition-all uppercase tracking-wide"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileOpen(true)} 
              className="lg:hidden p-1 text-slate-500 hover:text-[#111111]"
            >
              <Menu className="h-5.5 w-5.5" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Workspace</span>
              <span className="text-xs font-semibold text-slate-400">/</span>
              <span className="text-xs font-bold text-[#111111] capitalize">
                {pathname ? pathname.split('/').pop()?.replace('-', ' ') : 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden md:flex items-center gap-1.5 bg-[#F8F8F8] border border-slate-200/60 px-3 py-1.5 rounded-lg">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                {tenant?.subdomain || 'demo'}
              </span>
            </div>

            <button className="relative p-1.5 text-slate-400 hover:text-[#E86D1F] transition-all">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#E86D1F]" />
            </button>

            <div className="flex items-center gap-2.5 border-l border-slate-200/80 pl-5">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/60 flex items-center justify-center font-extrabold text-[#111111] text-xs">
                {user ? getInitials(user.name) : '??'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-[11px] font-bold text-[#111111]">{user?.name || 'Loading...'}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  {user?.roles?.[0]?.replace('_', ' ') || ''}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#F8F8F8] bg-linear-grid p-6 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
