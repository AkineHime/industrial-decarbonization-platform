import React, { useState, useEffect } from 'react';
import { FileUpload } from '../components/data/FileUpload';
import { Table, AlertTriangle, CheckCircle, Save, Copy, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';

export function DataManagement() {
    const [data, setData] = useState<any[]>([]);
    const [validated, setValidated] = useState(false);
    const [mines, setMines] = useState<any[]>([]);
    const [copySuccess, setCopySuccess] = useState<string | null>(null);

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
    }, []);

    const handleDataLoaded = (uploadedData: any[]) => {
        setData(uploadedData);
        setValidated(false);
    };

    const validateData = () => {
        // Mock validation logic
        setTimeout(() => {
            setValidated(true);
        }, 1000);
    };

    const handleDownloadTemplate = () => {
        const firstMineId = mines.length > 0 ? mines[0].id : '00000000-0000-0000-0000-000000000000';
        const templateData = [
            {
                mine_id: firstMineId,
                activity_type: 'diesel_combustion',
                date: new Date().toISOString().split('T')[0],
                amount: 500,
                unit: 'L'
            },
            {
                mine_id: firstMineId,
                activity_type: 'grid_electricity',
                date: new Date().toISOString().split('T')[0],
                amount: 1000,
                unit: 'kWh'
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "emissions_data_template.xlsx");
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopySuccess(text);
        setTimeout(() => setCopySuccess(null), 2000);
    };

    const handleCommit = async () => {
        if (!data.length) return;

        try {
            const payload = {
                entries: data.map(row => ({
                    mine_id: row.mine_id,
                    activity_type: row.activity_type || 'diesel_combustion',
                    date: row.date || new Date().toISOString(),
                    amount: row.amount || 0,
                    unit: row.unit || 'L'
                }))
            };

            const res = await fetch('http://localhost:3000/api/emissions/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const result = await res.json();
                alert(`Successfully imported ${result.count} entries.`);
                setData([]);
                setValidated(false);
            } else {
                const err = await res.json();
                alert(`Import failed: ${err.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('Error connecting to server.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Data Management</h1>
                    <p className="text-slate-400 mt-1">Upload, validate, and manage emission data sources.</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={handleDownloadTemplate}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg border border-slate-700 transition-colors"
                    >
                        Download Template
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

                        <div className="mt-6 p-4 bg-slate-950/50 rounded-xl border border-slate-800/50 text-xs text-slate-500">
                            <p className="font-bold text-slate-400 mb-2">Import Requirements:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Maximum file size: 50MB</li>
                                <li>Supported formats: .xlsx, .csv</li>
                                <li><strong>mine_id</strong> must be a valid UUID</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Preview & Validation Section */}
                <div className="lg:col-span-2">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg min-h-[500px] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-slate-100 font-bold">Data Preview</h3>
                            {data.length > 0 && (
                                <div className="flex space-x-3">
                                    {!validated ? (
                                        <button
                                            onClick={validateData}
                                            className="px-4 py-2 bg-amber-600/10 text-amber-500 hover:bg-amber-600/20 border border-amber-600/20 rounded-lg text-sm font-bold flex items-center transition-all"
                                        >
                                            <AlertTriangle className="w-4 h-4 mr-2" />
                                            Validate Data
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

                        {data.length > 0 ? (
                            <div className="flex-1 overflow-auto border border-slate-800 rounded-xl">
                                <table className="w-full text-left text-sm text-slate-400">
                                    <thead className="bg-slate-950 text-slate-200 uppercase font-bold text-xs sticky top-0">
                                        <tr>
                                            {Object.keys(data[0]).map((key) => (
                                                <th key={key} className="px-6 py-3 border-b border-slate-800 whitespace-nowrap">
                                                    {key}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {data.slice(0, 10).map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                                                {Object.values(row).map((val: any, j) => (
                                                    <td key={j} className="px-6 py-3 whitespace-nowrap text-slate-300">
                                                        {val}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {data.length > 10 && (
                                    <div className="p-3 text-center text-xs text-slate-500 border-t border-slate-800 bg-slate-950/30">
                                        Showing first 10 rows of {data.length} entries
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                                <Table className="w-12 h-12 mb-4 opacity-20" />
                                <p>No data loaded. Upload a file to preview content.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
