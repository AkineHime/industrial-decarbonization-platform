import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Activity, Factory } from 'lucide-react';
import { cn } from '../lib/utils';
import { useForm } from 'react-hook-form';

const INTERVENTIONS = [
    { id: 'solar_pv', name: '50MW Solar PV Farm', type: 'renewables', impact: 0.35, cost: '$$$' },
    { id: 'ev_fleet', name: 'Electric Dumpers & Excavators', type: 'transport', impact: 0.25, cost: '$$$$' },
    { id: 'methane_capture', name: 'VAM Capture System', type: 'process', impact: 0.15, cost: '$$' },
    { id: 'process_efficiency', name: 'Process Efficiency Upgrades', type: 'process', impact: 0.05, cost: '$' },
    { id: 'afforestation', name: 'Afforestation Phase 1', type: 'sinks', impact: 0.02, cost: '$' },
];

export function ScenarioPlanning() {
    const [scenarios, setScenarios] = useState<any[]>([]);
    const [selectedScenario, setSelectedScenario] = useState<any | null>(null);
    const [activeInterventions, setActiveInterventions] = useState<string[]>([]);
    const [baseEmissions, setBaseEmissions] = useState(0);
    const [mines, setMines] = useState<any[]>([]);

    const { register, handleSubmit, reset } = useForm({
        defaultValues: {
            name: '',
            description: '',
            target_year: '2030',
            mine_id: ''
        }
    });
    const [isCreating, setIsCreating] = useState(false);

    // Custom Interventions State
    const [customIntervention, setCustomIntervention] = useState('');
    const [customCost, setCustomCost] = useState('$$');
    const [localInterventions, setLocalInterventions] = useState(INTERVENTIONS);

    // Calculate total reduction factor from active interventions
    const currentInterventions = localInterventions;

    // Load initial data
    useEffect(() => {
        // Fetch scenarios
        fetch('http://localhost:3000/api/scenarios')
            .then(res => res.json())
            .then(data => setScenarios(data))
            .catch(err => console.error(err));

        // Fetch mines
        fetch('http://localhost:3000/api/mines')
            .then(res => res.json())
            .then(data => setMines(data))
            .catch(err => console.error(err));

        // Fetch base emissions (current total)
        fetch('http://localhost:3000/api/analytics/summary')
            .then(res => res.json())
            .then(data => setBaseEmissions(data.total_co2e || 10000)) // Fallback to 10k for visual if 0
            .catch(err => console.error(err));
    }, []);

    const handleAddCustomIntervention = () => {
        if (!customIntervention) return;
        const newId = `custom_${Date.now()}`;
        const newIntervention = {
            id: newId,
            name: customIntervention,
            type: 'custom',
            impact: 0.05, // Default small impact
            cost: customCost
        };
        setLocalInterventions([...localInterventions, newIntervention]);
        setCustomIntervention('');
        setCustomCost('$$'); // Reset to default
    };

    const handleDeleteScenario = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this scenario?')) return;

        try {
            await fetch(`http://localhost:3000/api/scenarios/${id}`, { method: 'DELETE' });
            setScenarios(scenarios.filter(s => s.id !== id));
            if (selectedScenario?.id === id) {
                setSelectedScenario(null);
                setActiveInterventions([]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleIntervention = (id: string) => {
        setActiveInterventions(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Calculate chart data based on selection
    const generateChartData = () => {
        const data = [];
        const startYear = new Date().getFullYear();
        let currentLevel = baseEmissions;

        // Calculate total reduction factor from active interventions
        const totalImpact = activeInterventions.reduce((acc, id) => {
            const intervention = currentInterventions.find(i => i.id === id); // Use currentInterventions
            return acc + (intervention?.impact || 0);
        }, 0);

        for (let i = 0; i <= 10; i++) { // 10 Year forecast
            const year = startYear + i;
            // Simple logic: interventions ramp up over 3 years then stabilize
            const rampUp = Math.min(i / 3, 1);
            const reduction = baseEmissions * totalImpact * rampUp;

            data.push({
                year,
                baseline: baseEmissions,
                scenario: Math.max(0, currentLevel - reduction),
                reduction: reduction
            });
        }
        return data;
    };

    const handleCreateScenario = async (data: any) => {
        // Map selected IDs to full objects for persistence
        const selectedObjects = activeInterventions.map(id =>
            localInterventions.find(i => i.id === id)
        ).filter(Boolean);

        const payload = {
            mine_id: data.mine_id || null,
            name: data.name,
            description: data.description,
            target_year: parseInt(data.target_year),
            interventions: selectedObjects // Save full objects
        };

        try {
            const res = await fetch('http://localhost:3000/api/scenarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const newScenario = await res.json();
                setScenarios([newScenario, ...scenarios]);
                setIsCreating(false);
                setSelectedScenario(newScenario);
                alert('Scenario saved successfully!');
            } else {
                const err = await res.json();
                alert('Failed to save scenario: ' + err.error);
            }
        } catch (err) {
            console.error(err);
            alert('Connection error. Please try again.');
        }
    };

    const handleUpdateScenario = async () => {
        if (!selectedScenario) return;

        const selectedObjects = activeInterventions.map(id =>
            localInterventions.find(i => i.id === id)
        ).filter(Boolean);

        const payload = {
            ...selectedScenario,
            interventions: selectedObjects
        };

        try {
            const res = await fetch(`http://localhost:3000/api/scenarios/${selectedScenario.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const updated = await res.json();
                setScenarios(scenarios.map(s => s.id === updated.id ? updated : s));
                setSelectedScenario(updated);
                alert('Scenario updated with selected interventions!');
            }
        } catch (err) {
            console.error(err);
            alert('Update failed.');
        }
    };

    const chartData = generateChartData();

    const formatValue = (value: number | undefined | any) => {
        if (!value) return '0';
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
        return value.toString();
    };

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100">Scenario Simulator</h1>
                    <p className="text-slate-500">Model decarbonization pathways and interventions</p>
                </div>
                <div className="flex gap-3">
                    {selectedScenario && (
                        <button
                            onClick={handleUpdateScenario}
                            className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/50 hover:bg-indigo-500 hover:text-white font-bold px-4 py-2 rounded-lg flex items-center transition-all"
                        >
                            <Activity className="w-5 h-5 mr-2" />
                            Update Scenario
                        </button>
                    )}
                    <button
                        onClick={() => { setIsCreating(true); setSelectedScenario(null); setActiveInterventions([]); reset(); }}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-lg flex items-center transition-colors"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        New Scenario
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Left Sidebar - Scenarios & Controls */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2">

                    {/* Scenario List */}
                    {!isCreating && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex-1">
                            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-4">Saved Scenarios</h3>
                            <div className="space-y-3">
                                {scenarios.map(s => (
                                    <div
                                        key={s.id}
                                        onClick={() => {
                                            setSelectedScenario(s);
                                            setIsCreating(false);

                                            // 1. Process interventions from DB (could be IDs or full objects)
                                            let ivs = Array.isArray(s.interventions)
                                                ? s.interventions
                                                : (typeof s.interventions === 'string' ? JSON.parse(s.interventions) : []);

                                            if (!ivs) ivs = [];

                                            // 2. Identify and restore any custom interventions stored in the scenario
                                            const scenarioInterventions = ivs.filter((i: any) => typeof i === 'object');
                                            const scenarioIds = ivs.map((i: any) => typeof i === 'object' ? i.id : i);

                                            // 3. Merged those back into our local list so UI can show them
                                            setLocalInterventions(prev => {
                                                const existingIds = prev.map(p => p.id);
                                                const newItems = scenarioInterventions.filter((i: any) => !existingIds.includes(i.id));
                                                return [...prev, ...newItems];
                                            });

                                            setActiveInterventions(scenarioIds || []);
                                        }}
                                        className={cn(
                                            "p-4 rounded-xl border cursor-pointer transition-all hover:bg-slate-800 relative group",
                                            selectedScenario?.id === s.id
                                                ? "bg-emerald-500/10 border-emerald-500/50"
                                                : "bg-slate-950/50 border-slate-800"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-slate-200">{s.name}</span>
                                            <button
                                                onClick={(e) => handleDeleteScenario(s.id, e)}
                                                className="text-slate-600 hover:text-red-500 transition-colors p-1"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">{s.target_year}</span>
                                            {s.mine_id && (
                                                <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-400 flex items-center">
                                                    <Factory className="w-2 h-2 mr-1" />
                                                    {mines.find(m => m.id === s.mine_id)?.name || 'Linked Unit'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 truncate">{s.description || 'No description'}</div>
                                    </div>
                                ))}
                                {scenarios.length === 0 && (
                                    <div className="text-center py-8 text-slate-600 italic text-sm">No scenarios found. Create one to start.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Creation Form */}
                    {isCreating && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex-1">
                            <h3 className="text-slate-100 font-bold mb-4">Define New Scenario</h3>
                            <form onSubmit={handleSubmit(handleCreateScenario)} className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase">Scenario Name</label>
                                    <input {...register('name', { required: true })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 mt-1 focus:border-emerald-500 outline-none" placeholder="e.g. Aggressive Solar Push" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase">Associate with Unit</label>
                                    <select {...register('mine_id', { required: true })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 mt-1 focus:border-emerald-500 outline-none">
                                        <option value="">Select a Unit...</option>
                                        {mines.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase">Target Year</label>
                                    <select {...register('target_year')} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 mt-1 focus:border-emerald-500 outline-none">
                                        <option value="2030">2030</option>
                                        <option value="2040">2040</option>
                                        <option value="2050">2050</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase">Description</label>
                                    <textarea {...register('description')} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 mt-1 focus:border-emerald-500 outline-none" rows={2} placeholder="Briefly describe the objective..." />
                                </div>

                                <div className="pt-4">
                                    <button type="submit" className="w-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/50 p-2 rounded-lg font-bold transition-colors">
                                        Save Scenario
                                    </button>
                                    <button type="button" onClick={() => setIsCreating(false)} className="w-full mt-2 text-slate-500 hover:text-slate-300 text-sm">Cancel</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Intervention Selector */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                        <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-4">Interventions</h3>

                        {/* Add New Intervention Input */}
                        <div className="flex mb-4 gap-2">
                            <input
                                value={customIntervention}
                                onChange={(e) => setCustomIntervention(e.target.value)}
                                placeholder="Add e.g., 'Tree Planting'"
                                className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 flex-1 focus:border-emerald-500 outline-none"
                            />
                            <select
                                value={customCost}
                                onChange={(e) => setCustomCost(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded px-2 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500"
                            >
                                <option value="$">$ Low</option>
                                <option value="$$">$$ Med</option>
                                <option value="$$$">$$$ High</option>
                            </select>
                            <button
                                onClick={handleAddCustomIntervention}
                                className="bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white px-3 rounded font-bold transition-colors"
                            >
                                +
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {currentInterventions.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => toggleIntervention(item.id)}
                                    className={cn(
                                        "flex items-center p-3 rounded-lg cursor-pointer border transition-all",
                                        activeInterventions.includes(item.id)
                                            ? "bg-emerald-900/20 border-emerald-500/30"
                                            : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                                    )}
                                >
                                    <div className={cn(
                                        "w-5 h-5 rounded flex items-center justify-center mr-3 border",
                                        activeInterventions.includes(item.id) ? "bg-emerald-500 border-emerald-500" : "border-slate-600"
                                    )}>
                                        {activeInterventions.includes(item.id) && <Activity className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-slate-200">{item.name}</div>
                                        <div className="text-xs text-slate-500 flex justify-between mt-1">
                                            <span>Est. Impact: -{Math.round(item.impact * 100)}%</span>
                                            <span>{item.cost}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Content - Visualization */}
                <div className="col-span-12 lg:col-span-8 flex flex-col space-y-6">
                    {/* Main Chart */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex-1 min-h-[400px] relative">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-100">Projected Emissions Trajectory</h3>
                            <div className="flex space-x-4 text-sm">
                                <div className="flex items-center"><span className="w-3 h-3 bg-slate-700 rounded-full mr-2"></span> Business As Usual</div>
                                <div className="flex items-center"><span className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></span> Scenario Path</div>
                            </div>
                        </div>

                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorScenario" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="year" stroke="#64748b" tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" tickLine={false} axisLine={false} tickFormatter={formatValue} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                        itemStyle={{ color: '#f8fafc' }}
                                        formatter={(value: any) => [formatValue(value), '']}
                                    />
                                    <Area type="monotone" dataKey="baseline" stroke="#475569" strokeWidth={2} fill="transparent" name="Baseline" dot={false} />
                                    <Area type="monotone" dataKey="scenario" stroke="#10b981" strokeWidth={3} fill="url(#colorScenario)" name="Scenario" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Target Reduction</div>
                            <div className="text-2xl font-bold text-emerald-400">
                                {Math.round((activeInterventions.reduce((acc, id) => {
                                    const intervention = currentInterventions.find(i => i.id === id);
                                    return acc + (intervention?.impact || 0);
                                }, 0)) * 100)}%
                            </div>
                            <div className="text-slate-600 text-xs mt-1">vs Baseline</div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">CAPEX Intensity</div>
                            {(() => {
                                const costScore = activeInterventions.reduce((acc, id) => {
                                    const i = currentInterventions.find(item => item.id === id);
                                    if (!i) return acc;
                                    return acc + (i.cost.length || 0); // '$' = 1, '$$' = 2
                                }, 0);

                                let label = 'Low';
                                let color = 'text-emerald-400';
                                if (costScore > 6) { label = 'High'; color = 'text-red-400'; }
                                else if (costScore > 3) { label = 'Medium'; color = 'text-amber-400'; }

                                return (
                                    <>
                                        <div className={`text-2xl font-bold ${color}`}>{label}</div>
                                        <div className="text-slate-600 text-xs mt-1">Score: {costScore}</div>
                                    </>
                                );
                            })()}
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Net Zero Year</div>
                            {(() => {
                                const impact = activeInterventions.reduce((acc, id) => {
                                    const i = currentInterventions.find(item => item.id === id);
                                    return acc + (i?.impact || 0);
                                }, 0);

                                const currentYear = new Date().getFullYear();
                                // Simple projection: 100% reduction = 2030, 0% = >2050
                                const projectedYear = impact > 0
                                    ? Math.round(currentYear + (1 - impact) * 25 + 5)
                                    : '2050+';

                                const yearDisplay = impact >= 1 ? currentYear + 1 : (impact <= 0 ? '> 2060' : projectedYear);

                                return (
                                    <>
                                        <div className="text-2xl font-bold text-blue-400">{yearDisplay}</div>
                                        <div className="text-slate-600 text-xs mt-1">Estimated</div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
