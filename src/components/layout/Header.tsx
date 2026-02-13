import React from 'react';
import { cn } from '../../lib/utils';
import { Bell, Search, UserCircle, ChevronDown } from 'lucide-react';

export function Header({ className }: { className?: string }) {
    return (
        <header className={cn(
            "h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40",
            className
        )}>
            {/* Left: Mine Selector & Breadcrumbs */}
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-emerald-500/50 transition-colors cursor-pointer group">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-sm font-medium text-slate-200 group-hover:text-emerald-400">Jharia Coal Block-IV</span>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                </div>

                <div className="h-6 w-px bg-slate-800 mx-2" />

                <div className="flex space-x-1">
                    {['Overview', 'Analysis', 'Planning'].map((tab, i) => (
                        <button
                            key={tab}
                            className={cn(
                                "px-3 py-1 text-sm font-medium rounded-md transition-colors",
                                i === 0 ? "bg-slate-800 text-slate-100" : "text-slate-400 hover:text-slate-200"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Right: Actions, Notifications, User */}
            <div className="flex items-center space-x-4">
                <div className="relative group">
                    <Search className="w-5 h-5 text-slate-400 group-hover:text-slate-200 transition-colors cursor-pointer" />
                </div>

                <div className="relative">
                    <Bell className="w-5 h-5 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
                </div>

                <div className="flex items-center space-x-3 pl-4 border-l border-slate-800">
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-medium text-slate-200">Rahul Sharma</div>
                        <div className="text-xs text-slate-500">Sustainability Lead</div>
                    </div>
                    <UserCircle className="w-9 h-9 text-slate-600 bg-slate-900 rounded-full p-1 border border-slate-800" />
                </div>
            </div>
        </header>
    );
}
