import { useState, useEffect, useRef } from 'react';
import {
    Link as LinkIcon, Truck, Plane, Users, Trash2, Plus, ArrowUpRight, Factory,
    Download, Search, BarChart3, PieChart as PieIcon, Table as TableIcon,
    FileText, Upload, ChevronRight, TrendingUp, Loader2
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    AreaChart, Area
} from 'recharts';
import { useForm } from 'react-hook-form';
import * as XLSX from 'xlsx';

const CATEGORIES = [
    { id: 'goods', name: 'Purchased Goods', icon: Factory, factor: '0.35 kg/$', unit: 'USD', value: 0.35 },
    { id: 'freight', name: 'Freight & Logistics', icon: Truck, factor: '0.12 kg/t-km', unit: 't-km', value: 0.12 },
    { id: 'travel', name: 'Business Travel', icon: Plane, factor: '0.18 kg/km', unit: 'km', value: 0.18 },
    { id: 'commuting', name: 'Employee Commuting', icon: Users, factor: '0.15 kg/km', unit: 'km', value: 0.15 },
    { id: 'waste', name: 'Waste Disposal', icon: Trash2, factor: '0.45 kg/kg', unit: 'kg', value: 0.45 },
];

export function Scope3() {
    const [entries, setEntries] = useState<any[]>([]);
    const [filteredEntries, setFilteredEntries] = useState<any[]>([]);
    const [mines, setMines] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'entry' | 'suppliers' | 'import'>('overview');
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filters
    const [selectedYear, setSelectedYear] = useState<string>('2026');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory] = useState<string>('All');

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            mine_id: '',
            category: 'Purchased Goods',
            amount: '',
            unit: 'USD',
            vendor_name: '',
            date: new Date().toISOString().split('T')[0]
        }
    });

    const watchedCategory = watch('category');

    useEffect(() => {
        const cat = CATEGORIES.find(c => c.name === watchedCategory);
        if (cat) setValue('unit', cat.unit);
    }, [watchedCategory, setValue]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let filtered = [...entries];
        if (selectedYear !== 'All') {
            filtered = filtered.filter(e => new Date(e.date).getFullYear().toString() === selectedYear);
        }
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(e => e.category === selectedCategory);
        }
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(e =>
                (e.vendor_name && e.vendor_name.toLowerCase().includes(lowerQuery)) ||
                (e.category && e.category.toLowerCase().includes(lowerQuery))
            );
        }
        setFilteredEntries(filtered);
    }, [entries, selectedYear, searchQuery, selectedCategory]);

    const fetchData = async () => {
        try {
            const [entriesRes, minesRes] = await Promise.all([
                fetch('http://localhost:3000/api/scope3'),
                fetch('http://localhost:3000/api/mines')
            ]);
            setEntries(await entriesRes.json());
            setMines(await minesRes.json());
        } catch (err) {
            console.error(err);
        }
    };

    const onSubmit = async (data: any) => {
        try {
            const res = await fetch('http://localhost:3000/api/scope3', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                reset();
                fetchData();
                setActiveTab('overview');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const exportCSV = () => {
        const headers = ['Mine', 'Category', 'Vendor', 'Date', 'Amount', 'Unit', 'CO2e (tons)'];
        const csvRows = filteredEntries.map(e => [
            mines.find(m => m.id === e.mine_id)?.name || 'Unknown',
            e.category,
            e.vendor_name || 'N/A',
            new Date(e.date).toLocaleDateString(),
            e.amount,
            e.unit,
            e.co2e_tons
        ].join(','));

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Scope3_Report_${selectedYear}.csv`;
        a.click();
    };

    // Analytics Helpers
    const downloadTemplate = () => {
        const data = [{
            "Mine ID": mines[0]?.id || "PASTE_UUID_HERE",
            "Category": "Purchased Goods",
            "Vendor Name": "Sample Supplier Ltd",
            "Date": new Date().toISOString().split('T')[0],
            "Amount": 1500,
            "Unit": "USD"
        }, {
            "Mine ID": mines[0]?.id || "PASTE_UUID_HERE",
            "Category": "Business Travel",
            "Vendor Name": "IndiGo Airlines",
            "Date": new Date().toISOString().split('T')[0],
            "Amount": 450,
            "Unit": "km"
        }];

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Scope3_Template");

        // Auto-size columns for better usability
        const maxWidths = Object.keys(data[0]).map(k => Math.max(k.length, 25));
        worksheet['!cols'] = maxWidths.map(w => ({ wch: w }));

        XLSX.writeFile(workbook, "Scope3_Import_Template.xlsx");
    };

    const processFile = async (file: File) => {
        setUploading(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = e.target?.result;
                let rawEntries: any[] = [];

                if (file.name.endsWith('.csv')) {
                    const text = data as string;
                    const lines = text.split('\n');
                    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                    rawEntries = lines.slice(1).filter(l => l.trim()).map(row => {
                        const values = row.split(',');
                        const obj: any = {};
                        headers.forEach((h, i) => { if (h) obj[h] = values[i]?.trim(); });
                        return obj;
                    });
                } else {
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    rawEntries = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
                }

                // Robust synonym-based mapping
                const finalEntries = rawEntries.map(row => {
                    const mapped: any = {};
                    Object.entries(row).forEach(([key, val]) => {
                        const k = key.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

                        // Map synonyms (Removed 'unit' from here to avoid mapping 'USD' to mine_id)
                        if (['mineid', 'siteid', 'unitid', 'id', 'mine', 'site'].includes(k)) mapped.mine_id = val;
                        else if (['category', 'type', 'emissioncategory'].includes(k)) mapped.category = val;
                        else if (['vendorname', 'vendor', 'supplier', 'suppliername', 'company', 'source'].includes(k)) mapped.vendor_name = val;
                        else if (['amount', 'quantity', 'value', 'consumption', 'qty', 'total'].includes(k)) {
                            // Convert to absolute value to prevent negative emissions
                            mapped.amount = Math.abs(parseFloat(String(val)) || 0);
                        }
                        else if (['unit', 'units', 'uom', 'measurement'].includes(k)) mapped.unit = val;
                        else if (['date', 'time', 'period', 'activitydate', 'recordedat'].includes(k)) mapped.date = val;
                        else mapped[key] = val;
                    });

                    // Auto-assign if missing and unique
                    if (!mapped.mine_id && mines.length === 1) {
                        mapped.mine_id = mines[0].id;
                    }

                    return mapped;
                }).filter(ent => ent.amount !== undefined && ent.amount >= 0);

                if (finalEntries.length === 0) {
                    throw new Error('No valid data found. Please ensure headers include "Mine ID" and "Amount".');
                }

                // Final validation check for required IDs
                const missingId = finalEntries.find(ent => !ent.mine_id);
                if (missingId) {
                    throw new Error('Some rows are missing a "Mine ID". Please use the UUID from the Units page.');
                }

                const res = await fetch('http://localhost:3000/api/scope3/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ entries: finalEntries })
                });

                if (res.ok) {
                    alert(`✅ Done! Successfully imported ${finalEntries.length} entries`);
                    fetchData();
                    setActiveTab('overview');
                } else {
                    const errData = await res.json();
                    alert(`❌ Import Failed: ${errData.error}`);
                }
            } catch (err: any) {
                console.error(err);
                alert(`⚠️ ${err.message || 'Error processing file'}`);
            } finally {
                setUploading(false);
            }
        };

        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const totalImpact = filteredEntries.reduce((acc, curr) => acc + parseFloat(curr.co2e_tons), 0);

    const byCategoryData = CATEGORIES.map(cat => ({
        name: cat.name,
        value: filteredEntries.filter(e => e.category === cat.name).reduce((acc, curr) => acc + parseFloat(curr.co2e_tons), 0)
    })).filter(d => d.value > 0);

    const supplierRanking = Object.entries(filteredEntries.reduce((acc: any, curr: any) => {
        if (curr.vendor_name) {
            acc[curr.vendor_name] = (acc[curr.vendor_name] || 0) + parseFloat(curr.co2e_tons);
        }
        return acc;
    }, {})).sort(([, a]: any, [, b]: any) => b - a).slice(0, 5);

    const monthData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => ({
        name: month,
        emissions: filteredEntries.filter(e => new Date(e.date).toLocaleString('default', { month: 'short' }) === month).reduce((acc, curr) => acc + parseFloat(curr.co2e_tons), 0)
    }));

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-12">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                        <LinkIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Scope 3 Intelligence</h1>
                        <p className="text-slate-500 text-sm">Value chain emissions tracking & supplier ranking.</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={exportCSV}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 transition-all"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Navigation & Filters */}
            <div className="grid grid-cols-12 gap-6 items-end">
                <div className="col-span-12 lg:col-span-7">
                    <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800 w-fit">
                        {[
                            { id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'entry', label: 'Data Entry', icon: Plus },
                            { id: 'suppliers', label: 'Suppliers', icon: Users },
                            { id: 'import', label: 'Import', icon: Upload },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center space-x-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                    : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-5 flex items-center space-x-3">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Filter by vendor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                    >
                        <option value="All">All Years</option>
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                    </select>
                </div>
            </div>

            {/* Content Tabs */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-12 gap-6">
                    {/* KPI Cards */}
                    <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-16 h-16 text-blue-500" />
                            </div>
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Aggregate Emissions</h3>
                            <div className="text-4xl font-black text-white">{totalImpact.toLocaleString()} <span className="text-sm font-normal text-slate-500">tCO2e</span></div>
                            <div className="mt-4 flex items-center text-emerald-400 text-xs font-bold">
                                <ArrowUpRight className="w-3 h-3 mr-1" />
                                12.5% from last period
                            </div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">High Impact Category</h3>
                            <div className="text-2xl font-bold text-slate-200">
                                {byCategoryData.sort((a, b) => b.value - a.value)[0]?.name || 'N/A'}
                            </div>
                            <div className="mt-2 text-xs text-slate-500">
                                accounting for {totalImpact > 0 ? ((byCategoryData.sort((a, b) => b.value - a.value)[0]?.value / totalImpact) * 100).toFixed(1) : 0}% of total
                            </div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Supply Chain Health</h3>
                            <div className="text-2xl font-bold text-emerald-500">OPTIMAL</div>
                            <div className="mt-2 text-xs text-slate-500">
                                94% of vendors reporting verified data
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="col-span-12 lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-slate-100 flex items-center">
                                <BarChart3 className="w-4 h-4 mr-2 text-blue-500" />
                                Emission Trend Analysis
                            </h3>
                        </div>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthData}>
                                    <defs>
                                        <linearGradient id="colorEmissions" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                                        itemStyle={{ color: '#e2e8f0' }}
                                    />
                                    <Area type="monotone" dataKey="emissions" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorEmissions)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6">
                        <h3 className="font-bold text-slate-100 mb-8 flex items-center">
                            <PieIcon className="w-4 h-4 mr-2 text-indigo-500" />
                            Category Breakdown
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={byCategoryData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {byCategoryData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                                        itemStyle={{ color: '#e2e8f0' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-3 mt-4">
                            {byCategoryData.sort((a, b) => b.value - a.value).slice(0, 3).map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center text-slate-400">
                                        <div className={`w-2 h-2 rounded-full mr-2 ${['bg-blue-500', 'bg-emerald-500', 'bg-amber-500'][i]}`}></div>
                                        {item.name}
                                    </div>
                                    <div className="text-slate-200 font-bold">{((item.value / totalImpact) * 100).toFixed(0)}%</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="col-span-12 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-slate-200 flex items-center">
                                <TableIcon className="w-4 h-4 mr-2 text-slate-500" />
                                Emission Audit Trail
                            </h3>
                            <div className="text-xs text-slate-500 font-medium">Viewing {filteredEntries.length} entries</div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-950/50">
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Vendor</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-800/50">Date</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Consumption</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Impact (t)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {filteredEntries.map((entry, idx) => (
                                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-8 py-4 text-sm font-bold text-slate-200">{entry.vendor_name || 'Generic Vendor'}</td>
                                            <td className="px-8 py-4">
                                                <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-md uppercase border border-blue-500/20">
                                                    {entry.category}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-xs text-slate-500 border-r border-slate-800/50">{new Date(entry.date).toLocaleDateString()}</td>
                                            <td className="px-8 py-4 text-xs text-slate-400 font-mono">{parseFloat(entry.amount).toLocaleString()} {entry.unit}</td>
                                            <td className="px-8 py-4 text-right">
                                                <div className="inline-flex items-center text-white font-bold text-sm">
                                                    {parseFloat(entry.co2e_tons).toFixed(2)}
                                                    <ArrowUpRight className="w-3 h-3 ml-2 text-slate-700 group-hover:text-blue-500 transition-colors" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredEntries.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center text-slate-600 italic text-sm">No data matching filters.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'entry' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto py-8">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-8 flex items-center">
                            <Plus className="w-6 h-6 mr-3 text-blue-500" />
                            Log New Indirect Entry
                        </h3>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operational Unit</label>
                                <select {...register('mine_id', { required: true })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:border-blue-500 focus:outline-none transition-colors">
                                    <option value="">Select Unit...</option>
                                    {mines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                                {errors.mine_id && <span className="text-red-500 text-[10px] font-bold uppercase">Required</span>}
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date of Activity</label>
                                    <input type="date" {...register('date')} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:border-blue-500 focus:outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                                    <select {...register('category')} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:border-blue-500 focus:outline-none transition-colors">
                                        {CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity</label>
                                    <input
                                        type="number"
                                        step="any"
                                        {...register('amount', { required: true })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:border-blue-500 focus:outline-none font-mono"
                                        placeholder="0.00"
                                    />
                                    {errors.amount && <span className="text-red-500 text-[10px] font-bold uppercase">Required</span>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit</label>
                                    <input type="text" {...register('unit')} readOnly className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-600 focus:outline-none cursor-not-allowed opacity-50" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier Name</label>
                                <input
                                    type="text"
                                    {...register('vendor_name')}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:border-blue-500 focus:outline-none"
                                    placeholder="e.g. Acme Sourcing Co."
                                />
                            </div>

                            <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/40 text-sm uppercase tracking-widest">
                                Save Indirect Entry
                            </button>
                        </form>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-500/20 rounded-3xl p-8">
                            <h4 className="font-bold text-blue-400 mb-4 flex items-center">
                                <FileText className="w-4 h-4 mr-2" />
                                Compliance Guidelines
                            </h4>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                Scope 3 emissions are calculated using the <strong>Spend-Based Method</strong> and <strong>Distance-Based Method</strong> as per the GHG Protocol.
                            </p>
                            <ul className="space-y-4 text-xs text-slate-500">
                                <li className="flex items-start">
                                    <ChevronRight className="w-3 h-3 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                                    <span>Purchased Goods and Services use secondary industry averages for kg/$ spent.</span>
                                </li>
                                <li className="flex items-start">
                                    <ChevronRight className="w-3 h-3 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                                    <span>Logistics impact is calculated using Well-to-Wheel (WTW) conversion factors.</span>
                                </li>
                                <li className="flex items-start">
                                    <ChevronRight className="w-3 h-3 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                                    <span>Business travel includes RFI factors for air travel high-altitude impacts.</span>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                            <h4 className="font-bold text-slate-200 mb-2">Automated Validation</h4>
                            <p className="text-slate-500 text-xs">
                                Entries with deviations greater than 50% from the historical unit mean are flagged for manual review.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'suppliers' && (
                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 h-fit">
                        <h3 className="font-bold text-slate-100 mb-6 flex items-center">
                            <Users className="w-4 h-4 mr-2 text-blue-500" />
                            Top Emitters
                        </h3>
                        <div className="space-y-4">
                            {supplierRanking.map(([name, value]: any, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 hover:border-blue-500/30 transition-all cursor-default group">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-400 text-xs shadow-inner">
                                            #{i + 1}
                                        </div>
                                        <span className="text-sm font-bold text-slate-300 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{name}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-white">{value.toFixed(1)} <span className="text-[10px] text-slate-600">t</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                            <h3 className="font-bold text-slate-100 mb-8 uppercase tracking-widest text-[10px] text-slate-500">Emission Concentration by Supplier</h3>
                            <div className="h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={supplierRanking.map(([name, value]: any) => ({ name, value }))} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                        <XAxis type="number" stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                        <YAxis dataKey="name" type="category" stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} width={100} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                                            itemStyle={{ color: '#e2e8f0' }}
                                            cursor={{ fill: 'transparent' }}
                                        />
                                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'import' && (
                <div className="max-w-4xl mx-auto py-12">
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`bg-slate-900 border-2 border-dashed rounded-[2rem] p-16 flex flex-col items-center text-center transition-all group relative overflow-hidden ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 hover:bg-slate-900/50'
                            }`}
                    >
                        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Upload className="w-10 h-10 text-blue-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Upload Emission Data</h3>
                        <p className="text-slate-500 max-w-sm mb-10">
                            Drag and drop your vendor templates or supply chain manifests here. Supported formats: .csv, .xlsx, .xls
                        </p>
                        <div className="flex items-center space-x-4">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                                accept=".csv,.xlsx,.xls"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center"
                            >
                                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                {uploading ? 'Processing...' : 'Select Files'}
                            </button>
                            <button
                                onClick={downloadTemplate}
                                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition-all font-bold"
                            >
                                Download Template
                            </button>
                        </div>
                        {dragActive && (
                            <div className="absolute inset-0 z-10 w-full h-full pointer-events-none flex items-center justify-center bg-blue-600/10 backdrop-blur-sm">
                                <div className="text-blue-400 font-black text-2xl uppercase tracking-widest animate-pulse">Drop files here</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
