import React from 'react';

const TableList = ({ title, tables, onSelect, onDelete }) => {
    if (!tables || tables.length === 0) return null;

    return (
        <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">{title}</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
                {tables.map(t => (
                    <div
                        key={t.id}
                        onClick={() => onSelect(t.id)}
                        className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-rose-50 cursor-pointer transition group"
                    >
                        <div className="text-left">
                            <div className="font-mono font-bold text-slate-700">{t.name || t.shortCode || t.id}</div>
                            <div className="text-xs text-slate-400">
                                {t.createdAt?.seconds ? new Date(t.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown date'}
                            </div>
                        </div>
                        {onDelete ? (
                            <button
                                onClick={(e) => onDelete(t.id, e)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-300 hover:bg-rose-100 hover:text-rose-600 transition"
                            >
                                <i className="fas fa-trash-alt text-xs"></i>
                            </button>
                        ) : (
                            <div className="text-slate-300 px-2">
                                <i className="fas fa-chevron-right text-xs"></i>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TableList;
