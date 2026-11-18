'use client';

import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Database,
  Download,
  Home,
  ListOrdered,
  LogIn,
  Minus,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Settings,
  SlidersHorizontal,
  Tags,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  UserCheck,
  Wallet,
} from 'lucide-react';
import CashflowChart, { ChartGranularity } from '@/components/CashflowChart';
import CategoryManager from '@/components/CategoryManager';
import ConfirmDialog from '@/components/ConfirmDialog';
import GoogleDriveSync from '@/components/GoogleDriveSync';
import MonthlyArchiveManager from '@/components/MonthlyArchiveManager';
import PWAInstallButton from '@/components/PWAInstallButton';
import TransactionModal from '@/components/TransactionModal';
import UserProfileSection from '@/components/UserProfileSection';
import { subscribeToAuth } from '@/lib/firebaseAuth';
import type { User } from 'firebase/auth';
import {
  CADENCE_OPTIONS,
  Cadence,
  DEFAULT_SETTINGS,
  LedgerSettings,
  MonthlyArchive,
  PeriodScope,
  Transaction,
  TransactionType,
  buildDailySeries,
  buildMonthlySeries,
  buildWeeklySeries,
  exportTransactionsToCSV,
  filterByPeriod,
  formatBengaliDate,
  formatBengaliMonth,
  formatBengaliWeekday,
  formatNumber,
  formatTaka,
  generateSampleTransactions,
  getClientTodayISO,
  getServerArchivesSnapshot,
  getServerSettingsSnapshot,
  getServerTodayISO,
  getServerTransactionsSnapshot,
  getWeekBounds,
  loadStoredArchives,
  loadStoredSettings,
  loadStoredTransactions,
  saveStoredArchives,
  saveStoredSettings,
  saveStoredTransactions,
  shiftDateISO,
  shiftMonthISO,
  subscribeLedger,
  subscribeNoop,
  summarizeTransactions,
} from '@/lib/ledger';

type NavSection =
  | 'home'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'transactions'
  | 'reports'
  | 'settings'
  | 'categories'
  | 'settings-budget'
  | 'settings-monthly'
  | 'settings-drive'
  | 'settings-backup'
  | 'settings-reset';

