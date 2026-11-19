'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calculator,
  CalendarClock,
  Check,
  Copy,
  Delete,
  Percent,
  PiggyBank,
  Plus,
  ReceiptText,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { TransactionType, formatNumber, formatTaka, toBengaliDigits } from '@/lib/ledger';

export type CalculatorTab = 'receipt' | 'profit' | 'vat' | 'emi' | 'budget';

interface ReceiptItem {
  id: string;
  name: string;
  expression?: string;
  amount: number;
}

interface HisabCalculatorModalProps {
  onClose: () => void;
  useBengaliDigits: boolean;
  initialTab?: CalculatorTab;
  onApplyToTransaction: (payload: {
    amount: number;
    type: TransactionType;
    desc?: string;
  }) => void;
  onApplyBudgetLimits?: (limits: {
    dailyExpenseLimit: number;
    weeklyExpenseLimit: number;
    monthlyExpenseLimit: number;
    monthlySavingsGoal: number;
  }) => void;
  onToast?: (msg: string) => void;
}

const BN_TO_EN: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

function toEnglishDigits(input: string): string {
  return input.replace(/[০-৯]/g, (ch) => BN_TO_EN[ch] ?? ch);
}

function formatExprDisplay(expr: string, useBn: boolean): string {
  const clean = expr || '0';
  return useBn ? toBengaliDigits(clean) : toEnglishDigits(clean);
}

type Token =
  | { type: 'num'; value: number }
  | { type: 'op'; value: '+' | '-' | '*' | '/' | '%' | '(' | ')' };

function tokenizeExpression(raw: string): Token[] | null {
  const normalized = toEnglishDigits(raw)
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/\s+/g, '');

  if (!normalized) return [];

  const tokens: Token[] = [];
  let i = 0;

  while (i < normalized.length) {
    const ch = normalized[i];
    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let numStr = '';
      let dotCount = 0;
      while (
        i < normalized.length &&
        ((normalized[i] >= '0' && normalized[i] <= '9') || normalized[i] === '.')
      ) {
        if (normalized[i] === '.') {
          dotCount += 1;
          if (dotCount > 1) return null;
        }
        numStr += normalized[i];
        i += 1;
      }
      if (numStr === '.') return null;
      const num = Number(numStr);
      if (!Number.isFinite(num)) return null;
      tokens.push({ type: 'num', value: num });
      continue;
    }

    if (
      ch === '+' ||
      ch === '-' ||
      ch === '*' ||
      ch === '/' ||
      ch === '%' ||
      ch === '(' ||
      ch === ')'
    ) {
      tokens.push({ type: 'op', value: ch });
      i += 1;
      continue;
    }

    return null;
  }

  return tokens;
}

/**
 * Pure TypeScript recursive-descent arithmetic evaluator (no eval / no Function).
 * Supports +, -, *, /, parentheses, unary +/-, and postfix %.
 * In additive context (e.g. 1000 + 15%), the percentage applies to the left-hand term (1000 * 0.15 = 150).
 */
function evaluateMathExpression(raw: string): number | null {
  const tokens = tokenizeExpression(raw);
  if (!tokens || tokens.length === 0) return null;

  let pos = 0;

  function peek(): Token | undefined {
    return tokens?.[pos];
  }

  function consume(): Token | undefined {
    const t = tokens?.[pos];
    pos += 1;
    return t;
  }

  function parseExpression(): number | null {
    let left = parseTerm();
    if (left === null) return null;

    while (true) {
      const next = peek();
      if (!next || next.type !== 'op' || (next.value !== '+' && next.value !== '-')) {
        break;
      }
      consume();
      const right = parseTermWithBase(left);
      if (right === null) return null;
      left = next.value === '+' ? left + right : left - right;
    }
    return left;
  }

  function parseTermWithBase(addBase: number): number | null {
    // Check if single factor followed directly by '%' inside additive op, e.g., 1000 + 15%
    const savedPos = pos;
    const unary = parseFactor(false);
    if (unary !== null) {
      const after = peek();
      if (after && after.type === 'op' && after.value === '%') {
        const afterPct = tokens?.[pos + 1];
        if (!afterPct || (afterPct.type === 'op' && (afterPct.value === '+' || afterPct.value === '-' || afterPct.value === ')'))) {
          consume();
          return (addBase * unary) / 100;
        }
      }
    }
    pos = savedPos;
    return parseTerm();
  }

  function parseTerm(): number | null {
    let left = parseFactor(true);
    if (left === null) return null;

    while (true) {
      const next = peek();
      if (!next || next.type !== 'op' || (next.value !== '*' && next.value !== '/')) {
        break;
      }
      consume();
      const right = parseFactor(true);
      if (right === null) return null;
      if (next.value === '*') {
        left *= right;
      } else {
        if (right === 0) return null;
        left /= right;
      }
    }
    return left;
  }

  function parseFactor(applyPercent: boolean): number | null {
    const t = peek();
    if (!t) return null;

    let val: number | null = null;

    if (t.type === 'op' && (t.value === '+' || t.value === '-')) {
      consume();
      const inner = parseFactor(applyPercent);
      if (inner === null) return null;
      return t.value === '-' ? -inner : inner;
    }

    if (t.type === 'op' && t.value === '(') {
      consume();
      val = parseExpression();
      if (val === null) return null;
      const closeParen = peek();
      if (!closeParen || closeParen.type !== 'op' || closeParen.value !== ')') {
        return null;
      }
      consume();
    } else if (t.type === 'num') {
      consume();
      val = t.value;
    } else {
      return null;
    }

    if (applyPercent) {
      while (peek()?.type === 'op' && peek()?.value === '%') {
        consume();
        val /= 100;
      }
    }

    return val;
  }

  const result = parseExpression();
  if (result === null || pos !== tokens.length || !Number.isFinite(result)) {
    return null;
  }
  return Math.round(result * 10000) / 10000;
}

