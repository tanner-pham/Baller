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
    <div className="bg-white border-b-2 border-gray-200 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-['Bebas_Neue',sans-serif] text-2xl tracking-wide text-[#030213] mb-4">
          Search Another Listing
        </h2>
        <div className="flex items-center bg-[#F5F5F0] border-3 border-[#030213] rounded-lg overflow-hidden shadow-sm w-full">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Paste Facebook Marketplace listing URL"
            className="flex-1 px-6 py-4 text-base font-['Space_Grotesk',sans-serif] outline-none bg-[#F5F5F0] placeholder:text-gray-500"
          />
          <button
            onClick={handleSearch}
            className="bg-[#030213] border-3 border-white p-3 text-white hover:bg-opacity-75 hover:scale-105 transition-all flex items-center justify-center rounded-lg cursor-pointer"
          >
            <Search className="size-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
