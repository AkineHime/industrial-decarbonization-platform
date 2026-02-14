import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FileUploadProps {
    onDataLoaded: (data: Record<string, any[]>) => void;
}

export function FileUpload({ onDataLoaded }: FileUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const uploadedFile = acceptedFiles[0];
        if (uploadedFile) {
            setFile(uploadedFile);
            setError(null);
            parseExcel(uploadedFile);
        }
    }, [onDataLoaded]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv']
        },
        multiple: false
    });

    const parseExcel = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });

                const allSheets: Record<string, any[]> = {};
                workbook.SheetNames.forEach(sheetName => {
                    const sheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(sheet);
                    if (jsonData.length > 0) {
                        allSheets[sheetName] = jsonData;
                    }
                });

                console.log("Parsed Data:", allSheets);
                onDataLoaded(allSheets);
            } catch (err) {
                console.error("Error parsing file:", err);
                setError("Failed to parse file. Please ensure it follows the template format.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFile(null);
        setError(null);
        onDataLoaded({});
    };

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={cn(
                    "relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300",
                    isDragActive ? "border-emerald-500 bg-emerald-500/5 scale-[1.01]" : "border-slate-700 hover:border-slate-600 hover:bg-slate-900/50 bg-slate-900/30",
                    error && "border-red-500/50 bg-red-500/5"
                )}
            >
                <input {...getInputProps()} />

                {file ? (
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
                            <FileSpreadsheet className="w-8 h-8" />
                        </div>
                        <div className="text-left">
                            <div className="text-slate-200 font-bold text-sm tracking-tight">{file.name}</div>
                            <div className="text-slate-500 text-xs mt-0.5">{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                        <button
                            onClick={removeFile}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all ml-4"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="p-4 bg-slate-800 rounded-full mb-4 text-slate-400 group-hover:text-emerald-500 transition-colors">
                            <Upload className="w-6 h-6" />
                        </div>
                        <h3 className="text-slate-200 font-bold text-lg mb-2">Upload Emissions Data</h3>
                        <p className="text-slate-400 text-sm max-w-xs mx-auto mb-4">
                            Drag and drop your Excel/CSV file here, or click to browse.
                        </p>
                        <div className="flex space-x-2 text-xs text-slate-500 font-mono">
                            <span className="px-2 py-1 bg-slate-900 rounded border border-slate-800">.XLSX</span>
                            <span className="px-2 py-1 bg-slate-900 rounded border border-slate-800">.CSV</span>
                        </div>
                    </>
                )}

                {error && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center text-red-400 text-xs font-medium">
                        <AlertCircle className="w-3 h-3 mr-1.5" />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