export default function MoneyManagerApp() {
  const transactions = useSyncExternalStore(
    subscribeLedger,
    loadStoredTransactions,
    getServerTransactionsSnapshot
  );
  const settings = useSyncExternalStore(
    subscribeLedger,
    loadStoredSettings,
    getServerSettingsSnapshot
  );
  const archives = useSyncExternalStore(
    subscribeLedger,
    loadStoredArchives,
    getServerArchivesSnapshot
  );

  const todayISO = useSyncExternalStore(
    subscribeNoop,
    getClientTodayISO,
    getServerTodayISO
  );
  const currentMonthISO = todayISO ? todayISO.slice(0, 7) : '';

  const [activeNav, setActiveNav] = useState<NavSection>('home');
  const [homePeriod, setHomePeriod] = useState<PeriodScope>('all');
  const [customAnchorDate, setAnchorDate] = useState<string | null>(null);
  const [customAnchorMonth, setAnchorMonth] = useState<string | null>(null);
  const anchorDate = customAnchorDate ?? todayISO;
  const anchorMonth = customAnchorMonth ?? currentMonthISO;
  const [chartGranularity, setChartGranularity] = useState<ChartGranularity>('daily');

  // Transactions view filters
  const [searchQuery, setSearchQuery] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | TransactionType>('all');
  const [txCadenceFilter, setTxCadenceFilter] = useState<'all' | Cadence>('all');
  const [txMonthFilter, setTxMonthFilter] = useState<string>('all');
  const [txSort, setTxSort] = useState<'newest' | 'amount'>('newest');

  // Modal & Dialog state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<TransactionType>('in');
  const [modalInitialCadence, setModalInitialCadence] = useState<Cadence>('দৈনিক');
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>(undefined);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Settings draft state
  const [draftOverride, setDraftOverride] = useState<Partial<LedgerSettings> | null>(null);
  const draftSettings: LedgerSettings = draftOverride
    ? { ...settings, ...draftOverride }
    : settings;

  const setDraftSettings = (next: LedgerSettings) => {
    setDraftOverride(next);
  };

  // Firebase Auth user state
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = subscribeToAuth((u) => {
      setCurrentUser(u);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3200);
  };

  const updateTransactions = (next: Transaction[]) => {
    saveStoredTransactions(next);
  };

  const updateSettings = (next: LedgerSettings) => {
    setDraftOverride(null);
    saveStoredSettings(next);
  };

  const handleUpdateCategories = (
    type: TransactionType,
    nextList: string[],
    renamedFromTo?: { from: string; to: string }
  ) => {
    const updatedSettings: LedgerSettings = {
      ...settings,
      ...(type === 'in'
        ? { incomeCategories: nextList }
        : { expenseCategories: nextList }),
    };
    saveStoredSettings(updatedSettings);
    if (draftOverride) {
      setDraftOverride({
        ...draftOverride,
        ...(type === 'in'
          ? { incomeCategories: nextList }
          : { expenseCategories: nextList }),
      });
    }
    if (renamedFromTo) {
      const updatedTx = transactions.map((tx) =>
        tx.type === type && tx.category === renamedFromTo.from
          ? { ...tx, category: renamedFromTo.to }
          : tx
      );
      saveStoredTransactions(updatedTx);
    }
  };

  const handleApplySector = (
    sectorName: string,
    nextIncomeCategories: string[],
    nextExpenseCategories: string[]
  ) => {
    const updatedSettings: LedgerSettings = {
      ...settings,
      accountSector: sectorName,
      incomeCategories: nextIncomeCategories,
      expenseCategories: nextExpenseCategories,
    };
    saveStoredSettings(updatedSettings);
    if (draftOverride) {
      setDraftOverride({
        ...draftOverride,
        accountSector: sectorName,
        incomeCategories: nextIncomeCategories,
        expenseCategories: nextExpenseCategories,
      });
    }
    showToast(`"${sectorName}" সেক্টর ও এর খাতসমূহ চালু করা হয়েছে`);
  };

  const handleRenameSector = (sectorName: string) => {
    const updatedSettings: LedgerSettings = {
      ...settings,
      accountSector: sectorName,
    };
    saveStoredSettings(updatedSettings);
    if (draftOverride) {
      setDraftOverride({
        ...draftOverride,
        accountSector: sectorName,
      });
    }
  };

  const handleAddQuickCategory = (type: TransactionType, categoryName: string) => {
    const current = type === 'in' ? settings.incomeCategories : settings.expenseCategories;
    if (current.includes(categoryName)) return;
    handleUpdateCategories(type, [categoryName, ...current]);
  };

  const useBn = settings.useBengaliDigits;

  // Handlers for add / edit / delete
  const openAddModal = (
    type: TransactionType = 'in',
    cadence: Cadence = 'দৈনিক',
    defaultDate?: string
  ) => {
    setEditingTx(null);
    setModalInitialType(type);
    setModalInitialCadence(cadence);
    setModalInitialDate(defaultDate || todayISO);
    setModalOpen(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setModalOpen(true);
  };

  const handleSaveTransaction = (
    payload: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      const updated = transactions.map((item) =>
        item.id === existingId ? { ...item, ...payload } : item
      );
      updateTransactions(updated);
      showToast('লেনদেন হালনাগাদ করা হয়েছে');
    } else {
      const created: Transaction = {
        ...payload,
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        createdAt: Date.now(),
      };
      updateTransactions([created, ...transactions]);
      showToast('নতুন লেনদেন সংরক্ষণ করা হয়েছে');
    }
  };

  const confirmDeleteTransaction = () => {
    if (!deleteTarget) return;
    const filtered = transactions.filter((t) => t.id !== deleteTarget.id);
    updateTransactions(filtered);
    setDeleteTarget(null);
    showToast('লেনদেন মুছে ফেলা হয়েছে');
  };

  const handleClearAllData = () => {
    updateTransactions([]);
    setClearConfirmOpen(false);
    showToast('সব লেনদেন মুছে ফেলা হয়েছে');
  };

  const handleLoadSample = () => {
    const samples = generateSampleTransactions();
    updateTransactions([...samples, ...transactions]);
    showToast('নমুনা দৈনিক, সাপ্তাহিক ও মাসিক হিসাব যোগ করা হয়েছে');
  };

  const handleRestoreData = (
    importedTx: Transaction[],
    importedSettings?: LedgerSettings,
    importedArchives?: MonthlyArchive[]
  ) => {
    updateTransactions(importedTx);
    if (importedSettings && typeof importedSettings === 'object') {
      updateSettings({ ...DEFAULT_SETTINGS, ...importedSettings });
    }
    if (Array.isArray(importedArchives)) {
      saveStoredArchives(importedArchives);
    }
    showToast('হিসাব সফলভাবে রিস্টোর হয়েছে');
  };
  const handleSaveMonthlyArchive = (
    archive: MonthlyArchive,
    options?: {
      carryForwardToNextMonth?: boolean;
      clearActiveMonthTransactions?: boolean;
    }
  ) => {
    const nextArchives = [
      archive,
      ...archives.filter((item) => item.month !== archive.month),
    ].sort((a, b) => b.month.localeCompare(a.month));
    saveStoredArchives(nextArchives);

    let nextTransactions = transactions;
    let txChanged = false;

    if (options?.clearActiveMonthTransactions) {
      nextTransactions = nextTransactions.filter(
        (tx) => tx.date.slice(0, 7) !== archive.month
      );
      txChanged = true;
    }

    if (options?.carryForwardToNextMonth && archive.netBalance > 0) {
      const nextMonthISO = shiftMonthISO(archive.month, 1);
      if (nextMonthISO) {
        const carryTx: Transaction = {
          id: `carry_${archive.month}_${Date.now()}`,
          desc: `গত মাসের জের (${formatBengaliMonth(archive.month, useBn)})`,
          amount: archive.netBalance,
          type: 'in',
          cadence: 'মাসিক',
          category: settings.incomeCategories[0] || 'অন্যান্য আয়',
          date: `${nextMonthISO}-01`,
          note: 'মাস-শেষ থেকে আনীত ব্যালেন্স',
          createdAt: Date.now(),
        };
        nextTransactions = [carryTx, ...nextTransactions];
        txChanged = true;
      }
    }

    if (txChanged) {
      updateTransactions(nextTransactions);
    }

    showToast(`${formatBengaliMonth(archive.month, useBn)}-এর হিসাব স্থায়ীভাবে সেভ করা হয়েছে`);
  };

  const handleDeleteMonthlyArchive = (month: string) => {
    const nextArchives = archives.filter((item) => item.month !== month);
    saveStoredArchives(nextArchives);
    showToast(`${formatBengaliMonth(month, useBn)}-এর সংরক্ষিত হিসাব মুছে ফেলা হয়েছে`);
  };

  const handleExportJSON = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'সহজ হিসাব',
      settings,
      transactions,
      archives,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SohojHisab_Backup_${todayISO}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('JSON ব্যাকআপ ফাইল ডাউনলোড হয়েছে');
  };

  const handleRestoreJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const importedList = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.transactions)
          ? parsed.transactions
          : null;
        if (!importedList) {
          showToast('সঠিক ব্যাকআপ ফাইল পাওয়া যায়নি');
          return;
        }
        handleRestoreAll(importedList, parsed.settings, parsed.archives);
        showToast('ব্যাকআপ থেকে হিসাব সফলভাবে পুনরুদ্ধার হয়েছে');
      } catch {
        showToast('ফাইলটি পড়া যায়নি, সঠিক JSON ব্যাকআপ দিন');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRestoreAll = (
    importedTransactions: Transaction[],
    importedSettings?: LedgerSettings,
    importedArchives?: MonthlyArchive[]
  ) => {
    const cleaned: Transaction[] = (importedTransactions as unknown[])
      .filter((item: unknown) => typeof item === 'object' && item !== null)
      .map((rawItem: unknown, idx: number) => {
        const item = rawItem as Record<string, unknown>;
        return {
          id: String(item.id ?? `${Date.now()}_${idx}`),
          desc: String(item.desc ?? 'লেনদেন'),
          amount: Math.max(0, Number(item.amount ?? 0)),
          type: item.type === 'out' ? 'out' : 'in',
          cadence: CADENCE_OPTIONS.includes(item.cadence as Cadence)
            ? (item.cadence as Cadence)
            : 'দৈনিক',
          category: String(item.category ?? 'অন্যান্য'),
          date:
            typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date)
              ? item.date
              : todayISO,
          note: typeof item.note === 'string' ? item.note : undefined,
          createdAt: Number(item.createdAt ?? Date.now()),
        };
      });

    updateTransactions(cleaned);
    if (importedSettings && typeof importedSettings === 'object') {
      updateSettings({ ...DEFAULT_SETTINGS, ...importedSettings });
    }
    if (Array.isArray(importedArchives)) {
      saveStoredArchives(importedArchives);
    }
  };



  // Derived summaries
  const sortedAll = useMemo(
    () =>
      [...transactions].sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.createdAt - a.createdAt;
      }),
    [transactions]
  );

  const allSummary = useMemo(() => summarizeTransactions(transactions), [transactions]);
  const todaySummary = useMemo(
    () => summarizeTransactions(filterByPeriod(transactions, 'day', todayISO, currentMonthISO)),
    [transactions, todayISO, currentMonthISO]
  );
  const thisWeekSummary = useMemo(
    () => summarizeTransactions(filterByPeriod(transactions, 'week', todayISO, currentMonthISO)),
    [transactions, todayISO, currentMonthISO]
  );
  const thisMonthSummary = useMemo(
    () => summarizeTransactions(filterByPeriod(transactions, 'month', todayISO, currentMonthISO)),
    [transactions, todayISO, currentMonthISO]
  );

  // Active scope for Home or Period views
  const effectivePeriodScope: PeriodScope =
    activeNav === 'daily'
      ? 'day'
      : activeNav === 'weekly'
      ? 'week'
      : activeNav === 'monthly'
      ? 'month'
      : homePeriod;

  const periodFilteredList = useMemo(
    () => filterByPeriod(sortedAll, effectivePeriodScope, anchorDate, anchorMonth),
    [sortedAll, effectivePeriodScope, anchorDate, anchorMonth]
  );

  const periodSummary = useMemo(
    () => summarizeTransactions(periodFilteredList),
    [periodFilteredList]
  );

  // Chart series
  const dailySeries = useMemo(() => buildDailySeries(transactions, anchorDate, 7, useBn), [transactions, anchorDate, useBn]);
  const weeklySeries = useMemo(() => buildWeeklySeries(transactions, anchorDate, 6, useBn), [transactions, anchorDate, useBn]);
  const monthlySeries = useMemo(() => buildMonthlySeries(transactions, anchorMonth, 6), [transactions, anchorMonth]);

  // Available months for filter
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    if (currentMonthISO) set.add(currentMonthISO);
    for (const tx of transactions) {
      if (tx.date?.length >= 7) set.add(tx.date.slice(0, 7));
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [transactions, currentMonthISO]);

  // All Transactions view filtered
  const filteredTransactionsPage = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = sortedAll.filter((tx) => {
      if (txTypeFilter !== 'all' && tx.type !== txTypeFilter) return false;
      if (txCadenceFilter !== 'all' && tx.cadence !== txCadenceFilter) return false;
      if (txMonthFilter !== 'all' && tx.date.slice(0, 7) !== txMonthFilter) return false;
      if (q) {
        const hay = `${tx.desc} ${tx.category} ${tx.cadence} ${tx.note ?? ''} ${tx.date}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (txSort === 'amount') {
      return [...filtered].sort((a, b) => b.amount - a.amount);
    }
    return filtered;
  }, [sortedAll, searchQuery, txTypeFilter, txCadenceFilter, txMonthFilter, txSort]);

  // Category breakdown for Reports / Period
  const categoryBreakdown = useMemo(() => {
    const source =
      activeNav === 'daily' || activeNav === 'weekly' || activeNav === 'monthly'
        ? periodFilteredList
        : transactions;
    const expenseMap = new Map<string, number>();
    const incomeMap = new Map<string, number>();
    let totalExp = 0;
    let totalInc = 0;
    for (const tx of source) {
      if (tx.type === 'out') {
        expenseMap.set(tx.category, (expenseMap.get(tx.category) ?? 0) + tx.amount);
        totalExp += tx.amount;
      } else {
        incomeMap.set(tx.category, (incomeMap.get(tx.category) ?? 0) + tx.amount);
        totalInc += tx.amount;
      }
    }
    const expenses = Array.from(expenseMap.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        pct: totalExp > 0 ? Math.round((amount / totalExp) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
    const incomes = Array.from(incomeMap.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        pct: totalInc > 0 ? Math.round((amount / totalInc) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
    return { expenses, incomes, totalExp, totalInc };
  }, [transactions, periodFilteredList, activeNav]);

  // Budget status helper (never hue-only: always returns label + colors)
  const getBudgetStatus = (spent: number, limit: number) => {
    if (limit <= 0) return { pct: 0, label: 'সীমা নির্ধারিত নেই', bar: 'bg-slate-300', text: 'text-slate-600' };
    const ratio = (spent / limit) * 100;
    const pct = Math.min(100, Math.round(ratio));
    if (ratio >= 100) return { pct, label: 'সীমা অতিক্রম', bar: 'bg-[#DC2626]', text: 'text-[#DC2626]' };
    if (ratio >= 80) return { pct, label: 'সতর্কতা', bar: 'bg-amber-500', text: 'text-amber-700' };
    return { pct, label: 'সীমার মধ্যে', bar: 'bg-[#168653]', text: 'text-[#137C50]' };
  };

  // Period context label & stepper
  const periodLabel = useMemo(() => {
    if (effectivePeriodScope === 'all') return 'সর্বমোট সার্বিক হিসাব';
    if (effectivePeriodScope === 'day') {
      if (!anchorDate) return 'দৈনিক হিসাব';
      return `${formatBengaliDate(anchorDate, useBn)} · ${formatBengaliWeekday(anchorDate)}`;
    }
    if (effectivePeriodScope === 'week') {
      const { start, end } = getWeekBounds(anchorDate);
      if (!start || !end) return 'সাপ্তাহিক হিসাব';
      return `${formatBengaliDate(start, useBn)} – ${formatBengaliDate(end, useBn)}`;
    }
    if (!anchorMonth) return 'মাসিক হিসাব';
    return formatBengaliMonth(anchorMonth, useBn);
  }, [effectivePeriodScope, anchorDate, anchorMonth, useBn]);

  const stepPeriod = (dir: -1 | 1) => {
    if (effectivePeriodScope === 'day') {
      setAnchorDate((prev) => shiftDateISO(prev ?? todayISO, dir));
    } else if (effectivePeriodScope === 'week') {
      setAnchorDate((prev) => shiftDateISO(prev ?? todayISO, dir * 7));
    } else if (effectivePeriodScope === 'month') {
      setAnchorMonth((prev) => shiftMonthISO(prev ?? currentMonthISO, dir));
    }
  };

  const resetPeriodAnchor = () => {
    setAnchorDate(null);
    setAnchorMonth(null);
  };

  const navTitleMap: Record<NavSection, string> = {
    home: settings.accountTitle || 'ড্যাশবোর্ড ও সারসংক্ষেপ',
    daily: 'দৈনিক হিসাব খাতা',
    weekly: 'সাপ্তাহিক হিসাব খাতা',
    monthly: 'মাসিক হিসাব খাতা',
    transactions: 'সকল লেনদেন',
    reports: 'রিপোর্ট ও বিশ্লেষণ',
    settings: 'সেটিংস ও বাজেট',
    categories: 'খাত / ক্যাটাগরি ব্যবস্থাপনা',
    'settings-monthly': 'মাস শেষ ও সংরক্ষিত হিসাব',
    'settings-drive': 'গুগল ড্রাইভ ও সিঙ্ক',
    'settings-budget': 'হিসাব ও বাজেট সেটিংস',
    'settings-backup': 'ডেটা ব্যাকআপ ও পুনরুদ্ধার',
    'settings-reset': 'সব হিসাব মুছে ফেলুন',
  };

  const isSettingsSubPage =
    activeNav === 'settings' ||
    activeNav === 'categories' ||
    activeNav === 'settings-monthly' ||
    activeNav === 'settings-drive' ||
    activeNav === 'settings-budget' ||
    activeNav === 'settings-backup' ||
    activeNav === 'settings-reset';

  const sidebarItems: { id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'হোম ও সারসংক্ষেপ', icon: Home },
    { id: 'daily', label: 'দৈনিক হিসাব', icon: CalendarDays },
    { id: 'weekly', label: 'সাপ্তাহিক হিসাব', icon: CalendarRange },
    { id: 'monthly', label: 'মাসিক হিসাব', icon: Calendar },
    { id: 'transactions', label: 'সকল লেনদেন', icon: ListOrdered },
    { id: 'reports', label: 'রিপোর্ট ও বিশ্লেষণ', icon: BarChart3 },
    { id: 'settings', label: 'সেটিংস ও বাজেট', icon: Settings },
  ];

  const mobileTabs: { id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'হোম', icon: Home },
    { id: 'transactions', label: 'লেনদেন', icon: ListOrdered },
    { id: 'reports', label: 'রিপোর্ট', icon: BarChart3 },
    { id: 'settings', label: 'সেটিংস', icon: Settings },
  ];

  const renderTransactionRow = (tx: Transaction) => {
    const isIncome = tx.type === 'in';
    return (
      <div
        key={tx.id}
        className="group flex items-center justify-between gap-3 px-4 py-3.5 bg-white hover:bg-slate-50/70 transition-colors border-b border-slate-100 last:border-b-0"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isIncome ? 'bg-[#E7F6EE] text-[#137C50]' : 'bg-red-50 text-[#DC2626]'
            }`}
          >
            {isIncome ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate">{tx.desc}</p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-0.5">
              <span className="tabular-nums">{formatBengaliDate(tx.date, useBn)}</span>
              <span aria-hidden="true">·</span>
              <span>{tx.cadence}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{tx.category}</span>
              {tx.note && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="truncate text-slate-400">{tx.note}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <p
              className={`text-sm font-bold tabular-nums whitespace-nowrap ${
                isIncome ? 'text-[#137C50]' : 'text-[#DC2626]'
              }`}
            >
              {isIncome ? '+' : '−'}
              {formatTaka(tx.amount, useBn)}
            </p>
            <p className="text-[11px] text-slate-400">
              {isIncome ? 'জমা' : 'খরচ'}
            </p>
          </div>

          <div className="flex items-center gap-1 ml-1">
            <button
              type="button"
              onClick={() => openEditModal(tx)}
              aria-label={`${tx.desc} সম্পাদনা করুন`}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(tx)}
              aria-label={`${tx.desc} মুছুন`}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-[#DC2626] hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEmptyState = (customMsg?: string) => (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#E7F6EE] text-[#137C50] flex items-center justify-center mx-auto mb-3">
        <Wallet className="w-6 h-6" />
      </div>
      <h4 className="text-base font-bold text-slate-900">এখনো কোনো লেনদেন নেই</h4>
      <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
        {customMsg ||
          'আপনার দৈনিক, সাপ্তাহিক বা মাসিক আয় ও খরচের হিসাব রাখা শুরু করতে নতুন লেনদেন যোগ করুন।'}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
        <button
          type="button"
          onClick={() =>
            openAddModal(
              'in',
              activeNav === 'weekly'
                ? 'সাপ্তাহিক'
                : activeNav === 'monthly'
                ? 'মাসিক'
                : 'দৈনিক',
              activeNav === 'daily' || activeNav === 'weekly' ? anchorDate : todayISO
            )
          }
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#137C50] hover:bg-[#0F6842] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          প্রথম লেনদেন যোগ করুন
        </button>
        {transactions.length === 0 && (
          <button
            type="button"
            onClick={handleLoadSample}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors whitespace-nowrap"
          >
            নমুনা হিসাব দেখুন
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F6F8FA] text-[#0F172A] flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[260px] lg:fixed lg:inset-y-0 bg-white border-r border-slate-200/90 z-30 no-print">
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-[#E7F6EE] text-[#137C50] flex items-center justify-center font-bold text-lg shrink-0">
            ৳
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap truncate">
            সহজ হিসাব
          </span>
        </div>

        <div className="px-3 pt-4 pb-1">
          <button
            type="button"
            onClick={() =>
              openAddModal(
                'in',
                activeNav === 'weekly'
                  ? 'সাপ্তাহিক'
                  : activeNav === 'monthly'
                  ? 'মাসিক'
                  : 'দৈনিক',
                activeNav === 'daily' || activeNav === 'weekly' ? anchorDate : todayISO
              )
            }
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#137C50] hover:bg-[#0F6842] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>নতুন লেনদেন</span>
          </button>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto" aria-label="প্রধান নেভিগেশন">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active =
              activeNav === item.id ||
              (item.id === 'settings' && isSettingsSubPage);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveNav(item.id)}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#E7F6EE] text-[#137C50] font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-3">
          <PWAInstallButton variant="sidebar" onToast={showToast} />

          <button
            type="button"
            onClick={() => setActiveNav('settings')}
            className="w-full p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-slate-100 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
          >
            {currentUser ? (
              <>
                <div className="w-8 h-8 rounded-lg bg-[#137C50] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser.email ? currentUser.email[0].toUpperCase() : '✓'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-emerald-600 truncate flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    লগইন সক্রিয় (সেটিংস)
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#137C50] border border-[#137C50]/20 flex items-center justify-center font-bold text-xs shrink-0">
                  <LogIn className="w-4 h-4 text-[#137C50]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    ইমেইল লগইন / একাউন্ট
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    সেটিংসে অ্যাকাউন্ট পরিচালনা
                  </p>
                </div>
              </>
            )}
          </button>

          <div>
            <p className="text-xs text-slate-500 leading-relaxed">
              মোট সংরক্ষিত লেনদেন:{' '}
              <strong className="text-slate-800 tabular-nums">
                {formatNumber(transactions.length, useBn, 0)}টি
              </strong>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              অফলাইন ও ব্রাউজারে তথ্য নিরাপদ থাকে
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 lg:pl-[260px] flex flex-col min-h-screen pb-24 lg:pb-10">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 h-12 lg:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 lg:px-8 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="lg:hidden w-8 h-8 rounded-lg bg-[#E7F6EE] text-[#137C50] flex items-center justify-center font-bold text-base shrink-0">
              ৳
            </span>
            <h1 className="text-base lg:text-lg font-bold text-slate-900 whitespace-nowrap truncate">
              <span className="lg:hidden">সহজ হিসাব</span>
              <span className="hidden lg:inline">{navTitleMap[activeNav]}</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton variant="header" onToast={showToast} />

            <button
              type="button"
              onClick={() => setActiveNav('settings')}
              title={currentUser ? `লগইন আছেন: ${currentUser.email || 'ব্যবহারকারী'}` : 'লগইন করুন / সেটিংস'}
              className="min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              {currentUser ? (
                <>
                  <span className="w-5 h-5 rounded-lg bg-[#137C50] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    {currentUser.email ? currentUser.email[0].toUpperCase() : '✓'}
                  </span>
                  <span className="max-w-[70px] sm:max-w-[130px] truncate hidden sm:inline text-slate-800">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5 text-[#137C50]" />
                  <span className="text-slate-800">লগইন</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('settings')}
              aria-label="সেটিংস"
              className="lg:hidden min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Print Header */}
        <div className="hidden print-only px-8 pt-6 pb-4 border-b border-slate-300">
          <h1 className="text-xl font-bold">{settings.accountTitle} — সহজ হিসাব</h1>
          <p className="text-xs text-slate-600 mt-1">
            প্রিন্টের তারিখ: {todayISO ? formatBengaliDate(todayISO, useBn) : '—'}
          </p>
        </div>

        {/* Page Body */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-7 space-y-6">
          {/* ==================== HOME / PERIOD WORKSPACE ==================== */}
          {(activeNav === 'home' ||
            activeNav === 'daily' ||
            activeNav === 'weekly' ||
            activeNav === 'monthly') && (
            <>
              {/* Context Date & Period Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">
                    {todayISO
                      ? `${formatBengaliWeekday(todayISO)} · ${formatBengaliDate(todayISO, useBn)}`
                      : 'দৈনিক, সাপ্তাহিক ও মাসিক হিসাব'}
                  </p>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                    {periodLabel}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {activeNav === 'home' && (
                    <div className="inline-flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl">
                      {(
                        [
                          { id: 'all', label: 'সার্বিক' },
                          { id: 'day', label: 'দৈনিক' },
                          { id: 'week', label: 'সাপ্তাহিক' },
                          { id: 'month', label: 'মাসিক' },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setHomePeriod(tab.id)}
                          className={`px-3 py-1.5 min-h-[36px] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                            homePeriod === tab.id
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {effectivePeriodScope !== 'all' && (
                    <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => stepPeriod(-1)}
                        aria-label="পূর্ববর্তী সময়"
                        className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={resetPeriodAnchor}
                        className="px-2.5 min-h-[36px] text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
                      >
                        {effectivePeriodScope === 'day'
                          ? 'আজ'
                          : effectivePeriodScope === 'week'
                          ? 'চলতি সপ্তাহ'
                          : 'চলতি মাস'}
                      </button>
                      <button
                        type="button"
                        onClick={() => stepPeriod(1)}
                        aria-label="পরবর্তী সময়"
                        className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Hero Balance + Quick Actions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Primary Balance Card */}
                <div className="lg:col-span-7 relative overflow-hidden bg-gradient-to-br from-[#0F6842] via-[#137C50] to-[#1D9963] text-white rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-12 -top-12 w-48 h-48 rounded-full border border-white/10"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-4 -top-4 w-28 h-28 rounded-full bg-white/5"
                  />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-emerald-100">
                        {effectivePeriodScope === 'all'
                          ? 'বর্তমান সার্বিক ব্যালেন্স'
                          : effectivePeriodScope === 'day'
                          ? 'নির্বাচিত দিনের নিট ব্যালেন্স'
                          : effectivePeriodScope === 'week'
                          ? 'নির্বাচিত সপ্তাহের নিট ব্যালেন্স'
                          : 'নির্বাচিত মাসের নিট ব্যালেন্স'}
                      </span>
                      <span className="text-xs text-emerald-100 tabular-nums">
                        {formatNumber(periodSummary.count, useBn, 0)}টি লেনদেন
                      </span>
                    </div>
                    <p className="text-3xl sm:text-4xl font-bold tabular-nums mt-2 tracking-tight">
                      {formatTaka(periodSummary.balance, useBn)}
                    </p>
                    {periodSummary.income > 0 && (
                      <p className="text-xs text-emerald-100/90 mt-1.5 tabular-nums">
                        আয় থেকে সঞ্চয়:{' '}
                        {formatNumber(
                          Math.max(
                            0,
                            Math.round(
                              ((periodSummary.income - periodSummary.expense) /
                                periodSummary.income) *
                                100
                            )
                          ),
                          useBn,
                          0
                        )}
                        %
                      </p>
                    )}
                  </div>

                  <div className="relative z-10 grid grid-cols-2 gap-4 pt-5 mt-5 border-t border-white/15">
                    <div>
                      <span className="text-xs text-emerald-100 flex items-center gap-1">
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        মোট জমা / আয়
                      </span>
                      <p className="text-lg sm:text-xl font-bold tabular-nums mt-1">
                        {formatTaka(periodSummary.income, useBn)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-emerald-100 flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        মোট খরচ / উত্তোলন
                      </span>
                      <p className="text-lg sm:text-xl font-bold tabular-nums mt-1">
                        {formatTaka(periodSummary.expense, useBn)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions & Multi-Period Snapshot */}
                <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <h3 className="text-sm font-bold text-slate-900">দ্রুত লেনদেন যোগ করুন</h3>
                      <span className="text-[11px] text-slate-400">১-ট্যাপ এন্ট্রি</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => openAddModal('in', 'দৈনিক')}
                        className="min-h-[78px] p-2 rounded-xl border border-slate-200/90 hover:border-[#137C50]/40 hover:bg-[#E7F6EE]/40 active:scale-[0.98] flex flex-col items-center justify-center gap-1.5 transition-all"
                      >
                        <span className="w-9 h-9 rounded-xl bg-[#E7F6EE] text-[#137C50] flex items-center justify-center">
                          <Plus className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">জমা</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openAddModal('out', 'দৈনিক')}
                        className="min-h-[78px] p-2 rounded-xl border border-slate-200/90 hover:border-[#DC2626]/40 hover:bg-red-50/40 active:scale-[0.98] flex flex-col items-center justify-center gap-1.5 transition-all"
                      >
                        <span className="w-9 h-9 rounded-xl bg-red-50 text-[#DC2626] flex items-center justify-center">
                          <Minus className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">খরচ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openAddModal('in', 'সাপ্তাহিক')}
                        className="min-h-[78px] p-2 rounded-xl border border-slate-200/90 hover:border-[#137C50]/40 hover:bg-[#E7F6EE]/40 active:scale-[0.98] flex flex-col items-center justify-center gap-1.5 transition-all"
                      >
                        <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                          <CalendarRange className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">সাপ্তাহিক</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openAddModal('in', 'মাসিক')}
                        className="min-h-[78px] p-2 rounded-xl border border-slate-200/90 hover:border-[#137C50]/40 hover:bg-[#E7F6EE]/40 active:scale-[0.98] flex flex-col items-center justify-center gap-1.5 transition-all"
                      >
                        <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                          <Calendar className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">মাসিক</span>
                      </button>
                    </div>
                  </div>

                  {/* Period comparison strip */}
                  <div className="grid grid-cols-3 gap-2 pt-4 mt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveNav('daily');
                        setAnchorDate(todayISO);
                      }}
                      className="text-left p-2 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <span className="block text-[11px] text-slate-500">আজকের নিট</span>
                      <span
                        className={`block text-sm font-bold tabular-nums mt-0.5 ${
                          todaySummary.balance >= 0 ? 'text-[#137C50]' : 'text-[#DC2626]'
                        }`}
                      >
                        {formatTaka(todaySummary.balance, useBn)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveNav('weekly');
                        setAnchorDate(todayISO);
                      }}
                      className="text-left p-2 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <span className="block text-[11px] text-slate-500">সাপ্তাহিক নিট</span>
                      <span
                        className={`block text-sm font-bold tabular-nums mt-0.5 ${
                          thisWeekSummary.balance >= 0 ? 'text-[#137C50]' : 'text-[#DC2626]'
                        }`}
                      >
                        {formatTaka(thisWeekSummary.balance, useBn)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveNav('monthly');
                        setAnchorMonth(currentMonthISO);
                      }}
                      className="text-left p-2 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <span className="block text-[11px] text-slate-500">মাসিক নিট</span>
                      <span
                        className={`block text-sm font-bold tabular-nums mt-0.5 ${
                          thisMonthSummary.balance >= 0 ? 'text-[#137C50]' : 'text-[#DC2626]'
                        }`}
                      >
                        {formatTaka(thisMonthSummary.balance, useBn)}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Home Analytics Row: Cashflow Chart + Budget Limits */}
              {activeNav === 'home' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  <div className="lg:col-span-7">
                    <CashflowChart
                      granularity={chartGranularity}
                      onGranularityChange={setChartGranularity}
                      dailySeries={dailySeries}
                      weeklySeries={weeklySeries}
                      monthlySeries={monthlySeries}
                      useBengaliDigits={useBn}
                    />
                  </div>

                  <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <h3 className="text-base font-semibold text-slate-900">
                          দৈনিক, সাপ্তাহিক ও মাসিক বাজেট
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveNav('settings')}
                          className="text-xs font-semibold text-[#137C50] hover:underline whitespace-nowrap"
                        >
                          সীমা বদলান
                        </button>
                      </div>

                      <div className="space-y-4">
                        {[
                          {
                            title: 'আজকের খরচ',
                            spent: todaySummary.expense,
                            limit: settings.dailyExpenseLimit,
                          },
                          {
                            title: 'চলতি সপ্তাহের খরচ',
                            spent: thisWeekSummary.expense,
                            limit: settings.weeklyExpenseLimit,
                          },
                          {
                            title: 'চলতি মাসের খরচ',
                            spent: thisMonthSummary.expense,
                            limit: settings.monthlyExpenseLimit,
                          },
                        ].map((row) => {
                          const status = getBudgetStatus(row.spent, row.limit);
                          return (
                            <div key={row.title}>
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="font-semibold text-slate-700">{row.title}</span>
                                <span className={`font-semibold ${status.text}`}>
                                  {status.label}
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${status.bar}`}
                                  style={{ width: `${status.pct}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-500 tabular-nums mt-1">
                                <span>ব্যয়: {formatTaka(row.spent, useBn)}</span>
                                <span>সীমা: {formatTaka(row.limit, useBn)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-600">চলতি মাসের নিট সঞ্চয় লক্ষ্য</span>
                      <span className="font-bold tabular-nums text-slate-900">
                        {formatTaka(thisMonthSummary.balance, useBn)} /{' '}
                        {formatTaka(settings.monthlySavingsGoal, useBn)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Period Category Summary when inside Daily/Weekly/Monthly view */}
              {activeNav !== 'home' && periodFilteredList.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
                      <TrendingUp className="w-4 h-4 text-[#137C50]" />
                      এই সময়ের আয়ের খাতসমূহ
                    </div>
                    {categoryBreakdown.incomes.length === 0 ? (
                      <p className="text-xs text-slate-500">এই সময়ে কোনো জমা/আয় নেই।</p>
                    ) : (
                      <div className="space-y-2.5">
                        {categoryBreakdown.incomes.map((cat) => (
                          <div key={cat.name} className="flex items-center justify-between text-xs">
                            <span className="text-slate-700 font-medium">{cat.name}</span>
                            <span className="tabular-nums font-semibold text-[#137C50]">
                              {formatTaka(cat.amount, useBn)} ({formatNumber(cat.pct, useBn, 0)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
                      <TrendingDown className="w-4 h-4 text-[#DC2626]" />
                      এই সময়ের খরচের খাতসমূহ
                    </div>
                    {categoryBreakdown.expenses.length === 0 ? (
                      <p className="text-xs text-slate-500">এই সময়ে কোনো খরচ নেই।</p>
                    ) : (
                      <div className="space-y-2.5">
                        {categoryBreakdown.expenses.map((cat) => (
                          <div key={cat.name} className="flex items-center justify-between text-xs">
                            <span className="text-slate-700 font-medium">{cat.name}</span>
                            <span className="tabular-nums font-semibold text-[#DC2626]">
                              {formatTaka(cat.amount, useBn)} ({formatNumber(cat.pct, useBn, 0)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recent / Period Transactions Section */}
              <section aria-labelledby="recent-heading">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 id="recent-heading" className="text-base font-bold text-slate-900">
                    {activeNav === 'home' ? 'সাম্প্রতিক লেনদেন' : 'এই সময়ের লেনদেন তালিকা'}
                  </h3>
                  {activeNav === 'home' && transactions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveNav('transactions')}
                      className="text-xs font-semibold text-[#137C50] hover:underline whitespace-nowrap"
                    >
                      সব লেনদেন দেখুন
                    </button>
                  )}
                </div>

                {periodFilteredList.length === 0 ? (
                  renderEmptyState(
                    activeNav === 'home' && homePeriod === 'all'
                      ? undefined
                      : 'নির্বাচিত সময়ে কোনো লেনদেন পাওয়া যায়নি। নতুন লেনদেন যোগ করে হিসাব শুরু করুন।'
                  )
                ) : (
                  <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden">
                    {(activeNav === 'home'
                      ? periodFilteredList.slice(0, 8)
                      : periodFilteredList
                    ).map(renderTransactionRow)}
                  </div>
                )}
              </section>
            </>
          )}

          {/* ==================== ALL TRANSACTIONS LEDGER ==================== */}
          {activeNav === 'transactions' && (
            <section className="space-y-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-5 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="বিবরণ, খাত বা নোট দিয়ে খুঁজুন..."
                      className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#137C50]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <select
                      aria-label="হিসাবের সময়কাল ফিল্টার"
                      value={txCadenceFilter}
                      onChange={(e) => setTxCadenceFilter(e.target.value as 'all' | Cadence)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#137C50]"
                    >
                      <option value="all">সব সময়কাল</option>
                      {CADENCE_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <select
                      aria-label="মাস অনুযায়ী ফিল্টার"
                      value={txMonthFilter}
                      onChange={(e) => setTxMonthFilter(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#137C50]"
                    >
                      <option value="all">সকল মাস</option>
                      {availableMonths.map((m) => (
                        <option key={m} value={m}>
                          {formatBengaliMonth(m, useBn)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <select
                      aria-label="সাজানোর ধরন"
                      value={txSort}
                      onChange={(e) => setTxSort(e.target.value as 'newest' | 'amount')}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#137C50]"
                    >
                      <option value="newest">নতুন তারিখ আগে</option>
                      <option value="amount">বেশি টাকা আগে</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                    {(
                      [
                        { id: 'all', label: 'সব' },
                        { id: 'in', label: 'জমা / আয়' },
                        { id: 'out', label: 'খরচ / উত্তোলন' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setTxTypeFilter(f.id)}
                        className={`px-3.5 py-1.5 min-h-[34px] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                          txTypeFilter === f.id
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="text-xs text-slate-600 tabular-nums">
                    দেখানো হচ্ছে{' '}
                    <strong>{formatNumber(filteredTransactionsPage.length, useBn, 0)}টি</strong>{' '}
                    লেনদেন · মোট:{' '}
                    <strong className="text-slate-900">
                      {formatTaka(
                        summarizeTransactions(filteredTransactionsPage).balance,
                        useBn
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              {filteredTransactionsPage.length === 0 ? (
                renderEmptyState('খোঁজা বা ফিল্টারের সাথে মিলে এমন কোনো লেনদেন পাওয়া যায়নি।')
              ) : (
                <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden">
                  {filteredTransactionsPage.map(renderTransactionRow)}
                </div>
              )}
            </section>
          )}

          {/* ==================== REPORTS & ANALYTICS ==================== */}
          {activeNav === 'reports' && (
            <section className="space-y-5">
              {/* Period Comparison Table */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 overflow-x-auto">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      দৈনিক, সাপ্তাহিক, মাসিক ও সার্বিক সারাংশ
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      প্রতিটি সময়কালের জমা, খরচ এবং নিট ব্যালেন্সের তুলনা
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 no-print">
                    <button
                      type="button"
                      onClick={() => exportTransactionsToCSV(sortedAll)}
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-[#137C50] hover:bg-[#0F6842] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <Download className="w-4 h-4" />
                      CSV ডাউনলোড
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <Printer className="w-4 h-4" />
                      প্রিন্ট / PDF
                    </button>
                  </div>
                </div>

                <table className="w-full text-left border-collapse min-w-[540px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500">
                      <th className="py-3 pr-4 font-semibold">সময়কাল</th>
                      <th className="py-3 px-4 font-semibold text-right">লেনদেন</th>
                      <th className="py-3 px-4 font-semibold text-right">মোট জমা / আয়</th>
                      <th className="py-3 px-4 font-semibold text-right">মোট খরচ</th>
                      <th className="py-3 pl-4 font-semibold text-right">নিট ব্যালেন্স</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {[
                      { label: 'আজকের দিন (দৈনিক)', data: todaySummary },
                      { label: 'চলতি সপ্তাহ (সাপ্তাহিক)', data: thisWeekSummary },
                      { label: 'চলতি মাস (মাসিক)', data: thisMonthSummary },
                      { label: 'সর্বমোট (সার্বিক)', data: allSummary },
                    ].map((row) => (
                      <tr key={row.label} className="hover:bg-slate-50/70">
                        <td className="py-3.5 pr-4 font-semibold text-slate-900">{row.label}</td>
                        <td className="py-3.5 px-4 text-right tabular-nums text-slate-600">
                          {formatNumber(row.data.count, useBn, 0)}
                        </td>
                        <td className="py-3.5 px-4 text-right tabular-nums font-semibold text-[#137C50]">
                          {formatTaka(row.data.income, useBn)}
                        </td>
                        <td className="py-3.5 px-4 text-right tabular-nums font-semibold text-[#DC2626]">
                          {formatTaka(row.data.expense, useBn)}
                        </td>
                        <td
                          className={`py-3.5 pl-4 text-right tabular-nums font-bold ${
                            row.data.balance >= 0 ? 'text-slate-900' : 'text-[#DC2626]'
                          }`}
                        >
                          {formatTaka(row.data.balance, useBn)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Monthly Trend Chart */}
              <CashflowChart
                granularity={chartGranularity}
                onGranularityChange={setChartGranularity}
                dailySeries={dailySeries}
                weeklySeries={weeklySeries}
                monthlySeries={monthlySeries}
                useBengaliDigits={useBn}
              />

              {/* Category Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
                  <h3 className="text-base font-bold text-slate-900 mb-4">
                    খাতভিত্তিক জমা / আয়
                  </h3>
                  {categoryBreakdown.incomes.length === 0 ? (
                    <p className="text-sm text-slate-500">এখনো কোনো জমার হিসাব নেই।</p>
                  ) : (
                    <div className="space-y-3.5">
                      {categoryBreakdown.incomes.map((c) => (
                        <div key={c.name}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold text-slate-700">{c.name}</span>
                            <span className="tabular-nums font-semibold text-[#137C50]">
                              {formatTaka(c.amount, useBn)} · {formatNumber(c.pct, useBn, 0)}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#168653]"
                              style={{ width: `${c.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
                  <h3 className="text-base font-bold text-slate-900 mb-4">
                    খাতভিত্তিক খরচ / উত্তোলন
                  </h3>
                  {categoryBreakdown.expenses.length === 0 ? (
                    <p className="text-sm text-slate-500">এখনো কোনো খরচের হিসাব নেই।</p>
                  ) : (
                    <div className="space-y-3.5">
                      {categoryBreakdown.expenses.map((c) => (
                        <div key={c.name}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold text-slate-700">{c.name}</span>
                            <span className="tabular-nums font-semibold text-[#DC2626]">
                              {formatTaka(c.amount, useBn)} · {formatNumber(c.pct, useBn, 0)}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#DC2626]"
                              style={{ width: `${c.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ==================== SETTINGS MENU (UNIFORM ICON CARDS) ==================== */}
          {activeNav === 'settings' && (
            <section className="max-w-3xl space-y-4">
              {/* Profile & Account Section with Logout Button (খালি সেটিংস এর ভেতরে থাকবে) */}
              <UserProfileSection
                variant="settings"
                onToast={showToast}
                onNavigateToDrive={() => setActiveNav('settings-drive')}
                onNameActivated={(name) => {
                  if (name && (!settings.accountTitle || settings.accountTitle === 'সহজ হিসাব')) {
                    updateSettings({
                      ...settings,
                      accountTitle: `${name} এর হিসাব`,
                    });
                  }
                }}
              />

              <PWAInstallButton variant="card" onToast={showToast} />

              <button
                type="button"
                onClick={() => setActiveNav('categories')}
                className="w-full min-h-[74px] bg-white border border-slate-200/90 hover:border-[#137C50]/40 hover:bg-slate-50/70 rounded-2xl p-4 sm:px-5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#E7F6EE] text-[#137C50] flex items-center justify-center shrink-0">
                    <Tags className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      খাত / ক্যাটাগরি সাজান ও কাস্টমাইজ করুন
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {settings.accountSector} ·{' '}
                      {formatNumber(
                        settings.expenseCategories.length + settings.incomeCategories.length,
                        useBn,
                        0
                      )}
                      টি খাত · সেক্টর ও খাত এডিট করুন
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setActiveNav('settings-drive')}
                className="w-full min-h-[74px] bg-white border border-slate-200/90 hover:border-[#137C50]/40 hover:bg-slate-50/70 rounded-2xl p-4 sm:px-5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#E7F6EE] text-[#137C50] flex items-center justify-center shrink-0">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      গুগল ড্রাইভ ও সিঙ্ক (ঐচ্ছিক)
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {currentUser
                        ? `${currentUser.email} অ্যাকাউন্টের সাথে ড্রাইভ সিঙ্ক`
                        : 'জিমেইল দিয়ে লগইন করে ড্রাইভে সেভ রাখুন বা অন্যকে হিসাব পাঠান'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setActiveNav('settings-monthly')}
                className="w-full min-h-[74px] bg-white border border-slate-200/90 hover:border-[#137C50]/40 hover:bg-slate-50/70 rounded-2xl p-4 sm:px-5 flex items-center justify-between gap-3 text-left transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#E7F6EE] text-[#137C50] flex items-center justify-center shrink-0">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      মাস শেষ ও সংরক্ষিত হিসাব
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      মাস শেষ করে প্রতি মাসের হিসাব স্থায়ীভাবে সেভ রাখুন ·{' '}
                      {formatNumber(archives.length, useBn, 0)}টি মাস সংরক্ষিত
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setActiveNav('settings-budget')}
                className="w-full min-h-[74px] bg-white border border-slate-200/90 hover:border-[#137C50]/40 hover:bg-slate-50/70 rounded-2xl p-4 sm:px-5 flex items-center justify-between gap-3 text-left transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#E7F6EE] text-[#137C50] flex items-center justify-center shrink-0">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      হিসাব ও বাজেট সেটিংস
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {settings.accountTitle} · মাসিক সীমা{' '}
                      {formatTaka(settings.monthlyExpenseLimit, useBn)} ·{' '}
                      {settings.useBengaliDigits ? 'বাংলা সংখ্যা' : 'ইংরেজি সংখ্যা'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setActiveNav('settings-backup')}
                className="w-full min-h-[74px] bg-white border border-slate-200/90 hover:border-[#137C50]/40 hover:bg-slate-50/70 rounded-2xl p-4 sm:px-5 flex items-center justify-between gap-3 text-left transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      ডেটা ব্যাকআপ ও পুনরুদ্ধার
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      JSON ব্যাকআপ ডাউনলোড, আপলোড ও নমুনা হিসাব ·{' '}
                      {formatNumber(transactions.length, useBn, 0)}টি লেনদেন
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setActiveNav('settings-reset')}
                className="w-full min-h-[74px] bg-white border border-slate-200/90 hover:border-[#DC2626]/40 hover:bg-red-50/30 rounded-2xl p-4 sm:px-5 flex items-center justify-between gap-3 text-left transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-red-50 text-[#DC2626] flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      সব হিসাব মুছে ফেলুন
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      সংরক্ষিত সকল লেনদেন স্থায়ীভাবে রিসেট করুন
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </button>
            </section>
          )}

          {/* ==================== DEDICATED GOOGLE DRIVE SYNC PAGE ==================== */}
          {activeNav === 'settings-drive' && (
            <section className="max-w-3xl space-y-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveNav('settings')}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <ChevronLeft className="w-4 h-4" />
                  সেটিংসে ফিরুন
                </button>
              </div>

              <GoogleDriveSync
                settings={settings}
                transactions={transactions}
                archives={archives}
                useBengaliDigits={useBn}
                onRestoreAll={handleRestoreAll}
                onToast={showToast}
              />
            </section>
          )}

          {/* ==================== DEDICATED MONTH-END & ARCHIVES PAGE ==================== */}
          {activeNav === 'settings-monthly' && (
            <section className="max-w-3xl space-y-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveNav('settings')}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <ChevronLeft className="w-4 h-4" />
                  সেটিংসে ফিরুন
                </button>
              </div>

              <MonthlyArchiveManager
                transactions={transactions}
                archives={archives}
                currentMonthISO={currentMonthISO}
                todayISO={todayISO}
                useBengaliDigits={useBn}
                onSaveArchive={handleSaveMonthlyArchive}
                onDeleteArchive={handleDeleteMonthlyArchive}
                onToast={showToast}
              />
            </section>
          )}

          {/* ==================== DEDICATED CATEGORIES PAGE ==================== */}
          {activeNav === 'categories' && (
            <section className="max-w-3xl space-y-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveNav('settings')}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <ChevronLeft className="w-4 h-4" />
                  সেটিংসে ফিরুন
                </button>
              </div>

              <CategoryManager
                accountSector={settings.accountSector}
                incomeCategories={settings.incomeCategories}
                expenseCategories={settings.expenseCategories}
                useBengaliDigits={useBn}
                onUpdateCategories={handleUpdateCategories}
                onApplySector={handleApplySector}
                onRenameSector={handleRenameSector}
                onToast={showToast}
              />
            </section>
          )}

          {/* ==================== DEDICATED BUDGET SETTINGS PAGE ==================== */}
          {activeNav === 'settings-budget' && (
            <section className="max-w-3xl space-y-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveNav('settings')}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <ChevronLeft className="w-4 h-4" />
                  সেটিংসে ফিরুন
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateSettings(draftSettings);
                  showToast('সেটিংস ও বাজেট সীমা সংরক্ষণ করা হয়েছে');
                }}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4"
              >
                <div>
                  <h2 className="text-base font-bold text-slate-900">হিসাব ও বাজেট সেটিংস</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    দৈনিক, সাপ্তাহিক ও মাসিক খরচের সীমা নির্ধারণ করুন
                  </p>
                </div>

                <div>
                  <label htmlFor="s-title" className="block text-xs font-semibold text-slate-600 mb-1.5">
                    হিসাব খাতার নাম
                  </label>
                  <input
                    id="s-title"
                    type="text"
                    maxLength={60}
                    value={draftSettings.accountTitle}
                    onChange={(e) =>
                      setDraftSettings({ ...draftSettings, accountTitle: e.target.value })
                    }
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#137C50]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="s-daily" className="block text-xs font-semibold text-slate-600 mb-1.5">
                      দৈনিক খরচের সীমা (৳)
                    </label>
                    <input
                      id="s-daily"
                      type="number"
                      min="0"
                      value={draftSettings.dailyExpenseLimit}
                      onChange={(e) =>
                        setDraftSettings({
                          ...draftSettings,
                          dailyExpenseLimit: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-[#137C50]"
                    />
                  </div>
                  <div>
                    <label htmlFor="s-weekly" className="block text-xs font-semibold text-slate-600 mb-1.5">
                      সাপ্তাহিক খরচের সীমা (৳)
                    </label>
                    <input
                      id="s-weekly"
                      type="number"
                      min="0"
                      value={draftSettings.weeklyExpenseLimit}
                      onChange={(e) =>
                        setDraftSettings({
                          ...draftSettings,
                          weeklyExpenseLimit: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-[#137C50]"
                    />
                  </div>
                  <div>
                    <label htmlFor="s-monthly" className="block text-xs font-semibold text-slate-600 mb-1.5">
                      মাসিক খরচের সীমা (৳)
                    </label>
                    <input
                      id="s-monthly"
                      type="number"
                      min="0"
                      value={draftSettings.monthlyExpenseLimit}
                      onChange={(e) =>
                        setDraftSettings({
                          ...draftSettings,
                          monthlyExpenseLimit: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-[#137C50]"
                    />
                  </div>
                  <div>
                    <label htmlFor="s-goal" className="block text-xs font-semibold text-slate-600 mb-1.5">
                      মাসিক সঞ্চয়ের লক্ষ্য (৳)
                    </label>
                    <input
                      id="s-goal"
                      type="number"
                      min="0"
                      value={draftSettings.monthlySavingsGoal}
                      onChange={(e) =>
                        setDraftSettings({
                          ...draftSettings,
                          monthlySavingsGoal: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-[#137C50]"
                    />
                  </div>
                </div>

                <label className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <div>
                    <span className="block text-sm font-semibold text-slate-800">
                      বাংলা সংখ্যায় হিসাব দেখান (০১২৩)
                    </span>
                    <span className="block text-xs text-slate-500">
                      বন্ধ করলে ইংরেজি সংখ্যায় (0123) দেখাবে
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={draftSettings.useBengaliDigits}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        useBengaliDigits: e.target.checked,
                      })
                    }
                    className="w-5 h-5 accent-[#137C50]"
                  />
                </label>

                <button
                  type="submit"
                  className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#137C50] hover:bg-[#0F6842] text-white text-sm font-semibold transition-colors"
                >
                  সেটিংস সংরক্ষণ করুন
                </button>
              </form>
            </section>
          )}

          {/* ==================== DEDICATED BACKUP & RESTORE PAGE ==================== */}
          {activeNav === 'settings-backup' && (
            <section className="max-w-3xl space-y-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveNav('settings')}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <ChevronLeft className="w-4 h-4" />
                  সেটিংসে ফিরুন
                </button>
              </div>

              {/* Google Drive Cloud Sync */}
              <GoogleDriveSync
                settings={settings}
                transactions={transactions}
                archives={archives}
                onRestoreAll={handleRestoreAll}
                onToast={showToast}
                useBengaliDigits={useBn}
              />

              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">ডেটা ব্যাকআপ ও পুনরুদ্ধার</h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    আপনার হিসাব এই ডিভাইসের ব্রাউজারে সংরক্ষিত থাকে। নিরাপত্তা হিসেবে যেকোনো সময় JSON বা CSV ফাইল ডাউনলোড করে রাখতে পারেন।
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-800 inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4 text-[#137C50]" />
                    JSON ব্যাকআপ ডাউনলোড
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-800 inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <Upload className="w-4 h-4 text-slate-700" />
                    ব্যাকআপ ফাইল আপলোড
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={handleRestoreJSON}
                    className="hidden"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs sm:text-sm font-semibold text-slate-700 inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  নমুনা হিসাব যোগ করুন
                </button>
              </div>
            </section>
          )}

          {/* ==================== DEDICATED RESET DATA PAGE ==================== */}
          {activeNav === 'settings-reset' && (
            <section className="max-w-3xl space-y-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveNav('settings')}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <ChevronLeft className="w-4 h-4" />
                  সেটিংসে ফিরুন
                </button>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">সব হিসাব মুছে ফেলুন</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                    নতুন করে শুরু করতে চাইলে সংরক্ষিত সকল লেনদেন (বর্তমানে{' '}
                    <strong className="text-slate-800 tabular-nums">
                      {formatNumber(transactions.length, useBn, 0)}টি
                    </strong>
                    ) স্থায়ীভাবে মুছে ফেলতে পারেন। মোছার আগে চাইলে ব্যাকআপ নিয়ে রাখতে পারেন।
                  </p>
                </div>

                <button
                  type="button"
                  disabled={transactions.length === 0}
                  onClick={() => setClearConfirmOpen(true)}
                  className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-xl bg-[#DC2626] hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                >
                  সব লেনদেন মুছে ফেলুন
                </button>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (5-slot ergonomic bar with central Add Transaction button) */}
      <nav
        aria-label="মোবাইল নেভিগেশন"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-[62px] bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-5 items-center px-1 no-print"
      >
        {mobileTabs.slice(0, 2).map((tab) => {
          const Icon = tab.icon;
          const active =
            activeNav === tab.id ||
            (tab.id === 'home' &&
              (activeNav === 'daily' || activeNav === 'weekly' || activeNav === 'monthly'));
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveNav(tab.id)}
              className={`min-h-[46px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors whitespace-nowrap ${
                active ? 'text-[#137C50] font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}

        {/* Central Add New Transaction Button */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() =>
              openAddModal(
                'in',
                activeNav === 'weekly'
                  ? 'সাপ্তাহিক'
                  : activeNav === 'monthly'
                  ? 'মাসিক'
                  : 'দৈনিক',
                activeNav === 'daily' || activeNav === 'weekly' ? anchorDate : todayISO
              )
            }
            aria-label="নতুন লেনদেন যোগ করুন"
            className="w-12 h-12 -mt-3 rounded-2xl bg-[#137C50] hover:bg-[#0F6842] active:scale-95 text-white shadow-md shadow-[#137C50]/30 border-4 border-[#F6F8FA] flex items-center justify-center transition-all"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {mobileTabs.slice(2).map((tab) => {
          const Icon = tab.icon;
          const active =
            activeNav === tab.id ||
            (tab.id === 'settings' && isSettingsSubPage);
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveNav(tab.id)}
              className={`min-h-[46px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors whitespace-nowrap ${
                active ? 'text-[#137C50] font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Modals & Dialogs */}
      <TransactionModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTx(null);
        }}
        onSave={handleSaveTransaction}
        initialType={modalInitialType}
        initialCadence={modalInitialCadence}
        initialDate={modalInitialDate}
        editingTx={editingTx}
        useBengaliDigits={useBn}
        incomeCategories={settings.incomeCategories}
        expenseCategories={settings.expenseCategories}
        onOpenCategorySettings={() => setActiveNav('categories')}
        onAddQuickCategory={handleAddQuickCategory}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="লেনদেন মুছবেন?"
        description={
          deleteTarget
            ? `"${deleteTarget.desc}" (${formatTaka(deleteTarget.amount, useBn)}) লেনদেনটি স্থায়ীভাবে মুছে যাবে।`
            : ''
        }
        confirmLabel="হ্যাঁ, মুছুন"
        onConfirm={confirmDeleteTransaction}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={clearConfirmOpen}
        title="সব হিসাব মুছে ফেলবেন?"
        description="সকল সংরক্ষিত লেনদেন মুছে যাবে। আগে JSON বা CSV ব্যাকআপ না নিলে এই তথ্য আর ফেরত পাওয়া যাবে না।"
        confirmLabel="সব মুছে ফেলুন"
        onConfirm={handleClearAllData}
        onCancel={() => setClearConfirmOpen(false)}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 lg:bottom-6 right-4 lg:right-6 z-50 bg-slate-900 text-white text-xs sm:text-sm font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 no-print"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
