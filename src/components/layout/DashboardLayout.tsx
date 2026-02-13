import React from 'react';
import { Sidebar } from './Sidebar';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex">
            <Sidebar />
            {/* Content Area - Offset by sidebar width (w-20 = 5rem) */}
            <div className="flex-1 ml-20 transition-all duration-300">
                <main className="p-8 overflow-y-auto min-h-screen">
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
