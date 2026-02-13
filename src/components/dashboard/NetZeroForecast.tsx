import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { cn } from '../../lib/utils';

export function NetZeroPathForecast({ data = [] }: { data?: any[] }) {
    if (data.length === 0) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg shadow-slate-950/50 flex items-center justify-center h-full min-h-[300px]">
                <div className="text-slate-500 text-sm">No forecast data available</div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg shadow-slate-950/50">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="text-slate-100 font-bold text-lg tracking-tight">NET-ZERO PATH</div>
                    <div className="text-slate-100 font-bold text-lg tracking-tight">FORECAST</div>
                </div>
                <div className="flex space-x-4 text-xs font-medium">
                    <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
                        <span className="text-slate-400">Actual</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-sky-600 mr-2"></div>
                        <span className="text-slate-400">Target</span>
                    </div>
                </div>
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            dy={10}
                        />
                        <YAxis hide />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                            itemStyle={{ color: '#f1f5f9' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="target"
                            stroke="#0284c7"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            fill="transparent"
                        />
                        <Area
                            type="monotone"
                            dataKey="actual"
                            stroke="#10b981"
                            strokeWidth={3}
                            fill="url(#colorActual)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
