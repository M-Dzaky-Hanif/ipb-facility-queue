import React from 'react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Ya, Lanjutkan", cancelText = "Batal", confirmColor = "indigo" }) {
    if (!isOpen) return null;

    const colorClasses = {
        indigo: "bg-indigo-600 hover:bg-indigo-700",
        rose: "bg-rose-600 hover:bg-rose-700",
        amber: "bg-amber-600 hover:bg-amber-700",
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in print:hidden">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="text-lg font-extrabold text-slate-800 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button 
                        onClick={onCancel} 
                        className="px-4 py-2.5 text-sm text-slate-500 font-bold hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className={`px-4 py-2.5 text-sm text-white font-bold rounded-lg shadow-md transition cursor-pointer ${colorClasses[confirmColor] || colorClasses.indigo}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
