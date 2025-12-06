import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2, Search, Database } from 'lucide-react';
import { WORD_BANK } from '../utils/wordBank';

interface WordBankModalProps {
    isOpen: boolean;
    onClose: () => void;
    customDictionary: Record<string, string>;
    onSave: (newDict: Record<string, string>) => void;
}

export const WordBankModal: React.FC<WordBankModalProps> = ({ isOpen, onClose, customDictionary, onSave }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [newSlang, setNewSlang] = useState('');
    const [newCorrect, setNewCorrect] = useState('');
    const [activeTab, setActiveTab] = useState<'custom' | 'search'>('custom');

    const handleAdd = () => {
        if (!newSlang || !newCorrect) return;
        const key = newSlang.toLowerCase().trim();
        const val = newCorrect.trim();

        const updated = { ...customDictionary, [key]: val };
        onSave(updated);
        setNewSlang('');
        setNewCorrect('');
    };

    const handleDelete = (key: string) => {
        const updated = { ...customDictionary };
        delete updated[key];
        onSave(updated);
    };

    const customEntries = useMemo(() => {
        return Object.entries(customDictionary).sort((a, b) => a[0].localeCompare(b[0]));
    }, [customDictionary]);

    const allEntries = useMemo(() => {
        if (!searchTerm) return [];
        const term = searchTerm.toLowerCase();

        // Combine custom and default for search
        const combined = { ...WORD_BANK, ...customDictionary };

        return Object.entries(combined)
            .filter(([key, val]) => key.includes(term) || val.toLowerCase().includes(term))
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(0, 50); // Limit results
    }, [searchTerm, customDictionary]);

    // Handle Escape key to close modal
    React.useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => {
                // Close if clicking backdrop (not modal content)
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="bg-[#262626] border border-[#383838] rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
                role="dialog"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#333] bg-[#222]">
                    <div>
                        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                            <span className="text-[#3399FF]"><Database size={20} /></span> Word Bank Manager
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">Add custom corrections or search the built-in dictionary.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white bg-[#333] hover:bg-[#444] rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[#333] bg-[#2a2a2a]">
                    <button
                        onClick={() => setActiveTab('custom')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'custom' ? 'border-[#3399FF] text-white bg-[#333]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        My Custom Entries ({Object.keys(customDictionary).length})
                    </button>
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'search' ? 'border-[#3399FF] text-white bg-[#333]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        Search Full Dictionary
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto min-h-[300px]">

                    {activeTab === 'custom' && (
                        <div className="space-y-6">
                            {/* Add New */}
                            <div className="bg-[#222] p-4 rounded border border-[#383838]">
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Add New Correction</h3>
                                <div className="flex flex-col md:flex-row gap-3">
                                    <input
                                        type="text"
                                        placeholder="Incorrect / Slang (e.g. 'wideo')"
                                        value={newSlang}
                                        onChange={(e) => setNewSlang(e.target.value)}
                                        className="flex-1 bg-[#1e1e1e] border border-[#444] rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#3399FF]"
                                    />
                                    <div className="text-gray-500 flex items-center justify-center">→</div>
                                    <input
                                        type="text"
                                        placeholder="Correct Form (e.g. 'Video')"
                                        value={newCorrect}
                                        onChange={(e) => setNewCorrect(e.target.value)}
                                        className="flex-1 bg-[#1e1e1e] border border-[#444] rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#3399FF]"
                                    />
                                    <button
                                        onClick={handleAdd}
                                        disabled={!newSlang || !newCorrect}
                                        className="bg-[#3399FF] hover:bg-[#2288EE] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Plus size={16} /> Add
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-2">
                                    * Custom entries override the default dictionary. Keys are case-insensitive.
                                </p>
                            </div>

                            {/* List */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Your Corrections</h3>
                                {customEntries.length === 0 ? (
                                    <div className="text-center text-gray-600 py-8 border border-dashed border-[#333] rounded">
                                        <Database size={32} className="mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No custom entries yet.</p>
                                    </div>
                                ) : (
                                    <div className="bg-[#1e1e1e] border border-[#333] rounded overflow-hidden">
                                        {customEntries.map(([key, val], idx) => (
                                            <div key={key} className={`flex items-center justify-between p-3 ${idx !== customEntries.length - 1 ? 'border-b border-[#333]' : ''} hover:bg-[#262626] transition-colors`}>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-red-300 font-mono text-sm">{key}</span>
                                                    <span className="text-gray-500">→</span>
                                                    <span className="text-green-300 font-mono text-sm">{val}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(key)}
                                                    className="text-gray-600 hover:text-red-400 transition-colors p-1"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'search' && (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-3 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search existing words (e.g. 'mumbai', 'bcoz')..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-[#1e1e1e] border border-[#444] rounded pl-10 pr-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-[#3399FF]"
                                    autoFocus
                                />
                            </div>

                            <div className="border border-[#333] rounded bg-[#1e1e1e] min-h-[200px] max-h-[300px] overflow-y-auto">
                                {!searchTerm ? (
                                    <div className="flex flex-col items-center justify-center h-48 text-gray-600">
                                        <Search size={24} className="mb-2 opacity-20" />
                                        <p className="text-xs">Type to search the dictionary</p>
                                    </div>
                                ) : allEntries.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-48 text-gray-600">
                                        <p className="text-sm">No matches found.</p>
                                        <button
                                            onClick={() => { setActiveTab('custom'); setNewSlang(searchTerm); setNewCorrect(''); }}
                                            className="mt-2 text-[#3399FF] text-xs hover:underline"
                                        >
                                            Add "{searchTerm}" as custom entry?
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        {allEntries.map(([key, val], idx) => {
                                            const isCustom = customDictionary.hasOwnProperty(key);
                                            return (
                                                <div key={key} className={`flex items-center justify-between p-3 border-b border-[#333] hover:bg-[#262626]`}>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-red-300 font-mono text-sm">{key}</span>
                                                        <span className="text-gray-500">→</span>
                                                        <span className="text-green-300 font-mono text-sm">{val}</span>
                                                    </div>
                                                    {isCustom && <span className="text-[10px] bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded border border-blue-900">Custom</span>}
                                                    {!isCustom && <span className="text-[10px] text-gray-600">Default</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#333] bg-[#222] flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-[#333] hover:bg-[#444] text-gray-200 px-6 py-2 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};