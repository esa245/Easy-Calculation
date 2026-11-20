export type TransactionType = 'in' | 'out';
export type Cadence = 'দৈনিক' | 'সাপ্তাহিক' | 'মাসিক' | 'অন্যান্য';
export type PeriodScope = 'all' | 'day' | 'week' | 'month';

export interface Transaction {
  id: string;
  desc: string;
  amount: number;
  type: TransactionType;
  cadence: Cadence;
  category: string;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: number;
}

export interface LedgerSettings {
  accountTitle: string;
  accountSector: string;
  useBengaliDigits: boolean;
  dailyExpenseLimit: number;
  weeklyExpenseLimit: number;
  monthlyExpenseLimit: number;
  monthlySavingsGoal: number;
  incomeCategories: string[];
  expenseCategories: string[];
}

export interface SectorPreset {
  id: string;
  name: string;
  description: string;
  incomeCategories: string[];
  expenseCategories: string[];
}

export interface MonthlyArchiveCategoryTotal {
  name: string;
  amount: number;
}

export interface MonthlyArchive {
  month: string; // YYYY-MM
  closedAt: string; // YYYY-MM-DD
  updatedAt: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactionCount: number;
  note?: string;
  incomeByCategory: MonthlyArchiveCategoryTotal[];
  expenseByCategory: MonthlyArchiveCategoryTotal[];
  transactions: Transaction[];
}

export type BuiltinAssetChannel = 'bkash' | 'nagad' | 'bank' | 'cash' | 'other';
export type AssetChannel = BuiltinAssetChannel | (string & {});

export interface CustomAssetChannel {
  id: string;
  label: string;
  iconType: 'mobile' | 'bank' | 'cash' | 'piggy' | 'wallet';
  colorTheme: 'emerald' | 'blue' | 'pink' | 'orange' | 'violet' | 'teal';
  createdAt: number;
}

export interface AssetAccount {
  id: string;
  channel: AssetChannel;
  name: string;
  balance: number;
  note?: string;
  updatedAt: number;
}

export const STORAGE_KEY_V2 = 'mmp_pro_ledger_v2';
export const STORAGE_KEY_SETTINGS = 'mmp_pro_settings_v2';
export const STORAGE_KEY_ARCHIVES = 'mmp_pro_monthly_archives_v1';
export const STORAGE_KEY_ASSETS = 'mmp_pro_assets_v1';
export const STORAGE_KEY_ASSET_CHANNELS = 'mmp_pro_asset_channels_v1';
export const LEGACY_STORAGE_KEY = 'mmp_hopweb_v1';

export const INCOME_CATEGORIES = [
  'বেতন / সম্মানী',
  'ব্যবসা / বিক্রয়',
  'সদস্য জমা',
  'বিনিয়োগ / লাভ',
  'উপহার / বোনাস',
  'অন্যান্য আয়',
];

export const EXPENSE_CATEGORIES = [
  'বাজার ও খাবার',
  'বাড়ি ভাড়া',
  'যাতায়াত',
  'বিল ও রিচার্জ',
  'চিকিৎসা',
  'শিক্ষা ও বই',
  'ব্যক্তিগত ও কেনাকাটা',
  'উত্তোলন / পরিশোধ',
  'অন্যান্য খরচ',
];

