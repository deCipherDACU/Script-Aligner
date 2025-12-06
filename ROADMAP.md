# ScriptAligner Roadmap

This document outlines future enhancement opportunities based on research into Automated Hinglish Caption Correction.

---

## Current Architecture (v1.0)
- **Frontend**: React + Vite (Web/UXP compatible)
- **Processing**: Offline Word Bank + Phonetic Matching
- **Output**: SRT file with ITN formatting

---

## Phase 1: Enhanced Offline (Current)
✅ Word Bank corrections (500+ terms)
✅ Phonetic fuzzy matching for accent tolerance
✅ Inverse Text Normalization (ITN)
✅ Schwa deletion for Hindi names
✅ Currency/number formatting

---

## Phase 2: Output Script Control (Planned)
- [ ] **Latin/Devanagari toggle** - User selects output script
- [ ] **Transliteration engine** - Basic bidirectional conversion
- [ ] **Script detection** - Auto-detect input script

---

## Phase 3: Cloud ASR Integration (Future)
Based on research recommendations:

### Sarvam AI
- **Endpoint**: Speech-to-Text API
- **Cost**: ₹30/hour
- **Features**: 
  - Code-mixing optimized
  - Speaker diarization
  - Script selection via API parameter
- **Integration**: Add as "Cloud Boost" option

### AI4Bharat IndicWhisper
- **Model**: Fine-tuned Whisper on Vistaar dataset (10K+ hours)
- **Deployment**: Local GPU or HuggingFace Inference
- **WER**: ~22% on Hinglish (vs ~35% generic Whisper)
- **Integration**: Bundled model or API call

---

## Phase 4: LLM Semantic Correction (Future)
Research shows Chain-of-Thought (CoT) prompting can reduce WER by 40%+.

### Architecture
```
ASR Output → LLM (GPT-4o-mini / Llama 3) → Corrected Text
```

### CoT Prompt Strategy
```
System: You are an expert Hinglish editor.
Input: "Maine school call kiya"
Analysis: "school" is phonetically similar to "usko" (him)
Output: "Maine usko call kiya"
```

### Integration Options
1. **OpenAI API** - Best quality, higher cost
2. **Local Llama** - Privacy-friendly, requires GPU
3. **Groq API** - Fast inference, low latency

---

## Phase 5: Adobe UXP Migration (Future)
Current CEP architecture will need migration as Adobe phases out CEP.

### Migration Path
1. Keep Python backend separate
2. Replace `child_process.spawn` with `fetch` to localhost
3. Port React UI to UXP Spectrum components
4. Consider WebAssembly for lightweight models

### WebAssembly Opportunities
- **Whisper.cpp** - Browser-based ASR
- **ONNX Runtime** - Run ML models directly in UXP

---

## Technical Debt
- [ ] Add unit tests for phonetics/ITN
- [ ] Refactor App.tsx (800+ lines) into hooks
- [ ] Add processing progress indicators
- [ ] Implement undo/redo for edits

---

## References
- AI4Bharat Vistaar Dataset
- Sarvam AI Speech-to-Text API
- OpenAI Whisper V3
- Adobe UXP Developer Documentation
