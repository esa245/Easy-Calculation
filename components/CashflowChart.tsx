'use client';

import React, { useState } from 'react';
import {
  ChartBucket,
  formatTaka,
} from '@/lib/ledger';

export type ChartGranularity = 'daily' | 'weekly' | 'monthly';

interface CashflowChartProps {
  granularity: ChartGranularity;
  onGranularityChange: (g: ChartGranularity) => void;
  dailySeries: ChartBucket[];
  weeklySeries: ChartBucket[];
  monthlySeries: ChartBucket[];
  useBengaliDigits: boolean;
}

export default function CashflowChart({
  granularity,
  onGranularityChange,
  dailySeries,
  weeklySeries,
  monthlySeries,
  useBengaliDigits,
}: CashflowChartProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const series =
    granularity === 'daily'
      ? dailySeries
      : granularity === 'weekly'
      ? weeklySeries
      : monthlySeries;

  const maxVal = Math.max(
    1,
    ...series.map((b) => Math.max(b.income, b.expense))
  );

  const activeBucket = activeIdx !== null ? series[activeIdx] : series[series.length - 1];

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900">আয় ও খরচের তুলনামূলক চিত্র</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {granularity === 'daily'
              ? 'শেষ ৭ দিনের দৈনিক হিসাব'
              : granularity === 'weekly'
              ? 'শেষ ৬ সপ্তাহের সাপ্তাহিক হিসাব'
              : 'শেষ ৬ মাসের মাসিক হিসাব'}
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          {(
            [
              { id: 'daily', label: 'দৈনিক' },
              { id: 'weekly', label: 'সাপ্তাহিক' },
              { id: 'monthly', label: 'মাসিক' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                onGranularityChange(tab.id);
                setActiveIdx(null);
              }}
              className={`px-3 py-1.5 min-h-[34px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                granularity === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selected / latest bucket summary line (clean unboxed text with separators) */}
      {activeBucket && (
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100 text-xs">
          <span className="font-semibold text-slate-700">{activeBucket.label}</span>
          <div className="flex flex-wrap items-center gap-3 tabular-nums">
            <span className="text-[#137C50] font-semibold">
              জমা: {formatTaka(activeBucket.income, useBengaliDigits)}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-[#DC2626] font-semibold">
              খরচ: {formatTaka(activeBucket.expense, useBengaliDigits)}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-slate-800 font-semibold">
              নিট: {formatTaka(activeBucket.income - activeBucket.expense, useBengaliDigits)}
            </span>
          </div>
        </div>
      )}

      {/* Bar chart columns */}
      <div className="grid grid-cols-7 gap-2 items-end h-44 pt-2" style={{ gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))` }}>
        {series.map((bucket, idx) => {
          const inPct = Math.round((bucket.income / maxVal) * 100);
          const outPct = Math.round((bucket.expense / maxVal) * 100);
          const isSelected = activeIdx === idx;
          return (
            <button
              key={bucket.key}
              type="button"
              onClick={() => setActiveIdx(idx)}
              onMouseEnter={() => setActiveIdx(idx)}
              onFocus={() => setActiveIdx(idx)}
              className={`group flex flex-col items-center justify-end h-full rounded-xl p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#137C50] ${
                isSelected ? 'bg-slate-50' : 'hover:bg-slate-50/70'
              }`}
              aria-label={`${bucket.label}: জমা ${formatTaka(bucket.income, useBengaliDigits)}, খরচ ${formatTaka(bucket.expense, useBengaliDigits)}`}
            >
              <div className="w-full flex-1 flex items-end justify-center gap-1 min-h-0">
                <div
                  className="w-3 sm:w-3.5 rounded-t-md bg-[#168653] transition-all duration-200"
                  style={{ height: `${bucket.income > 0 ? Math.max(8, inPct) : 3}%`, opacity: bucket.income > 0 ? 1 : 0.15 }}
                />
                <div
                  className="w-3 sm:w-3.5 rounded-t-md bg-[#DC2626] transition-all duration-200"
                  style={{ height: `${bucket.expense > 0 ? Math.max(8, outPct) : 3}%`, opacity: bucket.expense > 0 ? 1 : 0.15 }}
                />
              </div>
              <span className="mt-2 text-[11px] font-medium text-slate-600 truncate w-full text-center">
                {bucket.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#168653] inline-block" aria-hidden="true" />
          জমা / আয়
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#DC2626] inline-block" aria-hidden="true" />
          খরচ / উত্তোলন
        </span>
      </div>
    </div>
  );
}