export const SECTOR_PRESETS: SectorPreset[] = [
  {
    id: 'personal',
    name: 'ব্যক্তিগত ও সংসার',
    description: 'দৈনন্দিন পারিবারিক বাজার, বেতন, ভাড়া ও ব্যক্তিগত হিসাব',
    incomeCategories: INCOME_CATEGORIES,
    expenseCategories: EXPENSE_CATEGORIES,
  },
  {
    id: 'shop',
    name: 'দোকান ও ব্যবসা',
    description: 'দোকানের নগদ/বাকি বিক্রয়, মাল ক্রয়, দোকান ভাড়া ও কর্মচারী খরচ',
    incomeCategories: [
      'নগদ বিক্রয়',
      'বাকি আদায়',
      'বিকাশ / অনলাইন বিক্রয়',
      'পাইকারি বিক্রয়',
      'মালিক মূলধন জমা',
      'অন্যান্য আয়',
    ],
    expenseCategories: [
      'মাল / স্টক ক্রয়',
      'দোকান ভাড়া',
      'কর্মচারী বেতন',
      'বিদ্যুৎ ও ইন্টারনেট বিল',
      'পরিবহন ও ডেলিভারি',
      'চা-নাস্তা ও আপ্যায়ন',
      'দোকান মেরামত ও সাজসজ্জা',
      'বাকি / মহাজন পরিশোধ',
      'অন্যান্য খরচ',
    ],
  },
  {
    id: 'association',
    name: 'সমিতি ও সঞ্চয়',
    description: 'সদস্যদের সঞ্চয় জমা, কিস্তি আদায় ও তহবিল পরিচালনা',
    incomeCategories: [
      'সদস্য সঞ্চয় জমা',
      'কিস্তি আদায়',
      'ভর্তি / সদস্য ফি',
      'মুনাফা ও লাভ',
      'অনুদান',
      'অন্যান্য জমা',
    ],
    expenseCategories: [
      'সঞ্চয় ফেরত / উত্তোলন',
      'ঋণ / কিস্তি প্রদান',
      'অফিস ভাড়া ও বিল',
      'আপ্যায়ন ও মিটিং খরচ',
      'যাতায়াত ও স্টেশনারি',
      'অন্যান্য খরচ',
    ],
  },
  {
    id: 'service',
    name: 'ফ্রিল্যান্সিং ও সেবা',
    description: 'ক্লায়েন্ট পেমেন্ট, টিউশনি, প্রজেক্ট আয় ও অফিস সরঞ্জাম',
    incomeCategories: [
      'ক্লায়েন্ট পেমেন্ট',
      'প্রজেক্ট / সার্ভিস ফি',
      'টিউশনি / সম্মানী',
      'কনসাল্টিং',
      'অন্যান্য আয়',
    ],
    expenseCategories: [
      'ইন্টারনেট ও মোবাইল বিল',
      'সফটওয়্যার ও সাবস্ক্রিপশন',
      'সরঞ্জাম ও যন্ত্রপাতি',
      'অফিস / কো-ওয়ার্কিং',
      'যাতায়াত ও খাবার',
      'অন্যান্য খরচ',
    ],
  },
];

export const DEFAULT_SETTINGS: LedgerSettings = {
  accountTitle: 'আমার হিসাব খাতা',
  accountSector: 'ব্যক্তিগত ও সংসার',
  useBengaliDigits: true,
  dailyExpenseLimit: 1500,
  weeklyExpenseLimit: 8000,
  monthlyExpenseLimit: 30000,
  monthlySavingsGoal: 10000,
  incomeCategories: INCOME_CATEGORIES,
  expenseCategories: EXPENSE_CATEGORIES,
};

export const CADENCE_OPTIONS: Cadence[] = ['দৈনিক', 'সাপ্তাহিক', 'মাসিক', 'অন্যান্য'];

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const BENGALI_MONTHS_SHORT = [
  'জানু',
  'ফেব্রু',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টে',
  'অক্টো',
  'নভে',
  'ডিসে',
];
const BENGALI_MONTHS_FULL = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];
const BENGALI_WEEKDAYS = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার',
];

export function toBengaliDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => BENGALI_DIGITS[Number(d)] ?? d);
}