const OPERATORS = new Set(['+', '-', '×', '÷']);

export default function HisabCalculatorModal({
  onClose,
  useBengaliDigits: appUseBn,
  initialTab = 'receipt',
  onApplyToTransaction,
  onApplyBudgetLimits,
  onToast,
}: HisabCalculatorModalProps) {
  const [bnDigits, setBnDigits] = useState(appUseBn);
  const [activeTab, setActiveTab] = useState<CalculatorTab>(initialTab);

  // Tab 1: Calculator & Receipt state
  const [expr, setExpr] = useState('');
  const [lastValidValue, setLastValidValue] = useState(0);
  const [itemName, setItemName] = useState('');
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [calcError, setCalcError] = useState(false);

  // Tab 2: Profit / Loss & Margin
  const [costPrice, setCostPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [extraCost, setExtraCost] = useState('');
  const [unitQty, setUnitQty] = useState('1');

  // Tab 3: VAT & Discount
  const [basePrice, setBasePrice] = useState('');
  const [discountPct, setDiscountPct] = useState('');
  const [vatPct, setVatPct] = useState('');

  // Tab 4: EMI / Loan
  const [loanAmount, setLoanAmount] = useState('');
  const [annualRate, setAnnualRate] = useState('');
  const [tenureMonths, setTenureMonths] = useState('12');

  // Tab 5: Daily Budget & Savings
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [keptAsideAmount, setKeptAsideAmount] = useState('');
  const [daysInMonth, setDaysInMonth] = useState('30');

  const evaluated = useMemo(() => {
    if (!expr.trim()) return 0;
    return evaluateMathExpression(expr);
  }, [expr]);

  const currentDisplayValue = evaluated !== null ? evaluated : lastValidValue;

  const receiptTotal = useMemo(
    () => receiptItems.reduce((sum, item) => sum + item.amount, 0),
    [receiptItems]
  );

  const appendDigitOrDot = useCallback(
    (char: string) => {
      setCalcError(false);
      setExpr((prev) => {
        if (prev === '0' && char !== '.' && char !== '00') {
          return char;
        }
        if (prev === '' && char === '00') {
          return '0';
        }
        if (prev === '' && char === '.') {
          return '0.';
        }
        if (char === '.') {
          const lastSegment = prev.split(/[+\-×÷()%]/).pop() ?? '';
          if (lastSegment.includes('.')) return prev;
          if (lastSegment === '') return `${prev}0.`;
        }
        return `${prev}${char}`;
      });
    },
    []
  );

  const appendOperator = useCallback((op: string) => {
    setCalcError(false);
    setExpr((prev) => {
      if (!prev) {
        return op === '-' ? '-' : '';
      }
      const last = prev[prev.length - 1];
      if (OPERATORS.has(last)) {
        return `${prev.slice(0, -1)}${op}`;
      }
      if (last === '(' && op !== '-') return prev;
      return `${prev}${op}`;
    });
  }, []);

  const appendParenthesis = useCallback((paren: '(' | ')') => {
    setCalcError(false);
    setExpr((prev) => {
      if (paren === '(') {
        const last = prev[prev.length - 1];
        if (last && ((last >= '0' && last <= '9') || last === ')')) {
          return `${prev}×(`;
        }
        return `${prev}(`;
      }
      const openCount = (prev.match(/\(/g) ?? []).length;
      const closeCount = (prev.match(/\)/g) ?? []).length;
      if (openCount <= closeCount) return prev;
      const last = prev[prev.length - 1];
      if (!last || OPERATORS.has(last) || last === '(') return prev;
      return `${prev})`;
    });
  }, []);

  const appendQuickAdd = useCallback((amountToAdd: number) => {
    setCalcError(false);
    setExpr((prev) => {
      if (!prev) return String(amountToAdd);
      const last = prev[prev.length - 1];
      if (OPERATORS.has(last)) {
        return `${prev}${amountToAdd}`;
      }
      return `${prev}+${amountToAdd}`;
    });
  }, []);

  const handlePercentKey = useCallback(() => {
    setCalcError(false);
    setExpr((prev) => {
      if (!prev) return '';
      const last = prev[prev.length - 1];
      if (OPERATORS.has(last) || last === '(' || last === '%') return prev;
      return `${prev}%`;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setExpr('');
    setLastValidValue(0);
    setCalcError(false);
  }, []);

  const handleClearEntry = useCallback(() => {
    setCalcError(false);
    setExpr((prev) => {
      if (!prev) return '';
      const match = prev.match(/^(.*[+\-×÷(])([^+\-×÷()]+)$/);
      if (match) return match[1];
      return '';
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setCalcError(false);
    setExpr((prev) => prev.slice(0, -1));
  }, []);

  const handleEquals = useCallback(() => {
    if (!expr.trim()) return;
    const res = evaluateMathExpression(expr);
    if (res === null) {
      setCalcError(true);
      return;
    }
    const rounded = Math.round(res * 100) / 100;
    setLastValidValue(rounded);
    setExpr(String(rounded));
    setCalcError(false);
  }, [expr]);

  const handleAddToReceipt = useCallback(() => {
    const val = evaluated !== null ? evaluated : evaluateMathExpression(expr);
    if (val === null || !Number.isFinite(val) || val <= 0) {
      onToast?.('ফর্দে যোগ করার জন্য ০-এর বেশি সঠিক পরিমাণ হিসাব করুন');
      return;
    }
    const rounded = Math.round(val * 100) / 100;
    const cleanName =
      itemName.trim() || `পণ্য / খাত ${formatNumber(receiptItems.length + 1, bnDigits, 0)}`;
    const hasOperator = /[+\-×÷()%]/.test(expr);
    setReceiptItems((prev) => [
      ...prev,
      {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: cleanName,
        expression: hasOperator ? expr : undefined,
        amount: rounded,
      },
    ]);
    setItemName('');
    setExpr('');
    setLastValidValue(0);
    setCalcError(false);
  }, [bnDigits, evaluated, expr, itemName, onToast, receiptItems.length]);

  const handleRemoveReceiptItem = (id: string) => {
    setReceiptItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Keyboard navigation for Receipt Calculator tab
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (activeTab !== 'receipt') return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddToReceipt();
        }
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        appendDigitOrDot(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        appendDigitOrDot('.');
      } else if (e.key === '+') {
        e.preventDefault();
        appendOperator('+');
      } else if (e.key === '-') {
        e.preventDefault();
        appendOperator('-');
      } else if (e.key === '*') {
        e.preventDefault();
        appendOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        appendOperator('÷');
      } else if (e.key === '%') {
        e.preventDefault();
        handlePercentKey();
      } else if (e.key === '(' || e.key === ')') {
        e.preventDefault();
        appendParenthesis(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activeTab,
    appendDigitOrDot,
    appendOperator,
    appendParenthesis,
    handleAddToReceipt,
    handleBackspace,
    handleEquals,
    handlePercentKey,
    onClose,
  ]);

  // Derived Profit/Loss calculations
  const profitMetrics = useMemo(() => {
    const qty = Math.max(1, Number(unitQty) || 1);
    const cost = Math.max(0, Number(costPrice) || 0);
    const extra = Math.max(0, Number(extraCost) || 0);
    const sell = Math.max(0, Number(sellPrice) || 0);
    const totalCost = cost * qty + extra;
    const totalSell = sell * qty;
    const netProfit = totalSell - totalCost;
    const marginPct = totalSell > 0 ? (netProfit / totalSell) * 100 : 0;
    const markupPct = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
    return { qty, totalCost, totalSell, netProfit, marginPct, markupPct };
  }, [costPrice, extraCost, sellPrice, unitQty]);

  // Derived VAT & Discount calculations
  const vatMetrics = useMemo(() => {
    const base = Math.max(0, Number(basePrice) || 0);
    const discPct = Math.max(0, Math.min(100, Number(discountPct) || 0));
    const vatP = Math.max(0, Number(vatPct) || 0);
    const discountAmount = (base * discPct) / 100;
    const afterDiscount = Math.max(0, base - discountAmount);
    const vatAmount = (afterDiscount * vatP) / 100;
    const finalTotal = afterDiscount + vatAmount;
    return { base, discountAmount, afterDiscount, vatAmount, finalTotal };
  }, [basePrice, discountPct, vatPct]);

  // Derived EMI calculations
  const emiMetrics = useMemo(() => {
    const principal = Math.max(0, Number(loanAmount) || 0);
    const annual = Math.max(0, Number(annualRate) || 0);
    const months = Math.max(1, Math.round(Number(tenureMonths) || 1));
    if (principal <= 0) {
      return { emi: 0, totalPayment: 0, totalInterest: 0, months };
    }
    const monthlyRate = annual / 12 / 100;
    if (monthlyRate === 0) {
      const emi = principal / months;
      return { emi, totalPayment: principal, totalInterest: 0, months };
    }
    const factor = Math.pow(1 + monthlyRate, months);
    const emi = (principal * monthlyRate * factor) / (factor - 1);
    const totalPayment = emi * months;
    const totalInterest = totalPayment - principal;
    return { emi, totalPayment, totalInterest, months };
  }, [annualRate, loanAmount, tenureMonths]);

  // Derived Daily Budget & Savings calculations
  const budgetMetrics = useMemo(() => {
    const income = Math.max(0, Number(monthlyIncome) || 0);
    const keptAside = Math.max(0, Number(keptAsideAmount) || 0);
    const days = Math.max(1, Math.min(31, Math.round(Number(daysInMonth) || 30)));
    const spendableMonthly = Math.max(0, income - keptAside);
    const dailyLimit = spendableMonthly / days;
    const weeklyLimit = dailyLimit * 7;
    const savedRatio = income > 0 ? Math.min(100, (keptAside / income) * 100) : 0;
    return { keptAside, spendableMonthly, dailyLimit, weeklyLimit, savedRatio, days };
  }, [daysInMonth, keptAsideAmount, monthlyIncome]);

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onToast?.(`${label} কপি করা হয়েছে`);
    } catch {
      onToast?.('কপি করা যায়নি');
    }
  };

  const tabs: { id: CalculatorTab; label: string; icon: React.ReactNode }[] = [
    { id: 'receipt', label: 'হিসাব ও ফর্দ', icon: <ReceiptText className="w-4 h-4 shrink-0" /> },
    { id: 'profit', label: 'লাভ-ক্ষতি ও মার্জিন', icon: <TrendingUp className="w-4 h-4 shrink-0" /> },
    { id: 'vat', label: 'ভ্যাট ও ডিসকাউন্ট', icon: <Percent className="w-4 h-4 shrink-0" /> },
    { id: 'emi', label: 'কিস্তি / ঋণ (EMI)', icon: <CalendarClock className="w-4 h-4 shrink-0" /> },
    { id: 'budget', label: 'দৈনিক বাজেট ও সঞ্চয়', icon: <PiggyBank className="w-4 h-4 shrink-0" /> },
  ];

  const receiptDescSummary = useMemo(() => {
    if (receiptItems.length === 0) return 'ক্যালকুলেটর হিসাব';
    const names = receiptItems.map((i) => i.name).slice(0, 3);
    const extra = receiptItems.length > 3 ? ` ও আরও ${formatNumber(receiptItems.length - 3, bnDigits, 0)}টি` : '';
    return `ফর্দ: ${names.join(', ')}${extra}`;
  }, [bnDigits, receiptItems]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hisab-calc-title"
    >
      {/* Blurred backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
      />

      {/* Modal Window */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full sm:max-w-4xl bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl max-h-[94dvh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-[#E7F6EE] text-[#137C50] flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5" />
            </span>
            <h2
              id="hisab-calc-title"
              className="text-base sm:text-lg font-bold text-slate-900 truncate"
            >
              হিসাব ক্যালকুলেটর
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setBnDigits((prev) => !prev)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {bnDigits ? 'বাংলা সংখ্যা (১,২,৩)' : 'English (1,2,3)'}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="বন্ধ করুন"
              className="min-w-[40px] min-h-[40px] -mr-1.5 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-slate-100 bg-slate-50/50 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2 min-w-max">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#137C50] text-white shadow-xs'
                      : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F8FAFC]">
          {/* ==================== TAB 1: HISAB & RECEIPT ==================== */}
          {activeTab === 'receipt' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-start">
              {/* Left: Dark Display + Keypad */}
              <div>
                {/* Dark Navy Display Card */}
                <div className="bg-[#0F172A] rounded-2xl p-4 text-white shadow-sm">
                  <div className="flex items-center justify-between gap-2 min-h-[20px]">
                    <span className="text-[11px] font-medium text-slate-400">
                      {calcError ? 'সঠিক গাণিতিক চিহ্ন দিন' : ''}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-300 tabular-nums text-right truncate">
                      {formatExprDisplay(expr || '0', bnDigits)}
                    </span>
                  </div>

                  <div className="mt-1 flex items-baseline justify-end gap-2">
                    <span className="text-lg sm:text-xl font-bold text-slate-400">=</span>
                    <span
                      className={`text-2xl sm:text-3xl font-bold tabular-nums tracking-tight ${
                        calcError ? 'text-amber-400' : 'text-[#10B981]'
                      }`}
                    >
                      {formatTaka(currentDisplayValue, bnDigits)}
                    </span>
                  </div>

                  {/* Item Name + Add to Receipt */}
                  <div className="mt-3.5 flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={60}
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="খাত বা পণ্যের নাম (ঐচ্ছিক — যেমন: চাল, তেল)"
                      className="flex-1 min-w-0 min-h-[42px] px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-[#10B981]"
                    />
                    <button
                      type="button"
                      onClick={handleAddToReceipt}
                      className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#137C50] hover:bg-[#0F6842] text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ফর্দে যোগ</span>
                    </button>
                  </div>
                </div>

                {/* 5-Column Keypad */}
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {/* Row 1 */}
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="min-h-[48px] rounded-xl border border-red-100 bg-[#FEF2F2] hover:bg-red-100/80 text-[#DC2626] text-sm sm:text-base font-bold flex items-center justify-center active:scale-[0.97] transition-all cursor-pointer"
                  >
                    C
                  </button>
                  <button
                    type="button"
                    onClick={handleClearEntry}
                    className="min-h-[48px] rounded-xl border border-amber-100 bg-[#FFFBEB] hover:bg-amber-100/80 text-[#D97706] text-sm sm:text-base font-bold flex items-center justify-center active:scale-[0.97] transition-all cursor-pointer"
                  >
                    CE
                  </button>
                  <button
                    type="button"
                    onClick={() => appendParenthesis('(')}
                    className="min-h-[48px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-base font-bold flex items-center justify-center active:scale-[0.97] transition-all cursor-pointer"
                  >
                    (
                  </button>
                  <button
                    type="button"
                    onClick={() => appendParenthesis(')')}
                    className="min-h-[48px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-base font-bold flex items-center justify-center active:scale-[0.97] transition-all cursor-pointer"
                  >
                    )
                  </button>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    aria-label="শেষ অক্ষর মুছুন"
                    className="min-h-[48px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center active:scale-[0.97] transition-all cursor-pointer"
                  >
                    <Delete className="w-4 h-4" />
                  </button>

                  {/* Row 2 */}
                  {['7', '8', '9'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => appendDigitOrDot(d)}
                      className="min-h-[48px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 text-base sm:text-lg font-bold tabular-nums flex items-center justify-center active:scale-[0.97] transition-all cursor-pointer"
                    >
                      {bnDigits ? toBengaliDigits(d) : d}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => appendOperator('÷')}
                    className="min-h-[48px] rounded-xl border border-indigo-100 bg-[#EEF2FF] hover:bg-indigo-100/80 text-[#4338CA] text-lg font-bold flex items-center justify-center active:scale-[0.97] transition-all cursor-pointer"
                  >
                    ÷
                  </button>
                  <button
                    type="button"
                    onClick={handlePercentKey}
                    className="min-h-[48px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm sm:text-base font-bold flex items-center justify-center active:scale-[0.97] transition-all cursor-pointer"
                  >
                    %
                  </button>

                  {/* Row 3 */}
                  {['4', '5', '6'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => appendDigitOrDot(d)}
                      className="min-h-[48px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 text-base sm:text-lg font-bold tabular-nums flex items-center justify-center active:scale-[0.97] transition-all cursor-pointer"
                    >
                      {bnDigits ? toBengaliDigits(d) : d}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => appendOperator('×')}
                    className="min-h-[48px] rounded-xl border border-indigo-100 bg-[#EEF2FF] hover:bg-indigo-100/80 text-[#4338CA] text-lg font-bold flex items-center justify-center active:scale-[0.97] transition-all cursor-pointer"
                  >
                    ×
                  </button>
                  <button
                    type="button"
                    onClick={() => appendQuickAdd(500)}
                    className="min-h-[48px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold tabular-nums flex items-center justify-center active:scale-[0.97] transition-all cursor-pointer whitespace-nowrap"
                  >
                    +{bnDigits ? toBengaliDigits('500') : '500'}
                  </button>

                  {/* Row 4 */}
                  {['1', '2', '3'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => appendDigitOrDot(d)}
                      className="min-h-[48px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 text-base sm:text-lg font-bold tabular-nums flex items-center justify-center active:scale-[0.97] transition-all cursor-pointer"
                    >
                      {bnDigits ? toBengaliDigits(d) : d}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => appendOperator('-')}
                    className="min-h-[48px] rounded-xl border border-indigo-100 bg-[#EEF2FF] hover:bg-indigo-100/80 text-[#4338CA] text-lg font-bold flex items-center justify-center active:scale-[0.97] transition-all cursor-pointer"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() => appendQuickAdd(1000)}
                    className="min-h-[48px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold tabular-nums flex items-center justify-center active:scale-[0.97] transition-all cursor-pointer whitespace-nowrap"
                  >
                    +{bnDigits ? toBengaliDigits('1000') : '1000'}
                  </button>

                  {/* Row 5 */}
                  <button
                    type="button"
                    onClick={() => appendDigitOrDot('0')}
                    className="min-h-[48px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 text-base sm:text-lg font-bold tabular-nums flex items-center justify-center active:scale-[0.97] transition-all cursor-pointer"
                  >
                    {bnDigits ? '০' : '0'}
                  </button>
                  <button
                    type="button"
                    onClick={() => appendDigitOrDot('00')}
                    className="min-h-[48px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 text-sm sm:text-base font-bold tabular-nums flex items-center justify-center active:scale-[0.97] transition-all cursor-pointer"
                  >
                    {bnDigits ? '০০' : '00'}
                  </button>
                  <button
                    type="button"
                    onClick={() => appendDigitOrDot('.')}
                    className="min-h-[48px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 text-lg font-bold flex items-center justify-center active:scale-[0.97] transition-all cursor-pointer"
                  >
                    .
                  </button>
                  <button
                    type="button"
                    onClick={() => appendOperator('+')}
                    className="min-h-[48px] rounded-xl border border-indigo-100 bg-[#EEF2FF] hover:bg-indigo-100/80 text-[#4338CA] text-lg font-bold flex items-center justify-center active:scale-[0.97] transition-all cursor-pointer"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={handleEquals}
                    className="min-h-[48px] rounded-xl border border-[#137C50] bg-[#137C50] hover:bg-[#0F6842] text-white text-xl font-bold flex items-center justify-center active:scale-[0.97] transition-all cursor-pointer shadow-xs"
                  >
                    =
                  </button>
                </div>

                {/* Direct Apply when no receipt items or quick single calculation */}
                {currentDisplayValue > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-2xl p-2.5">
                    <span className="text-xs font-semibold text-slate-600 px-1 flex-1 min-w-[140px]">
                      সরাসরি লেনদেনে নিন ({formatTaka(currentDisplayValue, bnDigits)}):
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onApplyToTransaction({
                          amount: Math.round(currentDisplayValue * 100) / 100,
                          type: 'in',
                          desc: itemName.trim() || undefined,
                        })
                      }
                      className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#E7F6EE] text-[#137C50] hover:bg-[#D5EFE1] text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      আয়ে যোগ
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onApplyToTransaction({
                          amount: Math.round(currentDisplayValue * 100) / 100,
                          type: 'out',
                          desc: itemName.trim() || undefined,
                        })
                      }
                      className="min-h-[36px] px-3 py-1.5 rounded-xl bg-red-50 text-[#DC2626] hover:bg-red-100 text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      খরচে যোগ
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Itemized Receipt Panel */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col min-h-[260px] lg:min-h-[440px]">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <ReceiptText className="w-4 h-4 text-[#137C50] shrink-0" />
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      হিসাবের ফর্দ ও রসিদ
                    </h3>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold tabular-nums shrink-0">
                      {formatNumber(receiptItems.length, bnDigits, 0)}টি
                    </span>
                  </div>

                  {receiptItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setReceiptItems([])}
                      className="text-xs font-semibold text-[#DC2626] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      সব মুছুন
                    </button>
                  )}
                </div>

                {receiptItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4">
                    <ReceiptText className="w-9 h-9 text-slate-300 mb-2.5" />
                    <p className="text-sm font-bold text-slate-500">কোনো ফর্দ নেই</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                      বামপাশের ক্যালকুলেটরে হিসাব করে “ফর্দে যোগ” বাটনে চাপুন
                    </p>
                  </div>
                ) : (
                  <>
                    <ul className="flex-1 divide-y divide-slate-100 max-h-[260px] overflow-y-auto my-2">
                      {receiptItems.map((item, idx) => (
                        <li
                          key={item.id}
                          className="py-2.5 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                              {formatNumber(idx + 1, bnDigits, 0)}. {item.name}
                            </p>
                            {item.expression && (
                              <p className="text-[11px] text-slate-400 tabular-nums truncate">
                                {formatExprDisplay(item.expression, bnDigits)}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 tabular-nums">
                              {formatTaka(item.amount, bnDigits)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveReceiptItem(item.id)}
                              aria-label="আইটেম মুছুন"
                              className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-slate-400 hover:text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-3 border-t border-slate-200 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-slate-600">
                          ফর্দের সর্বমোট
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg sm:text-xl font-bold text-[#137C50] tabular-nums">
                            {formatTaka(receiptTotal, bnDigits)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyText(String(Math.round(receiptTotal * 100) / 100), 'মোট হিসাব')
                            }
                            aria-label="মোট পরিমাণ কপি করুন"
                            className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onApplyToTransaction({
                              amount: Math.round(receiptTotal * 100) / 100,
                              type: 'in',
                              desc: receiptDescSummary,
                            })
                          }
                          className="min-h-[42px] px-3 py-2 rounded-xl bg-[#137C50] hover:bg-[#0F6842] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <ArrowDownLeft className="w-4 h-4" />
                          আয় হিসেবে যোগ
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onApplyToTransaction({
                              amount: Math.round(receiptTotal * 100) / 100,
                              type: 'out',
                              desc: receiptDescSummary,
                            })
                          }
                          className="min-h-[42px] px-3 py-2 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                          খরচ হিসেবে যোগ
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ==================== TAB 2: PROFIT / LOSS & MARGIN ==================== */}
          {activeTab === 'profit' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5">
                <h3 className="text-sm font-bold text-slate-900">ক্রয়-বিক্রয় ও খরচের তথ্য দিন</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      একক ক্রয়মূল্য (৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      placeholder="যেমন: ৮০০"
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold tabular-nums text-slate-900 focus:outline-none focus:border-[#137C50]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      একক বিক্রয়মূল্য (৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(e.target.value)}
                      placeholder="যেমন: ১০০০"
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold tabular-nums text-slate-900 focus:outline-none focus:border-[#137C50]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      পরিমাণ / পিস সংখ্যা
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      value={unitQty}
                      onChange={(e) => setUnitQty(e.target.value)}
                      placeholder="১"
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold tabular-nums text-slate-900 focus:outline-none focus:border-[#137C50]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      অতিরিক্ত খরচ (ভাড়া/অন্যান্য ৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      value={extraCost}
                      onChange={(e) => setExtraCost(e.target.value)}
                      placeholder="০"
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold tabular-nums text-slate-900 focus:outline-none focus:border-[#137C50]"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">লাভ-ক্ষতি ও মার্জিন ফলাফল</h3>
                  <div
                    className={`rounded-2xl p-4 border ${
                      profitMetrics.netProfit >= 0
                        ? 'bg-[#E7F6EE]/70 border-[#137C50]/20'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <span className="text-xs font-semibold text-slate-600">
                      {profitMetrics.netProfit >= 0 ? 'মোট নিট লাভ' : 'মোট ক্ষতি'}
                    </span>
                    <p
                      className={`text-2xl sm:text-3xl font-bold tabular-nums mt-1 ${
                        profitMetrics.netProfit >= 0 ? 'text-[#137C50]' : 'text-[#DC2626]'
                      }`}
                    >
                      {formatTaka(Math.abs(profitMetrics.netProfit), bnDigits)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3">
                      <span className="text-[11px] font-medium text-slate-500">
                        প্রফিট মার্জিন (বিক্রয়ের ওপর)
                      </span>
                      <p className="text-base font-bold text-slate-900 tabular-nums mt-0.5">
                        {formatNumber(profitMetrics.marginPct, bnDigits, 1)}%
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3">
                      <span className="text-[11px] font-medium text-slate-500">
                        মার্কআপ (খরচের ওপর)
                      </span>
                      <p className="text-base font-bold text-slate-900 tabular-nums mt-0.5">
                        {formatNumber(profitMetrics.markupPct, bnDigits, 1)}%
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3">
                      <span className="text-[11px] font-medium text-slate-500">মোট খরচ</span>
                      <p className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">
                        {formatTaka(profitMetrics.totalCost, bnDigits)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3">
                      <span className="text-[11px] font-medium text-slate-500">মোট বিক্রয়</span>
                      <p className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">
                        {formatTaka(profitMetrics.totalSell, bnDigits)}
                      </p>
                    </div>
                  </div>
                </div>

                {profitMetrics.totalSell > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        onApplyToTransaction({
                          amount: Math.round(profitMetrics.totalSell * 100) / 100,
                          type: 'in',
                          desc: 'পণ্য বিক্রয়',
                        })
                      }
                      className="min-h-[42px] px-3 py-2 rounded-xl bg-[#137C50] hover:bg-[#0F6842] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      বিক্রয় আয়ে যোগ
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onApplyToTransaction({
                          amount: Math.round(profitMetrics.totalCost * 100) / 100,
                          type: 'out',
                          desc: 'পণ্য ক্রয় ও খরচ',
                        })
                      }
                      className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      ক্রয় খরচে যোগ
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== TAB 3: VAT & DISCOUNT ==================== */}
          {activeTab === 'vat' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5">
                <h3 className="text-sm font-bold text-slate-900">মূল্য, ডিসকাউন্ট ও ভ্যাট</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    মূল দাম / বিল পরিমাণ (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="যেমন: ২৫০০"
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold tabular-nums text-slate-900 focus:outline-none focus:border-[#137C50]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      ডিসকাউন্ট (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      inputMode="decimal"
                      value={discountPct}
                      onChange={(e) => setDiscountPct(e.target.value)}
                      placeholder="যেমন: ১০"
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold tabular-nums text-slate-900 focus:outline-none focus:border-[#137C50]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      ভ্যাট / ট্যাক্স (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      value={vatPct}
                      onChange={(e) => setVatPct(e.target.value)}
                      placeholder="যেমন: ১৫"
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold tabular-nums text-slate-900 focus:outline-none focus:border-[#137C50]"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                    দ্রুত ডিসকাউন্ট বাছাই:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[5, 10, 15, 20, 25].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setDiscountPct(String(pct))}
                        className="min-h-[36px] px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 tabular-nums cursor-pointer"
                      >
                        {formatNumber(pct, bnDigits, 0)}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">ভ্যাট ও ডিসকাউন্ট হিসাব</h3>
                  <div className="rounded-2xl p-4 bg-[#0F172A] text-white">
                    <span className="text-xs text-slate-300">সর্বমোট প্রদেয় মূল্য</span>
                    <p className="text-2xl sm:text-3xl font-bold text-[#10B981] tabular-nums mt-1">
                      {formatTaka(vatMetrics.finalTotal, bnDigits)}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">ডিসকাউন্ট ছাড়</span>
                      <span className="font-bold text-[#137C50] tabular-nums">
                        − {formatTaka(vatMetrics.discountAmount, bnDigits)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">ছাড়ের পর দাম</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {formatTaka(vatMetrics.afterDiscount, bnDigits)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-600">ভ্যাট / ট্যাক্স যোগ</span>
                      <span className="font-bold text-amber-600 tabular-nums">
                        + {formatTaka(vatMetrics.vatAmount, bnDigits)}
                      </span>
                    </div>
                  </div>
                </div>

                {vatMetrics.finalTotal > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onApplyToTransaction({
                          amount: Math.round(vatMetrics.finalTotal * 100) / 100,
                          type: 'in',
                          desc: 'ভ্যাট-ডিসকাউন্টসহ বিক্রয় বিল',
                        })
                      }
                      className="min-h-[42px] px-3 py-2 rounded-xl bg-[#137C50] hover:bg-[#0F6842] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      আয়ে যোগ করুন
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onApplyToTransaction({
                          amount: Math.round(vatMetrics.finalTotal * 100) / 100,
                          type: 'out',
                          desc: 'ভ্যাট-ডিসকাউন্টসহ ক্রয়/বিল',
                        })
                      }
                      className="min-h-[42px] px-3 py-2 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      খরচে যোগ করুন
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== TAB 4: EMI / LOAN ==================== */}
          {activeTab === 'emi' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5">
                <h3 className="text-sm font-bold text-slate-900">ঋণ / কিস্তির বিবরণ</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    ঋণের মোট পরিমাণ (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    placeholder="যেমন: ১০০০০০"
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold tabular-nums text-slate-900 focus:outline-none focus:border-[#137C50]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      বার্ষিক সুদের হার (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      value={annualRate}
                      onChange={(e) => setAnnualRate(e.target.value)}
                      placeholder="যেমন: ৯"
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold tabular-nums text-slate-900 focus:outline-none focus:border-[#137C50]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      মেয়াদ (মাস)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      value={tenureMonths}
                      onChange={(e) => setTenureMonths(e.target.value)}
                      placeholder="১২"
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold tabular-nums text-slate-900 focus:outline-none focus:border-[#137C50]"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">কিস্তি (EMI) ফলাফল</h3>
                  <div className="rounded-2xl p-4 bg-[#0F172A] text-white">
                    <span className="text-xs text-slate-300">মাসিক কিস্তি (EMI)</span>
                    <p className="text-2xl sm:text-3xl font-bold text-[#10B981] tabular-nums mt-1">
                      {formatTaka(emiMetrics.emi, bnDigits)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3">
                      <span className="text-[11px] font-medium text-slate-500">মোট সুদ</span>
                      <p className="text-sm font-bold text-amber-600 tabular-nums mt-0.5">
                        {formatTaka(emiMetrics.totalInterest, bnDigits)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3">
                      <span className="text-[11px] font-medium text-slate-500">
                        মোট পরিশোধযোগ্য
                      </span>
                      <p className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">
                        {formatTaka(emiMetrics.totalPayment, bnDigits)}
                      </p>
                    </div>
                  </div>
                </div>

                {emiMetrics.emi > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      onApplyToTransaction({
                        amount: Math.round(emiMetrics.emi * 100) / 100,
                        type: 'out',
                        desc: 'মাসিক কিস্তি / ঋণ পরিশোধ',
                      })
                    }
                    className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    মাসিক কিস্তি খরচে যোগ করুন
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ==================== TAB 5: DAILY BUDGET & SAVINGS ==================== */}
          {activeTab === 'budget' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5">
                <h3 className="text-sm font-bold text-slate-900">বেতন থেকে সঞ্চয় ও দৈনিক খরচ হিসাব</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      মাসিক আয় / বেতন (৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      placeholder="যেমন: ৩৫০০০"
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold tabular-nums text-slate-900 focus:outline-none focus:border-[#137C50]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      সঞ্চয় / আলাদা রাখবেন (৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      value={keptAsideAmount}
                      onChange={(e) => setKeptAsideAmount(e.target.value)}
                      placeholder="বেতন থেকে যে টাকা জমা বা আলাদা রাখবেন (যেমন: ১০০০০)"
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold tabular-nums text-slate-900 focus:outline-none focus:border-[#137C50]"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <label className="block text-xs font-semibold text-slate-600">
                        মাসের দিন সংখ্যা
                      </label>
                      <div className="flex items-center gap-1">
                        {[28, 29, 30, 31].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDaysInMonth(String(d))}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold tabular-nums cursor-pointer ${
                              Number(daysInMonth) === d
                                ? 'bg-[#137C50] text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {formatNumber(d, bnDigits, 0)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      step="1"
                      inputMode="numeric"
                      value={daysInMonth}
                      onChange={(e) => setDaysInMonth(e.target.value)}
                      placeholder="৩০"
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold tabular-nums text-slate-900 focus:outline-none focus:border-[#137C50]"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">দৈনিক বাজেট ও সঞ্চয় ফলাফল</h3>
                  <div className="rounded-2xl p-4 bg-[#E7F6EE] border border-[#137C50]/20">
                    <span className="text-xs font-semibold text-[#137C50]">
                      দৈনিক খরচ করতে পারবেন ({formatNumber(budgetMetrics.days, bnDigits, 0)} দিন)
                    </span>
                    <p className="text-2xl sm:text-3xl font-bold text-[#137C50] tabular-nums mt-1">
                      {formatTaka(budgetMetrics.dailyLimit, bnDigits)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3">
                      <span className="text-[11px] font-medium text-slate-500">
                        বাকি মাসিক খরচযোগ্য
                      </span>
                      <p className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">
                        {formatTaka(budgetMetrics.spendableMonthly, bnDigits)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3">
                      <span className="text-[11px] font-medium text-slate-500">
                        সাপ্তাহিক হাতখরচ
                      </span>
                      <p className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">
                        {formatTaka(budgetMetrics.weeklyLimit, bnDigits)}
                      </p>
                    </div>
                  </div>

                  {budgetMetrics.keptAside > 0 && (
                    <div className="rounded-xl bg-slate-50 border border-slate-200/70 px-3 py-2.5 flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-slate-600">
                        জমা / আলাদা রাখা ({formatNumber(budgetMetrics.savedRatio, bnDigits, 1)}%)
                      </span>
                      <span className="font-bold text-[#137C50] tabular-nums">
                        {formatTaka(budgetMetrics.keptAside, bnDigits)}
                      </span>
                    </div>
                  )}
                </div>

                {(budgetMetrics.dailyLimit > 0 || budgetMetrics.spendableMonthly > 0) && (
                  <div className="space-y-2 pt-1">
                    {onApplyBudgetLimits && (
                      <button
                        type="button"
                        onClick={() =>
                          onApplyBudgetLimits({
                            dailyExpenseLimit: Math.round(budgetMetrics.dailyLimit),
                            weeklyExpenseLimit: Math.round(budgetMetrics.weeklyLimit),
                            monthlyExpenseLimit: Math.round(budgetMetrics.spendableMonthly),
                            monthlySavingsGoal: Math.round(budgetMetrics.keptAside),
                          })
                        }
                        className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#137C50] hover:bg-[#0F6842] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shadow-xs"
                      >
                        <Check className="w-4 h-4 shrink-0" />
                        <span>অ্যাপের বাজেট সীমায় সেট করুন</span>
                      </button>
                    )}

                    {budgetMetrics.dailyLimit > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          onApplyToTransaction({
                            amount: Math.round(budgetMetrics.dailyLimit * 100) / 100,
                            type: 'out',
                            desc: 'দৈনিক বাজেট খরচ',
                          })
                        }
                        className="w-full min-h-[40px] px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                        <span>দৈনিক পরিমাণ লেনদেনে নিন</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
