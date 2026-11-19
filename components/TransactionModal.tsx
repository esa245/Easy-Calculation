'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, ArrowDownLeft, ArrowUpRight, Check } from 'lucide-react';
import {
  CADENCE_OPTIONS,
  Cadence,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  Transaction,
  TransactionType,
  formatNumber,
  getTodayISO,
} from '@/lib/ledger';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: Omit<Transaction, 'id' | 'createdAt'>, existingId?: string) => void;
  initialType?: TransactionType;
  initialCadence?: Cadence;
  initialDate?: string;
  initialAmount?: number;
  initialDesc?: string;
  editingTx?: Transaction | null;
  useBengaliDigits: boolean;
  incomeCategories: string[];
  expenseCategories: string[];
  onOpenCategorySettings?: () => void;
  onAddQuickCategory?: (type: TransactionType, categoryName: string) => void;
}

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

function TransactionModalBody({
  onClose,
  onSave,
  initialType = 'in',
  initialCadence = 'দৈনিক',
  initialDate,
  initialAmount,
  initialDesc,
  editingTx,
  useBengaliDigits,
  incomeCategories,
  expenseCategories,
  onOpenCategorySettings,
  onAddQuickCategory,
}: Omit<TransactionModalProps, 'open'>) {
  const safeIncomeCats = incomeCategories.length > 0 ? incomeCategories : INCOME_CATEGORIES;
  const safeExpenseCats = expenseCategories.length > 0 ? expenseCategories : EXPENSE_CATEGORIES;

  const [type, setType] = useState<TransactionType>(
    editingTx ? editingTx.type : initialType
  );
  const [cadence, setCadence] = useState<Cadence>(
    editingTx ? editingTx.cadence : initialCadence
  );
  const [category, setCategory] = useState<string>(
    editingTx
      ? editingTx.category
      : initialType === 'in'
      ? safeIncomeCats[0]
      : safeExpenseCats[0]
  );
  const [desc, setDesc] = useState(editingTx ? editingTx.desc : initialDesc ?? '');
  const [amount, setAmount] = useState(
    editingTx
      ? String(editingTx.amount)
      : initialAmount !== undefined && initialAmount > 0
      ? String(initialAmount)
      : ''
  );
  const [date, setDate] = useState(
    editingTx ? editingTx.date : initialDate || getTodayISO()
  );
  const [note, setNote] = useState(editingTx?.note ?? '');
  const [errorMsg, setErrorMsg] = useState('');
  const [customCatMode, setCustomCatMode] = useState(false);
  const [customCatInput, setCustomCatInput] = useState('');

  const baseCategories = type === 'in' ? safeIncomeCats : safeExpenseCats;
  const categories = baseCategories.includes(category)
    ? baseCategories
    : [category, ...baseCategories];

  const handleTypeSwitch = (nextType: TransactionType) => {
    setType(nextType);
    const nextList = nextType === 'in' ? safeIncomeCats : safeExpenseCats;
    if (!nextList.includes(category)) {
      setCategory(nextList[0]);
    }
  };

  const handleQuickAddAmount = (val: number) => {
    const current = Number(amount) || 0;
    setAmount(String(current + val));
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setErrorMsg('সঠিক টাকার পরিমাণ (০-এর বেশি) লিখুন।');
      return;
    }
    if (!date) {
      setErrorMsg('অনুগ্রহ করে তারিখ নির্বাচন করুন।');
      return;
    }

    const finalCategory = customCatMode && customCatInput.trim()
      ? customCatInput.trim()
      : category;

    if (customCatMode && customCatInput.trim() && onAddQuickCategory) {
      onAddQuickCategory(type, finalCategory);
    }

    const finalDesc = desc.trim() || finalCategory || (type === 'in' ? 'জমা / আয়' : 'খরচ');

    onSave(
      {
        desc: finalDesc,
        amount: Math.round(numericAmount * 100) / 100,
        type,
        cadence,
        category: finalCategory,
        date,
        note: note.trim() || undefined,
      },
      editingTx?.id
    );
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-xl max-h-[94dvh] overflow-y-auto"
    >
      {/* Mobile drag handle */}
      <div className="sm:hidden flex justify-center pt-2">
        <div className="w-8 h-1 rounded-full bg-slate-300" />
      </div>

      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
        <h2 id="tx-modal-title" className="text-sm sm:text-base font-bold text-slate-900">
          {editingTx ? 'লেনদেন সম্পাদনা' : 'নতুন লেনদেন'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="বন্ধ করুন"
          className="min-w-[36px] min-h-[36px] -mr-1.5 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-3 space-y-2.5">
        {/* Type Selector */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleTypeSwitch('in')}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
              type === 'in'
                ? 'bg-[#E7F6EE] border-[#137C50] text-[#137C50]'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
            জমা / আয়
          </button>
          <button
            type="button"
            onClick={() => handleTypeSwitch('out')}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
              type === 'out'
                ? 'bg-[#FEF2F2] border-[#DC2626] text-[#DC2626]'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            খরচ / উত্তোলন
          </button>
        </div>

        {/* Amount + Quick Add */}
        <div>
          <label htmlFor="tx-amount" className="block text-[11px] font-semibold text-slate-600 mb-1">
            টাকার পরিমাণ (৳)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
              ৳
            </span>
            <input
              id="tx-amount"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              placeholder="৫০০"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrorMsg('');
              }}
              className="w-full min-h-[42px] pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-base font-bold tabular-nums text-slate-900 focus:outline-none focus:border-[#137C50] focus:ring-2 focus:ring-[#137C50]/15"
              required
            />
          </div>
          <div className="grid grid-cols-4 gap-1.5 mt-1.5">
            {QUICK_AMOUNTS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAddAmount(val)}
                className="px-1.5 py-1 min-h-[30px] rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 tabular-nums transition-colors whitespace-nowrap"
              >
                +৳{formatNumber(val, useBengaliDigits, 0)}
              </button>
            ))}
          </div>
        </div>

        {/* Description (Optional) */}
        <div>
          <label htmlFor="tx-desc" className="block text-[11px] font-semibold text-slate-600 mb-1">
            বিবরণ (ঐচ্ছিক)
          </label>
          <input
            id="tx-desc"
            type="text"
            maxLength={120}
            placeholder={
              type === 'in'
                ? 'না লিখলেও চলবে — যেমন: নগদ বিক্রয় বা বেতন'
                : 'না লিখলেও চলবে — যেমন: বাজার বা বিল'
            }
            value={desc}
            onChange={(e) => {
              setDesc(e.target.value);
              setErrorMsg('');
            }}
            className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#137C50] focus:ring-2 focus:ring-[#137C50]/15"
          />
        </div>

        {/* Cadence */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            সময়কাল
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {CADENCE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setCadence(opt)}
                className={`min-h-[36px] px-1.5 py-1 rounded-xl border text-[11px] sm:text-xs font-semibold transition-colors whitespace-nowrap ${
                  cadence === opt
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Category + Date (side-by-side on mobile too to avoid scrolling) */}
        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1">
              <label htmlFor="tx-category" className="block text-[11px] font-semibold text-slate-600 truncate">
                খাত
              </label>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCustomCatMode((prev) => !prev);
                    setCustomCatInput('');
                  }}
                  className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 whitespace-nowrap"
                >
                  {customCatMode ? 'তালিকা' : '+ নতুন'}
                </button>
                {onOpenCategorySettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCategorySettings();
                    }}
                    className="text-[10px] font-semibold text-[#137C50] hover:underline whitespace-nowrap"
                  >
                    সাজান
                  </button>
                )}
              </div>
            </div>
            {customCatMode ? (
              <input
                id="tx-category"
                type="text"
                maxLength={50}
                value={customCatInput}
                onChange={(e) => setCustomCatInput(e.target.value)}
                placeholder="খাতের নাম..."
                autoFocus
                className="w-full min-h-[40px] px-2.5 py-1.5 rounded-xl border border-[#137C50] bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#137C50]/15"
              />
            ) : (
              <select
                id="tx-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full min-h-[40px] px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#137C50] focus:ring-2 focus:ring-[#137C50]/15"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="min-w-0">
            <label htmlFor="tx-date" className="block text-[11px] font-semibold text-slate-600 mb-1">
              তারিখ
            </label>
            <input
              id="tx-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-h-[40px] px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 tabular-nums focus:outline-none focus:border-[#137C50] focus:ring-2 focus:ring-[#137C50]/15"
              required
            />
          </div>
        </div>

        {/* Optional Note */}
        <div>
          <input
            id="tx-note"
            type="text"
            maxLength={160}
            aria-label="অতিরিক্ত নোট (ঐচ্ছিক)"
            placeholder="নোট (ঐচ্ছিক) — নগদ / বিকাশ / রসিদ নম্বর"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#137C50] focus:ring-2 focus:ring-[#137C50]/15"
          />
        </div>

        {errorMsg && (
          <p role="alert" className="text-[11px] font-semibold text-[#DC2626] bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {errorMsg}
          </p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            বাতিল
          </button>
          <button
            type="submit"
            className="flex-1 min-h-[42px] px-4 py-2 rounded-xl bg-[#137C50] hover:bg-[#0F6842] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Check className="w-4 h-4" />
            {editingTx ? 'পরিবর্তন সংরক্ষণ' : 'সংরক্ষণ করুন'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

export default function TransactionModal({
  open,
  onClose,
  onSave,
  initialType = 'in',
  initialCadence = 'দৈনিক',
  initialDate,
  initialAmount,
  initialDesc,
  editingTx,
  useBengaliDigits,
  incomeCategories,
  expenseCategories,
  onOpenCategorySettings,
  onAddQuickCategory,
}: TransactionModalProps) {
  const formKey = editingTx
    ? `edit_${editingTx.id}`
    : `new_${initialType}_${initialCadence}_${initialDate ?? 'today'}_${initialAmount ?? ''}_${initialDesc ?? ''}_${incomeCategories[0] ?? ''}_${expenseCategories[0] ?? ''}`;

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tx-modal-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px]"
          />

          <TransactionModalBody
            key={formKey}
            onClose={onClose}
            onSave={onSave}
            initialType={initialType}
            initialCadence={initialCadence}
            initialDate={initialDate}
            initialAmount={initialAmount}
            initialDesc={initialDesc}
            editingTx={editingTx}
            useBengaliDigits={useBengaliDigits}
            incomeCategories={incomeCategories}
            expenseCategories={expenseCategories}
            onOpenCategorySettings={onOpenCategorySettings}
            onAddQuickCategory={onAddQuickCategory}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
