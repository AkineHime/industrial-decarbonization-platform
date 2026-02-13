import React, { useState, useEffect } from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart2, PieChart as PieIcon, Activity } from 'lucide-react';

export function Analytics() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetailedData = async () => {
            setLoading(true);
            try {
                const res = await fetch('http://localhost:3000/api/analytics/detailed');
                const result = await res.json();

                // If no data, provide a slightly better empty state or keep mock for demo
                if (!result.byActivity.length) {
                    setData({
                        byActivity: [
                            { name: 'No Data', value: 1, color: '#1e293b' }
                        ],
                        byScope: [
                            { name: 'No Data', value: 0, color: '#1e293b' }
                        ],
                        monthlyTrend: []
                    });
                } else {
                    setData(result);
                }
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetailedData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-emerald-500 font-medium animate-pulse">Loading Analytics...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-8">
                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
                    <BarChart2 className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-100">Deep Analytics</h1>
                    <p className="text-slate-500">Breakdown of emissions by source, scope, and time.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Breakdown */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-slate-100 font-bold flex items-center">
                            <PieIcon className="w-4 h-4 mr-2 text-indigo-400" />
                            Emissions by Source
                        </h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.byActivity}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.byActivity.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                                    itemStyle={{ color: '#f1f5f9' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Scope Breakdown */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-slate-100 font-bold flex items-center">
                            <Activity className="w-4 h-4 mr-2 text-emerald-400" />
                            Scope Analysis
                        </h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.byScope} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {data.byScope.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Monthly Trend */}
                <div className="col-span-1 lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-slate-100 font-bold">Monthly Emission Trend</h3>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            {data.monthlyTrend.length > 0 ? (
                                <AreaChart data={data.monthlyTrend}>
                                    <defs>
                                        <linearGradient id="colorEmissions" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" tickMargin={10} />
                                    <YAxis stroke="#64748b" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                                    />
                                    <Area type="monotone" dataKey="emissions" stroke="#6366f1" fillOpacity={1} fill="url(#colorEmissions)" />
                                </AreaChart>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-500 italic">
                                    Insufficient data to show trends.
                                </div>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
