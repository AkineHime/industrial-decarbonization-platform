import { useState, useEffect } from 'react';
import { FileUpload } from '../components/data/FileUpload';
import { Table, AlertTriangle, CheckCircle, Save, Copy, Info, Layers, Database } from 'lucide-react';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';

export function DataManagement() {
    const [data, setData] = useState<Record<string, any[]>>({});
    const [validated, setValidated] = useState(false);
    const [mines, setMines] = useState<any[]>([]);
    const [copySuccess, setCopySuccess] = useState<string | null>(null);
    const [activeSheet, setActiveSheet] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'upload' | 'explorer'>('upload');
    const [dbEntries, setDbEntries] = useState<any[]>([]);
    const [loadingDb, setLoadingDb] = useState(false);

    useEffect(() => {
        const fetchMines = async () => {
            try {
                const res = await fetch('http://localhost:3000/api/mines');
                const result = await res.json();
                setMines(result);
            } catch (error) {
                console.error('Failed to fetch mines:', error);
            }
        };
        fetchMines();
        fetchDbEntries();
    }, []);

    const fetchDbEntries = async () => {
        setLoadingDb(true);
        try {
            const res = await fetch('http://localhost:3000/api/emissions');
            const result = await res.json();
            setDbEntries(result);
        } catch (error) {
            console.error('Failed to fetch emissions:', error);
        } finally {
            setLoadingDb(false);
        }
    };

    const handleDataLoaded = (uploadedData: Record<string, any[]>) => {
        setData(uploadedData);
        setValidated(false);
        const sheets = Object.keys(uploadedData);
        if (sheets.length > 0) setActiveSheet(sheets[0]);
    };

    const validateData = () => {
        // Mock validation logic
        setTimeout(() => {
            setValidated(true);
        }, 1000);
    };

    const handleDownloadTemplate = () => {
        const wb = XLSX.utils.book_new();
        const firstMineId = mines.length > 0 ? mines[0].id : 'PASTE_MINE_ID_HERE';

        // 1. Scope 1 (Stationary)
        const s1Stationary = [
            {
                mine_id: firstMineId,
                activity_type: 'diesel_combustion',
                date: new Date().toISOString().split('T')[0],
                amount: 5000,
                unit: 'L'
            },
            {
                mine_id: firstMineId,
                activity_type: 'coal_power',
                date: new Date().toISOString().split('T')[0],
                amount: 100,
                unit: 'tons'
            }
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s1Stationary), "Scope1_Stationary");

        // 2. Scope 1 (Mobile/Explosives)
        const s1Mobile = [
            {
                mine_id: firstMineId,
                activity_type: 'transport_hilly',
                date: new Date().toISOString().split('T')[0],
                amount: 1500,
                unit: 'km'
            },
            {
                mine_id: firstMineId,
                activity_type: 'explosives_anfo',
                date: new Date().toISOString().split('T')[0],
                amount: 500,
                unit: 'kg'
            }
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s1Mobile), "Scope1_Mobile");

        // 3. Scope 2 (Energy)
        const s2Energy = [
            {
                mine_id: firstMineId,
                activity_type: 'grid_electricity',
                date: new Date().toISOString().split('T')[0],
                amount: 15000,
                unit: 'kWh'
            }
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s2Energy), "Scope2_Energy");

        // 4. Scope 3 (Value Chain)
        const s3Value = [
            {
                mine_id: firstMineId,
                category: 'Purchased Goods',
                sub_category: 'Steel',
                vendor_name: 'Vendor X',
                date: new Date().toISOString().split('T')[0],
                amount: 50000,
                unit: 'USD'
            }
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s3Value), "Scope3_ValueChain");

        XLSX.writeFile(wb, "Reboot_Emissions_Template_v4.xlsx");
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopySuccess(text);
        setTimeout(() => setCopySuccess(null), 2000);
    };

    const handleCommit = async () => {
        const sheets = Object.keys(data);
        if (sheets.length === 0) return;

        try {
            let processedCount = 0;
            const summary: string[] = [];

            for (const sheetName of sheets) {
                const sheetData = data[sheetName];
                if (!sheetData || sheetData.length === 0) continue;

                const name = sheetName.toLowerCase().trim();

                // Robust synonym-based column mapper
                const mapSynonyms = (row: any) => {
                    const mapped: any = {};
                    Object.entries(row).forEach(([key, val]) => {
                        const k = key.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

                        // Identities
                        if (['mineid', 'siteid', 'unitid', 'id'].includes(k)) mapped.mine_id = val;
                        else if (['name', 'minename', 'sitename', 'unitname', 'title'].includes(k)) mapped.name = val;

                        // Geography
                        else if (['location', 'city', 'district', 'area'].includes(k)) mapped.location = val;
                        else if (['state', 'province', 'region'].includes(k)) mapped.state = val;
                        else if (['gridregion', 'grid', 'powergrid'].includes(k)) mapped.grid_region = val;
                        else if (['climatezone', 'climate', 'weather'].includes(k)) mapped.climate_zone = val;

                        // Activity / Category
                        else if (['activitytype', 'type', 'category', 'activity', 'source', 'emissioncategory'].includes(k)) {
                            mapped.activity_type = val;
                            mapped.category = val;
                        }
                        else if (['date', 'time', 'period', 'recordedat', 'activitydate'].includes(k)) mapped.date = val;
                        else if (['amount', 'quantity', 'value', 'consumption', 'qty', 'emission'].includes(k)) {
                            mapped.amount = Math.abs(parseFloat(String(val)) || 0);
                        }
                        else if (['unit', 'units', 'uom', 'measurement'].includes(k)) mapped.unit = val;

                        // Supply Chain
                        else if (['vendorname', 'vendor', 'supplier', 'suppliername', 'company'].includes(k)) mapped.vendor_name = val;
                        else if (['subcategory', 'subcat', 'details'].includes(k)) mapped.sub_category = val;

                        // Capacity
                        else if (['annualcapacitytons', 'capacity', 'annualcapacity'].includes(k)) mapped.annual_capacity_tons = val;
                    });

                    // Auto-assign Mine ID if unique system-wide & not the units sheet
                    if (!mapped.mine_id && mines.length === 1 && !name.includes('unit')) {
                        mapped.mine_id = mines[0].id;
                    }

                    return mapped;
                };

                const mappedData = sheetData.map(mapSynonyms);

                // 1. Handle Scope 3
                if (name.includes('scope3') || name.includes('value')) {
                    const res = await fetch('http://localhost:3000/api/scope3/bulk', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ entries: mappedData })
                    });
                    if (!res.ok) throw new Error(`Failed to upload Scope 3`);
                    processedCount += sheetData.length;
                    summary.push(`${sheetName}: ${sheetData.length} scope 3 entries`);
                }

                // 2. Handle Scope 1 & 2 (General Emissions)
                else if (name.includes('scope1') || name.includes('scope2') || name.includes('mobile') || name.includes('stationary') || name.includes('energy') || name.includes('emission')) {
                    const formatted = mappedData.map(row => ({
                        mine_id: row.mine_id,
                        activity_type: row.activity_type || 'diesel_combustion',
                        date: row.date || new Date().toISOString(),
                        amount: row.amount || 0,
                        unit: row.unit || 'L'
                    }));

                    const res = await fetch('http://localhost:3000/api/emissions/bulk', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ entries: formatted })
                    });
                    if (!res.ok) throw new Error(`Failed to upload ${sheetName}`);
                    processedCount += sheetData.length;
                    summary.push(`${sheetName}: ${sheetData.length} emissions`);
                }
            }

            if (processedCount === 0) {
                alert("No recognizable sheets found. Please ensure your sheet names include keywords like 'Emissions', 'Units', or 'Scope3'.");
            } else {
                alert(`✅ Success!\nProcessed ${processedCount} entries:\n${summary.join('\n')}`);
                setData({});
                setValidated(false);
                setActiveSheet(null);
                fetchDbEntries(); // Refresh explorer after upload
            }
        } catch (error: any) {
            console.error(error);
            alert(`❌ Error: ${error.message}`);
        }
    };

    const hasData = Object.keys(data).length > 0;
    const currentSheetData = activeSheet ? data[activeSheet] : [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Data Management</h1>
                    <p className="text-slate-400 mt-1">Bulk upload and validation for 4-sheet emissions data.</p>
                </div>
                <div className="flex space-x-3">
                    <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800 mr-2">
                        <button
                            onClick={() => setViewMode('upload')}
                            className={cn(
                                "px-4 py-1.5 text-xs font-bold rounded-md transition-all",
                                viewMode === 'upload' ? "bg-slate-800 text-emerald-400" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            Upload Center
                        </button>
                        <button
                            onClick={() => setViewMode('explorer')}
                            className={cn(
                                "px-4 py-1.5 text-xs font-bold rounded-md transition-all",
                                viewMode === 'explorer' ? "bg-slate-800 text-emerald-400" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            Database Explorer
                        </button>
                    </div>
                    <button
                        onClick={handleDownloadTemplate}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg border border-slate-700 transition-colors flex items-center"
                    >
                        <Database className="w-4 h-4 mr-2" />
                        Download Template
                    </button>
                </div>
            </div>

            {viewMode === 'upload' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Reference IDs & Upload Section */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Reference Table */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                            <h3 className="text-slate-100 font-bold mb-4 flex items-center">
                                <Info className="w-5 h-5 mr-2 text-blue-400" />
                                Valid Mine IDs
                            </h3>
                            <p className="text-xs text-slate-500 mb-4">Use these IDs in your Excel/CSV file to link data to correct units.</p>
                            <div className="space-y-2 max-h-48 overflow-auto pr-2 custom-scrollbar">
                                {mines.map((mine) => (
                                    <div key={mine.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center group">
                                        <div className="overflow-hidden mr-2">
                                            <div className="text-slate-200 font-bold text-xs truncate">{mine.name}</div>
                                            <div className="text-slate-600 text-[10px] font-mono truncate">{mine.id}</div>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(mine.id)}
                                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-emerald-400 transition-all"
                                            title="Copy UUID"
                                        >
                                            {copySuccess === mine.id ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                            <h3 className="text-slate-100 font-bold mb-4 flex items-center">
                                <Table className="w-5 h-5 mr-2 text-emerald-500" />
                                Upload Source Data
                            </h3>
                            <FileUpload onDataLoaded={handleDataLoaded} />
                        </div>
                    </div>

                    {/* Preview & Validation Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg min-h-[600px] flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center space-x-2">
                                    <h3 className="text-slate-100 font-bold">Data Preview</h3>
                                    {hasData && (
                                        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full">{Object.keys(data).length} Sheets</span>
                                    )}
                                </div>

                                {hasData && (
                                    <div className="flex space-x-3">
                                        {!validated ? (
                                            <button
                                                onClick={validateData}
                                                className="px-4 py-2 bg-amber-600/10 text-amber-500 hover:bg-amber-600/20 border border-amber-600/20 rounded-lg text-sm font-bold flex items-center transition-all"
                                            >
                                                <AlertTriangle className="w-4 h-4 mr-2" />
                                                Validate All
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleCommit}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold flex items-center shadow-lg shadow-emerald-900/20 transition-all"
                                            >
                                                <Save className="w-4 h-4 mr-2" />
                                                Commit to Database
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {hasData ? (
                                <div className="flex flex-col h-full">
                                    {/* Sheet Tabs */}
                                    <div className="border-b border-slate-800 mb-0">
                                        <div className="flex space-x-1 overflow-x-auto custom-scrollbar px-2">
                                            {Object.keys(data).map(sheet => (
                                                <button
                                                    key={sheet}
                                                    onClick={() => setActiveSheet(sheet)}
                                                    className={cn(
                                                        "px-6 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 relative",
                                                        activeSheet === sheet
                                                            ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                                                            : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30"
                                                    )}
                                                >
                                                    {sheet}
                                                    <span className="ml-2 px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-400 opacity-70 group-hover:opacity-100">
                                                        {data[sheet].length}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Table */}
                                    <div className="flex-1 overflow-auto custom-scrollbar bg-slate-950/30">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-900/50 sticky top-0 backdrop-blur-sm z-10">
                                                <tr>
                                                    {currentSheetData.length > 0 && Object.keys(currentSheetData[0]).map((key) => (
                                                        <th key={key} className="px-6 py-4 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                                            {key.replace(/_/g, ' ')}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/50">
                                                {currentSheetData.slice(0, 50).map((row, i) => (
                                                    <tr key={i} className="hover:bg-slate-800/30 transition-colors group">
                                                        {Object.values(row).map((val: any, j) => (
                                                            <td key={j} className="px-6 py-3 whitespace-nowrap text-slate-400 group-hover:text-slate-200 text-xs font-medium">
                                                                {val}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {currentSheetData.length === 0 && (
                                            <div className="p-8 text-center text-slate-500 italic">Empty Sheet</div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                                    <Layers className="w-16 h-16 mb-4 opacity-20" />
                                    <h3 className="text-lg font-bold text-slate-400 mb-2">No Data Loaded</h3>
                                    <p className="text-sm max-w-sm text-center">
                                        Upload a multi-sheet Excel file to view, validate, and commit environmental data across 4 dimensions.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[600px]">
                    <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                        <div>
                            <h3 className="font-bold text-slate-100 flex items-center">
                                <Database className="w-5 h-5 mr-3 text-emerald-500" />
                                Emissions Ledger (Scope 1 & 2)
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-black">Historical Audit Trail</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-xs text-slate-400 font-bold px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
                                {dbEntries.length} Records Found
                            </div>
                            <button
                                onClick={fetchDbEntries}
                                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                                title="Refresh Data"
                            >
                                <Database className={cn("w-4 h-4", loadingDb && "animate-spin")} />
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-950/50">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Mine / Unit</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Activity</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Scope</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-800/50">Date</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Impact (tCO2e)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {dbEntries.map((entry, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="text-sm font-bold text-slate-200">{entry.mine_name}</div>
                                            <div className="text-[10px] text-slate-600 font-mono mt-0.5">{entry.mine_id.substring(0, 8)}...</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-medium text-slate-300 capitalize">{entry.activity_type.replace(/_/g, ' ')}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={cn(
                                                "px-2 py-0.5 text-[10px] font-bold rounded-md uppercase border",
                                                entry.scope === 'Scope 1' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                            )}>
                                                {entry.scope}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-xs text-slate-500 font-medium border-r border-slate-800/50">
                                            {new Date(entry.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="px-8 py-5 text-xs text-slate-400 font-mono">
                                            {parseFloat(entry.amount).toLocaleString()} {entry.unit}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="text-white font-black text-base">{parseFloat(entry.co2e_tons).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        </td>
                                    </tr>
                                ))}
                                {dbEntries.length === 0 && !loadingDb && (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <Database className="w-12 h-12 text-slate-800 mx-auto mb-4 opacity-20" />
                                            <p className="text-slate-500 font-medium italic">No emission records found in the industrial ledger.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
