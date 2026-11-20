'use client';

import React, { useMemo, useState } from 'react';
import {
  Banknote,
  Briefcase,
  Check,
  Landmark,
  Lightbulb,
  Minus,
  Pencil,
  PiggyBank,
  Plus,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import {
  AssetAccount,
  AssetChannel,
  CustomAssetChannel,
  createCustomAssetChannel,
  formatNumber,
  formatTaka,
} from '@/lib/ledger';

interface MyAssetSectionProps {
  assets: AssetAccount[];
  customChannels: CustomAssetChannel[];
  useBengaliDigits: boolean;
  onSaveAssets: (next: AssetAccount[]) => void;
  onSaveCustomChannels: (next: CustomAssetChannel[]) => void;
  onToast: (msg: string) => void;
}

interface ChannelMeta {
  id: AssetChannel;
  label: string;
  defaultName: string;
  placeholder: string;
  badgeBg: string;
  badgeText: string;
  activeBorder: string;
  barColor: string;
  icon: React.ComponentType<{ className?: string }>;
  isCustom?: boolean;
}

const ICON_MAP: Record<CustomAssetChannel['iconType'], React.ComponentType<{ className?: string }>> = {
  mobile: Smartphone,
  bank: Landmark,
  cash: Banknote,
  piggy: PiggyBank,
  wallet: Wallet,
};

const THEME_STYLES: Record<
  CustomAssetChannel['colorTheme'],
  { themeLabel: string; badgeBg: string; badgeText: string; activeBorder: string; barColor: string; swatch: string }
> = {
  emerald: {
    themeLabel: 'সবুজ',
    badgeBg: 'bg-[#E7F6EE]',
    badgeText: 'text-[#137C50]',
    activeBorder: 'border-[#137C50] bg-[#E7F6EE]/70',
    barColor: 'bg-[#137C50]',
    swatch: 'bg-[#137C50]',
  },
  blue: {
    themeLabel: 'নীল',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-[#2563EB]',
    activeBorder: 'border-[#2563EB] bg-blue-50/70',
    barColor: 'bg-[#2563EB]',
    swatch: 'bg-[#2563EB]',
  },
  pink: {
    themeLabel: 'গোলাপি',
    badgeBg: 'bg-pink-50',
    badgeText: 'text-[#D81B60]',
    activeBorder: 'border-[#D81B60] bg-pink-50/70',
    barColor: 'bg-[#D81B60]',
    swatch: 'bg-[#D81B60]',
  },
  orange: {
    themeLabel: 'কমলা',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-[#EA580C]',
    activeBorder: 'border-[#EA580C] bg-orange-50/70',
    barColor: 'bg-[#EA580C]',
    swatch: 'bg-[#EA580C]',
  },
  violet: {
    themeLabel: 'বেগুনি',
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-700',
    activeBorder: 'border-violet-600 bg-violet-50/70',
    barColor: 'bg-violet-600',
    swatch: 'bg-violet-600',
  },
  teal: {
    themeLabel: 'টিল',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
    activeBorder: 'border-teal-600 bg-teal-50/70',
    barColor: 'bg-teal-600',
    swatch: 'bg-teal-600',
  },
};

const BUILTIN_CHANNELS: ChannelMeta[] = [
  {
    id: 'bkash',
    label: 'বিকাশ',
    defaultName: 'পার্সোনাল বিকাশ',
    placeholder: 'যেমন: পার্সোনাল বিকাশ / এজেন্ট নম্বর',
    ...THEME_STYLES.pink,
    icon: Smartphone,
  },
  {
    id: 'nagad',
    label: 'নগদ',
    defaultName: 'পার্সোনাল নগদ',
    placeholder: 'যেমন: পার্সোনাল নগদ / ব্যবসার নগদ',
    ...THEME_STYLES.orange,
    icon: Smartphone,
  },
  {
    id: 'bank',
    label: 'ব্যাংক',
    defaultName: 'ব্যাংক অ্যাকাউন্ট',
    placeholder: 'যেমন: ডাচ-বাংলা / ইসলামী / সোনালী ব্যাংক',
    ...THEME_STYLES.blue,
    icon: Landmark,
  },
  {
    id: 'cash',
    label: 'হাতে নগদ',
    defaultName: 'ক্যাশ / মানিব্যাগ',
    placeholder: 'যেমন: বাসার ক্যাশ / দোকানের ক্যাশ বাক্স',
    ...THEME_STYLES.emerald,
    icon: Banknote,
  },
  {
    id: 'other',
    label: 'অন্যান্য',
    defaultName: 'অন্যান্য সঞ্চয়',
    placeholder: 'যেমন: সঞ্চয়পত্র / ব্যক্তিগত তহবিল',
    ...THEME_STYLES.violet,
    icon: PiggyBank,
  },
];

const QUICK_CHANNEL_PRESETS: {
  label: string;
  iconType: CustomAssetChannel['iconType'];
  colorTheme: CustomAssetChannel['colorTheme'];
}[] = [
  { label: 'রকেট', iconType: 'mobile', colorTheme: 'violet' },
  { label: 'উপায়', iconType: 'mobile', colorTheme: 'teal' },
  { label: 'সেলফিন (CellFin)', iconType: 'bank', colorTheme: 'blue' },
  { label: 'ট্যাপ (Tap)', iconType: 'mobile', colorTheme: 'emerald' },
  { label: 'ডিপিএস / এফডিআর', iconType: 'piggy', colorTheme: 'teal' },
  { label: 'সমিতি তহবিল', iconType: 'wallet', colorTheme: 'orange' },
  { label: 'স্বর্ণ / বিনিয়োগ', iconType: 'piggy', colorTheme: 'pink' },
];

const MONEY_TIPS = [
  {
    title: 'সব টাকা এক জায়গায় না রেখে ভাগ করে রাখুন',
    body: 'দৈনন্দিন খরচের টাকা হাতে নগদ বা বিকাশ/নগদে এবং বড় অঙ্কের সঞ্চয় বা জরুরি তহবিল ব্যাংক অ্যাকাউন্টে নিরাপদে রাখুন।',
    icon: ShieldCheck,
  },
  {
    title: '৫০-৩০-২০ নিয়মে সঞ্চয় গড়ে তুলুন',
    body: 'মাসিক আয়ের ৫০% প্রয়োজনীয় খরচ, ৩০% ব্যক্তিগত/পারিবারিক চাহিদা এবং অন্তত ২০% টাকা আলাদা অ্যাকাউন্টে জমা রাখার অভ্যাস করুন।',
    icon: PiggyBank,
  },
  {
    title: 'অন্তত ৩–৬ মাসের জরুরি তহবিল রাখুন',
    body: 'হঠাৎ অসুস্থতা বা আয় কমে যাওয়ার সময়ের জন্য কমপক্ষে ৩ মাসের সংসার খরচের সমান টাকা আলাদা ব্যাংক বা ডিপিএস হিসেবে রাখুন।',
    icon: Lightbulb,
  },
  {
    title: 'ডিজিটাল ওয়ালেট নিরাপত্তা বজায় রাখুন',
    body: 'বিকাশ, নগদ বা ব্যাংক অ্যাপের পিন ও OTP কারো সাথে শেয়ার করবেন না এবং প্রতি সপ্তাহে একাউন্টের ব্যালেন্স মিলিয়ে দেখুন।',
    icon: Smartphone,
  },
];

const BUSINESS_TIPS = [
  {
    title: 'ব্যবসার মূলধন ও ব্যক্তিগত খরচ আলাদা রাখুন',
    body: 'দোকান বা ব্যবসার ক্যাশ থেকে সরাসরি সংসারের বাজার-খরচ না করে নিজের জন্য নির্ধারিত মাসিক বেতন/ভাতা আলাদা করে নিন।',
    icon: Briefcase,
  },
  {
    title: 'প্রতিদিন ক্যাশ ও ডিজিটাল পেমেন্ট মিলিয়ে নিন',
    body: 'দিন শেষে দোকানের নগদ ক্যাশ, বিকাশ, নগদ ও ব্যাংক জমার হিসাব একসাথে যোগ করে খাতার ব্যালেন্সের সাথে মিলিয়ে দেখুন।',
    icon: TrendingUp,
  },
  {
    title: 'লাভের ৩০–৪০% পুনর্বিনিয়োগ করুন',
    body: 'ব্যবসার নিট লাভের পুরোটা খরচ না করে একটি অংশ নতুন স্টক বাড়ানো বা বেশি চাহিদার পণ্য সংগ্রহে বিনিয়োগ করলে ব্যবসা দ্রুত বাড়ে।',
    icon: Sparkles,
  },
  {
    title: 'বাকি খাতা ও নগদ প্রবাহ (Cashflow) নিয়ন্ত্রণ',
    body: 'অতিরিক্ত বাকি দিলে মূলধন আটকে যায়; তাই নিয়মিত কাস্টমারদের সাথে নির্ধারিত তারিখে বকেয়া আদায়ের ব্যবস্থা রাখুন।',
    icon: Wallet,
  },
];

export default function MyAssetSection({
  assets,
  customChannels,
  useBengaliDigits,
  onSaveAssets,
  onSaveCustomChannels,
  onToast,
}: MyAssetSectionProps) {
  const [selectedChannel, setSelectedChannel] = useState<AssetChannel>('bkash');
  const [filterChannel, setFilterChannel] = useState<'all' | AssetChannel>('all');
  const [accountName, setAccountName] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adjustTargetId, setAdjustTargetId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');

  // Add custom channel panel state
  const [addChannelOpen, setAddChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelIcon, setNewChannelIcon] = useState<CustomAssetChannel['iconType']>('mobile');
  const [newChannelTheme, setNewChannelTheme] = useState<CustomAssetChannel['colorTheme']>('teal');

  const allChannels = useMemo<ChannelMeta[]>(() => {
    const customMetas: ChannelMeta[] = customChannels.map((ch) => {
      const theme = THEME_STYLES[ch.colorTheme] ?? THEME_STYLES.teal;
      return {
        id: ch.id,
        label: ch.label,
        defaultName: ch.label,
        placeholder: `যেমন: আমার ${ch.label}`,
        badgeBg: theme.badgeBg,
        badgeText: theme.badgeText,
        activeBorder: theme.activeBorder,
        barColor: theme.barColor,
        icon: ICON_MAP[ch.iconType] ?? Wallet,
        isCustom: true,
      };
    });
    return [...BUILTIN_CHANNELS, ...customMetas];
  }, [customChannels]);

  const channelMap = useMemo(() => {
    const map: Record<string, ChannelMeta> = {};
    for (const ch of allChannels) {
      map[ch.id] = ch;
    }
    return map;
  }, [allChannels]);

  const totalAssets = useMemo(
    () => assets.reduce((sum, item) => sum + Math.max(0, Number(item.balance) || 0), 0),
    [assets]
  );

  const channelTotals = useMemo(() => {
    const totals: Record<string, { amount: number; count: number }> = {};
    for (const ch of allChannels) {
      totals[ch.id] = { amount: 0, count: 0 };
    }
    for (const item of assets) {
      const key = channelMap[item.channel] ? item.channel : 'other';
      if (!totals[key]) totals[key] = { amount: 0, count: 0 };
      totals[key].amount += Math.max(0, Number(item.balance) || 0);
      totals[key].count += 1;
    }
    return totals;
  }, [allChannels, assets, channelMap]);

  const filteredAssets = useMemo(() => {
    const base =
      filterChannel === 'all'
        ? assets
        : assets.filter((item) => item.channel === filterChannel);
    return [...base].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [assets, filterChannel]);

  const filteredTotal = useMemo(
    () => filteredAssets.reduce((sum, item) => sum + Math.max(0, Number(item.balance) || 0), 0),
    [filteredAssets]
  );

  const handleSelectChannelButton = (ch: AssetChannel) => {
    setSelectedChannel(ch);
    setFilterChannel((prev) => (prev === ch ? 'all' : ch));
  };

  const handleAddCustomChannel = (
    label: string,
    iconType: CustomAssetChannel['iconType'],
    colorTheme: CustomAssetChannel['colorTheme']
  ) => {
    const clean = label.trim();
    if (!clean) {
      onToast('নতুন মাধ্যমের নাম লিখুন');
      return;
    }
    const exists = allChannels.some(
      (c) => c.label.toLowerCase() === clean.toLowerCase()
    );
    if (exists) {
      onToast(`"${clean}" মাধ্যমটি ইতিমধ্যেই যুক্ত আছে`);
      return;
    }

    const created = createCustomAssetChannel(clean, iconType, colorTheme);
    onSaveCustomChannels([...customChannels, created]);
    setSelectedChannel(created.id);
    setFilterChannel(created.id);
    setNewChannelName('');
    onToast(`"${clean}" মাধ্যমটি যোগ করা হয়েছে`);
  };

  const handleCreateCustomChannelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddCustomChannel(newChannelName, newChannelIcon, newChannelTheme);
  };

  const handleDeleteCustomChannel = (ch: ChannelMeta) => {
    const stats = channelTotals[ch.id] ?? { count: 0, amount: 0 };
    if (stats.count > 0) {
      onToast(`"${ch.label}" মাধ্যম মুছতে আগে এর অ্যাকাউন্টগুলো সরান বা মুছুন`);
      return;
    }
    onSaveCustomChannels(customChannels.filter((c) => c.id !== ch.id));
    if (selectedChannel === ch.id) setSelectedChannel('bkash');
    if (filterChannel === ch.id) setFilterChannel('all');
    onToast(`"${ch.label}" মাধ্যমটি মুছে ফেলা হয়েছে`);
  };

  const resetForm = () => {
    setEditingId(null);
    setAccountName('');
    setAmountInput('');
    setNoteInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amountInput);
    if (!Number.isFinite(num) || num < 0) {
      onToast('সঠিক টাকার পরিমাণ লিখুন');
      return;
    }
    const meta = channelMap[selectedChannel] ?? channelMap.other;
    const cleanName = accountName.trim() || meta.defaultName;
    const rounded = Math.round(num * 100) / 100;

    if (editingId) {
      const updated = assets.map((item) =>
        item.id === editingId
          ? {
              ...item,
              channel: selectedChannel,
              name: cleanName,
              balance: rounded,
              note: noteInput.trim() || undefined,
              updatedAt: Date.now(),
            }
          : item
      );
      onSaveAssets(updated);
      onToast(`${cleanName}-এর টাকা হালনাগাদ করা হয়েছে`);
      resetForm();
      return;
    }

    const created: AssetAccount = {
      id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      channel: selectedChannel,
      name: cleanName,
      balance: rounded,
      note: noteInput.trim() || undefined,
      updatedAt: Date.now(),
    };
    onSaveAssets([created, ...assets]);
    onToast(`${cleanName}-এ ${formatTaka(rounded, useBengaliDigits)} সংরক্ষণ করা হয়েছে`);
    resetForm();
  };

  const handleStartEdit = (item: AssetAccount) => {
    setEditingId(item.id);
    setSelectedChannel(channelMap[item.channel] ? item.channel : 'other');
    setAccountName(item.name);
    setAmountInput(String(item.balance));
    setNoteInput(item.note ?? '');
  };

  const handleDelete = (item: AssetAccount) => {
    onSaveAssets(assets.filter((a) => a.id !== item.id));
    if (editingId === item.id) resetForm();
    onToast(`${item.name} মুছে ফেলা হয়েছে`);
  };

  const handleQuickAdjust = (item: AssetAccount, deltaSign: 1 | -1) => {
    const val = Number(adjustAmount);
    if (!Number.isFinite(val) || val <= 0) {
      onToast('বাড়াতে বা কমাতে ০-এর বেশি টাকা লিখুন');
      return;
    }
    const nextBalance = Math.max(0, Math.round((item.balance + deltaSign * val) * 100) / 100);
    const updated = assets.map((a) =>
      a.id === item.id ? { ...a, balance: nextBalance, updatedAt: Date.now() } : a
    );
    onSaveAssets(updated);
    setAdjustTargetId(null);
    setAdjustAmount('');
    onToast(
      `${item.name}-এ ${formatTaka(val, useBengaliDigits)} ${
        deltaSign === 1 ? 'যোগ' : 'বাদ'
      } করা হয়েছে`
    );
  };

  const activeMeta = channelMap[selectedChannel] ?? channelMap.other;

  return (
    <div className="space-y-6">
      {/* 1. Aggregated Total Asset Hero Card */}
      <div className="bg-gradient-to-br from-[#0F6842] via-[#137C50] to-[#1D9963] text-white rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wide">
              My Asset — সব মাধ্যম মিলিয়ে মোট টাকা
            </span>
            <p className="text-3xl sm:text-4xl font-bold tabular-nums mt-1.5 tracking-tight">
              {formatTaka(totalAssets, useBengaliDigits)}
            </p>
            <p className="text-xs text-emerald-100/90 mt-1.5">
              সব মাধ্যম মিলিয়ে মোট{' '}
              <strong className="tabular-nums">
                {formatNumber(assets.length, useBengaliDigits, 0)}টি
              </strong>{' '}
              হিসাব জড়ো করা আছে
            </p>
          </div>

          <div className="bg-white/10 border border-white/15 rounded-2xl px-4 py-3 min-w-[190px]">
            <span className="text-[11px] text-emerald-100 block">
              {filterChannel === 'all'
                ? 'সব অ্যাকাউন্টের যোগফল'
                : `${(channelMap[filterChannel] ?? channelMap.other).label} অ্যাকাউন্টের মোট`}
            </span>
            <p className="text-lg font-bold tabular-nums mt-0.5">
              {formatTaka(filteredTotal, useBengaliDigits)}
            </p>
          </div>
        </div>

        {/* Multi-channel proportion bar */}
        {totalAssets > 0 && (
          <div className="mt-5">
            <div className="h-2.5 w-full rounded-full bg-white/15 overflow-hidden flex">
              {allChannels.map((ch) => {
                const amt = channelTotals[ch.id]?.amount ?? 0;
                if (amt <= 0) return null;
                const pct = (amt / totalAssets) * 100;
                return (
                  <div
                    key={ch.id}
                    style={{ width: `${pct}%` }}
                    className={`${ch.barColor} h-full transition-all`}
                    title={`${ch.label}: ${formatTaka(amt, useBengaliDigits)}`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Channel Quick Buttons + Add Custom Medium System */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              টাকা রাখার মাধ্যম বেছে নিন
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              যেকোনো বাটনে চাপুন অথবা আপনার পছন্দের নতুন মাধ্যম যোগ করুন
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setAddChannelOpen((prev) => !prev)}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                addChannelOpen
                  ? 'bg-[#137C50] border-[#137C50] text-white'
                  : 'bg-[#E7F6EE]/80 border-[#137C50]/30 text-[#137C50] hover:bg-[#E7F6EE]'
              }`}
            >
              {addChannelOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{addChannelOpen ? 'বন্ধ করুন' : 'নতুন মাধ্যম যোগ'}</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterChannel('all')}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                filterChannel === 'all'
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              সব ({formatNumber(assets.length, useBengaliDigits, 0)})
            </button>
          </div>
        </div>

        {/* Expandable Add New Medium Panel */}
        {addChannelOpen && (
          <div className="rounded-2xl bg-[#F8FAFC] border border-slate-200/90 p-3.5 sm:p-4 space-y-3">
            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-2">
                জনপ্রিয় মাধ্যম (১-ট্যাপে যোগ করুন):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_CHANNEL_PRESETS.map((preset) => {
                  const alreadyAdded = allChannels.some(
                    (c) => c.label.toLowerCase() === preset.label.toLowerCase()
                  );
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() =>
                        handleAddCustomChannel(preset.label, preset.iconType, preset.colorTheme)
                      }
                      className={`min-h-[34px] px-3 py-1 rounded-xl border text-xs font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap ${
                        alreadyAdded
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-[#137C50] hover:text-[#137C50] cursor-pointer'
                      }`}
                    >
                      {alreadyAdded ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form
              onSubmit={handleCreateCustomChannelSubmit}
              className="pt-2.5 border-t border-slate-200/80 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                <div className="sm:col-span-5">
                  <label
                    htmlFor="new-channel-name"
                    className="block text-xs font-semibold text-slate-600 mb-1"
                  >
                    নিজের মতো মাধ্যমের নাম লিখুন
                  </label>
                  <input
                    id="new-channel-name"
                    type="text"
                    maxLength={30}
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="যেমন: রকেট, পেওনিয়ার, ইসলামী ব্যাংক"
                    className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#137C50]"
                  />
                </div>

                <div className="sm:col-span-4">
                  <span className="block text-xs font-semibold text-slate-600 mb-1">
                    আইকন ও ধরন
                  </span>
                  <div className="flex items-center gap-1.5">
                    {(
                      [
                        { id: 'mobile', label: 'ওয়ালেট', Icon: Smartphone },
                        { id: 'bank', label: 'ব্যাংক', Icon: Landmark },
                        { id: 'cash', label: 'ক্যাশ', Icon: Banknote },
                        { id: 'piggy', label: 'সঞ্চয়', Icon: PiggyBank },
                        { id: 'wallet', label: 'তহবিল', Icon: Wallet },
                      ] as const
                    ).map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        title={label}
                        aria-label={label}
                        onClick={() => setNewChannelIcon(id)}
                        className={`min-w-[38px] min-h-[38px] rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                          newChannelIcon === id
                            ? 'bg-slate-900 border-slate-900 text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    className="w-full min-h-[40px] px-4 py-2 rounded-xl bg-[#137C50] hover:bg-[#0F6842] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>মাধ্যম যোগ করুন</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500">রং বেছে নিন:</span>
                {(Object.keys(THEME_STYLES) as CustomAssetChannel['colorTheme'][]).map((themeKey) => {
                  const t = THEME_STYLES[themeKey];
                  return (
                    <button
                      key={themeKey}
                      type="button"
                      onClick={() => setNewChannelTheme(themeKey)}
                      aria-label={t.themeLabel}
                      className={`min-h-[28px] px-2.5 py-1 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                        newChannelTheme === themeKey
                          ? 'border-slate-900 bg-white text-slate-900'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${t.swatch}`} />
                      <span>{t.themeLabel}</span>
                    </button>
                  );
                })}
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {allChannels.map((ch) => {
            const Icon = ch.icon;
            const stats = channelTotals[ch.id] ?? { amount: 0, count: 0 };
            const isSelected = selectedChannel === ch.id;
            const isFiltered = filterChannel === ch.id;
            return (
              <div
                key={ch.id}
                className={`relative min-h-[82px] rounded-2xl border transition-all ${
                  isSelected || isFiltered
                    ? `${ch.activeBorder} ring-1 ring-slate-900/5`
                    : 'border-slate-200/90 bg-white hover:bg-slate-50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectChannelButton(ch.id)}
                  className="w-full h-full p-3 text-left flex flex-col justify-between cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-1.5 pr-4">
                    <span
                      className={`w-8 h-8 rounded-xl ${ch.badgeBg} ${ch.badgeText} flex items-center justify-center shrink-0`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
                      {formatNumber(stats.count, useBengaliDigits, 0)}টি
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {ch.label}
                    </p>
                    <p className="text-xs font-bold text-[#137C50] tabular-nums mt-0.5 truncate">
                      {formatTaka(stats.amount, useBengaliDigits)}
                    </p>
                  </div>
                </button>

                {ch.isCustom && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomChannel(ch)}
                    aria-label={`${ch.label} মাধ্যম মুছুন`}
                    title="কাস্টম মাধ্যম মুছুন"
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg text-slate-400 hover:text-[#DC2626] hover:bg-white/90 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Add / Edit Money Form + Saved Accounts List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Write / Update Asset Balance */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3.5"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              {editingId ? 'অ্যাকাউন্টের টাকা হালনাগাদ' : 'অ্যাকাউন্টে টাকা লিখে রাখুন'}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                বাতিল
              </button>
            )}
          </div>

          {/* Channel quick picker inside form */}
          <div>
            <span className="block text-xs font-semibold text-slate-600 mb-1.5">মাধ্যম</span>
            <div className="flex flex-wrap gap-1.5">
              {allChannels.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setSelectedChannel(ch.id)}
                  className={`min-h-[36px] px-3 py-1 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    selectedChannel === ch.id
                      ? 'bg-[#137C50] border-[#137C50] text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="asset-name" className="block text-xs font-semibold text-slate-600 mb-1">
              অ্যাকাউন্ট / ওয়ালেটের নাম
            </label>
            <input
              id="asset-name"
              type="text"
              maxLength={60}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder={activeMeta.placeholder}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#137C50]"
            />
          </div>

          <div>
            <label
              htmlFor="asset-balance"
              className="block text-xs font-semibold text-slate-600 mb-1"
            >
              জমানো টাকার পরিমাণ (৳)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                ৳
              </span>
              <input
                id="asset-balance"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="৫০০০"
                required
                className="w-full min-h-[44px] pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-base font-bold tabular-nums text-slate-900 focus:outline-none focus:border-[#137C50]"
              />
            </div>
            <div className="grid grid-cols-4 gap-1.5 mt-1.5">
              {[500, 1000, 5000, 10000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmountInput(String((Number(amountInput) || 0) + val))}
                  className="min-h-[34px] px-1.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 tabular-nums whitespace-nowrap cursor-pointer"
                >
                  +৳{formatNumber(val, useBengaliDigits, 0)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="asset-note" className="block text-xs font-semibold text-slate-600 mb-1">
              নোট (ঐচ্ছিক)
            </label>
            <input
              id="asset-note"
              type="text"
              maxLength={100}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="যেমন: জরুরি সঞ্চয় / দোকানের মূলধন"
              className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#137C50]"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#137C50] hover:bg-[#0F6842] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{editingId ? 'পরিবর্তন সংরক্ষণ করুন' : 'My Asset-এ যোগ করুন'}</span>
          </button>
        </form>

        {/* Right: Aggregated Saved Accounts */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {filterChannel === 'all'
                  ? 'সংরক্ষিত সব অ্যাকাউন্ট ও জমা টাকা'
                  : `${(channelMap[filterChannel] ?? channelMap.other).label} অ্যাকাউন্টসমূহ`}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                {formatNumber(filteredAssets.length, useBengaliDigits, 0)}টি হিসাব · মোট{' '}
                {formatTaka(filteredTotal, useBengaliDigits)}
              </p>
            </div>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#E7F6EE] text-[#137C50] flex items-center justify-center mx-auto mb-3">
                <Wallet className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">কোনো অ্যাকাউন্ট এখনো যোগ করা হয়নি</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                আপনার বিকাশ, নগদ, ব্যাংক বা পছন্দের মাধ্যমে যেখানে যত টাকা আছে, পাশের ফর্মে লিখে সংরক্ষণ করুন—সব জড়ো হয়ে এখানে দেখাবে।
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredAssets.map((item) => {
                const meta = channelMap[item.channel] ?? channelMap.other;
                const Icon = meta.icon;
                const isAdjusting = adjustTargetId === item.id;
                return (
                  <div key={item.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span
                          className={`w-10 h-10 rounded-xl ${meta.badgeBg} ${meta.badgeText} flex items-center justify-center shrink-0 mt-0.5`}
                        >
                          <Icon className="w-5 h-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${meta.badgeBg} ${meta.badgeText}`}
                            >
                              {meta.label}
                            </span>
                          </div>
                          {item.note && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{item.note}</p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-base font-bold text-[#137C50] tabular-nums">
                          {formatTaka(item.balance, useBengaliDigits)}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustTargetId(isAdjusting ? null : item.id);
                              setAdjustAmount('');
                            }}
                            className="min-h-[32px] px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[11px] font-semibold text-slate-700 cursor-pointer"
                          >
                            + / −
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            aria-label={`${item.name} সম্পাদনা`}
                            className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            aria-label={`${item.name} মুছুন`}
                            className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg text-slate-400 hover:text-[#DC2626] hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {isAdjusting && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          inputMode="decimal"
                          value={adjustAmount}
                          onChange={(e) => setAdjustAmount(e.target.value)}
                          placeholder="টাকার পরিমাণ লিখুন"
                          className="flex-1 min-w-[140px] min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold tabular-nums focus:outline-none focus:border-[#137C50]"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuickAdjust(item, 1)}
                          className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#E7F6EE] text-[#137C50] hover:bg-[#D5EFE1] text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          জমা বাড়ান
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdjust(item, -1)}
                          className="min-h-[38px] px-3 py-1.5 rounded-xl bg-red-50 text-[#DC2626] hover:bg-red-100 text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                          টাকা কমান
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. Money Saving Tips & Business Advice */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-[#E7F6EE] text-[#137C50] flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              টাকা জমানোর টিপস ও ব্যবসার দরকারি পরামর্শ
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              সঠিক নিয়মে সম্পদ সংরক্ষণ এবং ব্যবসায়িক মূলধন বাড়ানোর কার্যকর কিছু কৌশল
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Money & Wallet Tips */}
          <div className="rounded-2xl bg-[#F8FAFC] border border-slate-200/70 p-4 space-y-3">
            <h4 className="text-xs sm:text-sm font-bold text-[#137C50] flex items-center gap-1.5">
              <PiggyBank className="w-4 h-4 shrink-0" />
              সঞ্চয় ও নিরাপদ অ্যাকাউন্ট টিপস
            </h4>
            <div className="space-y-2.5">
              {MONEY_TIPS.map((tip) => {
                const TipIcon = tip.icon;
                return (
                  <div
                    key={tip.title}
                    className="bg-white border border-slate-200/70 rounded-xl p-3 flex items-start gap-2.5"
                  >
                    <TipIcon className="w-4 h-4 text-[#137C50] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900">{tip.title}</p>
                      <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed">
                        {tip.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Business Tips */}
          <div className="rounded-2xl bg-[#F8FAFC] border border-slate-200/70 p-4 space-y-3">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-[#137C50] shrink-0" />
              ব্যবসা পরিচালনা ও মূলধন বৃদ্ধির পরামর্শ
            </h4>
            <div className="space-y-2.5">
              {BUSINESS_TIPS.map((tip) => {
                const TipIcon = tip.icon;
                return (
                  <div
                    key={tip.title}
                    className="bg-white border border-slate-200/70 rounded-xl p-3 flex items-start gap-2.5"
                  >
                    <TipIcon className="w-4 h-4 text-[#137C50] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900">{tip.title}</p>
                      <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed">
                        {tip.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
