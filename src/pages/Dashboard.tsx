import React, { useState } from 'react';
import { TrendingDown, Leaf, Cloud, Download } from 'lucide-react';
import { ZoneOptimization } from '../components/dashboard/ZoneOptimization';
import { ProjectedOffset } from '../components/dashboard/ProjectedOffset';
import { NetZeroPathForecast } from '../components/dashboard/NetZeroForecast';

export function Dashboard() {
    const [stats, setStats] = useState({
        totalReduction: 0,
        baselineReduction: 0,
        totalEmissions: 0
    });
    const [zones, setZones] = useState<any[]>([]);
    const [forecastData, setForecastData] = useState<any[]>([]);
    const [mode, setMode] = useState<'aggressive' | 'standard'>('aggressive');
    const [mines, setMines] = useState<any[]>([]);
    const [selectedMine, setSelectedMine] = useState<string>('all');

    // Calculate next phase (Next Quarter)
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const nextQuarterMonth = currentMonth + 3;
    const nextQuarterYear = nextQuarterMonth > 11 ? currentYear + 1 : currentYear;
    const nextQuarter = Math.floor((nextQuarterMonth % 12) / 3) + 1;
    const nextPhaseStr = `Q${nextQuarter} ${nextQuarterYear}`;

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Analytics Summary
                const analyticsUrl = selectedMine === 'all'
                    ? 'http://localhost:3000/api/analytics/summary'
                    : `http://localhost:3000/api/analytics/summary?mine_id=${selectedMine}`;

                const analyticsRes = await fetch(analyticsUrl);
                const analyticsData = await analyticsRes.json();
                const totalEmissions = analyticsData.total_co2e || 0;

                // 2. Fetch Mines (for Zones)
                const minesRes = await fetch('http://localhost:3000/api/mines');
                const minesData = await minesRes.json();
                setMines(minesData);

                // Map mines to zones format
                // If a specific mine is selected, only show that mine in the zones list
                const filteredMines = selectedMine === 'all'
                    ? minesData
                    : minesData.filter((m: any) => m.id === selectedMine);

                const mappedZones = filteredMines.map((mine: any, index: number) => ({
                    id: mine.name,
                    code: mine.id.substring(0, 8).toUpperCase(),
                    efficiency: Math.floor(Math.random() * (98 - 85) + 85),
                    status: index % 3 === 0 ? 'maintenance' : 'active'
                }));
                setZones(mappedZones);
                // 3. Fetch Detailed Analytics for Monthly Trend
                const detailedUrl = selectedMine === 'all'
                    ? 'http://localhost:3000/api/analytics/detailed'
                    : `http://localhost:3000/api/analytics/detailed?mine_id=${selectedMine}`;

                const detailedRes = await fetch(detailedUrl);
                const detailedData = await detailedRes.json();

                // Determine target reduction based on Mode
                let targetReduction = mode === 'standard' ? 0.2 : 0.5;

                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthlyValues = detailedData.monthlyTrend || [];

                const data = [];
                let baselineMonthlyAvg = totalEmissions / 12;

                for (let i = 0; i < 12; i++) {
                    const monthIdx = (currentMonth + i) % 12;
                    const monthName = months[monthIdx];

                    // Find actual data for this month if exists
                    const actualPoint = monthlyValues.find((p: any) => p.name === monthName);
                    const reductionFactor = 1 - (targetReduction * (i / 12));

                    data.push({
                        month: monthName,
                        actual: actualPoint ? actualPoint.emissions : (baselineMonthlyAvg > 0 ? baselineMonthlyAvg : 0),
                        target: baselineMonthlyAvg * reductionFactor
                    });
                }
                setForecastData(data);

                setStats({
                    totalEmissions,
                    totalReduction: totalEmissions * targetReduction,
                    baselineReduction: Math.round(targetReduction * 100)
                });

            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
            }
        };

        fetchData();
    }, [mode, selectedMine]);

    return (
        <div>
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                <div>
                    <div className="flex items-center space-x-2 text-emerald-500 mb-1">
                        <Leaf className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Carbon Neutrality</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Industrial Planning V2.3</h1>
                </div>
                <div className="flex space-x-3 items-center">
                    <select
                        value={selectedMine}
                        onChange={(e) => setSelectedMine(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-300 text-sm font-bold rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none transition-all mr-2"
                    >
                        <option value="all">Enterprise View (Full Asset Map)</option>
                        {mines.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                    <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                        <button
                            onClick={() => setMode('aggressive')}
                            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${mode === 'aggressive' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Aggressive
                        </button>
                        <button
                            onClick={() => setMode('standard')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'standard' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Standard
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Left Column - Main Content (8 cols) */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    {/* KPI Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg shadow-slate-950/50 flex flex-col justify-between relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Cloud className="w-24 h-24 text-emerald-500" />
                            </div>
                            <div>
                                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Total Scope 1 & 2 Emissions</div>
                                <div className="flex items-end space-x-2">
                                    <span className="text-4xl font-bold text-emerald-400 font-mono tracking-tight">
                                        {stats.totalEmissions?.toLocaleString(undefined, { maximumFractionDigits: 1 }) || 0}
                                    </span>
                                    <span className="text-slate-500 font-medium mb-1">MT</span>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-emerald-500 text-sm font-medium">
                                <TrendingDown className="w-4 h-4 mr-2" />
                                <span>{stats.baselineReduction}% target reduction</span>
                            </div>
                        </div>

                        <ProjectedOffset
                            offset={stats.totalReduction}
                            nextPhase={nextPhaseStr}
                        />
                    </div>

                    {/* Main Chart */}
                    <NetZeroPathForecast data={forecastData} />
                </div>

                {/* Right Column - Sidebar Widgets (4 cols) */}
                <div className="col-span-12 lg:col-span-4 space-y-6">


                    <ZoneOptimization zones={zones} />



                    <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 text-center">
                        <button className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center">
                            Export Full Analysis
                            <Download className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
