import { useState } from 'react';
import {
    User,
    Globe,
    Save,
    RefreshCw,
    Target,
    Zap
} from 'lucide-react';
import { cn } from '../lib/utils';

export function Settings() {
    const [activeTab, setActiveTab] = useState('profile');
    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            alert('Settings saved successfully!');
        }, 1200);
    };

    const TABS = [
        { id: 'profile', label: 'Organization', icon: User },
        { id: 'targets', label: 'Sustainability', icon: Target },
        { id: 'factors', label: 'Emission Factors', icon: Zap },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100 mb-2">Platform Settings</h1>
                    <p className="text-slate-500 text-sm">Configure organizational defaults and strategic sustainability targets.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all disabled:opacity-50"
                >
                    {saving ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                    Save Changes
                </button>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Sidebar Navigation */}
                <div className="col-span-12 lg:col-span-3 space-y-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all text-sm",
                                activeTab === tab.id
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "text-slate-500 hover:bg-slate-900/50 hover:text-slate-300 border border-transparent"
                            )}
                        >
                            <tab.icon className="w-5 h-5" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="col-span-12 lg:col-span-9 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
                    {activeTab === 'profile' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div>
                                <h3 className="text-xl font-bold text-slate-100 mb-6">Organization Profile</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company Name</label>
                                        <input
                                            type="text"
                                            defaultValue="Industrial Hub Alpha"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Default Region</label>
                                        <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:border-emerald-500/50 outline-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlPSIjOTQ2MzliOCIgc3Ryb2tlLXdpZHRoPSIyIj48cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik0xOSA5bC03IDctNy03Ii8+PC9zdmc+')] bg-no-repeat bg-[right_1rem_center] bg-[length:1rem] appearance-none transition-all">
                                            <option>South Asia (India)</option>
                                            <option>Oceania (Australia)</option>
                                            <option>Europe (EU)</option>
                                            <option>North America (USA)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'targets' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div>
                                <h3 className="text-xl font-bold text-slate-100 mb-6">Sustainability Targets</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                                        <div className="flex items-center space-x-3 mb-4 text-emerald-400">
                                            <Globe className="w-5 h-5" />
                                            <span className="font-bold">Net Zero Target Year</span>
                                        </div>
                                        <input
                                            type="number"
                                            defaultValue="2050"
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-3xl font-black text-white outline-none focus:border-emerald-500"
                                        />
                                        <p className="text-xs text-slate-500 mt-3 italic">Reporting baseline established in FY2024 Cycle.</p>
                                    </div>
                                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                                        <div className="flex items-center space-x-3 mb-4 text-indigo-400">
                                            <Target className="w-5 h-5" />
                                            <span className="font-bold">Aggressive Interim Target</span>
                                        </div>
                                        <div className="flex items-end space-x-4">
                                            <input
                                                type="number"
                                                defaultValue="45"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-3xl font-black text-white outline-none focus:border-indigo-500"
                                            />
                                            <span className="text-2xl font-bold text-slate-600 mb-3">%</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-3 italic">Target reduction by year 2035.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'factors' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div>
                                <h3 className="text-xl font-bold text-slate-100 mb-2">Emission Factor Overrides</h3>
                                <p className="text-slate-500 text-sm mb-6">Manage global emission factors used for automated calculations.</p>
                                <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-900 border-b border-slate-800">
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Activity Source</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Default Factor</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Override</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Unit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {[
                                                { name: 'Diesel Fuel', def: '2.68', custom: '2.68', unit: 'kg CO2e / L' },
                                                { name: 'Grid Electricity', def: '0.82', custom: '0.84', unit: 'kg CO2e / kWh' },
                                                { name: 'Explosives ANFO', def: '0.19', custom: '0.19', unit: 'kg CO2e / kg' },
                                                { name: 'Captive Coal', def: '0.95', custom: '1.02', unit: 'kg CO2e / kWh' },
                                            ].map((row, i) => (
                                                <tr key={i} className="hover:bg-slate-900/50 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-200">{row.name}</td>
                                                    <td className="px-6 py-4 text-sm font-mono text-slate-500">{row.def}</td>
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="text"
                                                            defaultValue={row.custom}
                                                            className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm font-mono text-emerald-400 outline-none focus:border-emerald-500"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-slate-500">{row.unit}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