function groupSouthAsianInteger(intStr: string): string {
  if (intStr.length <= 3) return intStr;
  const lastThree = intStr.slice(-3);
  const rest = intStr.slice(0, -3);
  const groupedRest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${groupedRest},${lastThree}`;
}

export function formatNumber(value: number, useBengali = true, maxDecimals = 2): string {
  const num = Number(value || 0);
  const safeNum = Number.isFinite(num) ? num : 0;
  const isNeg = safeNum < 0;
  const abs = Math.abs(safeNum);
  const factor = Math.pow(10, maxDecimals);
  const rounded = Math.round(abs * factor) / factor;
  const fixed = maxDecimals > 0 ? rounded.toFixed(maxDecimals).replace(/\.?0+$/, '') : String(Math.round(rounded));
  const [intPart, decPart] = fixed.split('.');
  const grouped = groupSouthAsianInteger(intPart);
  const formatted = `${isNeg ? '-' : ''}${decPart ? `${grouped}.${decPart}` : grouped}`;
  return useBengali ? toBengaliDigits(formatted) : formatted;
}

export function formatTaka(value: number, useBengali = true): string {
  const abs = Math.abs(Number(value || 0));
  const prefix = value < 0 ? '−৳' : '৳';
  return `${prefix}${formatNumber(abs, useBengali, 2)}`;
}

export function getTodayISO(dateObj = new Date()): string {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getMonthISO(dateObj = new Date()): string {
  return getTodayISO(dateObj).slice(0, 7);
}

function formatUTCDateISO(dt: Date): string {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function shiftDateISO(isoDate: string, days: number): string {
  if (!isoDate || isoDate.length < 10) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return formatUTCDateISO(dt);
}

export function shiftMonthISO(isoMonth: string, months: number): string {
  if (!isoMonth || isoMonth.length < 7) return '';
  const [y, m] = isoMonth.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + months, 1));
  return formatUTCDateISO(dt).slice(0, 7);
}

export function getWeekBounds(isoDate: string): { start: string; end: string } {
  if (!isoDate || isoDate.length < 10) return { start: '', end: '' };
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const offset = (dt.getUTCDay() + 6) % 7;
  const startDt = new Date(Date.UTC(y, m - 1, d - offset));
  const endDt = new Date(Date.UTC(y, m - 1, d - offset + 6));
  return {
    start: formatUTCDateISO(startDt),
    end: formatUTCDateISO(endDt),
  };
}

export function formatBengaliDate(isoDate: string, useBengali = true): string {
  if (!isoDate || isoDate.length < 10) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return '';
  const monthLabel = BENGALI_MONTHS_SHORT[m - 1] ?? '';
  const raw = `${d} ${monthLabel}, ${y}`;
  return useBengali ? toBengaliDigits(raw) : raw;
}

export function formatBengaliMonth(isoMonth: string, useBengali = true): string {
  if (!isoMonth || isoMonth.length < 7) return '';
  const [y, m] = isoMonth.split('-').map(Number);
  if (!y || !m) return '';
  const monthLabel = BENGALI_MONTHS_FULL[m - 1] ?? '';
  const raw = `${monthLabel} ${y}`;
  return useBengali ? toBengaliDigits(raw) : raw;
}

export function formatBengaliWeekday(isoDate: string): string {
  if (!isoDate || isoDate.length < 10) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return '';
  const dt = new Date(Date.UTC(y, m - 1, d));
  return BENGALI_WEEKDAYS[dt.getUTCDay()] ?? '';
}

export function summarizeTransactions(list: Transaction[]) {
  let income = 0;
  let expense = 0;
  for (const tx of list) {
    if (tx.type === 'in') income += tx.amount;
    else expense += tx.amount;
  }
  return {
    income,
    expense,
    balance: income - expense,
    count: list.length,
  };
}

export function filterByPeriod(
  list: Transaction[],
  scope: PeriodScope,
  anchorDate: string,
  anchorMonth: string
): Transaction[] {
  if (scope === 'all') return list;
  if (scope === 'day') {
    if (!anchorDate) return [];
    return list.filter((tx) => tx.date === anchorDate);
  }
  if (scope === 'week') {
    if (!anchorDate) return [];
    const { start, end } = getWeekBounds(anchorDate);
    if (!start || !end) return [];
    return list.filter((tx) => tx.date >= start && tx.date <= end);
  }
  // month
  if (!anchorMonth) return [];
  return list.filter((tx) => tx.date.slice(0, 7) === anchorMonth);
}

export interface ChartBucket {
  key: string;
  label: string;
  income: number;
  expense: number;
}

export function buildDailySeries(
  list: Transaction[],
  endDateISO: string,
  days = 7,
  useBengali = true
): ChartBucket[] {
  if (!endDateISO || endDateISO.length < 10) {
    return Array.from({ length: days }, (_, idx) => ({
      key: `day_placeholder_${idx}`,
      label: '—',
      income: 0,
      expense: 0,
    }));
  }
  const buckets: ChartBucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dISO = shiftDateISO(endDateISO, -i);
    const [, m, d] = dISO.split('-').map(Number);
    const rawLabel = `${d} ${BENGALI_MONTHS_SHORT[m - 1] ?? ''}`;
    const label = useBengali ? toBengaliDigits(rawLabel) : rawLabel;
    const dayTx = list.filter((tx) => tx.date === dISO);
    const sum = summarizeTransactions(dayTx);
    buckets.push({ key: dISO, label, income: sum.income, expense: sum.expense });
  }
  return buckets;
}

export function buildWeeklySeries(
  list: Transaction[],
  anchorDateISO: string,
  weeks = 6,
  useBengali = true
): ChartBucket[] {
  if (!anchorDateISO || anchorDateISO.length < 10) {
    return Array.from({ length: weeks }, (_, idx) => ({
      key: `week_placeholder_${idx}`,
      label: '—',
      income: 0,
      expense: 0,
    }));
  }
  const buckets: ChartBucket[] = [];
  const currentBounds = getWeekBounds(anchorDateISO);
  for (let i = weeks - 1; i >= 0; i--) {
    const wStart = shiftDateISO(currentBounds.start, -i * 7);
    const wEnd = shiftDateISO(wStart, 6);
    const [, sm, sd] = wStart.split('-').map(Number);
    const rawLabel = `${sd} ${BENGALI_MONTHS_SHORT[sm - 1] ?? ''}`;
    const label = useBengali ? toBengaliDigits(rawLabel) : rawLabel;
    const weekTx = list.filter((tx) => tx.date >= wStart && tx.date <= wEnd);
    const sum = summarizeTransactions(weekTx);
    buckets.push({ key: wStart, label, income: sum.income, expense: sum.expense });
  }
  return buckets;
}

export function buildMonthlySeries(
  list: Transaction[],
  anchorMonthISO: string,
  months = 6
): ChartBucket[] {
  if (!anchorMonthISO || anchorMonthISO.length < 7) {
    return Array.from({ length: months }, (_, idx) => ({
      key: `month_placeholder_${idx}`,
      label: '—',
      income: 0,
      expense: 0,
    }));
  }
  const buckets: ChartBucket[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const mISO = shiftMonthISO(anchorMonthISO, -i);
    const [, m] = mISO.split('-').map(Number);
    const label = BENGALI_MONTHS_SHORT[m - 1] ?? '';
    const monthTx = list.filter((tx) => tx.date.slice(0, 7) === mISO);
    const sum = summarizeTransactions(monthTx);
    buckets.push({ key: mISO, label, income: sum.income, expense: sum.expense });
  }
  return buckets;
}

export function subscribeNoop(): () => void {
  return () => {};
}

export function getClientTodayISO(): string {
  return getTodayISO();
}

export function getServerTodayISO(): string {
  return '';
}

const EMPTY_TRANSACTIONS: Transaction[] = [];
const EMPTY_ARCHIVES: MonthlyArchive[] = [];
const EMPTY_ASSETS: AssetAccount[] = [];
const EMPTY_ASSET_CHANNELS: CustomAssetChannel[] = [];
const ledgerListeners = new Set<() => void>();
let cachedTxRaw: string | null | undefined = undefined;
let cachedTxList: Transaction[] = EMPTY_TRANSACTIONS;
let cachedSettingsRaw: string | null | undefined = undefined;
let cachedSettingsObj: LedgerSettings = DEFAULT_SETTINGS;
let cachedArchivesRaw: string | null | undefined = undefined;
let cachedArchivesList: MonthlyArchive[] = EMPTY_ARCHIVES;
let cachedAssetsRaw: string | null | undefined = undefined;
let cachedAssetsList: AssetAccount[] = EMPTY_ASSETS;
let cachedAssetChannelsRaw: string | null | undefined = undefined;
let cachedAssetChannelsList: CustomAssetChannel[] = EMPTY_ASSET_CHANNELS;
let legacyChecked = false;

function notifyLedgerListeners() {
  ledgerListeners.forEach((cb) => cb());
}

export function subscribeLedger(listener: () => void): () => void {
  ledgerListeners.add(listener);
  if (typeof window === 'undefined') {
    return () => {
      ledgerListeners.delete(listener);
    };
  }
  const onStorage = (e: StorageEvent) => {
    if (
      e.key === STORAGE_KEY_V2 ||
      e.key === STORAGE_KEY_SETTINGS ||
      e.key === STORAGE_KEY_ARCHIVES ||
      e.key === STORAGE_KEY_ASSETS ||
      e.key === STORAGE_KEY_ASSET_CHANNELS
    ) {
      cachedTxRaw = undefined;
      cachedSettingsRaw = undefined;
      cachedArchivesRaw = undefined;
      cachedAssetsRaw = undefined;
      cachedAssetChannelsRaw = undefined;
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    ledgerListeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function getServerTransactionsSnapshot(): Transaction[] {
  return EMPTY_TRANSACTIONS;
}

export function getServerSettingsSnapshot(): LedgerSettings {
  return DEFAULT_SETTINGS;
}

export function getServerArchivesSnapshot(): MonthlyArchive[] {
  return EMPTY_ARCHIVES;
}

export function getServerAssetsSnapshot(): AssetAccount[] {
  return EMPTY_ASSETS;
}

export function getServerAssetChannelsSnapshot(): CustomAssetChannel[] {
  return EMPTY_ASSET_CHANNELS;
}

export function loadStoredAssetChannels(): CustomAssetChannel[] {
  if (typeof window === 'undefined') return EMPTY_ASSET_CHANNELS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_ASSET_CHANNELS);
    if (!raw) {
      cachedAssetChannelsRaw = null;
      cachedAssetChannelsList = EMPTY_ASSET_CHANNELS;
      return EMPTY_ASSET_CHANNELS;
    }
    if (raw === cachedAssetChannelsRaw) return cachedAssetChannelsList;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      cachedAssetChannelsRaw = raw;
      cachedAssetChannelsList = parsed;
      return cachedAssetChannelsList;
    }
  } catch {
    return EMPTY_ASSET_CHANNELS;
  }
  cachedAssetChannelsRaw = null;
  cachedAssetChannelsList = EMPTY_ASSET_CHANNELS;
  return EMPTY_ASSET_CHANNELS;
}

export function saveStoredAssetChannels(channels: CustomAssetChannel[]): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(channels);
    window.localStorage.setItem(STORAGE_KEY_ASSET_CHANNELS, serialized);
    cachedAssetChannelsRaw = serialized;
    cachedAssetChannelsList = channels;
    notifyLedgerListeners();
  } catch {
    // ignore storage quota errors gracefully
  }
}

export function createCustomAssetChannel(
  label: string,
  iconType: CustomAssetChannel['iconType'],
  colorTheme: CustomAssetChannel['colorTheme']
): CustomAssetChannel {
  return {
    id: `ch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    label,
    iconType,
    colorTheme,
    createdAt: Date.now(),
  };
}

