import React, { useState } from 'react';
import { X, FileText, Wand2, Download, Keyboard, AlertTriangle, Shield, Globe, Database, Zap, Laptop } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'desktop'>('guide');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#262626] border border-[#383838] rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333] bg-[#222]">
          <div>
            <h2 id="modal-title" className="text-xl font-bold text-gray-100 flex items-center gap-2">
              <span className="text-[#3399FF]">Script</span>Aligner Guide
            </h2>
            <p className="text-xs text-gray-500 mt-1">Features, Workflow & Installation</p>
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
                onClick={() => setActiveTab('guide')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'guide' ? 'border-[#3399FF] text-white bg-[#333]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                User Guide
            </button>
            <button 
                onClick={() => setActiveTab('desktop')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'desktop' ? 'border-[#3399FF] text-white bg-[#333]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                <span className="flex items-center justify-center gap-2"><Laptop size={14}/> Get Desktop App (.exe)</span>
            </button>
        </div>

        {/* Content */}
        <div className="p-0 overflow-y-auto min-h-[400px]">
          
          {activeTab === 'guide' ? (
            <>
              {/* 1. Key Features Grid */}
              <section className="p-6 bg-[#2a2a2a] border-b border-[#333]">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Key Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex gap-4 p-3 bg-[#222] border border-[#383838] rounded-lg">
                    <div className="p-2 bg-green-900/30 text-green-400 rounded h-fit">
                      <Shield size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-200 text-sm">100% Offline & Private</h4>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        Zero data leaves your device. No API keys required. Secure for confidential studio work.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-3 bg-[#222] border border-[#383838] rounded-lg">
                    <div className="p-2 bg-blue-900/30 text-blue-400 rounded h-fit">
                      <Globe size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-200 text-sm">Hinglish & Dialect Smart</h4>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        Phonetic engine understands "v/w" swaps, "th/d" sounds, and regional Indian accents.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-3 bg-[#222] border border-[#383838] rounded-lg">
                    <div className="p-2 bg-purple-900/30 text-purple-400 rounded h-fit">
                      <Database size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-200 text-sm">Massive Word Bank</h4>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        Auto-corrects Gen Z slang, Indian Names, Cities, Politics, Finance terms, and Memes.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-3 bg-[#222] border border-[#383838] rounded-lg">
                    <div className="p-2 bg-yellow-900/30 text-yellow-400 rounded h-fit">
                      <Zap size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-200 text-sm">Instant Alignment</h4>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        Uses Diff algorithms to merge your correct script with SRT timestamps instantly.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. Workflow Steps */}
              <section className="p-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">How to Use</h3>
                <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-4 before:w-0.5 before:bg-[#333]">
                  
                  <div className="relative flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center text-[#3399FF] font-bold border-2 border-[#333] z-10">1</div>
                    <div>
                      <h4 className="font-bold text-gray-200 flex items-center gap-2">
                        <FileText size={16} /> Export SRT
                      </h4>
                      <p className="mt-1 text-sm text-gray-400">
                        In Premiere Pro, transcribe your sequence. Go to <strong>Text Panel &gt; Export &gt; SRT file</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="relative flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center text-[#3399FF] font-bold border-2 border-[#333] z-10">2</div>
                    <div>
                      <h4 className="font-bold text-gray-200 flex items-center gap-2">
                        <Keyboard size={16} /> Load Source & Script
                      </h4>
                      <p className="mt-1 text-sm text-gray-400">
                        Drag the SRT into Step 1. Paste your <strong>Final Correct Script</strong> in Step 2.
                        <br />
                        <span className="text-xs text-[#3399FF]">Tip: The script is the "Master" for spelling and grammar.</span>
                      </p>
                    </div>
                  </div>

                  <div className="relative flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center text-[#3399FF] font-bold border-2 border-[#333] z-10">3</div>
                    <div>
                      <h4 className="font-bold text-gray-200 flex items-center gap-2">
                        <Wand2 size={16} /> Auto Correct
                      </h4>
                      <p className="mt-1 text-sm text-gray-400">
                        Click <strong>Auto Correct</strong>. The tool merges them, keeping timestamps perfect while fixing the text.
                      </p>
                    </div>
                  </div>

                  <div className="relative flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center text-[#3399FF] font-bold border-2 border-[#333] z-10">4</div>
                    <div>
                      <h4 className="font-bold text-gray-200 flex items-center gap-2">
                        <Download size={16} /> Verify & Download
                      </h4>
                      <p className="mt-1 text-sm text-gray-400">
                        Use <strong>Diff View</strong> (Eye icon) to check changes. Download the new SRT and import to Premiere.
                      </p>
                    </div>
                  </div>

                </div>
              </section>

              <div className="h-px bg-[#333] w-full mx-6 mb-6 max-w-[calc(100%-48px)]" />

              {/* 3. Tips & Shortcuts */}
              <section className="px-6 pb-6 grid md:grid-cols-2 gap-4">
                <div className="bg-[#222] p-4 rounded border border-[#333]">
                  <h4 className="font-bold text-gray-200 mb-3 flex items-center gap-2 text-sm">
                    <AlertTriangle size={14} className="text-yellow-500" /> Best Practices
                  </h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-400 text-xs">
                    <li>Script lines should roughly match the audio flow.</li>
                    <li>Remove scene headings (INT/EXT) from script.</li>
                    <li>Verify names manually if they are very unique.</li>
                  </ul>
                </div>
                <div className="bg-[#222] p-4 rounded border border-[#333]">
                  <h4 className="font-bold text-gray-200 mb-3 text-sm">Keyboard Shortcuts</h4>
                  <ul className="space-y-2 text-gray-400 text-xs">
                    <li className="flex justify-between items-center bg-[#2a2a2a] p-1.5 rounded">
                      <span>Run "Replace All"</span>
                      <kbd className="bg-[#333] px-2 py-0.5 rounded border border-[#444] font-mono font-bold text-[10px] text-gray-300">Enter</kbd>
                    </li>
                    <li className="flex justify-between items-center bg-[#2a2a2a] p-1.5 rounded">
                      <span>Close Find/Replace</span>
                      <kbd className="bg-[#333] px-2 py-0.5 rounded border border-[#444] font-mono font-bold text-[10px] text-gray-300">Esc</kbd>
                    </li>
                  </ul>
                </div>
              </section>
            </>
          ) : (
            // DESKTOP APP INSTRUCTIONS
            <section className="p-8 flex flex-col items-center text-center">
              <Laptop size={64} className="text-[#3399FF] mb-6" />
              <h3 className="text-xl font-bold text-gray-100 mb-2">Build Standalone EXE</h3>
              <p className="text-sm text-gray-400 max-w-lg mb-8">
                Since you are using the web version, I cannot generate the binary file directly. 
                However, I have added the <strong>Electron configuration files</strong> to your project.
                Follow these steps to build the .exe yourself:
              </p>

              <div className="w-full max-w-2xl bg-[#222] border border-[#333] rounded-lg text-left overflow-hidden">
                <div className="flex items-center gap-2 bg-[#1a1a1a] p-3 border-b border-[#333]">
                  <div className="w-3 h-3 rounded-full bg-red-500"/>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"/>
                  <div className="w-3 h-3 rounded-full bg-green-500"/>
                  <span className="ml-2 text-xs font-mono text-gray-500">Terminal</span>
                </div>
                <div className="p-6 font-mono text-sm space-y-6">
                  
                  <div>
                    <p className="text-gray-500 mb-2"># 1. Install dependencies</p>
                    <p className="text-green-400 select-all">npm install</p>
                  </div>

                  <div>
                    <p className="text-gray-500 mb-2"># 2. Build the desktop app</p>
                    <p className="text-green-400 select-all">npm run dist</p>
                  </div>

                  <div>
                    <p className="text-gray-500 mb-2"># 3. Locate your file</p>
                    <p className="text-gray-300">
                      Check the <span className="text-yellow-400">release/</span> folder for <span className="text-[#3399FF]">ScriptAligner Setup 1.0.0.exe</span>
                    </p>
                  </div>

                </div>
              </div>
              
              <div className="mt-8 p-4 bg-blue-900/20 border border-blue-900/50 rounded-lg text-left max-w-2xl">
                <h4 className="text-blue-400 font-bold text-sm mb-1 flex items-center gap-2">
                  <Globe size={14}/> Why Electron?
                </h4>
                <p className="text-xs text-blue-200/80">
                  Electron wraps this React app into a standalone desktop application. 
                  It allows the app to run without a browser and without Adobe Premiere Pro open.
                </p>
              </div>

            </section>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#333] bg-[#222] flex justify-between items-center">
            <p className="text-[10px] text-gray-500">v1.0.0 • Offline Build</p>
            <button 
                onClick={onClose}
                className="bg-[#3399FF] hover:bg-[#2288EE] text-white px-6 py-2 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors"
            >
                {activeTab === 'guide' ? 'Got it' : 'Close'}
            </button>
        </div>
      </div>
    </div>
  );
};