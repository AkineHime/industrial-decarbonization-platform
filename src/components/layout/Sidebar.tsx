import { useState, useEffect } from 'react';
import {
    LayoutGrid,
    BarChart2,
    Factory,
    Settings,
    Leaf,
    Link,
    Sun,
    Database,
    Calculator,
    Sliders
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
    { icon: LayoutGrid, label: 'Control Center', path: '/' },
    { icon: Factory, label: 'Units & Assets', path: '/units' },
    { icon: Calculator, label: 'Direct Inventory', path: '/calculator' },
    { icon: Link, label: 'Value Chain (Scope 3)', path: '/scope3' },
    { icon: Sun, label: 'Renewable Power', path: '/renewables' },
    { icon: Sliders, label: 'Scenario Lab', path: '/scenarios' },
    { icon: BarChart2, label: 'Deep Analytics', path: '/analytics' },
    { icon: Database, label: 'Data Management', path: '/data-management' },
];

export function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [activePath, setActivePath] = useState(location.pathname);

    useEffect(() => {
        setActivePath(location.pathname);
    }, [location.pathname]);

    return (
        <aside className="fixed left-0 top-0 h-screen w-20 bg-slate-950 border-r border-slate-800 flex flex-col items-center py-6 z-50">
            {/* Logo */}
            <div className="mb-10 w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <Leaf className="w-7 h-7 text-slate-950 fill-current" />
            </div>

            {/* Nav Items */}
            <nav className="flex-1 space-y-4 w-full px-3">
                {NAV_ITEMS.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={cn(
                            "w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 group relative mx-auto",
                            activePath === item.path
                                ? "bg-slate-800 text-emerald-400 shadow-lg shadow-slate-900/50"
                                : "text-slate-500 hover:bg-slate-900 hover:text-slate-300"
                        )}
                    >
                        <item.icon className="w-6 h-6" />

                        {/* Tooltip */}
                        <div className="absolute left-14 px-3 py-1.5 bg-slate-800 text-slate-200 text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-700 z-50">
                            {item.label}
                        </div>
                    </button>
                ))}
            </nav>

            {/* Bottom Actions */}
            <div className="mt-auto space-y-4 w-full px-3">
                <button
                    onClick={() => navigate('/settings')}
                    className={cn(
                        "w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 mx-auto group relative",
                        activePath === '/settings'
                            ? "bg-slate-800 text-emerald-400 shadow-lg shadow-slate-900/50"
                            : "text-slate-500 hover:bg-slate-900 hover:text-slate-300"
                    )}
                >
                    <Settings className="w-6 h-6" />
                    {/* Tooltip */}
                    <div className="absolute left-14 px-3 py-1.5 bg-slate-800 text-slate-200 text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-700 z-50">
                        Settings
                    </div>
                </button>
            </div>
        </aside>
    );
}
