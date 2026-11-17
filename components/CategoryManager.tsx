'use client';

import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Briefcase,
  Check,
  Home,
  Pencil,
  Plus,
  RotateCcw,
  Store,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  SECTOR_PRESETS,
  SectorPreset,
  TransactionType,
  formatNumber,
} from '@/lib/ledger';

interface CategoryManagerProps {
  accountSector: string;
  incomeCategories: string[];
  expenseCategories: string[];
  useBengaliDigits: boolean;
  onUpdateCategories: (
    type: TransactionType,
    nextList: string[],
    renamedFromTo?: { from: string; to: string }
  ) => void;
  onApplySector: (
    sectorName: string,
    nextIncomeCategories: string[],
    nextExpenseCategories: string[]
  ) => void;
  onRenameSector: (sectorName: string) => void;
  onToast: (msg: string) => void;
}

const SECTOR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  personal: Home,
  shop: Store,
  association: Users,
  service: Briefcase,
};

export default function CategoryManager({
  accountSector,
  incomeCategories,
  expenseCategories,
  useBengaliDigits,
  onUpdateCategories,
  onApplySector,
  onRenameSector,
  onToast,
}: CategoryManagerProps) {
  const [activeTab, setActiveTab] = useState<TransactionType>('out');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // Sector selection & custom sector rename
  const [pendingPreset, setPendingPreset] = useState<SectorPreset | null>(null);
  const [editingSector, setEditingSector] = useState(false);
  const [sectorInput, setSectorInput] = useState(accountSector);

  const list = activeTab === 'out' ? expenseCategories : incomeCategories;

  const matchedPreset = SECTOR_PRESETS.find((s) => s.name === accountSector);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (list.includes(trimmed)) {
      onToast('এই খাতটি তালিকায় আগে থেকেই রয়েছে');
      return;
    }
    const next = [trimmed, ...list];
    onUpdateCategories(activeTab, next);
    setNewCategoryName('');
    onToast(`"${trimmed}" সবার ওপরে যোগ করা হয়েছে`);
  };

  const handleMove = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onUpdateCategories(activeTab, next);
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditingValue(list[index]);
  };

  const saveEdit = (index: number) => {
    const oldName = list[index];
    const trimmed = editingValue.trim();
    if (!trimmed) {
      setEditingIndex(null);
      return;
    }
    if (trimmed !== oldName && list.includes(trimmed)) {
      onToast('একই নামের খাত আগে থেকেই আছে');
      return;
    }
    const next = list.map((item, idx) => (idx === index ? trimmed : item));
    onUpdateCategories(
      activeTab,
      next,
      trimmed !== oldName ? { from: oldName, to: trimmed } : undefined
    );
    setEditingIndex(null);
    onToast('খাতের নাম পরিবর্তন করা হয়েছে');
  };

  const handleDelete = (index: number) => {
    if (list.length <= 1) {
      onToast('কমপক্ষে একটি খাত তালিকায় থাকতে হবে');
      return;
    }
    const removed = list[index];
    const next = list.filter((_, idx) => idx !== index);
    onUpdateCategories(activeTab, next);
    if (editingIndex === index) setEditingIndex(null);
    onToast(`"${removed}" তালিকা থেকে সরানো হয়েছে`);
  };

  const handleResetDefaults = () => {
    const defaults =
      activeTab === 'out'
        ? matchedPreset?.expenseCategories ?? EXPENSE_CATEGORIES
        : matchedPreset?.incomeCategories ?? INCOME_CATEGORIES;
    onUpdateCategories(activeTab, defaults);
    setEditingIndex(null);
    onToast(`"${accountSector}"-এর ডিফল্ট খাত ফিরিয়ে আনা হয়েছে`);
  };

  const applyPreset = (preset: SectorPreset, mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      onApplySector(preset.name, preset.incomeCategories, preset.expenseCategories);
    } else {
      const mergedIncome = Array.from(
        new Set([...preset.incomeCategories, ...incomeCategories])
      );
      const mergedExpense = Array.from(
        new Set([...preset.expenseCategories, ...expenseCategories])
      );
      onApplySector(preset.name, mergedIncome, mergedExpense);
    }
    setSectorInput(preset.name);
    setPendingPreset(null);
  };

  const saveCustomSectorName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = sectorInput.trim();
    if (!trimmed) return;
    onRenameSector(trimmed);
    setEditingSector(false);
    onToast(`সেক্টরের নাম "${trimmed}" হিসেবে সেভ হয়েছে`);
  };

  return (
    <div className="space-y-5">
      {/* Sector / Use-case Picker (Personal vs Shop vs Association vs Service) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              হিসাবের সেক্টর / ধরন নির্বাচন ও এডিট করুন
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              কেউ ব্যক্তিগত সংসারের হিসাব, কেউ দোকান বা ব্যবসার হিসাব রাখেন — আপনার সেক্টর বেছে নিলে সেই অনুযায়ী খাত তৈরি হয়ে যাবে এবং যেকোনো খাত এডিট করতে পারবেন।
            </p>
          </div>
        </div>

        {/* Active Sector Bar with Rename */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5">
          {editingSector ? (
            <form onSubmit={saveCustomSectorName} className="flex items-center gap-2 w-full">
              <input
                type="text"
                maxLength={50}
                value={sectorInput}
                onChange={(e) => setSectorInput(e.target.value)}
                placeholder="যেমন: মুদি দোকান, ফার্মেসি, ব্যক্তিগত..."
                autoFocus
                className="flex-1 min-w-0 min-h-[38px] px-3 py-1.5 rounded-lg border border-[#137C50] bg-white text-sm text-slate-900 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="সেক্টর নাম সংরক্ষণ"
                className="min-w-[38px] min-h-[38px] px-3 rounded-lg bg-[#137C50] text-white text-xs font-semibold inline-flex items-center gap-1 hover:bg-[#0F6842]"
              >
                <Check className="w-4 h-4" />
                সেভ
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingSector(false);
                  setSectorInput(accountSector);
                }}
                aria-label="বাতিল"
                className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <>
              <div className="text-xs text-slate-600">
                বর্তমান সেক্টর:{' '}
                <strong className="text-slate-900 font-bold">{accountSector}</strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSectorInput(accountSector);
                  setEditingSector(true);
                }}
                className="text-xs font-semibold text-[#137C50] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
              >
                <Pencil className="w-3.5 h-3.5" />
                সেক্টরের নাম এডিট করুন
              </button>
            </>
          )}
        </div>

        {/* Sector Preset Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {SECTOR_PRESETS.map((preset) => {
            const Icon = SECTOR_ICONS[preset.id] ?? Store;
            const isActive = accountSector === preset.name;
            const isSelectedPending = pendingPreset?.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setPendingPreset(isSelectedPending ? null : preset)}
                className={`p-3.5 rounded-xl border text-left transition-colors flex items-start gap-3 ${
                  isSelectedPending
                    ? 'border-[#137C50] bg-[#E7F6EE]/50'
                    : isActive
                    ? 'border-[#137C50]/60 bg-[#E7F6EE]/25'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive || isSelectedPending
                      ? 'bg-[#E7F6EE] text-[#137C50]'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900 truncate">
                      {preset.name}
                    </span>
                    {isActive && (
                      <span className="text-[11px] font-semibold text-[#137C50] shrink-0">
                        চালু আছে
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Pending Sector Preview & Confirmation */}
        {pendingPreset && (
          <div className="border border-[#137C50]/30 bg-[#E7F6EE]/30 rounded-xl p-4 space-y-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                &quot;{pendingPreset.name}&quot; সেক্টরের খাতসমূহ:
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                <strong>আয়:</strong> {pendingPreset.incomeCategories.join(' · ')}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                <strong>খরচ:</strong> {pendingPreset.expenseCategories.join(' · ')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => applyPreset(pendingPreset, 'replace')}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#137C50] hover:bg-[#0F6842] text-white text-xs font-semibold transition-colors"
              >
                এই সেক্টরের খাত চালু করুন
              </button>
              <button
                type="button"
                onClick={() => applyPreset(pendingPreset, 'merge')}
                className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                আগের খাতের সাথে যোগ করুন
              </button>
              <button
                type="button"
                onClick={() => setPendingPreset(null)}
                className="min-h-[40px] px-3 py-2 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold"
              >
                বাতিল
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Category Editor List */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              খাত / ক্যাটাগরি সাজান ও এডিট করুন
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              যেকোনো খাত নতুন যোগ করুন, নাম এডিট করুন অথবা তীর (↑ ↓) চেপে ওপরে-নিচে সাজান। সবার ওপরের খাতটি নতুন লেনদেনে প্রথমে থাকবে।
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-600 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            ডিফল্ট তালিকা
          </button>
        </div>

        {/* Type Switcher */}
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('out');
              setEditingIndex(null);
            }}
            className={`px-4 py-2 min-h-[38px] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'out'
                ? 'bg-white text-[#DC2626] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            খরচের খাত ({formatNumber(expenseCategories.length, useBengaliDigits, 0)})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('in');
              setEditingIndex(null);
            }}
            className={`px-4 py-2 min-h-[38px] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'in'
                ? 'bg-white text-[#137C50] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            আয়ের খাত ({formatNumber(incomeCategories.length, useBengaliDigits, 0)})
          </button>
        </div>

        {/* Add Custom Category Form */}
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            maxLength={50}
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder={
              activeTab === 'out'
                ? 'নতুন খরচের খাত লিখুন (যেমন: মাল ক্রয়, দোকান ভাড়া, নাস্তা)'
                : 'নতুন আয়ের খাত লিখুন (যেমন: নগদ বিক্রয়, বাকি আদায়, টিউশনি)'
            }
            className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#137C50]"
          />
          <button
            type="submit"
            disabled={!newCategoryName.trim()}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#137C50] hover:bg-[#0F6842] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            যোগ করুন
          </button>
        </form>

        {/* Ordered Category List */}
        <div className="border border-slate-200/90 rounded-xl divide-y divide-slate-100 overflow-hidden">
          {list.map((cat, index) => {
            const isEditing = editingIndex === index;
            return (
              <div
                key={`${activeTab}_${cat}_${index}`}
                className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="text-xs font-semibold text-slate-400 tabular-nums w-6 shrink-0">
                    {formatNumber(index + 1, useBengaliDigits, 0)}.
                  </span>

                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <input
                        type="text"
                        maxLength={50}
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            saveEdit(index);
                          } else if (e.key === 'Escape') {
                            setEditingIndex(null);
                          }
                        }}
                        autoFocus
                        className="flex-1 min-w-0 min-h-[38px] px-3 py-1.5 rounded-lg border border-[#137C50] text-sm text-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => saveEdit(index)}
                        aria-label="নাম সংরক্ষণ করুন"
                        className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-lg bg-[#137C50] text-white hover:bg-[#0F6842] transition-colors shrink-0"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingIndex(null)}
                        aria-label="বাতিল করুন"
                        className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{cat}</p>
                      {index === 0 && (
                        <p className="text-[11px] text-[#137C50]">
                          প্রধান পছন্দ · নতুন লেনদেনে সবার আগে থাকবে
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, -1)}
                      aria-label={`${cat} ওপরে নিন`}
                      title="ওপরে নিন"
                      className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === list.length - 1}
                      onClick={() => handleMove(index, 1)}
                      aria-label={`${cat} নিচে নিন`}
                      title="নিচে নিন"
                      className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(index)}
                      aria-label={`${cat} সম্পাদনা করুন`}
                      title="নাম পরিবর্তন করুন"
                      className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={list.length <= 1}
                      onClick={() => handleDelete(index)}
                      aria-label={`${cat} মুছে ফেলুন`}
                      title="মুছে ফেলুন"
                      className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-lg text-slate-400 hover:text-[#DC2626] hover:bg-red-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
