import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Download, Wand2, AlertCircle, FileText, CheckCircle2, Pencil, Save, RotateCcw, Eye, Edit3, Search, X, ChevronRight, CircleHelp, Upload, WifiOff, ArrowDown, Database, Percent, ListOrdered, Heart } from 'lucide-react';
// SWITCHED TO OFFLINE SERVICE
import { alignSrtOffline } from './services/offlineService';
import { Button } from './components/Button';
import { Dropzone } from './components/Dropzone';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';
import { HelpModal } from './components/HelpModal';
import { WordBankModal } from './components/WordBankModal';
import { ProcessingStatus } from './types';
import * as Diff from 'diff';

const App: React.FC = () => {
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [srtContent, setSrtContent] = useState<string>('');
  const [scriptContent, setScriptContent] = useState<string>('');
  const [correctedSrt, setCorrectedSrt] = useState<string>('');
  const [originalOutput, setOriginalOutput] = useState<string>(''); // Store original AI output for revert
  const [status, setStatus] = useState<ProcessingStatus>('IDLE');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isEdited, setIsEdited] = useState<boolean>(false);
  
  // New Features State
  const [viewMode, setViewMode] = useState<'edit' | 'diff'>('edit');
  const [showFindReplace, setShowFindReplace] = useState<boolean>(false);
  const [findText, setFindText] = useState<string>('');
  const [replaceText, setReplaceText] = useState<string>('');
  const [matchCase, setMatchCase] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showWordBank, setShowWordBank] = useState<boolean>(false);
  const [customDictionary, setCustomDictionary] = useState<Record<string, string>>({});
  
  // Auto-save State
  const [isRestored, setIsRestored] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Script Input Ref
  const scriptInputRef = useRef<HTMLInputElement>(null);
  // Textarea Ref for Find/Replace selection
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ref to hold latest state for periodic saving without resetting interval
  const sessionRef = useRef({
    srtContent,
    scriptContent,
    correctedSrt,
    originalOutput,
    isEdited,
    srtFileName: srtFile?.name
  });

  // Ref to track last saved content to prevent redundant saves
  const lastSavedJson = useRef<string>('');

  // Helper to extract pure text from SRT (remove timestamps and indices)
  const extractTextFromSrt = (srt: string): string => {
    if (!srt) return '';
    // Remove sequence numbers (single digits on a line)
    let clean = srt.replace(/^\d+$/gm, '');
    // Remove timestamps
    clean = clean.replace(/^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}$/gm, '');
    // Normalize whitespace
    return clean.replace(/\s+/g, ' ').trim();
  };

  // Calculate Accuracy/Match Percentage
  const calculateMatchScore = (source: string, target: string): number => {
      if (!source || !target) return 0;
      
      // Use \S+ to match any non-whitespace characters (supports Hindi/Unicode)
      // Standard \w+ only matches [A-Za-z0-9_] which fails for Hindi
      const sourceWords = source.toLowerCase().match(/\S+/g) || [];
      const targetWords = target.toLowerCase().match(/\S+/g) || [];
      
      if (sourceWords.length === 0 || targetWords.length === 0) return 0;
      
      const diff = Diff.diffWords(sourceWords.join(' '), targetWords.join(' '));
      let matches = 0;
      
      diff.forEach(part => {
          if (!part.added && !part.removed) {
              const words = part.value.trim().split(/\s+/).filter(w => w.length > 0);
              matches += words.length;
          }
      });
      
      // Calculate overlap ratio relative to the TARGET script (how much of the script is present)
      // We limit to 100% just in case
      return Math.min(100, Math.round((matches / targetWords.length) * 100));
  };

  // Memoized Accuracy Scores
  const accuracyStats = useMemo(() => {
    if (!scriptContent) return { initial: 0, final: 0 };
    
    // Clean inputs
    const cleanScript = scriptContent.replace(/\s+/g, ' ').trim();
    const cleanSource = extractTextFromSrt(srtContent);
    const cleanResult = extractTextFromSrt(correctedSrt);
    
    const initial = calculateMatchScore(cleanSource, cleanScript);
    const final = calculateMatchScore(cleanResult, cleanScript);
    
    return { initial, final };
  }, [srtContent, scriptContent, correctedSrt]);

  // Toast Helpers
  const showToast = (message: string, type: ToastType = 'info', duration = 3000) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Calculate Diff
  const diffElements = useMemo(() => {
    if (!srtContent || !correctedSrt) return [];
    // We differentiate by words to make it readable
    return Diff.diffWords(srtContent, correctedSrt);
  }, [srtContent, correctedSrt]);

  // Real-time Match Count
  const matchCount = useMemo(() => {
    if (!findText || !correctedSrt) return 0;
    try {
        const flags = matchCase ? 'g' : 'gi';
        const escapedSearch = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedSearch, flags);
        const matches = correctedSrt.match(regex);
        return matches ? matches.length : 0;
    } catch {
        return 0;
    }
  }, [findText, correctedSrt, matchCase]);

  // Restore session on Mount
  useEffect(() => {
    // 1. Restore Session
    const savedSession = localStorage.getItem('indic_aligner_session');
    if (savedSession) {
      try {
        const data = JSON.parse(savedSession);
        
        if (data.srtContent) {
          setSrtContent(data.srtContent);
          // Reconstruct File object if name exists
          if (data.srtFileName) {
            const file = new File([data.srtContent], data.srtFileName, { type: 'text/plain' });
            setSrtFile(file);
          }
        }
        
        if (data.scriptContent) setScriptContent(data.scriptContent);
        if (data.correctedSrt) setCorrectedSrt(data.correctedSrt);
        if (data.originalOutput) setOriginalOutput(data.originalOutput);
        if (data.isEdited) setIsEdited(data.isEdited);
        
        // Restore completed status if there is a result
        if (data.correctedSrt) {
          setStatus('COMPLETED');
        }

        if (data.lastModified) {
          setLastSaved(new Date(data.lastModified));
        }

      } catch (e) {
        // console.error("Failed to restore session:", e);
      }
    }
    
    // 2. Restore Custom Dictionary
    const savedDict = localStorage.getItem('indic_aligner_custom_dict');
    if (savedDict) {
        try {
            setCustomDictionary(JSON.parse(savedDict));
        } catch (e) { /* ignore */ }
    }

    setIsRestored(true);
  }, []);

  // Save Dictionary when changed
  useEffect(() => {
      if (isRestored) {
          localStorage.setItem('indic_aligner_custom_dict', JSON.stringify(customDictionary));
      }
  }, [customDictionary, isRestored]);

  // Sync state to Ref for auto-save
  useEffect(() => {
    sessionRef.current = {
      srtContent,
      scriptContent,
      correctedSrt,
      originalOutput,
      isEdited,
      srtFileName: srtFile?.name
    };
  }, [srtContent, scriptContent, correctedSrt, originalOutput, isEdited, srtFile]);

  // Core Save Logic
  const saveToStorage = useCallback(() => {
    const data = sessionRef.current;
    
    // Prepare data for comparison (exclude timestamp)
    const currentData = {
      srtContent: data.srtContent,
      scriptContent: data.scriptContent,
      correctedSrt: data.correctedSrt,
      originalOutput: data.originalOutput,
      isEdited: data.isEdited,
      srtFileName: data.srtFileName
    };

    const currentJson = JSON.stringify(currentData);
    
    // Don't save if empty or unchanged
    if ((!data.srtContent && !data.scriptContent && !data.correctedSrt) || currentJson === lastSavedJson.current) return;

    const sessionData = {
      ...currentData,
      lastModified: Date.now()
    };

    try {
      localStorage.setItem('indic_aligner_session', JSON.stringify(sessionData));
      setLastSaved(new Date());
      lastSavedJson.current = currentJson;
    } catch (e) {
      // Silently fail if storage is full. No logs to avoid confusion.
    }
  }, []);

  // 1. Periodic Auto-save (30 seconds)
  useEffect(() => {
    if (!isRestored) return;
    const intervalId = setInterval(saveToStorage, 30000); 
    return () => clearInterval(intervalId);
  }, [isRestored, saveToStorage]);

  // 2. Inactivity Auto-save (3 seconds debounce)
  useEffect(() => {
    if (!isRestored) return;
    const timeoutId = setTimeout(saveToStorage, 3000);
    return () => clearTimeout(timeoutId);
  }, [srtContent, scriptContent, correctedSrt, originalOutput, isEdited, isRestored, saveToStorage]);

  // File Handling - Source File
  const handleFileSelect = useCallback((file: File) => {
    setSrtFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setSrtContent(text);
      showToast(`Loaded ${file.name}`, 'success');
    };
    reader.readAsText(file);
    setCorrectedSrt('');
    setOriginalOutput('');
    setStatus('IDLE');
    setIsEdited(false);
  }, []);

  const handleClearFile = useCallback(() => {
    setSrtFile(null);
    setSrtContent('');
    setCorrectedSrt('');
    setOriginalOutput('');
    setStatus('IDLE');
    setIsEdited(false);
    // Explicitly clear storage
    localStorage.removeItem('indic_aligner_session');
    setLastSaved(null);
    lastSavedJson.current = '';
  }, []);

  // File Handling - Script File
  const handleScriptFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setScriptContent(text);
        showToast(`Loaded Script: ${file.name}`, 'success');
      };
      reader.readAsText(file);
      // Reset input so same file can be loaded again
      e.target.value = '';
    }
  };

  // Process Logic
  const handleProcess = async () => {
    if (!srtContent || !scriptContent) return;

    setStatus('ALIGNING');
    setErrorMsg(null);
    setIsEdited(false);

    try {
      // Use Offline Service with Custom Dictionary
      const result = await alignSrtOffline(srtContent, scriptContent, customDictionary);
      setCorrectedSrt(result);
      setOriginalOutput(result);
      setStatus('COMPLETED');
      showToast('Alignment completed successfully!', 'success');
    } catch (err: any) {
      setErrorMsg(err.message || 'An unknown error occurred');
      setStatus('ERROR');
      showToast('Alignment failed', 'error');
    }
  };

  // MANUAL EDITING LOGIC
  const handleManualEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setCorrectedSrt(newValue);
    // Dynamically check if edited. 
    // If originalOutput exists, compare. If it doesn't, allow edits but no "Revert" state until processed.
    const isNowEdited = originalOutput ? newValue !== originalOutput : false;
    setIsEdited(isNowEdited);
  };

  // REVERT LOGIC
  const handleRevert = () => {
    if (window.confirm('Are you sure you want to discard your manual changes and revert to the original AI output?')) {
      setCorrectedSrt(originalOutput);
      setIsEdited(false);
      showToast('Reverted to original output', 'info');
    }
  };

  const handleDownload = async () => {
    if (!correctedSrt) return;

    // Determine filename
    const originalName = srtFile?.name || 'captions.srt';
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    const finalFileName = `corrected_${nameWithoutExt}.srt`;

    // Standard Browser Download
    showToast('Downloading SRT file...', 'info');
    const blob = new Blob([correctedSrt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Find Next Logic
  const handleFindNext = () => {
    if (!findText || !textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const content = correctedSrt;
    const startPos = textarea.selectionEnd; // Start searching after current selection
    
    // Create regex
    const flags = matchCase ? 'g' : 'gi';
    const escapedSearch = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedSearch, flags);
    
    let match;
    let nextMatch = null;
    let firstMatch = null;
    
    // Find first match and next match relative to cursor
    while ((match = regex.exec(content)) !== null) {
        if (!firstMatch) firstMatch = match;
        if (match.index >= startPos) {
            nextMatch = match;
            break;
        }
    }
    
    // Wrap around if no next match found
    if (!nextMatch && firstMatch) {
        nextMatch = firstMatch;
        showToast('Wrapped to beginning', 'info', 1000);
    }
    
    if (nextMatch) {
        textarea.focus();
        textarea.setSelectionRange(nextMatch.index, nextMatch.index + nextMatch[0].length);
        
        // Basic scroll into view logic (approximate)
        const lineHeight = 20; // Approx pixels per line
        const linesBefore = content.substring(0, nextMatch.index).split('\n').length;
        const scrollY = (linesBefore * lineHeight) - (textarea.clientHeight / 2);
        textarea.scrollTop = Math.max(0, scrollY);
    } else {
        showToast('No matches found', 'warning');
    }
  };

  // Replace Single
  const handleReplaceOne = () => {
    if (!textareaRef.current || !findText) return;
    const textarea = textareaRef.current;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = correctedSrt.substring(start, end);
    
    // Check if current selection matches findText (respecting case setting)
    const isMatch = matchCase 
        ? selectedText === findText 
        : selectedText.toLowerCase() === findText.toLowerCase();

    if (isMatch) {
        const before = correctedSrt.substring(0, start);
        const after = correctedSrt.substring(end);
        // Escape $ in replacement text
        const safeReplace = replaceText.replace(/\$/g, '$$$$');
        const newText = before + replaceText + after;
        
        setCorrectedSrt(newText);
        setIsEdited(true);
        
        // Use timeout to ensure state update renders before finding next
        setTimeout(() => {
             if(textareaRef.current) {
                 textareaRef.current.focus();
                 // Set cursor after replacement
                 const newCursorPos = start + replaceText.length;
                 textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                 // Auto find next
                 handleFindNext(); 
             }
        }, 0);
    } else {
        // If selection doesn't match, find next first
        handleFindNext();
    }
  };

  // Find and Replace All Logic
  const handleReplaceAll = () => {
    if (!findText) return;
    
    try {
      const flags = matchCase ? 'g' : 'gi';
      const escapedSearch = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedSearch, flags);
      const matches = correctedSrt.match(regex);
      const count = matches ? matches.length : 0;
      
      if (count > 0) {
        // Escape replacement text to ensure literal replacement (handling $ characters)
        const safeReplaceText = replaceText.replace(/\$/g, '$$$$');
        const newText = correctedSrt.replace(regex, safeReplaceText);
        setCorrectedSrt(newText);
        // Ensure status reflects change
        if (newText !== originalOutput) setIsEdited(true);
        showToast(`Replaced ${count} occurrences`, 'success');
      } else {
        showToast('No matches found', 'warning');
      }
    } catch (e) {
      console.error("Invalid regex/search", e);
      showToast('Invalid search pattern', 'error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        // Shift+Enter to Find Next? Just Enter for Find Next in Find box?
        if (e.currentTarget === document.activeElement && (e.target as HTMLElement).tagName === 'INPUT') {
            handleFindNext();
        }
    }
    if (e.key === 'Escape') {
        setShowFindReplace(false);
        // Refocus editor
        textareaRef.current?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-[#e0e0e0] flex flex-col items-center py-10 px-4 relative">
      
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <WordBankModal 
        isOpen={showWordBank} 
        onClose={() => setShowWordBank(false)} 
        customDictionary={customDictionary}
        onSave={setCustomDictionary}
      />

      {/* Container simulating a UXP Panel */}
      <div className="w-full max-w-5xl bg-[#262626] border border-[#383838] shadow-2xl rounded-lg overflow-hidden flex flex-col md:flex-row min-h-[700px]">
        
        {/* Left Panel: Inputs */}
        <div className="w-full md:w-[350px] p-6 flex flex-col border-b md:border-b-0 md:border-r border-[#383838] bg-[#222]">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                    <span className="text-[#3399FF] font-black">Script</span>Aligner
                </h1>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowWordBank(true)}
                    className="text-gray-500 hover:text-[#3399FF] transition-colors"
                    title="Manage Word Bank"
                  >
                    <Database size={18} />
                  </button>
                  <button 
                    onClick={() => setShowHelp(true)}
                    className="text-gray-500 hover:text-[#3399FF] transition-colors"
                    title="How to use"
                  >
                    <CircleHelp size={18} />
                  </button>
                </div>
            </div>
            
            <p className="text-[10px] text-gray-500 mb-6 -mt-4">Adobe Premiere Pro UXP Plugin</p>

            {/* Step 1: Source File Upload */}
            <div className="mb-6 space-y-2">
                <div className="flex justify-between items-end">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">1. Load Source File</label>
                </div>
                <Dropzone 
                    onFileSelect={handleFileSelect} 
                    selectedFile={srtFile} 
                    onClear={handleClearFile}
                    acceptedExtensions={['.srt', '.txt', '.csv']}
                />
            </div>

            {/* Step 2: Script Input */}
            <div className="flex-1 flex flex-col mb-6 space-y-2 min-h-[200px]">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        2. Paste Correct Script
                    </label>
                    
                    {/* Hidden input for script file upload */}
                    <input 
                      type="file" 
                      ref={scriptInputRef} 
                      onChange={handleScriptFileSelect} 
                      accept=".txt,.md,.doc,.docx,.csv" 
                      className="hidden" 
                    />
                    
                    <button 
                      onClick={() => scriptInputRef.current?.click()}
                      className="flex items-center gap-1 text-[10px] bg-[#333] hover:bg-[#444] text-gray-300 px-2 py-0.5 rounded border border-[#444] transition-colors"
                      title="Upload script from file"
                    >
                      <Upload size={10} /> Load File
                    </button>
                </div>
                
                <textarea 
                    className="flex-1 bg-[#1e1e1e] border border-[#444] rounded p-3 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#3399FF] resize-none font-mono"
                    placeholder="Paste your final script here. The tool will merge it with your timestamps."
                    value={scriptContent}
                    onChange={(e) => setScriptContent(e.target.value)}
                />
            </div>

            {/* Action Button */}
            <Button 
                onClick={handleProcess} 
                isLoading={status === 'ALIGNING'}
                disabled={!srtContent || !scriptContent}
                className="w-full py-3"
                icon={<Wand2 size={16} />}
            >
                {status === 'ALIGNING' ? 'Processing Offline...' : 'Auto Correct'}
            </Button>

            {status === 'ERROR' && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-900 rounded flex items-start gap-2 text-red-200 text-xs">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <p>{errorMsg}</p>
                </div>
            )}
        </div>

        {/* Right Panel: Output/Preview */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e]">
            {/* Header / Toolbar */}
            <div className="flex flex-col border-b border-[#333]">
              <div className="flex items-center justify-between p-4 h-14">
                  <div className="flex items-baseline gap-3">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Result</label>
                      {correctedSrt && (
                        <div className="flex items-center gap-2">
                           {/* Accuracy Badges */}
                           <span className="flex items-center gap-1.5 text-xs text-gray-300 font-mono bg-[#262626] border border-[#333] px-2 py-1 rounded shadow-sm" title="Accuracy vs Script before correction">
                              <Percent size={12} className="text-red-400" />
                              {accuracyStats.initial}% <span className="text-gray-500">Before</span>
                          </span>
                           <span className="flex items-center gap-1.5 text-xs text-gray-300 font-mono bg-[#262626] border border-[#333] px-2 py-1 rounded shadow-sm" title="Accuracy vs Script after correction">
                              <Percent size={12} className="text-green-400" />
                              {accuracyStats.final}% <span className="text-gray-500">After</span>
                          </span>
                        </div>
                      )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                      {/* View Mode Toggles */}
                      <div className="flex bg-[#262626] rounded-md p-0.5 border border-[#333] mr-2">
                          <button
                              onClick={() => setViewMode('edit')}
                              className={`p-1.5 rounded-sm transition-colors ${viewMode === 'edit' ? 'bg-[#3399FF] text-white' : 'text-gray-400 hover:text-white'}`}
                              title="Editor View"
                          >
                              <Edit3 size={14} />
                          </button>
                          <button
                              onClick={() => setViewMode('diff')}
                              className={`p-1.5 rounded-sm transition-colors ${viewMode === 'diff' ? 'bg-[#3399FF] text-white' : 'text-gray-400 hover:text-white'}`}
                              disabled={!correctedSrt}
                              title="Diff View (Compare Changes)"
                          >
                              <Eye size={14} />
                          </button>
                      </div>

                      {/* Find/Replace Toggle */}
                      <button 
                          onClick={() => {
                              setShowFindReplace(!showFindReplace);
                              if (!showFindReplace) {
                                  setTimeout(() => textareaRef.current?.focus(), 100);
                              }
                          }}
                          className={`p-1.5 rounded-md border border-[#333] transition-colors mr-2 ${showFindReplace ? 'bg-[#333] text-white' : 'bg-[#262626] text-gray-400 hover:text-white'}`}
                          title="Find and Replace"
                          disabled={!correctedSrt || viewMode === 'diff'}
                      >
                          <Search size={14} />
                      </button>

                      {isEdited && (
                          <div className="flex items-center gap-2 border-l border-[#333] pl-2">
                              <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">
                                <Pencil size={12} /> Modified
                              </span>
                              <button 
                                  onClick={handleRevert}
                                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[#333] transition-colors"
                                  title="Revert to original AI output"
                              >
                                  <RotateCcw size={12} />
                              </button>
                          </div>
                      )}
                      
                      {status === 'COMPLETED' && !isEdited && (
                          <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded">
                              <CheckCircle2 size={12} /> Generated
                          </span>
                      )}
                  </div>
              </div>

              {/* Find & Replace Toolbar */}
              {showFindReplace && viewMode === 'edit' && (
                <div className="bg-[#262626] border-t border-[#333] p-2 flex items-center gap-2 animate-in slide-in-from-top-2">
                    <div className="flex items-center bg-[#1e1e1e] border border-[#444] rounded px-2 py-1 flex-1 gap-2">
                        <Search size={12} className="text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="Find..." 
                            value={findText}
                            onChange={(e) => setFindText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="bg-transparent border-none text-xs text-white focus:outline-none w-full"
                            autoFocus
                        />
                         {findText && (
                            <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                {matchCount} matches
                            </span>
                        )}
                        <button 
                            onClick={handleFindNext}
                            className="p-1 hover:text-white text-gray-500 hover:bg-[#333] rounded"
                            title="Find Next"
                        >
                            <ArrowDown size={12} />
                        </button>
                        <button
                            onClick={() => setMatchCase(!matchCase)}
                            className={`px-1.5 py-0.5 text-[10px] font-bold rounded border transition-colors ${matchCase ? 'bg-[#3399FF] text-white border-[#3399FF]' : 'bg-transparent text-gray-500 border-transparent hover:text-gray-300'}`}
                            title="Match Case"
                        >
                            Aa
                        </button>
                    </div>
                    <div className="flex items-center bg-[#1e1e1e] border border-[#444] rounded px-2 py-1 flex-1">
                        <ChevronRight size={12} className="text-gray-500 mr-2" />
                        <input 
                            type="text" 
                            placeholder="Replace with..." 
                            value={replaceText}
                            onChange={(e) => setReplaceText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="bg-transparent border-none text-xs text-white focus:outline-none w-full"
                        />
                    </div>
                    <button 
                        onClick={handleReplaceOne}
                        disabled={!findText}
                        className="bg-[#333] hover:bg-[#444] text-xs text-white px-3 py-1.5 rounded border border-[#555] transition-colors whitespace-nowrap"
                        title="Replace current selection or find next"
                    >
                        Replace
                    </button>
                    <button 
                        onClick={handleReplaceAll}
                        disabled={!findText}
                        className="bg-[#333] hover:bg-[#444] text-xs text-white px-3 py-1.5 rounded border border-[#555] transition-colors whitespace-nowrap"
                    >
                        All
                    </button>
                    <button 
                         onClick={() => setShowFindReplace(false)}
                         className="p-1 hover:text-white text-gray-500"
                    >
                        <X size={14} />
                    </button>
                </div>
              )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-[#262626] relative group overflow-hidden">
                {correctedSrt ? (
                    <>
                        {/* Editor Mode */}
                        <textarea 
                            ref={textareaRef}
                            className={`w-full h-full bg-[#262626] p-4 text-sm font-mono text-gray-200 resize-none focus:outline-none focus:bg-[#2a2a2a] focus:ring-1 focus:ring-[#3399FF] transition-all ${viewMode === 'diff' ? 'hidden' : 'block'}`}
                            value={correctedSrt}
                            onChange={handleManualEdit}
                            placeholder="Corrected SRT output..."
                            spellCheck={false}
                        />

                        {/* Diff Mode */}
                        <div className={`w-full h-full bg-[#1a1a1a] p-4 overflow-auto text-sm font-mono whitespace-pre-wrap ${viewMode === 'diff' ? 'block' : 'hidden'}`}>
                            {diffElements.map((part, index) => {
                                let styleClass = 'text-gray-400';
                                
                                if (part.added) {
                                    styleClass = 'bg-green-500/30 text-green-100';
                                } else if (part.removed) {
                                    styleClass = 'bg-red-500/30 text-red-100 line-through decoration-red-400';
                                }

                                return (
                                    <span key={index} className={`${styleClass} px-0.5 rounded-sm`}>
                                        {part.value}
                                    </span>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 p-8 text-center">
                        <FileText size={48} className="mb-4 opacity-20" />
                        <p className="text-sm">Corrected SRT will appear here</p>
                        <p className="text-xs mt-2 opacity-50">Upload SRT & Script to begin</p>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-[#333] space-y-4">
                
                {/* Download Controls */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 w-full">
                      {/* Main Save Action */}
                      <Button 
                          variant="primary" 
                          className="w-full py-3" 
                          disabled={!correctedSrt}
                          onClick={handleDownload}
                          icon={<Download size={16} />}
                      >
                          Download SRT
                      </Button>
                    </div>
                </div>
                
                {/* Context/Footer Info */}
                <div className="flex flex-col items-center gap-1 border-t border-[#333] pt-4">
                    <p className="text-[10px] text-gray-600">Offline Engine • English / Hindi / Hinglish</p>
                    <div className="flex items-center gap-1 text-[9px] text-gray-600 opacity-70 hover:opacity-100 transition-opacity cursor-default">
                        <span>Made by Shubham</span>
                        <Heart size={8} className="text-red-500 fill-red-500" />
                    </div>
                    {lastSaved && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1">
                            <Save size={10} />
                            <span>Last saved: {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;