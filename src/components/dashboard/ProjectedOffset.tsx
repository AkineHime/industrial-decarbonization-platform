import React from 'react';
import { cn } from '../../lib/utils';
import { History } from 'lucide-react';

export function ProjectedOffset({ offset = 0, nextPhase }: { offset?: number, nextPhase?: string }) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg shadow-slate-950/50 flex flex-col justify-between">
            <div>
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Projected Offset</div>
                <div className="flex items-end space-x-2">
                    <span className="text-4xl font-bold text-slate-100 font-mono tracking-tight">{offset.toLocaleString()}</span>
                    <span className="text-slate-500 font-medium mb-1">MT</span>
                </div>
            </div>

            {nextPhase && (
                <div className="mt-4 flex items-center text-accent-blue text-sm font-medium">
                    <History className="w-4 h-4 mr-2" />
                    <span>Next phase: {nextPhase}</span>
                </div>
            )}
        </div>
    );
}
