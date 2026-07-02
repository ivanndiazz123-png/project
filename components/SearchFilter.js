'use client';

import { Search, ArrowUpDown, ArrowUpAZ, ArrowDownZA, Clock, CalendarDays } from 'lucide-react';

export default function SearchFilter({ searchQuery, onSearchChange, sortOrder, onSortChange }) {
  const sortOptions = [
    { value: 'newest', label: 'Newest First', icon: Clock },
    { value: 'oldest', label: 'Oldest First', icon: CalendarDays },
    { value: 'az', label: 'A to Z', icon: ArrowUpAZ },
    { value: 'za', label: 'Z to A', icon: ArrowDownZA },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400/50" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="glass-input w-full pl-12"
          placeholder="Search by file name or date..."
        />
      </div>

      <div className="flex items-center gap-2">
        <ArrowUpDown className="w-5 h-5 text-emerald-400/50" />
        <select
          value={sortOrder}
          onChange={(e) => onSortChange(e.target.value)}
          className="glass-input py-2 pr-10 cursor-pointer"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-emerald-900">
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
