import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Factory, MapPin, Plus, Loader2, Trash2 } from 'lucide-react';

export function Units() {
    const [units, setUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

    const fetchUnits = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3000/api/mines');
            const data = await res.json();
            setUnits(data);
        } catch (error) {
            console.error('Failed to fetch units:', error);
        } finally {
            setLoading(false);
        }
    };

    const STATE_MAP: any = {
        'Andhra Pradesh': { grid: 'Southern', climate: 'Tropical' },
        'Arunachal Pradesh': { grid: 'North-Eastern', climate: 'Montane' },
        'Assam': { grid: 'North-Eastern', climate: 'Warm & Humid' },
        'Bihar': { grid: 'Eastern', climate: 'Composite' },
        'Chhattisgarh': { grid: 'Western', climate: 'Tropical' },
        'Goa': { grid: 'Western', climate: 'Warm & Humid' },
        'Gujarat': { grid: 'Western', climate: 'Arid' },
        'Haryana': { grid: 'Northern', climate: 'Composite' },
        'Himachal Pradesh': { grid: 'Northern', climate: 'Montane' },
        'Jharkhand': { grid: 'Eastern', climate: 'Composite' },
        'Karnataka': { grid: 'Southern', climate: 'Tropical' },
        'Kerala': { grid: 'Southern', climate: 'Warm & Humid' },
        'Madhya Pradesh': { grid: 'Western', climate: 'Hot & Dry' },
        'Maharashtra': { grid: 'Western', climate: 'Warm & Humid' },
        'Manipur': { grid: 'North-Eastern', climate: 'Montane' },
        'Meghalaya': { grid: 'North-Eastern', climate: 'Montane' },
        'Mizoram': { grid: 'North-Eastern', climate: 'Montane' },
        'Nagaland': { grid: 'North-Eastern', climate: 'Montane' },
        'Odisha': { grid: 'Eastern', climate: 'Warm & Humid' },
        'Punjab': { grid: 'Northern', climate: 'Composite' },
        'Rajasthan': { grid: 'Northern', climate: 'Arid' },
        'Sikkim': { grid: 'Eastern', climate: 'Montane' },
        'Tamil Nadu': { grid: 'Southern', climate: 'Warm & Humid' },
        'Telangana': { grid: 'Southern', climate: 'Tropical' },
        'Tripura': { grid: 'North-Eastern', climate: 'Warm & Humid' },
        'Uttar Pradesh': { grid: 'Northern', climate: 'Composite' },
        'Uttarakhand': { grid: 'Northern', climate: 'Montane' },
        'West Bengal': { grid: 'Eastern', climate: 'Warm & Humid' },
        'Andaman & Nicobar': { grid: 'Eastern', climate: 'Warm & Humid' },
        'Chandigarh': { grid: 'Northern', climate: 'Composite' },
        'Dadra & Nagar Haveli': { grid: 'Western', climate: 'Warm & Humid' },
        'Delhi': { grid: 'Northern', climate: 'Composite' },
        'Jammu & Kashmir': { grid: 'Northern', climate: 'Montane' },
        'Ladakh': { grid: 'Northern', climate: 'Montane' },
        'Lakshadweep': { grid: 'Southern', climate: 'Warm & Humid' },
        'Puducherry': { grid: 'Southern', climate: 'Warm & Humid' }
    };

    const onStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const state = e.target.value;
        const geo = STATE_MAP[state];
        if (geo) {
            setValue('grid_region', geo.grid);
            setValue('climate_zone', geo.climate);
        }
    };

    useEffect(() => {
        fetchUnits();
    }, []);

    const onSubmit = async (data: any) => {
        setSubmitting(true);
        try {
            const res = await fetch('http://localhost:3000/api/mines', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                reset();
                fetchUnits();
            }
        } catch (error) {
            console.error('Failed to add unit:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Industrial Units</h1>
                    <p className="text-slate-400 mt-1">Manage mines, factories, and operational nodes.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Unit Form */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg h-fit">
                    <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center">
                        <Plus className="w-5 h-5 mr-2 text-emerald-500" />
                        Add New Unit
                    </h3>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Name</label>
                            <input
                                {...register('name', { required: true })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                                placeholder="e.g. Korba East Mine"
                            />
                            {errors.name && <span className="text-red-500 text-[10px] uppercase font-bold">Required</span>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">State</label>
                                <select
                                    {...register('state', {
                                        required: true,
                                        onChange: onStateChange
                                    })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                                >
                                    <option value="">Select State/UT</option>
                                    {Object.keys(STATE_MAP).sort().map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grid Region</label>
                                <select
                                    {...register('grid_region', { required: true })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                                >
                                    <option value="Northern">Northern</option>
                                    <option value="Southern">Southern</option>
                                    <option value="Eastern">Eastern</option>
                                    <option value="Western">Western</option>
                                    <option value="North-Eastern">North-Eastern</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Climate Zone</label>
                            <select
                                {...register('climate_zone', { required: true })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                            >
                                <option value="Tropical">Tropical</option>
                                <option value="Hot & Dry">Hot & Dry</option>
                                <option value="Arid">Arid</option>
                                <option value="Warm & Humid">Warm & Humid</option>
                                <option value="Composite">Composite</option>
                                <option value="Montane">Montane</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Annual Capacity (Tons)</label>
                            <input
                                type="number"
                                {...register('annual_capacity_tons')}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                                placeholder="0"
                            />
                        </div>

                        <button
                            disabled={submitting}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center disabled:opacity-50"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Unit'}
                        </button>
                    </form>
                </div>

                {/* Units List */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-20 text-emerald-500 animate-pulse font-medium">
                            Scanning Network...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {units.map((unit) => (
                                <div key={unit.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2.5 bg-slate-800 rounded-xl text-emerald-500">
                                            <Factory className="w-6 h-6" />
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (confirm('Are you sure you want to delete this unit?')) {
                                                    try {
                                                        const res = await fetch(`http://localhost:3000/api/mines/${unit.id}`, { method: 'DELETE' });
                                                        if (res.ok) {
                                                            fetchUnits();
                                                        } else {
                                                            alert('Failed to delete unit');
                                                        }
                                                    } catch (e) { console.error(e); }
                                                }
                                            }}
                                            className="text-slate-700 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h4 className="text-slate-100 font-bold mb-1">{unit.name}</h4>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-bold rounded border border-slate-700">
                                            {unit.state}
                                        </span>
                                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded border border-blue-500/20">
                                            {unit.grid_region} Grid
                                        </span>
                                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded border border-amber-500/20">
                                            {unit.climate_zone}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 text-xs flex items-center">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        {unit.location}, {unit.state}
                                    </p>

                                    <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-end">
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Capacity</div>
                                            <div className="text-slate-300 font-mono">
                                                {unit.annual_capacity_tons?.toLocaleString() || '0'} <span className="text-slate-600">t/y</span>
                                            </div>
                                        </div>
                                        <div className="pb-1">
                                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-full border border-emerald-500/20">
                                                ACTIVE
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