export function loadStoredAssets(): AssetAccount[] {
  if (typeof window === 'undefined') return EMPTY_ASSETS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_ASSETS);
    if (!raw) {
      cachedAssetsRaw = null;
      cachedAssetsList = EMPTY_ASSETS;
      return EMPTY_ASSETS;
    }
    if (raw === cachedAssetsRaw) return cachedAssetsList;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      cachedAssetsRaw = raw;
      cachedAssetsList = parsed;
      return cachedAssetsList;
    }
  } catch {
    return EMPTY_ASSETS;
  }
  cachedAssetsRaw = null;
  cachedAssetsList = EMPTY_ASSETS;
  return EMPTY_ASSETS;
}

export function saveStoredAssets(assets: AssetAccount[]): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(assets);
    window.localStorage.setItem(STORAGE_KEY_ASSETS, serialized);
    cachedAssetsRaw = serialized;
    cachedAssetsList = assets;
    notifyLedgerListeners();
  } catch {
    // ignore storage quota errors gracefully
  }
}

export function loadStoredArchives(): MonthlyArchive[] {
  if (typeof window === 'undefined') return EMPTY_ARCHIVES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_ARCHIVES);
    if (!raw) {
      cachedArchivesRaw = null;
      cachedArchivesList = EMPTY_ARCHIVES;
      return EMPTY_ARCHIVES;
    }
    if (raw === cachedArchivesRaw) return cachedArchivesList;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      cachedArchivesRaw = raw;
      cachedArchivesList = parsed;
      return cachedArchivesList;
    }
  } catch {
    return EMPTY_ARCHIVES;
  }
  cachedArchivesRaw = null;
  cachedArchivesList = EMPTY_ARCHIVES;
  return EMPTY_ARCHIVES;
}

