'use client';

import React, { useMemo, useState } from 'react';
import {
  Archive,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Trash2,
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  MonthlyArchive,
  Transaction,
  buildMonthlyArchive,
  exportTransactionsToCSV,
  formatBengaliDate,
  formatBengaliMonth,
  formatNumber,
  formatTaka,
  shiftMonthISO,
  summarizeTransactions,
} from '@/lib/ledger';

interface MonthlyArchiveManagerProps {
  transactions: Transaction[];
  archives: MonthlyArchive[];
  currentMonthISO: string;
  todayISO: string;
  useBengaliDigits: boolean;
  onSaveArchive: (
    archive: MonthlyArchive,
    options?: {
      carryForwardToNextMonth?: boolean;
      clearActiveMonthTransactions?: boolean;
    }
  ) => void;
  onDeleteArchive: (month: string) => void;
  onToast: (msg: string) => void;
}

export default function MonthlyArchiveManager({
  transactions,
  archives,
  currentMonthISO,
  todayISO,
  useBengaliDigits,
  onSaveArchive,
  onDeleteArchive,
  onToast,
}: MonthlyArchiveManagerProps) {
  // All months present in active transactions or saved archives + current month
  const selectableMonths = useMemo(() => {
    const set = new Set<string>();
    if (currentMonthISO) set.add(currentMonthISO);
    for (const tx of transactions) {
      if (tx.date?.length >= 7) set.add(tx.date.slice(0, 7));
    }
    for (const ar of archives) {
      if (ar.month?.length >= 7) set.add(ar.month);
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [transactions, archives, currentMonthISO]);

  const [customSelectedMonth, setCustomSelectedMonth] = useState<string | null>(null);
  const selectedMonth =
    customSelectedMonth && selectableMonths.includes(customSelectedMonth)
      ? customSelectedMonth
      : currentMonthISO || selectableMonths[0] || '';

  const [closingNote, setClosingNote] = useState('');
  const [carryForward, setCarryForward] = useState(false);
  const [clearMonthAfterSave, setClearMonthAfterSave] = useState(false);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [deleteTargetMonth, setDeleteTargetMonth] = useState<string | null>(null);

  const selectedMonthTx = useMemo(
    () => transactions.filter((tx) => tx.date.slice(0, 7) === selectedMonth),
    [transactions, selectedMonth]
  );
  const selectedSummary = useMemo(
    () => summarizeTransactions(selectedMonthTx),
    [selectedMonthTx]
  );

  const savedByMonth = useMemo(() => {
    const map = new Map<string, MonthlyArchive>();
    for (const ar of archives) {
      map.set(ar.month, ar);
    }
    return map;
  }, [archives]);

  const isSelectedAlreadySaved = Boolean(selectedMonth && savedByMonth.has(selectedMonth));

  const handleCloseMonth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMonth) return;

    const archive = buildMonthlyArchive(
      selectedMonth,
      selectedMonthTx,
      todayISO || `${selectedMonth}-01`,
      closingNote
    );

    onSaveArchive(archive, {
      carryForwardToNextMonth: carryForward && archive.netBalance > 0,
      clearActiveMonthTransactions: clearMonthAfterSave,
    });
    setClosingNote('');
    setCarryForward(false);
    setClearMonthAfterSave(false);
    setExpandedMonth(selectedMonth);
  };

  // Merge saved archives + unsaved active months into one chronological list
  const combinedMonthlyRows = useMemo(() => {
    const sortedArchives = [...archives].sort((a, b) => b.month.localeCompare(a.month));
    const savedMonthsSet = new Set(sortedArchives.map((a) => a.month));

    const unsavedMonths = Array.from(
      new Set(
        transactions
          .map((tx) => tx.date.slice(0, 7))
          .filter((m) => m && !savedMonthsSet.has(m))
      )
    ).sort((a, b) => b.localeCompare(a));

    return {
      saved: sortedArchives,
      unsaved: unsavedMonths.map((month) => {
        const list = transactions.filter((tx) => tx.date.slice(0, 7) === month);
        return {
          month,
          transactions: [...list].sort((a, b) => b.date.localeCompare(a.date)),
          summary: summarizeTransactions(list),
        };
      }),
    };
  }, [archives, transactions]);

  const nextMonthLabel = selectedMonth
    ? formatBengaliMonth(shiftMonthISO(selectedMonth, 1), useBengaliDigits)
    : '';

  return (
    <div className="space-y-5">
      {/* Month-End Close Form */}
      <form
        onSubmit={handleCloseMonth}
        className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              মাস শেষ করুন ও হিসাব সেভ রাখুন
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              মাস শেষে এই বাটনে চাপ দিলে সেই মাসের মোট আয়, খরচ, সঞ্চয় ও সব লেনদেন স্থায়ীভাবে এখানে সংরক্ষিত থাকবে।
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E7F6EE] text-[#137C50] flex items-center justify-center shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label
              htmlFor="archive-month-select"
              className="block text-xs font-semibold text-slate-600 mb-1.5"
            >
              কোন মাস শেষ / সেভ করবেন?
            </label>
            <select
              id="archive-month-select"
              value={selectedMonth}
              onChange={(e) => setCustomSelectedMonth(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#137C50]"
            >
              {selectableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatBengaliMonth(m, useBengaliDigits)}
                  {m === currentMonthISO ? ' (চলতি মাস)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="archive-note"
              className="block text-xs font-semibold text-slate-600 mb-1.5"
            >
              মাস শেষের নোট (ঐচ্ছিক)
            </label>
            <input
              id="archive-note"
              type="text"
              maxLength={120}
              value={closingNote}
              onChange={(e) => setClosingNote(e.target.value)}
              placeholder="যেমন: মাসের সব হিসাব মিলানো হয়েছে"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#137C50]"
            />
          </div>
        </div>

        {/* Live Month Preview */}
        <div className="grid grid-cols-3 gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
          <div>
            <span className="block text-[11px] text-slate-500">মোট জমা / আয়</span>
            <span className="block text-sm sm:text-base font-bold tabular-nums text-[#137C50] mt-0.5">
              {formatTaka(selectedSummary.income, useBengaliDigits)}
            </span>
          </div>
          <div>
            <span className="block text-[11px] text-slate-500">মোট খরচ</span>
            <span className="block text-sm sm:text-base font-bold tabular-nums text-[#DC2626] mt-0.5">
              {formatTaka(selectedSummary.expense, useBengaliDigits)}
            </span>
          </div>
          <div>
            <span className="block text-[11px] text-slate-500">নিট ব্যালেন্স</span>
            <span
              className={`block text-sm sm:text-base font-bold tabular-nums mt-0.5 ${
                selectedSummary.balance >= 0 ? 'text-slate-900' : 'text-[#DC2626]'
              }`}
            >
              {formatTaka(selectedSummary.balance, useBengaliDigits)}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500 tabular-nums">
          নির্বাচিত মাসে মোট লেনদেন:{' '}
          <strong className="text-slate-800">
            {formatNumber(selectedSummary.count, useBengaliDigits, 0)}টি
          </strong>
          {isSelectedAlreadySaved && (
            <>
              {' '}
              · <span className="text-[#137C50] font-semibold">আগে থেকেই সেভ করা আছে (আপডেট হবে)</span>
            </>
          )}
        </p>

        {/* Optional Month-End Workflows */}
        <div className="space-y-2 pt-1">
          {selectedSummary.balance > 0 && (
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={carryForward}
                onChange={(e) => setCarryForward(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-[#137C50]"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                পরবর্তী মাসে ({nextMonthLabel}) নিট ব্যালেন্স{' '}
                <strong className="tabular-nums text-[#137C50]">
                  {formatTaka(selectedSummary.balance, useBengaliDigits)}
                </strong>{' '}
                শুরুর জের হিসেবে যোগ করুন
              </span>
            </label>
          )}

          {selectedMonthTx.length > 0 && (
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={clearMonthAfterSave}
                onChange={(e) => setClearMonthAfterSave(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-[#137C50]"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                আর্কাইভে সেভ করার পর সক্রিয় তালিকা থেকে এই মাসের এন্ট্রিগুলো সরিয়ে পরিষ্কার রাখুন
              </span>
            </label>
          )}
        </div>

        <button
          type="submit"
          disabled={!selectedMonth}
          className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-xl bg-[#137C50] hover:bg-[#0F6842] disabled:opacity-40 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isSelectedAlreadySaved ? 'মাসের হিসাব আপডেট ও সেভ করুন' : 'মাস শেষ করে হিসাব সেভ করুন'}
        </button>
      </form>

      {/* Saved Monthly Archives */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900">
            সংরক্ষিত প্রতি মাসের হিসাব ({formatNumber(combinedMonthlyRows.saved.length, useBengaliDigits, 0)})
          </h3>
        </div>

        {combinedMonthlyRows.saved.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 text-center">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-2.5">
              <Archive className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              এখনো কোনো মাসের হিসাব মাস-শেষে সেভ করা হয়নি
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              ওপরের অংশ থেকে যেকোনো মাস নির্বাচন করে &quot;মাস শেষ করে হিসাব সেভ করুন&quot; চাপলে প্রতি মাসের পূর্ণ হিসাব এখানে স্থায়ীভাবে জমা থাকবে।
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {combinedMonthlyRows.saved.map((ar) => {
              const isExpanded = expandedMonth === ar.month;
              return (
                <div
                  key={ar.month}
                  className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden"
                >
                  <div className="p-4 sm:p-5 space-y-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h4 className="text-base font-bold text-slate-900">
                          {formatBengaliMonth(ar.month, useBengaliDigits)}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                          <span className="text-[#137C50] font-semibold">সেভড</span>
                          {' · '}
                          সংরক্ষণ: {formatBengaliDate(ar.closedAt, useBengaliDigits)}
                          {' · '}
                          {formatNumber(ar.transactionCount, useBengaliDigits, 0)}টি লেনদেন
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedMonth(isExpanded ? null : ar.month)}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        {isExpanded ? (
                          <>
                            বন্ধ করুন
                            <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            বিস্তারিত দেখুন
                            <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                      <div>
                        <span className="block text-[11px] text-slate-500">মোট জমা</span>
                        <span className="block text-sm font-bold tabular-nums text-[#137C50] mt-0.5">
                          {formatTaka(ar.totalIncome, useBengaliDigits)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-slate-500">মোট খরচ</span>
                        <span className="block text-sm font-bold tabular-nums text-[#DC2626] mt-0.5">
                          {formatTaka(ar.totalExpense, useBengaliDigits)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-slate-500">নিট ব্যালেন্স</span>
                        <span
                          className={`block text-sm font-bold tabular-nums mt-0.5 ${
                            ar.netBalance >= 0 ? 'text-slate-900' : 'text-[#DC2626]'
                          }`}
                        >
                          {formatTaka(ar.netBalance, useBengaliDigits)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5 space-y-4">
                      {ar.note && (
                        <p className="text-xs text-slate-700 bg-white border border-slate-200/80 rounded-xl px-3.5 py-2.5">
                          নোট: {ar.note}
                        </p>
                      )}

                      {/* Category breakdown inside archive */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5">
                          <h5 className="text-xs font-bold text-slate-800 mb-2">
                            খাতভিত্তিক জমা / আয়
                          </h5>
                          {ar.incomeByCategory.length === 0 ? (
                            <p className="text-xs text-slate-400">কোনো জমা নেই</p>
                          ) : (
                            <div className="space-y-1.5">
                              {ar.incomeByCategory.map((c) => (
                                <div key={c.name} className="flex justify-between text-xs">
                                  <span className="text-slate-600">{c.name}</span>
                                  <span className="font-semibold tabular-nums text-[#137C50]">
                                    {formatTaka(c.amount, useBengaliDigits)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5">
                          <h5 className="text-xs font-bold text-slate-800 mb-2">
                            খাতভিত্তিক খরচ / ব্যয়
                          </h5>
                          {ar.expenseByCategory.length === 0 ? (
                            <p className="text-xs text-slate-400">কোনো খরচ নেই</p>
                          ) : (
                            <div className="space-y-1.5">
                              {ar.expenseByCategory.map((c) => (
                                <div key={c.name} className="flex justify-between text-xs">
                                  <span className="text-slate-600">{c.name}</span>
                                  <span className="font-semibold tabular-nums text-[#DC2626]">
                                    {formatTaka(c.amount, useBengaliDigits)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Saved transactions list */}
                      {ar.transactions.length > 0 && (
                        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
                          <div className="px-3.5 py-2.5 border-b border-slate-100 text-xs font-bold text-slate-700">
                            এই মাসের সংরক্ষিত লেনদেনসমূহ
                          </div>
                          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                            {ar.transactions.map((tx) => (
                              <div
                                key={tx.id}
                                className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs"
                              >
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-800 truncate">{tx.desc}</p>
                                  <p className="text-slate-500 mt-0.5">
                                    {formatBengaliDate(tx.date, useBengaliDigits)} · {tx.category}
                                  </p>
                                </div>
                                <span
                                  className={`font-bold tabular-nums whitespace-nowrap ${
                                    tx.type === 'in' ? 'text-[#137C50]' : 'text-[#DC2626]'
                                  }`}
                                >
                                  {tx.type === 'in' ? '+' : '−'}
                                  {formatTaka(tx.amount, useBengaliDigits)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          disabled={ar.transactions.length === 0}
                          onClick={() => {
                            exportTransactionsToCSV(ar.transactions);
                            onToast(`${formatBengaliMonth(ar.month, useBengaliDigits)}-এর CSV ডাউনলোড হয়েছে`);
                          }}
                          className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-[#137C50]" />
                          এই মাসের CSV ডাউনলোড
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTargetMonth(ar.month)}
                          className="min-h-[40px] px-3.5 py-2 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-xs font-semibold text-[#DC2626] inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          আর্কাইভ থেকে মুছুন
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Unsaved Active Months Quick Action */}
      {combinedMonthlyRows.unsaved.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <h3 className="text-sm font-bold text-slate-800">
            সক্রিয় কিন্তু এখনো মাস-শেষ সেভ করা হয়নি
          </h3>
          <div className="space-y-2.5">
            {combinedMonthlyRows.unsaved.map((row) => (
              <div
                key={row.month}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {formatBengaliMonth(row.month, useBengaliDigits)}
                    {row.month === currentMonthISO ? ' · চলতি মাস' : ''}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                    জমা: {formatTaka(row.summary.income, useBengaliDigits)} · খরচ:{' '}
                    {formatTaka(row.summary.expense, useBengaliDigits)} · নিট:{' '}
                    <strong className="text-slate-800">
                      {formatTaka(row.summary.balance, useBengaliDigits)}
                    </strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const archive = buildMonthlyArchive(
                      row.month,
                      row.transactions,
                      todayISO || `${row.month}-01`
                    );
                    onSaveArchive(archive);
                    setExpandedMonth(row.month);
                  }}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#E7F6EE] hover:bg-[#d5efe1] text-[#137C50] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  এখনই সেভ করুন
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTargetMonth)}
        title="সংরক্ষিত মাসিক হিসাব মুছবেন?"
        description={
          deleteTargetMonth
            ? `${formatBengaliMonth(deleteTargetMonth, useBengaliDigits)}-এর সংরক্ষিত মাস-শেষ আর্কাইভ স্থায়ীভাবে মুছে যাবে।`
            : ''
        }
        confirmLabel="হ্যাঁ, মুছুন"
        onConfirm={() => {
          if (deleteTargetMonth) {
            onDeleteArchive(deleteTargetMonth);
            if (expandedMonth === deleteTargetMonth) setExpandedMonth(null);
            setDeleteTargetMonth(null);
          }
        }}
        onCancel={() => setDeleteTargetMonth(null)}
      />
    </div>
  );
}
