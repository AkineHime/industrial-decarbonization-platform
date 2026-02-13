import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Factory, MapPin, Plus, Loader2, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function Units() {
    const [units, setUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

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

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                                <input
                                    {...register('location', { required: true })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                                    placeholder="City, State"
                                />
                            </div>
                            {errors.location && <span className="text-red-500 text-[10px] uppercase font-bold">Required</span>}
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
                                        <button className="text-slate-700 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h4 className="text-slate-100 font-bold mb-1">{unit.name}</h4>
                                    <p className="text-slate-500 text-xs flex items-center">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        {unit.location}
                                    </p>

                                    <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-end">
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Capacity</div>
                                            <div className="text-slate-300 font-mono">
                                                {unit.annual_capacity_tons?.toLocaleString()} <span className="text-slate-600">t/y</span>
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