export function saveStoredArchives(archives: MonthlyArchive[]): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(archives);
    window.localStorage.setItem(STORAGE_KEY_ARCHIVES, serialized);
    cachedArchivesRaw = serialized;
    cachedArchivesList = archives;
    notifyLedgerListeners();
  } catch {
    // ignore storage quota errors gracefully
  }
}

export function buildMonthlyArchive(
  month: string,
  monthTransactions: Transaction[],
  closedAt: string,
  note?: string
): MonthlyArchive {
  const sum = summarizeTransactions(monthTransactions);
  const incMap = new Map<string, number>();
  const expMap = new Map<string, number>();
  for (const tx of monthTransactions) {
    if (tx.type === 'in') {
      incMap.set(tx.category, (incMap.get(tx.category) ?? 0) + tx.amount);
    } else {
      expMap.set(tx.category, (expMap.get(tx.category) ?? 0) + tx.amount);
    }
  }
  const incomeByCategory = Array.from(incMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
  const expenseByCategory = Array.from(expMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
  const sortedTx = [...monthTransactions].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.createdAt - a.createdAt;
  });

  return {
    month,
    closedAt,
    updatedAt: Date.now(),
    totalIncome: sum.income,
    totalExpense: sum.expense,
    netBalance: sum.balance,
    transactionCount: monthTransactions.length,
    note: note?.trim() || undefined,
    incomeByCategory,
    expenseByCategory,
    transactions: sortedTx,
  };
}

