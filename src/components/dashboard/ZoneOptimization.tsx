import React from 'react';
import { cn } from '../../lib/utils';
import { Settings, Zap, Truck, Factory } from 'lucide-react';

export function ZoneOptimization({ zones = [] }: { zones?: any[] }) {
    const [showAll, setShowAll] = React.useState(false);
    const displayedZones = showAll ? zones : zones.slice(0, 3);
    const hiddenCount = zones.length - displayedZones.length;

    if (zones.length === 0) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg shadow-slate-950/50 flex flex-col items-center justify-center h-full min-h-[300px]">
                <Settings className="w-12 h-12 text-slate-700 mb-4" />
                <h3 className="text-slate-400 font-bold mb-1">No Active Zones</h3>
                <p className="text-slate-600 text-xs text-center max-w-[200px]">Optimization scenarios will appear here once data is loaded.</p>
            </div>
        );
    }
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-full shadow-lg shadow-slate-950/50">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h3 className="text-slate-100 font-bold tracking-tight text-sm uppercase">Zone Optimization</h3>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20">
                    {zones.length} Active
                </span>
            </div>

            {/* List Header */}
            <div className="px-5 py-3 flex text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800/50 bg-slate-950/30">
                <div className="flex-1">Unit/ID</div>
                <div className="w-24 text-right">Efficiency</div>
                <div className="w-16 text-right">Status</div>
            </div>

            {/* List Items */}
            <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: showAll ? '400px' : 'auto' }}>
                {displayedZones.map((zone) => (
                    <div key={zone.id} className="px-5 py-4 border-b border-slate-800/50 flex items-center hover:bg-slate-800/30 transition-colors group">
                        <div className="flex-1">
                            <div className="text-slate-200 font-bold text-sm group-hover:text-emerald-400 transition-colors">{zone.id}</div>
                            <div className="text-slate-500 text-xs mt-0.5">ID: {zone.code}</div>
                        </div>
                        <div className="w-24 text-right">
                            <span className="text-slate-200 font-mono font-medium">{zone.efficiency}%</span>
                        </div>
                        <div className="w-16 flex justify-end">
                            <div className={cn(
                                "w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]",
                                zone.status === 'active' ? "bg-emerald-500 text-emerald-500" : "bg-amber-500 text-amber-500"
                            )} />
                        </div>
                    </div>
                ))}

                {/* View All Details */}
                {zones.length > 3 && (
                    <div className="p-4 text-center border-t border-slate-800 mt-auto bg-slate-900">
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="text-xs font-bold text-slate-500 hover:text-slate-300 uppercase tracking-wider transition-colors w-full py-1"
                        >
                            {showAll ? 'Collapse' : `View All ${zones.length} Units`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
