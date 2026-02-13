import React from 'react';
import { FileText, Download, CheckCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export function Reports() {

    const handleDownload = (type: 'pdf' | 'csv' | 'draft') => {
        if (type === 'pdf') {
            const doc = new jsPDF();
            doc.setFontSize(20);
            doc.text("Net-Zero Transition Plan", 20, 20);
            doc.setFontSize(12);
            doc.text("Executive Summary", 20, 30);
            doc.text("This document outlines the strategic roadmap for achieving net-zero emissions by 2050.", 20, 40);
            doc.text("Key Pillars:", 20, 50);
            doc.text("- Renewable Energy Adoption", 20, 60);
            doc.text("- Process Efficiency Improvements", 20, 70);
            doc.text("- Carbon Capture Utilization", 20, 80);
            doc.save("net_zero_transition_plan.pdf");
        } else if (type === 'csv') {
            const data = [
                { Validated: 'Yes', Mine: 'Korba', Scope: 'Scope 1', Emission: 1200, Unit: 'tCO2e' },
                { Validated: 'Yes', Mine: 'Jharia', Scope: 'Scope 2', Emission: 850, Unit: 'tCO2e' },
                { Validated: 'No', Mine: 'Singrauli', Scope: 'Scope 1', Emission: 1100, Unit: 'tCO2e' },
            ];
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Emissions");
            XLSX.writeFile(wb, "emissions_inventory_2024.xlsx");
        } else {
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text("SEBI BRSR Disclosure (Draft)", 20, 20);
            doc.setFontSize(12);
            doc.text("Section A: General Disclosures", 20, 30);
            doc.text("Section B: Management and Process Disclosures", 20, 40);
            doc.text("Section C: Principle-wise Performance Disclosure", 20, 50);
            doc.save("brsr_disclosure_draft.pdf");
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-100 mb-2">Strategy Reports</h1>
            <p className="text-slate-500 mb-8">Generate and download compliance and strategy documents.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Executive Summary */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-colors group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
                            <FileText className="w-6 h-6" />
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2 py-1 rounded">Ready</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-100 mb-2">Net-Zero Transition Plan</h3>
                    <p className="text-sm text-slate-400 mb-6">Comprehensive executive summary of the 2050 decarbonization roadmap, including financial implications and risk analysis.</p>

                    <button
                        onClick={() => handleDownload('pdf')}
                        className="w-full py-3 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 rounded-lg font-bold transition-all flex items-center justify-center"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                    </button>
                </div>

                {/* Technical Report */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-colors group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 group-hover:bg-blue-500 group-hover:text-slate-950 transition-all">
                            <FileText className="w-6 h-6" />
                        </div>
                        <span className="bg-blue-500/10 text-blue-400 text-xs font-bold px-2 py-1 rounded">Updated Today</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-100 mb-2">Emissions Inventory 2024</h3>
                    <p className="text-sm text-slate-400 mb-6">Detailed breakdown of Scope 1 & 2 emissions by source, activity, and location. compliant with GHG Protocol.</p>

                    <button
                        onClick={() => handleDownload('csv')}
                        className="w-full py-3 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 rounded-lg font-bold transition-all flex items-center justify-center"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download Excel
                    </button>
                </div>

                {/* Regulatory Filing */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/50 transition-colors group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <span className="bg-slate-800 text-slate-500 text-xs font-bold px-2 py-1 rounded">Draft</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-100 mb-2">SEBI BRSR Disclsoure</h3>
                    <p className="text-sm text-slate-400 mb-6">Business Responsibility and Sustainability Report format for FY2025-26 regulatory filing.</p>

                    <button
                        onClick={() => handleDownload('draft')}
                        className="w-full py-3 bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-300 rounded-lg font-bold transition-all flex items-center justify-center"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export Draft
                    </button>
                </div>
            </div>
        </div>
    );
}