export function loadStoredTransactions(): Transaction[] {
  if (typeof window === 'undefined') return EMPTY_TRANSACTIONS;
  try {
    const rawV2 = window.localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2 !== null) {
      if (rawV2 === cachedTxRaw) return cachedTxList;
      const parsed = JSON.parse(rawV2);
      if (Array.isArray(parsed)) {
        cachedTxRaw = rawV2;
        cachedTxList = parsed;
        return cachedTxList;
      }
    }
    if (!legacyChecked) {
      legacyChecked = true;
      const rawLegacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (rawLegacy) {
        const legacyParsed = JSON.parse(rawLegacy);
        if (Array.isArray(legacyParsed)) {
          const migrated: Transaction[] = legacyParsed.map((item, idx) => ({
            id: String(item.id ?? `${Date.now()}_${idx}`),
            desc: String(item.desc ?? 'লেনদেন'),
            amount: Number(item.amount ?? 0),
            type: item.type === 'out' ? 'out' : 'in',
            cadence: CADENCE_OPTIONS.includes(item.category) ? item.category : 'দৈনিক',
            category: item.type === 'out' ? 'অন্যান্য খরচ' : 'অন্যান্য আয়',
            date: typeof item.date === 'string' && item.date.length === 10 ? item.date : getTodayISO(),
            createdAt: Number(item.id ?? Date.now()),
          }));
          const serialized = JSON.stringify(migrated);
          window.localStorage.setItem(STORAGE_KEY_V2, serialized);
          cachedTxRaw = serialized;
          cachedTxList = migrated;
          return cachedTxList;
        }
      }
    }
  } catch {
    return EMPTY_TRANSACTIONS;
  }
  cachedTxRaw = null;
  cachedTxList = EMPTY_TRANSACTIONS;
  return EMPTY_TRANSACTIONS;
}

export function saveStoredTransactions(transactions: Transaction[]): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(transactions);
    window.localStorage.setItem(STORAGE_KEY_V2, serialized);
    cachedTxRaw = serialized;
    cachedTxList = transactions;
    notifyLedgerListeners();
  } catch {
    // ignore storage quota errors gracefully
  }
}

export function loadStoredSettings(): LedgerSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) {
      cachedSettingsRaw = null;
      cachedSettingsObj = DEFAULT_SETTINGS;
      return DEFAULT_SETTINGS;
    }
    if (raw === cachedSettingsRaw) return cachedSettingsObj;
    const parsed = JSON.parse(raw);
    cachedSettingsRaw = raw;
    cachedSettingsObj = {
      ...DEFAULT_SETTINGS,
      ...parsed,
      accountSector:
        typeof parsed?.accountSector === 'string' && parsed.accountSector.trim()
          ? parsed.accountSector
          : DEFAULT_SETTINGS.accountSector,
      incomeCategories:
        Array.isArray(parsed?.incomeCategories) && parsed.incomeCategories.length > 0
          ? parsed.incomeCategories
          : INCOME_CATEGORIES,
      expenseCategories:
        Array.isArray(parsed?.expenseCategories) && parsed.expenseCategories.length > 0
          ? parsed.expenseCategories
          : EXPENSE_CATEGORIES,
    };
    return cachedSettingsObj;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: LedgerSettings): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(settings);
    window.localStorage.setItem(STORAGE_KEY_SETTINGS, serialized);
    cachedSettingsRaw = serialized;
    cachedSettingsObj = settings;
    notifyLedgerListeners();
  } catch {
    // ignore
  }
}

