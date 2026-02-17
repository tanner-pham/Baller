"use client";

import { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch?: (url: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [url, setUrl] = useState('');

  const handleSearch = () => {
    if (url && onSearch) {
      onSearch(url);
      setUrl('');
    }
  };

  return (
    <div className="bg-white border-b-5 border-black px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-['Bebas_Neue',sans-serif] text-2xl tracking-wide text-[#030213] mb-4">
          Search Another Listing
        </h2>
        <div className="flex items-center gap-4 max-w-2xl">
          <div className="flex-1 bg-white border-5 border-black shadow-[6px_6px_0px_0px_#000000] rounded-full overflow-hidden">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Paste Facebook Marketplace listing URL"
              className="w-full px-6 py-3 text-sm font-['Space_Grotesk',sans-serif] font-semibold outline-none placeholder:text-gray-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-[#FADF0B] border-5 border-black px-6 py-3 font-['Anton',sans-serif] uppercase shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center justify-center rounded-lg cursor-pointer"
          >
            <Search className="size-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
