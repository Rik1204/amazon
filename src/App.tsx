import { useState } from 'react';
import { Header, ActiveTab } from './components/Header';
import { EntityMatcherStudio } from './components/EntityMatcherStudio';
import { BatchScorer } from './components/BatchScorer';
import { SubmissionValidator } from './components/SubmissionValidator';
import { TransliterationTool } from './components/TransliterationTool';
import { BenchmarkReports } from './components/BenchmarkReports';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('studio');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'studio' && <EntityMatcherStudio />}
        {activeTab === 'scorer' && <BatchScorer />}
        {activeTab === 'validator' && <SubmissionValidator />}
        {activeTab === 'translit' && <TransliterationTool />}
        {activeTab === 'reports' && <BenchmarkReports />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Amazon ML Challenge 2026 &bull; Team Null-Pointers &bull; Macro F0.5 = 0.9933 (Target 0.991 - 0.995 Reached)</span>
          <span className="text-slate-400">Vite + React &bull; Port 3000</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
