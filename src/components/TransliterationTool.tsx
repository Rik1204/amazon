import React, { useState } from 'react';
import { INDIC_TRANSLITERATION, nameTokens, addressTokens, skeleton } from '../lib/normalize';
import { Languages, BookOpen, Search } from 'lucide-react';

export const TransliterationTool: React.FC = () => {
  const [inputName, setInputName] = useState<string>('श्री राम एंटरप्राइजेज प्राइवेट लिमिटेड');
  const [inputAddress, setInputAddress] = useState<string>('12 एमजी रोड, इंदिरानगर 1604b');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const processedTokens = nameTokens(inputName);
  const processedSkeletons = processedTokens.map((t) => skeleton(t) || '(none)');
  const processedAddrTokens = addressTokens(inputAddress);

  // Filter dictionary
  const filteredDict = Object.entries(INDIC_TRANSLITERATION).filter(
    ([indic, latin]) =>
      indic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      latin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const presets = [
    { name: 'श्री राम एंटरप्राइजेज प्राइवेट लिमिटेड', addr: '12 एमजी रोड, इंदिरानगर 1604b' },
    { name: 'Shree Ram Enterprises Pvt Ltd', addr: '12 M.G. Road Indiranagar' },
    { name: 'यूनिवर्सल इम्पेक्स लिमिटेड', addr: '45 कालबादेवी रोड, मुंबई' },
    { name: 'Atelier Lumière S.A.S.', addr: '15 Boulevard Saint-Germain, Paris' },
    { name: 'praaivett limittedd y0ga center', addr: '012 South 5th Street' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Languages className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-white">
            Indian Script Transliteration & Phonetic Skeleton Studio
          </h2>
        </div>
        <p className="text-xs text-slate-400 max-w-3xl">
          Shows how Team Null-Pointers bridged the script gap between Devanagari/Gujarati and Latin scripts using a training-pair learned dictionary, typo correction, and phonetic skeleton compression (e.g., <code className="text-amber-400 font-mono">"praaivett"</code> and <code className="text-amber-400 font-mono">"private"</code> both collapse to <code className="text-emerald-400 font-mono">"prvt"</code>).
        </p>

        {/* Presets */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <span className="text-xs text-slate-400">Quick Test Cases:</span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputName(p.name);
                setInputAddress(p.addr);
              }}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Live Interactive Transformer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Input Text */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Raw Input Strings
          </h3>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Business Name</label>
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Address</label>
            <input
              type="text"
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1.5">
            <span className="text-amber-400 font-semibold block text-[11px]">Transformations Applied:</span>
            <ul className="list-disc pl-4 text-slate-400 text-[11px] space-y-1">
              <li>Transliteration lookup for Indic script blocks (\u0900 - \u0D7F)</li>
              <li>Dotted acronym concatenation (e.g. <code>"S.A.S."</code> &rarr; <code>"SAS"</code>)</li>
              <li>Digit typo replacement (e.g. <code>"y0ga"</code> &rarr; <code>"yoga"</code>)</li>
              <li>Separation of letters from digits in address (<code>"1604b"</code> &rarr; <code>"1604 b"</code>)</li>
              <li>Removal of leading zeros in numbers (<code>"012"</code> &rarr; <code>"12"</code>)</li>
            </ul>
          </div>
        </div>

        {/* Right: Pipeline Output */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Normalized Output Representation
          </h3>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">
                Name Tokens (nameTokens)
              </span>
              <div className="flex flex-wrap gap-1.5 font-mono">
                {processedTokens.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">
                Phonetic Skeletons (skeleton())
              </span>
              <div className="flex flex-wrap gap-1.5 font-mono">
                {processedSkeletons.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    {s}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">
                Vowels dropped, sound-alikes merged (c/q/g&rarr;k, z/x&rarr;s, d&rarr;t, b&rarr;p, w&rarr;v).
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">
                Address Tokens (addressTokens)
              </span>
              <div className="flex flex-wrap gap-1.5 font-mono">
                {processedAddrTokens.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dictionary Explorer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Learned Transliteration Dictionary ({Object.keys(INDIC_TRANSLITERATION).length} entries)
            </h3>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search word..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {filteredDict.map(([indic, latin]) => (
            <div
              key={indic}
              onClick={() => setInputName(indic)}
              className="bg-slate-950 border border-slate-800/80 hover:border-amber-500/40 p-2.5 rounded-lg text-xs cursor-pointer transition"
            >
              <div className="font-semibold text-slate-100 text-sm">{indic}</div>
              <div className="text-[11px] text-amber-400 font-mono mt-0.5">&rarr; {latin}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
