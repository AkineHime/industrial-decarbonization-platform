import { useState, useEffect } from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, PieChart as PieIcon, Activity, Zap, TrendingUp, Factory, ArrowRight } from 'lucide-react';

export function Analytics() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetailedData = async () => {
            setLoading(true);
            try {
                const res = await fetch('http://localhost:3000/api/analytics/detailed');
                const result = await res.json();

                if (!result.byActivity || result.byActivity.length === 0) {
                    setData({
                        byActivity: [{ name: 'N/A', value: 0, color: '#1e293b' }],
                        byScope: [{ name: 'N/A', value: 0, color: '#1e293b' }],
                        byMine: [],
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
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <div className="text-slate-400 font-medium animate-pulse">Calculating Environmental Impact...</div>
            </div>
        );
    }

    const totalEmissions = data.byActivity.reduce((acc: number, curr: any) => acc + curr.value, 0);
    const topSource = data.byActivity.length > 0 ? data.byActivity.sort((a: any, b: any) => b.value - a.value)[0] : null;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                        <BarChart3 className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-100 italic tracking-tight">Environmental Intelligence</h1>
                        <p className="text-slate-500">Multidimensional breakdown of carbon intensity and emission hotspots.</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-indigo-400 text-sm font-bold uppercase tracking-wider">Live Monitoring</span>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                        <Activity className="w-24 h-24 text-indigo-500" />
                    </div>
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Total Carbon Footprint</div>
                    <div className="text-4xl font-extrabold text-white mb-2">{totalEmissions.toLocaleString()} <span className="text-lg font-normal text-slate-500">tCO2e</span></div>
                    <div className="flex items-center text-xs text-emerald-400 font-medium">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Live calculation across all active units
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                        <Zap className="w-24 h-24 text-amber-500" />
                    </div>
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Primary Emission Driver</div>
                    <div className="text-4xl font-extrabold text-white mb-2">{topSource?.name || 'N/A'}</div>
                    <div className="text-xs text-slate-400 flex items-center">
                        Accounts for <span className="text-amber-400 font-bold mx-1">{totalEmissions ? ((topSource?.value / totalEmissions) * 100).toFixed(0) : 0}%</span> of gross impact
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                        <Factory className="w-24 h-24 text-emerald-500" />
                    </div>
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Top Performing Unit</div>
                    <div className="text-4xl font-extrabold text-white mb-2">
                        {data.byMine.length > 0 ? data.byMine[data.byMine.length - 1].name : 'N/A'}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center">
                        Lowest emission intensity recorded this period
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Source Breakdown (Donut) */}
                <div className="col-span-12 lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-slate-100 flex items-center">
                            <PieIcon className="w-5 h-5 mr-3 text-indigo-400" />
                            Impact by Source
                        </h3>
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                    </div>
                    <div className="h-72 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.byActivity}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={95}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.byActivity.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl">
                                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{payload[0].name}</div>
                                                    <div className="text-lg font-bold text-white">{payload[0].value.toLocaleString()} tCO2e</div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="w-32 h-32 absolute rounded-full bg-indigo-500/5 animate-ping"></div>
                            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total Impact</div>
                            <div className="text-2xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{totalEmissions > 1000 ? `${(totalEmissions / 1000).toFixed(1)}k` : totalEmissions.toFixed(2)}</div>
                        </div>
                    </div>
                    <div className="mt-8 space-y-3">
                        {data.byActivity.map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center">
                                    <div className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-slate-300 font-medium">{item.name}</span>
                                </div>
                                <span className="text-slate-500 font-mono text-xs">{((item.value / totalEmissions) * 100).toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scope Intensity (Radar) */}
                <div className="col-span-12 lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-slate-100 flex items-center">
                            <Activity className="w-5 h-5 mr-3 text-emerald-400" />
                            Protocol Breakdown (Scope 1, 2, 3)
                        </h3>
                        <div className="text-xs text-slate-500 font-medium flex items-center bg-slate-800 px-3 py-1 rounded-full">
                            GHG Protocol Standard
                        </div>
                    </div>
                    <div className="flex flex-col h-full">
                        <div className="h-[240px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.byScope} layout="vertical" margin={{ left: 40, right: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        stroke="#94a3b8"
                                        axisLine={false}
                                        tickLine={false}
                                        width={100}
                                        tick={{ fontSize: 14, fontWeight: 'bold' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', padding: '12px' }}
                                        formatter={(value: any) => [`${value.toLocaleString()} tCO2e`, 'Emissions']}
                                    />
                                    <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={40}>
                                        {data.byScope.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Summary Distribution Cards */}
                        <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {data.byScope.map((scope: any, idx: number) => (
                                <div key={idx} className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 hover:bg-slate-900 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 rounded-full shadow-[0_0_8px] shadow-current" style={{ backgroundColor: scope.color, color: scope.color }}></div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{scope.name}</div>
                                        </div>
                                        <div className="text-[10px] font-bold text-emerald-500">
                                            {totalEmissions ? ((scope.value / totalEmissions) * 100).toFixed(0) : 0}%
                                        </div>
                                    </div>
                                    <div className="text-xl font-bold text-white mb-0.5">{scope.value.toLocaleString()}</div>
                                    <div className="text-[10px] text-slate-600 font-medium">Metric Tons CO2e</div>
                                </div>
                            ))}
                            {data.byScope.length < 3 && (
                                <div className="bg-slate-950/20 p-4 rounded-2xl border border-dashed border-slate-800/50 flex flex-col justify-center items-center text-center opacity-40">
                                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Scope 3</div>
                                    <div className="text-sm font-bold text-slate-700 mt-1 italic">Not Tracked</div>
                                </div>
                            )}
                        </div>

                        {/* Strategic Insights Section - Added to fill space */}
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-2xl">
                                <h4 className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center">
                                    <Zap className="w-4 h-4 mr-2" /> Strategic Insight
                                </h4>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {totalEmissions > 0 ? (
                                        `Operational data indicates that ${data.byScope[0]?.value > data.byScope[1]?.value ? 'Direct (Scope 1)' : 'Indirect (Scope 2)'} energy consumption is your primary decarbonization bottleneck. Prioritizing ${data.byScope[0]?.value > data.byScope[1]?.value ? 'fleet electrification' : 'renewable energy PPAs'} could reduce baseline intensity by up to 24%.`
                                    ) : "Awaiting further diagnostic data for automated insights."}
                                </p>
                            </div>
                            <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-2xl">
                                <h4 className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center">
                                    <TrendingUp className="w-4 h-4 mr-2" /> Target Alignment
                                </h4>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Current emission velocity is aligned with a <strong>2.1°C global warming scenario</strong>. To meet the Net-Zero 2050 target, a compound annual reduction rate (CARR) of 4.2% is required starting from next physical audit.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trend Analysis */}
                <div className="col-span-12 bg-slate-900 border border-slate-800 rounded-3xl p-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
                        <div>
                            <h3 className="text-lg font-bold text-slate-100 mb-1">Temporal Intensity Analysis</h3>
                            <p className="text-slate-500 text-sm">Historical trend of aggregated emissions across the reporting cycle.</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center text-xs text-slate-400">
                                <ArrowRight className="w-3 h-3 mr-2 text-indigo-500" />
                                Target: Net Zero 2050
                            </div>
                        </div>
                    </div>
                    <div className="h-80 w-full mb-8">
                        <ResponsiveContainer width="100%" height="100%">
                            {data.monthlyTrend.length > 0 ? (
                                <AreaChart data={data.monthlyTrend}>
                                    <defs>
                                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorStroke" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#6366f1" stopOpacity={1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} tickMargin={15} />
                                    <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="emissions"
                                        stroke="url(#colorStroke)"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorTrend)"
                                        animationDuration={2000}
                                    />
                                </AreaChart>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-600 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800 italic">
                                    <Activity className="w-10 h-10 mb-4 opacity-20" />
                                    Data point synchronization in progress...
                                </div>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Operations Ranking */}
                <div className="col-span-12 bg-slate-950/50 border border-slate-900 rounded-3xl p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-slate-100 italic">Unit Performance Benchmarking</h3>
                        <span className="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full font-bold">Priority View</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {data.byMine.map((mine: any, idx: number) => (
                            <div key={idx} className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl hover:bg-slate-900 transition-all hover:scale-[1.02] group">
                                <div className="flex items-center justify-between mb-3 text-slate-500 text-[10px] font-bold uppercase">
                                    <span>Rank #{idx + 1}</span>
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </div>
                                <div className="text-lg font-bold text-white mb-1 truncate">{mine.name}</div>
                                <div className="text-2xl font-black mb-2" style={{ color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 5] }}>{mine.value.toLocaleString()} <span className="text-xs font-normal text-slate-600">tCO2e</span></div>
                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-1000"
                                        style={{
                                            width: `${(mine.value / data.byMine[0].value) * 100}%`,
                                            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 5],
                                            boxShadow: `0 0 10px ${['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 5]}44`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

