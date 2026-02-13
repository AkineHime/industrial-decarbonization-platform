import React from 'react';
import { Construction } from 'lucide-react';

export function ComingSoon() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-slate-800 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <Construction className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-bold text-slate-100 mb-2">Under Development</h1>
            <p className="text-slate-500 max-w-md">
                This module is currently being built. Check back soon for updates to the Industrial Planning platform.
            </p>
        </div>
    );
}
