import { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export function Reports() {
    const [loadingCard, setLoadingCard] = useState<string | null>(null);

    const generateStaticPDF = async () => {
        try {
            // Fetch live data
            const summaryRes = await fetch('http://localhost:3000/api/analytics/summary');
            const summary = await summaryRes.json();

            const detailedRes = await fetch('http://localhost:3000/api/analytics/detailed');
            const detailed = await detailedRes.json();

            const scenariosRes = await fetch('http://localhost:3000/api/scenarios');
            const scenarios = await scenariosRes.json();

            const doc = new jsPDF();

            // --- HEADER ---
            doc.setFillColor(30, 41, 59); // Slate-900 like
            doc.rect(0, 0, 210, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text("Decarbonization Strategy Report", 15, 20);
            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 15, 30);

            doc.setTextColor(0, 0, 0);

            let y = 50;

            // --- EXECUTIVE SUMMARY ---
            doc.setFontSize(16);
            doc.setTextColor(16, 185, 129); // Emerald-500
            doc.text("1. Executive Summary", 15, y);
            y += 10;

            doc.setFontSize(11);
            doc.setTextColor(60, 60, 60);
            const summaryText = `This report outlines the current carbon footprint and strategic decarbonization roadmap for the organization. As of today, the total Scope 1 & 2 emissions stand at ${summary.total_co2e?.toLocaleString()} Metric Tons CO2e. The organization has ${scenarios.length} active planning scenarios aimed at reducing this baseline.`;
            const splitSummary = doc.splitTextToSize(summaryText, 180);
            doc.text(splitSummary, 15, y);
            y += splitSummary.length * 6 + 10;

            // --- METHODOLOGY ---
            doc.setFontSize(16);
            doc.setTextColor(16, 185, 129);
            doc.text("2. Methodology & Emission Factors", 15, y);
            y += 10;

            doc.setFontSize(11);
            doc.setTextColor(60, 60, 60);
            doc.text("Calculations are based on the following standard emission factors:", 15, y);
            y += 8;

            const factors = [
                "- Diesel Combustion: 2.68 kg CO2e / Liter",
                "- Grid Electricity: 0.82 kg CO2e / kWh (Regional Average)",
                "- Explosives (ANFO): 0.19 kg CO2e / kg",
                "- Coal Power (Captive): 0.95 kg CO2e / kWh"
            ];

            factors.forEach(f => {
                doc.text(f, 20, y);
                y += 6;
            });
            y += 6;

            // --- CURRENT EMISSION STATUS ---
            doc.setFontSize(16);
            doc.setTextColor(16, 185, 129);
            doc.text("3. Current Emission Status", 15, y);
            y += 10;

            if (detailed.byActivity && detailed.byActivity.length > 0) {
                doc.setFontSize(12);
                doc.setTextColor(0, 0, 0);
                doc.text("Top Emission Sources:", 15, y);
                y += 8;

                doc.setFontSize(11);
                doc.setTextColor(60, 60, 60);
                detailed.byActivity.forEach((item: any) => {
                    doc.text(`- ${item.name}: ${item.value.toLocaleString()} tCO2e`, 20, y);
                    y += 6;
                });
            } else {
                doc.setFontSize(11);
                doc.text("No detailed emission activity recorded yet.", 20, y);
                y += 6;
            }
            y += 10;

            // --- STRATEGIC RECOMMENDATIONS ---
            doc.setFontSize(16);
            doc.setTextColor(16, 185, 129);
            doc.text("4. Strategic Recommendations", 15, y);
            y += 10;

            doc.setFontSize(11);
            doc.setTextColor(60, 60, 60);

            const strategies = [
                "1. Fleet Electrification: Transition diesel-heavy haul trucks to battery electric vehicles (BEVs) to reduce high Scope 1 emissions from diesel combustion.",
                "2. Renewable Energy Integration: Install on-site solar capacity or procure renewable power agreements (PPA) to lower the grid electricity carbon intensity.",
                "3. Operational Efficiency: Implement route optimization for transport and blast optimization to reduce explosive usage intensity."
            ];

            strategies.forEach(s => {
                const splitS = doc.splitTextToSize(s, 180);
                doc.text(splitS, 15, y);
                y += splitS.length * 6 + 4;
            });

            doc.save("manual_decarbonization_report.pdf");

        } catch (err: any) {
            console.error(err);
            alert("Failed to generate report: " + err.message);
        }
    };

    const handleDownload = async (type: 'pdf' | 'csv' | 'draft') => {
        if (type === 'pdf') {
            setLoadingCard('pdf');
            await generateStaticPDF();
            setLoadingCard(null);

        } else if (type === 'csv') {
            setLoadingCard('csv');
            try {
                const res = await fetch('http://localhost:3000/api/emissions/export');
                const data = await res.json();

                if (!data || data.length === 0) {
                    alert('No data to export!');
                    setLoadingCard(null);
                    return;
                }

                const wb = XLSX.utils.book_new();

                // 1. Cover Sheet
                const uniqueMines = Array.from(new Set(data.map((d: any) => d.mine_name || 'Unknown'))).join(', ');
                const coverData = [
                    ["CARBON ACCOUNTING REPORT", ""],
                    ["", ""],
                    ["Report Metadata", "Details"],
                    ["Generated Date", new Date().toLocaleDateString()],
                    ["Reporting Period", `FY ${new Date().getFullYear()}`],
                    ["Compliance Standard", "GHG Protocol Corporate Standard"],
                    ["Boundary Approach", "Operational Control"],
                    ["Facilities Covered", uniqueMines],
                    ["", ""],
                    ["Statement", "This report contains a comprehensive inventory of Greenhouse Gas (GHG) emissions from operational activities."]
                ];
                const wsCover = XLSX.utils.aoa_to_sheet(coverData);
                XLSX.utils.book_append_sheet(wb, wsCover, "Cover");

                // 2. Summary Sheet
                const total = data.reduce((sum: number, d: any) => sum + Number(d.co2e_tons), 0);
                const s1 = data.filter((d: any) => d.scope === 'scope1').reduce((sum: number, d: any) => sum + Number(d.co2e_tons), 0);
                const s2 = data.filter((d: any) => d.scope === 'scope2').reduce((sum: number, d: any) => sum + Number(d.co2e_tons), 0);

                const summaryData = [
                    ["Metric", "Emissions (tCO2e)", "Contribution"],
                    ["Total Scope 1 & 2", total.toFixed(2), "100%"],
                    ["Scope 1 (Direct)", s1.toFixed(2), total ? ((s1 / total) * 100).toFixed(1) + '%' : '0%'],
                    ["Scope 2 (Indirect)", s2.toFixed(2), total ? ((s2 / total) * 100).toFixed(1) + '%' : '0%'],
                    ["Scope 3 (Value Chain)", "0.00", "0% (Not captured)"]
                ];
                const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
                XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

                // 3. Scope 1
                const scope1Data = data.filter((d: any) => d.scope === 'scope1');
                const wsS1 = XLSX.utils.json_to_sheet(scope1Data.length ? scope1Data : [{ Info: "No Scope 1 Data" }]);
                XLSX.utils.book_append_sheet(wb, wsS1, "Scope 1");

                // 4. Scope 2
                const scope2Data = data.filter((d: any) => d.scope === 'scope2');
                const wsS2 = XLSX.utils.json_to_sheet(scope2Data.length ? scope2Data : [{ Info: "No Scope 2 Data" }]);
                XLSX.utils.book_append_sheet(wb, wsS2, "Scope 2");

                // 5. Scope 3
                const wsS3 = XLSX.utils.json_to_sheet([{ Info: "Scope 3 screening not yet conducted." }]);
                XLSX.utils.book_append_sheet(wb, wsS3, "Scope 3");

                // 6. Activity Data
                const wsActivity = XLSX.utils.json_to_sheet(data);
                XLSX.utils.book_append_sheet(wb, wsActivity, "Activity Data");

                // 7. Factors
                const factorsData = [
                    ["Activity Source", "Emission Factor", "Unit", "Methodology / Reference"],
                    ["Diesel Combustion", "2.68", "kg CO2e / L", "IPCC 2006 Guidelines"],
                    ["Grid Electricity", "0.82", "kg CO2e / kWh", "CEA Grid Database (India) 2023"],
                    ["Explosives (ANFO)", "0.19", "kg CO2e / kg", "Technical Supplier Data / Industry Avg"],
                    ["Captive Coal Power", "0.95", "kg CO2e / kWh", "Plant Specific Heat Rate"],
                    ["Transport (Rail/Road)", "0.15", "kg CO2e / ton-km", "GLEC Framework"]
                ];
                const wsFactors = XLSX.utils.aoa_to_sheet(factorsData);
                XLSX.utils.book_append_sheet(wb, wsFactors, "Factors");

                XLSX.writeFile(wb, `carbon_inventory_report_${new Date().getFullYear()}.xlsx`);
            } catch (err: any) {
                console.error(err);
                alert('Export failed: ' + err.message);
            } finally {
                setLoadingCard(null);
            }

        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-100 mb-2">Strategy Reports</h1>
                <p className="text-slate-500">Generate and download compliance and strategy documents.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Manual Strategy Report */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-colors group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
                            <FileText className="w-6 h-6" />
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2 py-1 rounded">Official</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-100 mb-2">Comprehensive Strategy Report (PDF)</h3>
                    <p className="text-sm text-slate-400 mb-6">Full decarbonization roadmap including methodology, emission factor analysis, and strategic recommendations based on current operational data.</p>

                    <button
                        onClick={() => handleDownload('pdf')}
                        disabled={loadingCard === 'pdf'}
                        className="w-full py-3 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 rounded-lg font-bold transition-all flex items-center justify-center border border-slate-700 hover:border-transparent disabled:opacity-50 disabled:cursor-wait"
                    >
                        {loadingCard === 'pdf' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                        {loadingCard === 'pdf' ? 'Generating...' : 'Download Report'}
                    </button>
                </div>

                {/* Technical Report (Excel) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 transition-colors group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 group-hover:bg-blue-500 group-hover:text-slate-950 transition-all">
                            <FileText className="w-6 h-6" />
                        </div>
                        <span className="bg-blue-500/10 text-blue-400 text-xs font-bold px-2 py-1 rounded">Live Data</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-100 mb-2">Emissions Inventory {new Date().getFullYear()} (Excel)</h3>
                    <p className="text-sm text-slate-400 mb-6">Detailed breakdown of Scope 1 & 2 emissions by source, activity, and location. Compliant with GHG Protocol.</p>

                    <button
                        onClick={() => handleDownload('csv')}
                        disabled={loadingCard === 'csv'}
                        className="w-full py-3 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 rounded-lg font-bold transition-all flex items-center justify-center border border-slate-700 hover:border-transparent disabled:opacity-50 disabled:cursor-wait"
                    >
                        {loadingCard === 'csv' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                        {loadingCard === 'csv' ? 'Exporting...' : 'Download Excel'}
                    </button>
                </div>
            </div>
        </div>
    );
}
