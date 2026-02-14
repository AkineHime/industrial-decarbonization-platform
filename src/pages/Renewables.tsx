import { useState, useEffect } from 'react';
import { Sun, Zap, Plus, Activity } from 'lucide-react';
import { useForm } from 'react-hook-form';

export function Renewables() {
    const [assets, setAssets] = useState<any[]>([]);
    const [generation, setGeneration] = useState<any[]>([]);
    const [mines, setMines] = useState<any[]>([]);

    const { register, handleSubmit, reset } = useForm();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [assetsRes, minesRes, genRes] = await Promise.all([
                fetch('http://localhost:3000/api/renewables/assets'),
                fetch('http://localhost:3000/api/mines'),
                fetch('http://localhost:3000/api/renewables/generation')
            ]);
            setAssets(await assetsRes.json());
            setMines(await minesRes.json());
            setGeneration(await genRes.json());
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddAsset = async (data: any) => {
        try {
            const res = await fetch('http://localhost:3000/api/renewables/assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                reset();
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const totalCapacity = assets.reduce((acc, curr) => acc + parseFloat(curr.capacity_kw || 0), 0);
    const totalGen = generation.reduce((acc, curr) => acc + parseFloat(curr.generated_kwh || 0), 0);
    const totalConsumed = generation.reduce((acc, curr) => acc + parseFloat(curr.self_consumed_kwh || 0), 0);



    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl text-white shadow-lg shadow-amber-500/20">
                        <Sun className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-100 italic tracking-tight">Renewable Assets</h1>
                        <p className="text-slate-500">Monitoring energy autonomy and captive clean power generation.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Stats Row */}
                <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                        <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Installed Capacity</div>
                        <div className="text-3xl font-bold text-white mb-1">{(totalCapacity / 1000).toFixed(1)} <span className="text-lg font-normal text-slate-500">MW</span></div>
                        <div className="text-emerald-400 text-xs font-bold">Active Grid Substitution</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                        <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Total Generation</div>
                        <div className="text-3xl font-bold text-white mb-1">{(totalGen / 1000).toFixed(1)} <span className="text-lg font-normal text-slate-500">MWh</span></div>
                        <div className="text-slate-500 text-xs">Cumulative recorded output</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                        <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Self-Consumption</div>
                        <div className="text-3xl font-bold text-emerald-400 mb-1">{totalGen ? ((totalConsumed / totalGen) * 100).toFixed(0) : 0}%</div>
                        <div className="text-slate-500 text-xs font-bold">Energy used on-site</div>
                    </div>
                </div>

                {/* Left: Asset List & Add Asset */}
                <div className="col-span-12 lg:col-span-5 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                        <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center">
                            <Plus className="w-5 h-5 mr-3 text-amber-500" />
                            Register Clean Energy Asset
                        </h3>
                        <form onSubmit={handleSubmit(handleAddAsset)} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Asset Name</label>
                                <input type="text" {...register('name')} placeholder="e.g. Phase 1 Solar Farm" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:ring-2 focus:ring-amber-500 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Unit</label>
                                    <select {...register('mine_id')} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:ring-2 focus:ring-amber-500 outline-none">
                                        <option value="">Select Mine...</option>
                                        {mines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Type</label>
                                    <select {...register('type')} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:ring-2 focus:ring-amber-500 outline-none">
                                        <option value="Solar">Solar PV</option>
                                        <option value="Wind">Wind Turbine</option>
                                        <option value="Hydro">Captive Hydro</option>
                                        <option value="Biomass">Biomass</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Peak Capacity (kW)</label>
                                    <input type="number" step="0.01" {...register('capacity_kw')} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:ring-2 focus:ring-amber-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Battery Storage (kWh)</label>
                                    <input type="number" step="0.01" {...register('storage_capacity_kwh')} placeholder="0" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:ring-2 focus:ring-amber-500 outline-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Degradation Rate (%)</label>
                                    <input type="number" step="0.1" defaultValue={0.5} {...register('annual_degradation_rate')} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:ring-2 focus:ring-amber-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Detailed Tech Specs</label>
                                    <div className="flex space-x-2">
                                        <input type="number" step="0.1" placeholder="Eff. %" {...register('technical_details.efficiency')} className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-3 text-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-xs" />
                                        <input type="number" step="1" placeholder="Tilt °" {...register('technical_details.tilt')} className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-3 text-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-xs" />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-900/20 uppercase tracking-widest text-sm">
                                Deploy Asset
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right: Active Assets */}
                <div className="col-span-12 lg:col-span-7">
                    <div className="bg-slate-950/50 border border-slate-900 rounded-3xl p-8 h-full">
                        <h3 className="text-lg font-bold text-slate-100 flex items-center mb-8 italic">
                            <Activity className="w-5 h-5 mr-3 text-emerald-400" />
                            Operational Inventory
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {assets.map((asset, idx) => (
                                <div key={idx} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group">
                                    <div className="absolute -top-2 -right-2 opacity-5 scale-150 group-hover:scale-125 transition-transform duration-1000">
                                        {asset.type === 'Solar' ? <Sun className="w-16 h-16 text-amber-500" /> : <Zap className="w-16 h-16 text-blue-500" />}
                                    </div>
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="p-2 bg-slate-800 rounded-lg">
                                            {asset.type === 'Solar' ? <Sun className="w-4 h-4 text-amber-400" /> : <Zap className="w-4 h-4 text-blue-400" />}
                                        </div>
                                        <div className="font-bold text-slate-200">{asset.name}</div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Capacity</div>
                                            <div className="text-xl font-bold text-white">{asset.capacity_kw} <span className="text-xs font-normal text-slate-600">kWp</span></div>
                                        </div>
                                        <div className="text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded">HEALTHY</div>
                                    </div>
                                </div>
                            ))}
                            {assets.length === 0 && (
                                <div className="col-span-1 md:col-span-2 py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
                                    <Sun className="w-16 h-16 text-slate-800 mx-auto mb-4 opacity-10" />
                                    <h3 className="text-xl font-bold text-slate-500 mb-2">No Assets Registered</h3>
                                    <p className="text-slate-600 text-sm max-w-xs mx-auto italic">
                                        Use the form on the left to deploy your first clean energy asset.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
