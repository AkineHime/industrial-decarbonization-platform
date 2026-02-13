import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Calculator, Save, AlertCircle, Check, Fuel, Zap, Bomb } from 'lucide-react';
import { cn } from '../lib/utils';

export function EmissionsCalculator() {
    const { register, handleSubmit, watch, formState: { errors }, reset } = useForm();
    const [mines, setMines] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [calculatedEmission, setCalculatedEmission] = useState<number | null>(null);

    const activityType = watch('activity_type');
    const amount = watch('amount');

    // Fetch mines for dropdown
    useEffect(() => {
        fetch('http://localhost:3000/api/mines')
            .then(res => res.json())
            .then(data => setMines(data))
            .catch(err => console.error('Failed to fetch mines', err));
    }, []);

    // Real-time calculation estimation
    useEffect(() => {
        if (!amount) {
            setCalculatedEmission(null);
            return;
        }
        let factor = 0;
        switch (activityType) {
            case 'diesel_combustion': factor = 2.68; break; // kg CO2/L
            case 'grid_electricity': factor = 0.82; break; // kg CO2/kWh
            case 'explosives': factor = 0.19; break; // kg CO2/kg
            default: factor = 0;
        }
        setCalculatedEmission((parseFloat(amount) * factor) / 1000); // Result in Tons
    }, [activityType, amount]);

    const onSubmit = async (data: any) => {
        setSubmitting(true);
        try {
            const response = await fetch('http://localhost:3000/api/emissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: [], // Legacy compat if needed
                    ...data,
                    unit: activityType === 'diesel_combustion' ? 'L' : activityType === 'grid_electricity' ? 'kWh' : 'kg'
                }),
            });

            if (response.ok) {
                setSuccess(true);
                reset();
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 mb-8">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                    <Calculator className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-100">Emissions Calculator</h1>
                    <p className="text-slate-500">Calculate and record operational emissions</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                            {/* Mine Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Select Mine / Unit</label>
                                <select
                                    {...register('mine_id', { required: true })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                                >
                                    <option value="">-- Select --</option>
                                    {mines.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                                {errors.mine_id && <span className="text-red-500 text-xs">Required</span>}
                            </div>

                            {/* Activity Type */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Activity Source</label>
                                <div className="grid grid-cols-3 gap-4">
                                    <label className={cn(
                                        "cursor-pointer border border-slate-800 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-slate-800/50 transition-all",
                                        activityType === 'diesel_combustion' && "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                                    )}>
                                        <input type="radio" value="diesel_combustion" {...register('activity_type', { required: true })} className="hidden" />
                                        <Fuel className="w-6 h-6" />
                                        <span className="text-xs font-bold">Diesel</span>
                                    </label>
                                    <label className={cn(
                                        "cursor-pointer border border-slate-800 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-slate-800/50 transition-all",
                                        activityType === 'grid_electricity' && "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                                    )}>
                                        <input type="radio" value="grid_electricity" {...register('activity_type', { required: true })} className="hidden" />
                                        <Zap className="w-6 h-6" />
                                        <span className="text-xs font-bold">Electricity</span>
                                    </label>
                                    <label className={cn(
                                        "cursor-pointer border border-slate-800 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-slate-800/50 transition-all",
                                        activityType === 'explosives' && "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                                    )}>
                                        <input type="radio" value="explosives" {...register('activity_type', { required: true })} className="hidden" />
                                        <Bomb className="w-6 h-6" />
                                        <span className="text-xs font-bold">Explosives</span>
                                    </label>
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">
                                    Consumption Amount
                                    {activityType === 'diesel_combustion' && ' (Liters)'}
                                    {activityType === 'grid_electricity' && ' (kWh)'}
                                    {activityType === 'explosives' && ' (kg)'}
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('amount', { required: true, min: 0 })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors font-mono text-lg"
                                    placeholder="0.00"
                                />
                            </div>

                            {/* Date Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Date</label>
                                <input
                                    type="date"
                                    {...register('date', { required: true })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className={cn(
                                    "w-full font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed",
                                    submitting ? "bg-slate-800 text-slate-500" : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                                )}
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-slate-500 border-t-emerald-500 rounded-full animate-spin mr-2"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 mr-2" />
                                        Record Emission Entry
                                    </>
                                )}
                            </button>

                            {success && (
                                <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl flex items-center text-emerald-400">
                                    <Check className="w-5 h-5 mr-2" />
                                    <span>Entry saved successfully!</span>
                                </div>
                            )}
                        </form>
                    </div>
                </div>

                {/* Preview/Calc Section */}
                <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                        <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-4">Estimated Impact</h3>

                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="text-5xl font-bold text-slate-100 font-mono tracking-tighter">
                                {calculatedEmission !== null ? calculatedEmission.toFixed(4) : '0.000'}
                            </div>
                            <div className="text-slate-500 font-medium mt-2">Tons CO2e</div>
                        </div>

                        <div className="border-t border-slate-800 pt-4 mt-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Emission Factor</span>
                                <span className="text-slate-300 font-mono">
                                    {activityType === 'diesel_combustion' && '2.68 kg/L'}
                                    {activityType === 'grid_electricity' && '0.82 kg/kWh'}
                                    {activityType === 'explosives' && '0.19 kg/kg'}
                                    {!activityType && '-'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Scope</span>
                                <span className="text-slate-300 font-mono">
                                    {activityType === 'grid_electricity' ? 'Scope 2' : (activityType ? 'Scope 1' : '-')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                        <div className="flex items-start text-amber-500">
                            <AlertCircle className="w-5 h-5 mr-3 mt-0.5" />
                            <div className="text-sm leading-relaxed">
                                <span className="font-bold block mb-1">Standard Factors Used</span>
                                Using IPCC 2019 default factors for calculations. For custom mine-specific factors, please update the configuration settings.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