export function generateSampleTransactions(): Transaction[] {
  const today = getTodayISO();
  const yesterday = shiftDateISO(today, -1);
  const twoDaysAgo = shiftDateISO(today, -2);
  const fiveDaysAgo = shiftDateISO(today, -5);
  const twelveDaysAgo = shiftDateISO(today, -12);
  const twentyDaysAgo = shiftDateISO(today, -20);
  const lastMonth = shiftMonthISO(today.slice(0, 7), -1) + '-15';

  const now = Date.now();
  return [
    {
      id: `sample_1_${now}`,
      desc: 'মাসিক বেতন ও ভাতা জমা',
      amount: 35000,
      type: 'in',
      cadence: 'মাসিক',
      category: 'বেতন / সম্মানী',
      date: twentyDaysAgo,
      note: 'ব্যাংক ট্রান্সফার',
      createdAt: now - 7000,
    },
    {
      id: `sample_2_${now}`,
      desc: 'বাসা ভাড়া পরিশোধ',
      amount: 12000,
      type: 'out',
      cadence: 'মাসিক',
      category: 'বাড়ি ভাড়া',
      date: twelveDaysAgo,
      note: 'চলতি মাসের ভাড়া',
      createdAt: now - 6000,
    },
    {
      id: `sample_3_${now}`,
      desc: 'সাপ্তাহিক কাঁচাবাজার ও মুদি',
      amount: 2450,
      type: 'out',
      cadence: 'সাপ্তাহিক',
      category: 'বাজার ও খাবার',
      date: fiveDaysAgo,
      createdAt: now - 5000,
    },
    {
      id: `sample_4_${now}`,
      desc: 'সাপ্তাহিক ফ্রিল্যান্সিং ও ব্যবসা আয়',
      amount: 6500,
      type: 'in',
      cadence: 'সাপ্তাহিক',
      category: 'ব্যবসা / বিক্রয়',
      date: twoDaysAgo,
      createdAt: now - 4000,
    },
    {
      id: `sample_5_${now}`,
      desc: 'বিদ্যুৎ ও ইন্টারনেট বিল',
      amount: 1850,
      type: 'out',
      cadence: 'মাসিক',
      category: 'বিল ও রিচার্জ',
      date: yesterday,
      createdAt: now - 3000,
    },
    {
      id: `sample_6_${now}`,
      desc: 'দৈনিক যাতায়াত ও দুপুরের খাবার',
      amount: 380,
      type: 'out',
      cadence: 'দৈনিক',
      category: 'যাতায়াত',
      date: today,
      createdAt: now - 2000,
    },
    {
      id: `sample_7_${now}`,
      desc: 'সদস্যের দৈনিক সঞ্চয় জমা',
      amount: 1200,
      type: 'in',
      cadence: 'দৈনিক',
      category: 'সদস্য জমা',
      date: today,
      createdAt: now - 1000,
    },
    {
      id: `sample_8_${now}`,
      desc: 'গত মাসের অতিরিক্ত আয়',
      amount: 18000,
      type: 'in',
      cadence: 'মাসিক',
      category: 'ব্যবসা / বিক্রয়',
      date: lastMonth,
      createdAt: now - 8000,
    },
  ];
}

export function exportTransactionsToCSV(transactions: Transaction[]): void {
  const headers = ['তারিখ', 'বিবরণ', 'ধরন', 'হিসাবের সময়', 'খাত', 'টাকার পরিমাণ (৳)', 'নোট'];
  const rows = transactions.map((tx) => [
    tx.date,
    tx.desc,
    tx.type === 'in' ? 'জমা / আয়' : 'খরচ / উত্তোলন',
    tx.cadence,
    tx.category,
    String(tx.amount),
    tx.note ?? '',
  ]);
  const lines = [headers, ...rows];
  const csv =
    '\uFEFF' +
    lines
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SohojHisab_${getTodayISO()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
