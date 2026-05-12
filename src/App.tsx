import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser } from './firebase';
import { hashData, encryptData, decryptData, authenticateBiometric } from './lib/security';
import { syncTransactionsToCloud, fetchTransactionsFromCloud, mergeTransactions, subscribeToTransactions } from './lib/sync';
import {
  Cloud,
  Bell,
  Settings,
  Eye,
  ArrowDown,
  ArrowUp,
  BarChart2,
  TrendingUp,
  FileText,
  Home,
  FileBarChart,
  User,
  Mic,
  Pencil,
  ArrowLeft,
  Share2,
  Laptop,
  Lock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Store,
  Wallet,
  LayoutGrid,
  Sun,
  Moon,
  Fingerprint,
  Shield,
  UserCircle,
  RefreshCw,
  LogOut,
  Lightbulb,
  Banknote,
  ShoppingBag,
  Users,
  Calendar,
  MoreHorizontal,
  PiggyBank,
  Plus,
  Camera,
  Check,
  PieChart,
  GraduationCap,
  Smartphone,
  Droplet,
  Wifi,
  Wrench,
  PartyPopper,
  Bookmark,
  Briefcase,
  Star,
  Flag,
  Heart,
  Landmark,
  Tag,
  Calculator,
  Truck,
  Zap,
  Search
} from 'lucide-react';

export interface Transaction {
  id: string;
  type: 'pemasukan' | 'pengeluaran';
  amount: number;
  date: string;
  categoryId: string;
  category?: string;
  note: string;
  createdAt: number;
}

const getLocalDateString = (date?: Date) => {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const PinNumpad = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
  const handleNum = (num: string) => {
    if (value.length < 6) onChange(value + num);
  };
  const handleDel = () => {
    if (value.length > 0) onChange(value.slice(0, -1));
  };
  return (
    <div className="grid grid-cols-3 gap-4 mt-6">
      {[1,2,3,4,5,6,7,8,9].map(num => (
        <button key={num} onClick={() => handleNum(num.toString())} className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 text-xl font-bold flex items-center justify-center mx-auto hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all text-gray-900 dark:text-white">
          {num}
        </button>
      ))}
      <div className="w-16 h-16"></div>
      <button onClick={() => handleNum('0')} className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 text-xl font-bold flex items-center justify-center mx-auto hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all text-gray-900 dark:text-white">0</button>
      <button onClick={handleDel} className="w-16 h-16 rounded-full text-xl font-bold flex items-center justify-center mx-auto text-gray-500 hover:text-gray-900 dark:hover:text-white active:scale-95 transition-all">
        <ArrowLeft size={24} />
      </button>
    </div>
  );
};

function HomeScreen({ onNavigate, onFilter, transactions, kelolaIcons, onSync, isSyncing }: { onNavigate: (tab: string) => void, onFilter: (filter: 'semua'|'pemasukan'|'pengeluaran') => void, transactions: Transaction[], kelolaIcons: any[], onSync: () => void, isSyncing: boolean }) {
  const totalPemasukan = transactions.filter(t => t.type === 'pemasukan').reduce((sum, t) => sum + t.amount, 0);
  const totalPengeluaran = transactions.filter(t => t.type === 'pengeluaran').reduce((sum, t) => sum + t.amount, 0);
  const saldo = totalPemasukan - totalPengeluaran;

  const sortedTransactions = [...transactions].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="flex flex-col h-full bg-[#F7F8FA] dark:bg-gray-900">
      <header className="flex justify-between items-center p-4 pt-6">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-bold text-xl text-gray-900 dark:text-white leading-tight">Es Mambo</h1>
          <span className="text-[13px] text-gray-500 dark:text-gray-400">{new Date().toLocaleDateString('id-ID', {weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'})}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onSync} disabled={isSyncing} className={`p-2 transition-colors ${isSyncing ? 'text-indigo-500 animate-pulse' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}><Cloud size={24} className="fill-current" /></button>
          <button className="p-2 text-blue-500 dark:text-indigo-400 hover:text-blue-600 dark:hover:text-indigo-300 transition-colors"><Bell size={22} /></button>
          <button onClick={() => onNavigate('profil')} className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><Settings size={22} /></button>
        </div>
      </header>

      <main className="px-5 pb-32 flex flex-col gap-5 overflow-y-auto w-full">
        <div className="w-full p-6 rounded-[24px] bg-gradient-to-br from-[#E0E7FF] to-[#F3F4FF] dark:from-indigo-900/40 dark:to-indigo-800/20 shadow-sm border border-transparent dark:border-indigo-500/20">
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-indigo-200/70 mb-3">
            <span className="text-[13px] font-medium text-gray-600 dark:text-indigo-200/90">Uang di Kas</span>
            <button className="text-gray-400 dark:text-indigo-300 hover:text-gray-600 dark:hover:text-indigo-100"><Pencil size={12} /></button>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Rp{saldo.toLocaleString('id-ID')}</span>
            <button className="text-gray-400 dark:text-indigo-300 hover:text-gray-600 dark:hover:text-indigo-100"><Eye size={20} /></button>
          </div>
          <div className={`inline-block px-3 py-1.5 rounded-lg ${saldo >= 0 ? 'bg-green-50 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-rose-900/30'}`}>
            <span className={`text-xs font-semibold ${saldo >= 0 ? 'text-green-600 dark:text-emerald-400' : 'text-red-500 dark:text-rose-400'}`}>Saldo {saldo >= 0 ? 'positif 👍' : 'negatif 📉'}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            disabled={transactions.length === 0}
            onClick={() => {
              onFilter('pemasukan');
              onNavigate('riwayat_transaksi');
            }} 
            className="flex-1 p-4 rounded-[20px] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm flex flex-col justify-center text-left disabled:opacity-70 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:hover:bg-white disabled:dark:hover:bg-gray-800"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-green-100/50 dark:bg-emerald-900/30 flex items-center justify-center">
                <ArrowDown size={14} className="text-green-500 dark:text-emerald-400" strokeWidth={3} />
              </div>
              <span className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">Pemasukan</span>
            </div>
            <div className="font-bold text-[15px] text-green-600 dark:text-emerald-400">Rp{totalPemasukan.toLocaleString('id-ID')}</div>
          </button>
          <button 
            disabled={transactions.length === 0}
            onClick={() => {
              onFilter('pengeluaran');
              onNavigate('riwayat_transaksi');
            }} 
            className="flex-1 p-4 rounded-[20px] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm flex flex-col justify-center text-left disabled:opacity-70 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:hover:bg-white disabled:dark:hover:bg-gray-800"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-red-100/50 dark:bg-rose-900/30 flex items-center justify-center">
                <ArrowUp size={14} className="text-red-500 dark:text-rose-400" strokeWidth={3} />
              </div>
              <span className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">Pengeluaran</span>
            </div>
            <div className="font-bold text-[15px] text-red-500 dark:text-rose-400">Rp{totalPengeluaran.toLocaleString('id-ID')}</div>
          </button>
        </div>

        <div className="flex gap-3">
          <div onClick={() => onNavigate('laporan')} className="flex-1 p-4 flex items-center justify-center gap-2.5 rounded-[20px] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <BarChart2 size={18} className="text-blue-500 dark:text-blue-400" strokeWidth={2.5} />
            <span className="font-bold text-[13px] text-gray-900 dark:text-gray-100">Laporan</span>
          </div>
          <div onClick={() => onNavigate('analisis')} className="flex-1 p-4 flex items-center justify-center gap-2.5 rounded-[20px] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <TrendingUp size={18} className="text-purple-500 dark:text-purple-400" strokeWidth={2.5} />
            <span className="font-bold text-[13px] text-gray-900 dark:text-gray-100">Analisis Usaha</span>
          </div>
        </div>

        <div className="flex justify-between items-center mt-2">
          <h2 className="font-bold text-[15px] text-gray-900 dark:text-white">Transaksi Terbaru</h2>
          <button 
            disabled={transactions.length === 0}
            onClick={() => {
              onFilter('semua');
              onNavigate('riwayat_transaksi');
            }} 
            className="text-[13px] text-blue-500 dark:text-indigo-400 font-semibold hover:text-blue-700 dark:hover:text-indigo-300 transition-colors disabled:opacity-50 disabled:hover:text-blue-500"
          >
            Lihat Semua
          </button>
        </div>

        {sortedTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-6 pt-4 pb-12">
            <div className="mb-4 text-indigo-50 dark:text-indigo-900/30">
              <FileText strokeWidth={1} size={84} className="fill-indigo-50/50 dark:fill-indigo-900/20" />
            </div>
            <h3 className="font-bold text-[15px] text-gray-600 dark:text-gray-300 mb-1.5">Belum ada transaksi</h3>
            <p className="text-[13px] text-gray-400 dark:text-gray-500">Mulai catat transaksi pertama Anda</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedTransactions.slice(0, 5).map(trx => (
              <div key={trx.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex items-center justify-between border border-gray-50 dark:border-gray-700 shadow-sm">
                 <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trx.type === 'pemasukan' ? 'bg-green-50 dark:bg-emerald-900/20 text-green-500 dark:text-emerald-400' : 'bg-red-50 dark:bg-rose-900/20 text-red-500 dark:text-rose-400'}`}>
                       {trx.type === 'pemasukan' ? <TrendingUp size={18} /> : <TrendingUp size={18} className="rotate-180" />}
                    </div>
                    <div className="flex flex-col">
                       <span className="font-bold text-[14px] text-gray-900 dark:text-white">{trx.category || 'Transaksi'}</span>
                       <span className="text-[11px] text-gray-500 dark:text-gray-400">{new Date(trx.date).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})} {trx.note ? `• ${trx.note}` : ''}</span>
                    </div>
                 </div>
                 <div className={`font-bold text-[14px] ${trx.type === 'pemasukan' ? 'text-green-500 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                    {trx.type === 'pemasukan' ? '+' : '-'}Rp{trx.amount.toLocaleString('id-ID')}
                 </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function LaporanScreen({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<'harian'|'mingguan'|'bulanan'|'custom'>('harian');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState<number | null>(null);
  const [endDate, setEndDate] = useState<number | null>(null);
  const [tempStartDate, setTempStartDate] = useState<number | null>(null);
  const [tempEndDate, setTempEndDate] = useState<number | null>(null);
  const [showPcModal, setShowPcModal] = useState(false);

  const handleDayClick = (day: number) => {
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      setTempStartDate(day);
      setTempEndDate(null);
    } else if (tempStartDate && !tempEndDate) {
      if (day >= tempStartDate) {
        setTempEndDate(day);
      } else {
        setTempStartDate(day);
      }
    }
  };

  const handleApply = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setShowDatePicker(false);
  };

  const handleCancel = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setShowDatePicker(false);
  };

  const renderDateText = () => {
    switch (tab) {
      case 'harian': return 'Hari ini — Rabu, 06 Mei 2026';
      case 'mingguan': return '01 Mei - 07 Mei 2026';
      case 'bulanan': return 'Mei 2026';
      case 'custom': 
        if (startDate && endDate) {
          return `${String(startDate).padStart(2, '0')} Mei - ${String(endDate).padStart(2, '0')} Mei 2026`;
        } else if (startDate) {
           return `${String(startDate).padStart(2, '0')} Mei 2026`;
        }
        return 'Pilih Rentang Tanggal';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F7F8FA] dark:bg-[#0B0C10] relative">
      <header className="flex justify-between items-center p-4 pt-6 pb-2 relative z-20">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors z-10"><ArrowLeft size={24} /></button>
        <h1 className="font-bold text-[17px] text-gray-900 dark:text-white absolute left-1/2 -translate-x-1/2">Laporan Keuangan</h1>
        <button className="p-2 -mr-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors z-10"><Share2 size={22} /></button>
      </header>

      <main className="px-5 pb-32 flex flex-col gap-4 overflow-y-auto w-full flex-1">
        
        {/* Export Banner */}
        <div className="bg-[#E8F8EE] dark:bg-emerald-900/20 rounded-2xl p-4 mt-2 border border-transparent dark:border-emerald-900/30">
          <div className="flex items-center justify-center gap-2 mb-2.5">
             <Laptop size={18} className="text-[#218F4C] dark:text-emerald-400" />
             <span className="font-bold text-sm text-[#218F4C] dark:text-emerald-400">Akses di PC / Laptop</span>
          </div>
          <p className="text-[11px] text-[#218F4C] dark:text-emerald-300/80 text-center px-4 mb-3 leading-relaxed">Buka aplikasi ini di perangkat lain untuk Export PDF & Excel dengan layar lebih lebar.</p>
          <button 
            onClick={() => setShowPcModal(true)}
            className="w-full bg-[#D1F0DE] dark:bg-emerald-800/40 hover:bg-[#C0E8D1] dark:hover:bg-emerald-800/60 transition-colors text-[#1B703C] dark:text-emerald-300 py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5"
          >
            Hubungkan ke PC <ArrowLeft size={16} className="rotate-180" />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-[#F3F4FF] dark:bg-[#1E202C] rounded-2xl p-1.5 flex mt-1">
          <button onClick={() => setTab('harian')} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${tab === 'harian' ? 'bg-[#6C5CE7] text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'}`}>Harian</button>
          <button onClick={() => setTab('mingguan')} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${tab === 'mingguan' ? 'bg-[#6C5CE7] text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'}`}>Mingguan</button>
          <button onClick={() => setTab('bulanan')} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${tab === 'bulanan' ? 'bg-[#6C5CE7] text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'}`}>Bulanan</button>
          <button onClick={() => { setTab('custom'); setShowDatePicker(true); }} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${tab === 'custom' ? 'bg-[#6C5CE7] text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'}`}>Custom</button>
        </div>

        {/* Date Selector */}
        <div className="flex justify-between items-center py-2 mt-1">
           <button className="p-1.5"><ChevronLeft size={20} className="text-[#6C5CE7] dark:text-indigo-400" /></button>
           <button onClick={() => tab === 'custom' && setShowDatePicker(true)} className="text-[13px] font-bold text-gray-900 dark:text-white">{renderDateText()}</button>
           <button className="p-1.5"><ChevronRight size={20} className="text-gray-400 dark:text-gray-600" /></button>
        </div>

        {/* Summary Cards */}
        <div className="bg-[#E7F2EB] dark:bg-emerald-900/10 rounded-[24px] py-6 px-4 border border-[#D1E8DC] dark:border-emerald-900/30 text-center flex flex-col items-center justify-center mt-1">
           <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Laba Bersih</span>
           <div className="text-[22px] font-bold text-[#10B981] dark:text-emerald-400">Rp0</div>
        </div>
        
        <div className="flex gap-3">
           <div className="flex-1 p-4 rounded-[20px] border border-[#E2E8F0] dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm flex flex-col justify-center relative overflow-hidden">
             <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-[#10B981] rounded-r-md"></div>
             <span className="text-[11px] text-gray-500 dark:text-gray-400 font-bold mb-1 pl-2.5 leading-tight">Pemasukan</span>
             <div className="font-bold text-[17px] text-[#10B981] dark:text-emerald-400 mt-0.5 pl-2.5">Rp0</div>
           </div>
           <div className="flex-1 p-4 rounded-[20px] border border-[#E2E8F0] dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm flex flex-col justify-center relative overflow-hidden">
             <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-[#F43F5E] rounded-r-md"></div>
             <span className="text-[11px] text-gray-500 dark:text-gray-400 font-bold mb-1 pl-2.5 leading-tight">Pengeluaran</span>
             <div className="font-bold text-[17px] text-[#F43F5E] dark:text-rose-400 mt-0.5 pl-2.5">Rp0</div>
           </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center mt-10">
           <div className="w-[72px] h-[72px] rounded-full bg-[#F3F4FF] dark:bg-indigo-900/30 flex items-center justify-center mb-5">
             <BarChart2 size={36} className="text-[#6C5CE7] dark:text-indigo-400" strokeWidth={2.5} />
           </div>
           <h3 className="font-bold text-[15px] text-gray-700 dark:text-gray-200 mb-2">Belum ada data untuk periode ini</h3>
           <p className="text-[11.5px] text-gray-500 dark:text-gray-400 text-center px-4">Coba pilih periode lain atau mulai mencatat transaksi baru.</p>
        </div>

        {/* Share Button */}
        <button className="w-full bg-[#F3F4FF] dark:bg-indigo-900/30 hover:bg-[#E0E7FF] dark:hover:bg-indigo-900/50 transition-colors py-4 rounded-2xl text-[14px] font-bold text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center gap-2.5 mt-8 mb-4 border border-transparent dark:border-indigo-500/20">
           <Share2 size={20} strokeWidth={2.5} /> Bagikan Laporan
        </button>

        {/* Footer text */}
        <div className="text-center pb-2">
           <span className="text-[10px] text-gray-400">Powered by nana.studio</span>
        </div>
      </main>

      {showDatePicker && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancel} />
          <div className="bg-[#2A2A35] dark:bg-[#1E1E28] w-full max-w-sm rounded-[24px] overflow-hidden relative z-50 flex flex-col shadow-2xl">
            <div className="p-5 border-b border-gray-700/50">
              <h3 className="text-[15px] font-bold text-white mb-2">Pilih Rentang Tanggal</h3>
              <p className="text-gray-300 text-[18px]">
                {tempStartDate ? `${tempStartDate} Mei` : 'Tanggal mulai'} - {tempEndDate ? `${tempEndDate} Mei` : 'Tanggal akhir'}
              </p>
            </div>
            <div className="p-5 overflow-y-auto max-h-[50vh] no-scrollbar">
              <div className="text-white font-bold mb-4 text-sm mt-2">Mei 2026</div>
              <div className="grid grid-cols-7 text-center gap-y-4 text-[13px]">
                 <div className="text-gray-400">M</div>
                 <div className="text-gray-400">S</div>
                 <div className="text-gray-400">S</div>
                 <div className="text-gray-400">R</div>
                 <div className="text-gray-400">K</div>
                 <div className="text-gray-400">J</div>
                 <div className="text-gray-400">S</div>
                 
                 <div className="text-gray-500"></div>
                 <div className="text-gray-500"></div>
                 <div className="text-gray-500"></div>
                 <div className="text-gray-500"></div>
                 <div className="text-gray-500"></div>

                 {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                   const isSelected = day === tempStartDate || day === tempEndDate;
                   const isInRange = tempStartDate && tempEndDate && day > tempStartDate && day < tempEndDate;
                   
                   return (
                     <div 
                       key={day} 
                       onClick={() => handleDayClick(day)}
                       className={`
                         flex items-center justify-center cursor-pointer
                         ${isInRange ? 'bg-indigo-900/30 text-indigo-300' : 'text-white'}
                         relative
                       `}
                     >
                       {isSelected ? (
                         <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#6C5CE7] text-white">
                           {day}
                         </span>
                       ) : (
                         <span className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 transition-colors">
                           {day}
                         </span>
                       )}
                     </div>
                   );
                 })}
              </div>

              <div className="text-gray-400 font-bold mt-8 mb-4">Juni 2026</div>
            </div>
            
            <div className="p-4 border-t border-gray-700/50 flex justify-end gap-6 bg-[#21212B] dark:bg-[#15151D] pt-5 pb-5 pr-6">
               <button onClick={handleCancel} className="text-gray-300 font-medium text-sm">Batal</button>
               <button onClick={handleApply} className="text-indigo-400 font-medium text-sm">Terapkan</button>
            </div>
          </div>
        </div>
      )}

      {/* PC Modal */}
      {showPcModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPcModal(false)} />
          <div className="bg-white dark:bg-[#151721] w-full max-w-sm rounded-[24px] p-6 relative z-50 flex flex-col items-center shadow-xl">
             <div className="w-12 h-12 bg-[#E8F8EE] dark:bg-emerald-900/30 text-[#10B981] rounded-full flex items-center justify-center mb-4">
               <Laptop size={24} />
             </div>
             <h2 className="font-bold text-[18px] text-gray-900 dark:text-white mb-2 text-center">Buka di Perangkat Lain</h2>
             <p className="text-[13px] text-gray-500 dark:text-gray-400 text-center mb-6">
               Scan QR Code menggunakan Google Lens atau kamera HP Anda untuk membuka aplikasi ini di perangkat lain. Data sudah otomatis sinkron (gratis hosting).
             </p>
             
             <div className="bg-white p-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6 inline-block">
               <QRCodeSVG value={window.location.href} size={160} />
             </div>
             
             <div className="w-full bg-[#F3F4FF] dark:bg-indigo-900/20 rounded-xl p-3 flex items-center justify-between mb-2">
                <span className="text-[11px] text-gray-500 dark:text-indigo-300/70 truncate w-3/4">{window.location.href}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link disalin!');
                  }}
                  className="text-indigo-600 dark:text-indigo-400 font-bold text-[11px]"
                >
                  Salin Link
                </button>
             </div>
             
             <button 
               onClick={() => setShowPcModal(false)}
               className="w-full mt-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
             >
               Tutup
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalisisScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="w-full h-full flex flex-col bg-[#F7F8FA] dark:bg-gray-900">
      <header className="flex flex-col p-4 pt-6 pb-4 relative">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors z-10">
            <ArrowLeft size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="font-bold text-[18px] text-gray-900 dark:text-white leading-tight">Analisis Usaha</h1>
            <span className="text-[12px] text-gray-500 dark:text-gray-400">Pantau kesehatan keuanganmu</span>
          </div>
        </div>
      </header>

      <main className="px-5 pb-32 flex flex-col gap-4 overflow-y-auto w-full flex-1">
        
        {/* Main Banner */}
        <div className="w-full p-5 rounded-[24px] bg-gradient-to-r from-[#7B68EE] to-[#6C5CE7] dark:from-indigo-600 dark:to-indigo-800 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles size={28} className="text-white fill-white" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-bold text-white text-[15px] mb-0.5">Analisis Usaha Kamu</h2>
            <p className="text-white/90 text-[12px] leading-snug">Insight personal berdasarkan pola keuangan usahamu.</p>
          </div>
        </div>

        <div className="mt-2">
          <span className="text-[12px] font-bold text-gray-600 dark:text-gray-400 ml-1">1 dari 1 insight</span>
          
          {/* Insight Card */}
          <div className="mt-3 bg-[#FFFBF0] dark:bg-amber-900/10 border border-[#FDE6BB] dark:border-amber-500/20 rounded-[20px] p-4 flex gap-3">
             <div className="w-10 h-10 rounded-full bg-[#FFEDD5] dark:bg-amber-900/40 flex items-center justify-center shrink-0">
               <AlertTriangle size={20} className="text-[#F59E0B] fill-[#F59E0B]" />
             </div>
             <div className="flex flex-col pt-0.5">
               <span className="text-[11px] font-bold text-[#D97706] dark:text-amber-400 mb-1">Perhatian</span>
               <p className="text-[13px] text-gray-800 dark:text-gray-200 leading-snug">
                 <span className="mr-1">📋</span>
                 Belum ada pencatatan pemasukan 3 hari ini. Jangan sampai ada transaksi yang terlewat ya!
               </p>
             </div>
          </div>
        </div>

        {/* Footer text */}
        <div className="text-center mt-12 pb-2">
           <span className="text-[10px] text-gray-400">Powered by nana.studio</span>
        </div>
      </main>
    </div>
  );
}

function ProfilScreen({ 
  onBack, 
  onManageCategory, 
  onShowPrivacy, 
  theme, 
  setTheme, 
  user, 
  login, 
  logout, 
  onSync, 
  isSyncing,
  appPin,
  setAppPin,
  isBiometricEnabled,
  setBiometricEnabled,
  onLockNow
}: { 
  onBack: () => void, 
  onManageCategory: () => void, 
  onShowPrivacy: () => void, 
  theme: string, 
  setTheme: (val: any) => void, 
  user: FirebaseUser | null, 
  login: () => Promise<any>, 
  logout: () => Promise<void>, 
  onSync: () => void, 
  isSyncing: boolean,
  appPin: string,
  setAppPin: (val: string) => void,
  isBiometricEnabled: boolean,
  setBiometricEnabled: (val: boolean) => void,
  onLockNow: () => void
}) {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinStep, setPinStep] = useState(1); // 1: input, 2: confirm
  const [pinError, setPinError] = useState('');

  const handleCreatePin = (val: string) => {
    setPinError('');
    if (pinStep === 1) {
      if (val.length === 6) {
        setTimeout(() => setPinStep(2), 250);
      }
    } else {
      if (val.length === 6) {
        setTimeout(() => {
          if (val === pinInput) {
            const hashed = hashData(val);
            setAppPin(hashed);
            localStorage.setItem('app_pin', hashed);
            setShowPinModal(false);
            setPinStep(1);
            setPinInput('');
            setPinConfirm('');
          } else {
            setPinError('PIN tidak sesuai, silakan coba lagi.');
            setPinStep(1);
            setPinInput('');
            setPinConfirm('');
          }
        }, 300);
      }
    }
  };

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const confirmClearPin = () => {
    setAppPin('');
    setBiometricEnabled(false);
    localStorage.removeItem('app_pin');
    localStorage.removeItem('app_biometric');
    setShowClearConfirm(false);
  };

  const clearPin = () => {
    setShowClearConfirm(true);
  };

  const [isBiometricLoading, setIsBiometricLoading] = useState(false);

  const toggleBiometric = async () => {
    if (!appPin) {
      alert("Aktifkan PIN terlebih dahulu");
      return;
    }
    
    if (isBiometricEnabled) {
      setBiometricEnabled(false);
      localStorage.setItem('app_biometric', 'false');
      return;
    }

    setIsBiometricLoading(true);
    try {
      const success = await authenticateBiometric();
      if (success) {
        setBiometricEnabled(true);
        localStorage.setItem('app_biometric', 'true');
      } else {
        console.log("Autentikasi biometrik dibatalkan");
      }
    } catch (err) {
      console.error("Biometric error:", err);
      alert("Gagal melakukan autentikasi biometrik.");
    } finally {
      setIsBiometricLoading(false);
    }
  };


  return (
    <div className="w-full h-full flex flex-col bg-[#F7F8FA] dark:bg-gray-900 overflow-hidden">
      <header className="flex items-center p-4 pt-6 pb-2 relative bg-[#F7F8FA] dark:bg-gray-900 z-20">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-[17px] text-gray-900 dark:text-white ml-2">Pengaturan</h1>
      </header>

      <main className="px-5 pb-32 flex flex-col gap-6 overflow-y-auto w-full flex-1 pt-4">
        
        {/* USAHA Section */}
        <section>
          <div className="text-[11px] font-bold text-[#6C5CE7] mb-3 tracking-wider uppercase">Usaha</div>
          <div className="bg-white dark:bg-gray-800 rounded-[20px] shadow-sm border border-gray-50 dark:border-gray-700 flex flex-col overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-full bg-[#F3F4FF] dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                   <Store size={18} className="text-[#6C5CE7] dark:text-indigo-400" />
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[11px] text-gray-400 font-medium">Nama Usaha</span>
                   <span className="text-[14px] font-bold text-gray-900 dark:text-white">Es Mambo</span>
                 </div>
              </div>
              <Pencil size={16} className="text-[#6C5CE7] dark:text-indigo-400" />
            </div>
            <div className="p-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-full bg-[#F3F4FF] dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                   <Wallet size={18} className="text-[#6C5CE7] dark:text-indigo-400" />
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[11px] text-gray-400 font-medium">Sesuaikan Saldo</span>
                   <span className="text-[14px] font-bold text-gray-900 dark:text-white">Saldo: Rp0</span>
                 </div>
              </div>
              <Pencil size={16} className="text-[#6C5CE7] dark:text-indigo-400" />
            </div>
            <div onClick={onManageCategory} className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-full bg-[#F3F4FF] dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                   <LayoutGrid size={18} className="text-[#6C5CE7] dark:text-indigo-400" />
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[14px] font-bold text-gray-900 dark:text-white leading-tight">Kelola Kategori</span>
                   <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Tambah, edit, atau hapus kategori transaksi</span>
                 </div>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </div>
          </div>
        </section>

        {/* TEMA APLIKASI Section */}
        <section>
          <div className="text-[11px] font-bold text-[#6C5CE7] mb-3 tracking-wider uppercase">Tema Aplikasi</div>
          <div className="flex gap-3">
             <button 
               onClick={() => setTheme('sistem')}
               className={`flex-1 py-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all ${theme === 'sistem' ? 'bg-[#F3F4FF] dark:bg-indigo-900/40 border-[#E0E7FF] dark:border-indigo-500/30 opacity-100' : 'bg-white dark:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-600 opacity-60'}`}
             >
                <Settings size={22} className={theme === 'sistem' ? 'text-[#6C5CE7] dark:text-indigo-400' : 'text-gray-400'} />
                <span className={`text-xs ${theme === 'sistem' ? 'font-bold text-[#6C5CE7] dark:text-indigo-400' : 'font-medium text-gray-600 dark:text-gray-400'}`}>Sistem</span>
             </button>
             <button 
               onClick={() => setTheme('terang')}
               className={`flex-1 py-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all ${theme === 'terang' ? 'bg-[#F3F4FF] dark:bg-indigo-900/40 border-[#E0E7FF] dark:border-indigo-500/30 opacity-100' : 'bg-white dark:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-600 opacity-60'}`}
             >
                <Sun size={22} className={theme === 'terang' ? 'text-[#6C5CE7] dark:text-indigo-400' : 'text-gray-400'} />
                <span className={`text-xs ${theme === 'terang' ? 'font-bold text-[#6C5CE7] dark:text-indigo-400' : 'font-medium text-gray-600 dark:text-gray-400'}`}>Terang</span>
             </button>
             <button 
               onClick={() => setTheme('gelap')}
               className={`flex-1 py-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all ${theme === 'gelap' ? 'bg-[#F3F4FF] dark:bg-indigo-900/40 border-[#E0E7FF] dark:border-indigo-500/30 opacity-100' : 'bg-white dark:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-600 opacity-60'}`}
             >
                <Moon size={22} className={theme === 'gelap' ? 'text-[#6C5CE7] dark:text-indigo-400' : 'text-gray-400'} />
                <span className={`text-xs ${theme === 'gelap' ? 'font-bold text-[#6C5CE7] dark:text-indigo-400' : 'font-medium text-gray-600 dark:text-gray-400'}`}>Gelap</span>
             </button>
          </div>
        </section>

        {/* KEAMANAN Section */}
        <section>
          <div className="text-[11px] font-bold text-[#6C5CE7] mb-3 tracking-wider uppercase">Keamanan</div>
          <div className="bg-white dark:bg-gray-800 rounded-[20px] shadow-sm border border-gray-50 dark:border-gray-700 flex flex-col overflow-hidden">
            <div 
              onClick={() => !appPin && (setPinStep(1), setPinInput(''), setPinConfirm(''), setShowPinModal(true))}
              className={`p-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-700 transition-colors ${!appPin ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : 'cursor-default opacity-80'}`}
            >
              <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-full bg-[#F3F4FF] dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                   <Lock size={18} className="text-[#6C5CE7] dark:text-indigo-400" />
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[14px] font-bold text-gray-900 dark:text-white leading-tight">PIN Keamanan</span>
                   <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Lindungi data Anda dengan kunci PIN</span>
                 </div>
              </div>
              <div className="flex items-center gap-1">
                 <span className={`text-xs font-medium ${appPin ? 'text-[#10B981] dark:text-[#4ADE80]' : 'text-red-500 dark:text-red-400'}`}>{appPin ? 'Aktif' : 'Belum diatur'}</span>
                 {!appPin && <ChevronRight size={18} className="text-gray-400" />}
              </div>
            </div>
            {appPin && (
               <>
                 <div onClick={clearPin} className="p-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center shrink-0">
                         <Lock size={18} className="text-red-500 dark:text-red-400" />
                       </div>
                       <div className="flex flex-col">
                         <span className="text-[14px] font-bold text-red-500 dark:text-red-400 leading-tight">Hapus PIN</span>
                       </div>
                    </div>
                 </div>
                 <div onClick={onLockNow} className="p-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-full bg-orange-50 dark:bg-orange-900/10 flex items-center justify-center shrink-0">
                         <Shield size={18} className="text-orange-500 dark:text-orange-400" />
                       </div>
                       <div className="flex flex-col">
                         <span className="text-[14px] font-bold text-orange-500 dark:text-orange-400 leading-tight">Kunci Sekarang</span>
                         <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Tes kecocokan PIN & sidik jari</span>
                       </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                 </div>
               </>
            )}
            <div onClick={toggleBiometric} className={`p-4 flex items-center justify-between transition-colors ${appPin ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : 'cursor-default opacity-50 bg-gray-50/50 dark:bg-gray-800/50'}`}>
              <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-full bg-transparent flex items-center justify-center shrink-0">
                   <Fingerprint size={22} className={isBiometricEnabled ? "text-[#6C5CE7] dark:text-indigo-400" : "text-gray-400"} />
                 </div>
                 <div className="flex flex-col">
                   <span className={`text-[14px] font-bold ${isBiometricEnabled ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"} leading-tight`}>Sidik Jari / Wajah</span>
                   <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{appPin ? 'Login lebih cepat dengan biometrik' : 'Aktifkan PIN terlebih dahulu'}</span>
                 </div>
              </div>
              <div className={`w-11 h-6 rounded-full relative transition-colors ${isBiometricEnabled ? 'bg-[#6C5CE7]' : 'bg-[#E2E8F0] dark:bg-gray-700'}`}>
                 <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${isBiometricEnabled ? 'left-6' : 'left-1 dark:bg-gray-400'}`}></div>
              </div>
            </div>
          </div>
        </section>

        {/* WEB DASHBOARD Section */}
        <section>
          <div className="text-[11px] font-bold text-[#6C5CE7] mb-3 tracking-wider uppercase">Web Dashboard</div>
          <div className="bg-white dark:bg-gray-800 rounded-[20px] shadow-sm border border-gray-50 dark:border-gray-700 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center gap-3">
               <div className="w-9 h-9 rounded-full bg-[#F3F4FF] dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                 <Laptop size={18} className="text-[#6C5CE7] dark:text-indigo-400" />
               </div>
               <div className="flex flex-col">
                 <span className="text-[14px] font-bold text-gray-900 dark:text-white leading-tight">Hubungkan ke Web</span>
                 <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Buka dashboard & laporan di PC</span>
               </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>
        </section>

        {/* LAINNYA Section */}
        <section>
          <div className="text-[11px] font-bold text-[#6C5CE7] mb-3 tracking-wider uppercase">Lainnya</div>
          <div onClick={onShowPrivacy} className="bg-white dark:bg-gray-800 rounded-[20px] shadow-sm border border-gray-50 dark:border-gray-700 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center gap-3">
               <div className="w-9 h-9 rounded-full bg-[#F3F4FF] dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                 <Shield size={18} className="text-[#6C5CE7] dark:text-indigo-400" />
               </div>
               <div className="flex flex-col">
                 <span className="text-[14px] font-bold text-gray-900 dark:text-white leading-tight">Kebijakan Privasi</span>
                 <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Data Anda sepenuhnya milik Anda</span>
               </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>
        </section>

        {/* AKUN & SYNC Section */}
        <section>
          <div className="text-[11px] font-bold text-[#6C5CE7] mb-3 tracking-wider uppercase">Akun & Sync</div>
          <div className="bg-white dark:bg-gray-800 rounded-[20px] shadow-sm border border-gray-50 dark:border-gray-700 flex flex-col overflow-hidden">
            {user ? (
              <>
                <div className="p-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                     <div className="w-9 h-9 rounded-full bg-[#E0F2E9] dark:bg-emerald-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                       {user.photoURL ? (
                         <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                       ) : (
                         <UserCircle size={20} className="text-[#10B981] dark:text-emerald-400" />
                       )}
                     </div>
                     <div className="flex flex-col">
                       <span className="text-[14px] font-bold text-gray-900 dark:text-white leading-tight">{user.displayName || 'Pengguna'}</span>
                       <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</span>
                     </div>
                  </div>
                </div>
                <div onClick={onSync} className={`p-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-700 transition-colors ${isSyncing ? 'cursor-default opacity-70' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                  <div className="flex items-center gap-3">
                     <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isSyncing ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'bg-[#F3F4FF] dark:bg-indigo-900/30'}`}>
                       <RefreshCw size={18} className={`text-[#6C5CE7] dark:text-indigo-400 ${isSyncing ? 'animate-spin' : ''}`} />
                     </div>
                     <div className="flex flex-col">
                       <span className="text-[14px] font-bold text-gray-900 dark:text-white leading-tight">{isSyncing ? 'Menyinkronkan...' : 'Sinkronisasi Awan'}</span>
                       <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Data aman tersimpan di awan</span>
                     </div>
                  </div>
                  <Check size={18} className="text-[#10B981] dark:text-emerald-400" />
                </div>
                <div onClick={logout} className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                     <div className="w-9 h-9 rounded-full bg-[#FFF0F0] dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                       <LogOut size={18} className="text-[#F43F5E] dark:text-rose-400" />
                     </div>
                     <div className="flex flex-col">
                       <span className="text-[14px] font-bold text-gray-900 dark:text-white leading-tight">Keluar / Sign Out</span>
                       <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Hapus sesi login dari HP ini</span>
                     </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </div>
              </>
            ) : (
              <div onClick={login} className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-3">
                   <div className="w-9 h-9 rounded-full bg-[#F3F4FF] dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                     <UserCircle size={20} className="text-[#6C5CE7] dark:text-indigo-400" />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[14px] font-bold text-gray-900 dark:text-white leading-tight">Masuk dengan Google</span>
                     <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Simpan data ke awan & multi-device</span>
                   </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </div>
            )}
          </div>
        </section>

        {/* Footer text */}
        <div className="text-center mt-2 pb-6">
           <span className="text-[10px] text-gray-400">Powered by nana.studio</span>
        </div>
      </main>

      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowClearConfirm(false)} />
          <div className="bg-white dark:bg-[#151721] w-full max-w-[320px] rounded-[24px] p-6 relative z-[110] flex flex-col items-center shadow-2xl animate-in fade-in zoom-in duration-200">
             <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-4">
               <Lock size={28} />
             </div>
             <h2 className="font-bold text-[18px] text-gray-900 dark:text-white mb-2 text-center">
               Hapus PIN?
             </h2>
             <p className="text-[13px] text-gray-500 dark:text-gray-400 text-center mb-6 leading-relaxed">
               Jika Anda menghapus PIN, fitur sidik jari juga akan dinonaktifkan. Data Anda mungkin menjadi kurang aman.
             </p>
             
             <div className="flex w-full gap-3">
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-[13px] hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmClearPin}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-[13px] shadow-sm transition-colors"
                >
                  Ya, Hapus
                </button>
             </div>
          </div>
        </div>
      )}

      {showPinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPinModal(false)} />
          <div className="bg-white dark:bg-[#151721] w-full max-w-sm rounded-[24px] p-6 relative z-[110] flex flex-col items-center shadow-2xl animate-in fade-in zoom-in duration-200">
             <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-[#6C5CE7] rounded-full flex items-center justify-center mb-4">
               <Lock size={24} />
             </div>
             <h2 className="font-bold text-[18px] text-gray-900 dark:text-white mb-2 text-center">
               {pinStep === 1 ? 'Buat PIN 6 Angka' : 'Konfirmasi PIN'}
             </h2>
             <p className="text-[13px] text-gray-500 dark:text-gray-400 text-center mb-6">
               {pinStep === 1 ? 'Masukkan 6 angka untuk mengamankan data transaksi Anda.' : 'Masukkan ulang PIN yang sama untuk konfirmasi.'}
             </p>
             
             <div className="flex justify-center gap-3 mb-2">
               {Array.from({ length: 6 }).map((_, i) => (
                 <div key={i} className={`w-4 h-4 rounded-full transition-colors ${i < (pinStep === 1 ? pinInput.length : pinConfirm.length) ? 'bg-[#6C5CE7]' : 'bg-gray-200 dark:bg-gray-700'}`} />
               ))}
             </div>
             
             <div className="h-5 flex items-center justify-center mb-2">
                {pinError && <span className="text-rose-500 font-bold text-xs animate-pulse">{pinError}</span>}
             </div>

             <PinNumpad 
               value={pinStep === 1 ? pinInput : pinConfirm} 
               onChange={(val) => {
                 if (pinStep === 1) {
                   setPinInput(val);
                   handleCreatePin(val);
                 } else {
                   setPinConfirm(val);
                   handleCreatePin(val);
                 }
               }} 
             />

             <button 
               onClick={() => { setShowPinModal(false); setPinStep(1); setPinInput(''); setPinConfirm(''); }}
               className="w-full mt-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
             >
               Batal
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CatatTransaksiScreen({ onBack, onSaveTransaction }: { onBack: () => void, onSaveTransaction: (t: Transaction) => void }) {
  const [inputMode, setInputMode] = useState<'voice' | 'manual'>('voice');
  const [transactionType, setTransactionType] = useState<'pemasukan' | 'pengeluaran'>('pemasukan');
  const [transactionDate, setTransactionDate] = useState(getLocalDateString());
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('lain-lain');
  const [amount, setAmount] = useState('0');
  const [note, setNote] = useState('');
  
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');

  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatType, setNewCatType] = useState<'pengeluaran' | 'pemasukan'>('pengeluaran');
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6C5CE7'); 
  const [newCatIcon, setNewCatIcon] = useState(0);

  const [customCategories, setCustomCategories] = useState<{id: string, name: string, type: 'pemasukan'|'pengeluaran', color: string, iconIdx: number}[]>([]);

  const handleSave = () => {
    if (!amount || amount === '0') {
      alert('Masukkan nominal transaksi.');
      return;
    }
    
    // Temukan nama kategori berdasarkan id
    let catName = selectedCategory;
    if (selectedCategory === 'lain-lain') catName = 'Lain-lain';
    else if (selectedCategory === 'modal') catName = 'Modal Masuk';
    else if (selectedCategory === 'penjualan') catName = 'Penjualan';
    else if (selectedCategory === 'lainnya') catName = 'Lainnya';
    else {
      const custom = customCategories.find(c => c.id === selectedCategory);
      if (custom) catName = custom.name;
    }

    const t: Transaction = {
      id: Date.now().toString(),
      type: transactionType,
      amount: parseInt(amount, 10),
      date: transactionDate,
      categoryId: selectedCategory,
      category: catName,
      note,
      createdAt: Date.now()
    };
    onSaveTransaction(t);
    alert('Transaksi berhasil disimpan!');
    onBack();
  };

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser Anda tidak mendukung fitur suara (Speech Recognition).");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      setIsRecording(true);
      setRecognizedText('');
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setRecognizedText(text);
      
      const lower = text.toLowerCase();
      const isPengeluaran = /beli|jajan|belanja|keluar|bayar|tagihan/.test(lower);
      const isPemasukan = /jual|pendapatan|pemasukan|terima|dapat/.test(lower);
      
      if (isPengeluaran) setTransactionType('pengeluaran');
      else if (isPemasukan) setTransactionType('pemasukan');
      
      let parsedAmount = "0";
      const numberMatch = text.replace(/\./g, '').match(/\d+/);
      if (numberMatch) {
         let num = parseInt(numberMatch[0], 10);
         if (lower.includes("ribu")) num *= 1000;
         else if (lower.includes("juta")) num *= 1000000;
         parsedAmount = num.toString();
      }
      
      setAmount(parsedAmount);
      setNote(text);
      setInputMode('manual');
    };

    recognition.onerror = (e: any) => {
      console.error(e);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  if (inputMode === 'voice') {
    return (
      <div className="w-full h-full flex flex-col bg-[#F7F8FA] dark:bg-[#0B0C10] overflow-hidden relative">
        <header className="flex items-center p-4 pt-6 pb-2 relative z-20">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-bold text-[17px] text-gray-900 dark:text-white ml-2">Catat Transaksi</h1>
        </header>

        <main className="px-5 flex flex-col gap-4 overflow-y-auto w-full flex-1 pt-4">
          <div className="bg-white dark:bg-[#151721] rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800 p-5 flex flex-col gap-3">
             <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#F3F4FF] dark:bg-indigo-900/30 flex items-center justify-center">
                  <Lightbulb size={18} className="text-[#6C5CE7] dark:text-indigo-400" />
                </div>
                <span className="font-bold text-[15px] text-gray-900 dark:text-white">Coba ucapkan...</span>
             </div>

             <div className="bg-[#F7F8FA] dark:bg-[#1E202C] rounded-xl p-3.5 flex items-center gap-3">
                <Banknote size={18} className="text-gray-500 dark:text-gray-400 shrink-0" />
                <span className="text-[13px] text-gray-700 dark:text-gray-300">"Jual nasi bungkus 15 ribu"</span>
             </div>
             
             <div className="bg-[#F7F8FA] dark:bg-[#1E202C] rounded-xl p-3.5 flex items-center gap-3">
                <ShoppingBag size={18} className="text-gray-500 dark:text-gray-400 shrink-0" />
                <span className="text-[13px] text-gray-700 dark:text-gray-300">"Kulakan bahan setengah juta"</span>
             </div>

             <div className="bg-[#F7F8FA] dark:bg-[#1E202C] rounded-xl p-3.5 flex items-center gap-3">
                <Lightbulb size={18} className="text-gray-500 dark:text-gray-400 shrink-0" />
                <span className="text-[13px] text-gray-700 dark:text-gray-300">"Token listrik 50 ribu"</span>
             </div>

             <div className="bg-[#F7F8FA] dark:bg-[#1E202C] rounded-xl p-3.5 flex items-center gap-3">
                <Users size={18} className="text-gray-500 dark:text-gray-400 shrink-0" />
                <span className="text-[13px] text-gray-700 dark:text-gray-300">"Gaji karyawan sejuta"</span>
             </div>

             <div className="mt-2 text-[11px] text-[#6C5CE7] dark:text-indigo-400 font-medium px-1">
               {isRecording ? "Sedang mendengarkan..." : "Tips: Sebutkan barang + nominal uangnya."}
             </div>
          </div>

          <div className="text-center mt-12 pb-2">
             <span className="text-[10px] text-gray-400 dark:text-gray-600">Powered by nana.studio</span>
          </div>
        </main>

        <footer className="p-5 pb-10 flex items-center justify-between relative">
           <button 
             onClick={() => setInputMode('manual')}
             className="w-[52px] h-[52px] rounded-full text-gray-500 dark:text-gray-400 flex items-center justify-center z-10 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
           >
             <Pencil size={24} />
           </button>
           
           <div className="absolute left-1/2 -translate-x-1/2 bottom-8">
             <button onClick={startRecording} className={`w-[68px] h-[68px] ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-[#6C5CE7] hover:bg-indigo-600'} text-white rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-[0_8px_30px_rgba(108,92,231,0.5)]`}>
               <Mic size={32} strokeWidth={2.5} className={isRecording ? 'animate-pulse' : ''} />
             </button>
           </div>
           
           <div className="w-[52px]"></div>
        </footer>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#F7F8FA] dark:bg-[#0B0C10] overflow-hidden relative">
      <header className="flex items-center p-4 pt-6 pb-2 relative z-20">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-[17px] text-gray-900 dark:text-white ml-2">Catat Transaksi</h1>
      </header>

      <main className="flex-1 overflow-y-auto w-full px-4 pb-32 pt-2 flex flex-col gap-4">
        {recognizedText && (
          <div className="bg-[#1A2F21] dark:bg-emerald-900/20 rounded-[20px] p-4 flex items-center justify-between border border-emerald-900/50">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Star size={16} className="text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-emerald-400/80 mb-0.5">Terdeteksi:</span>
                <span className="text-[13px] font-bold text-white">"{recognizedText}"</span>
              </div>
            </div>
            <button onClick={() => setRecognizedText('')} className="bg-emerald-500/20 hover:bg-emerald-500/30 transition-colors text-emerald-400 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
              <Check size={12} /> Yakin
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-[#151721] rounded-full p-1.5 flex shadow-sm border border-gray-100 dark:border-gray-800">
           <button 
             onClick={() => setTransactionType('pemasukan')}
             className={`flex-1 py-3 rounded-full text-[13px] font-bold transition-all ${transactionType === 'pemasukan' ? 'bg-[#10B981] dark:bg-[#4ADE80] text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
           >
             Pemasukan
           </button>
           <button 
             onClick={() => setTransactionType('pengeluaran')}
             className={`flex-1 py-3 rounded-full text-[13px] font-bold transition-all ${transactionType === 'pengeluaran' ? 'bg-[#F43F5E] dark:bg-rose-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
           >
             Pengeluaran
           </button>
        </div>

        <div 
          onClick={() => setShowDateModal(true)}
          className="bg-white dark:bg-[#151721] rounded-[20px] p-4 flex items-center justify-between shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1E202C]/50 transition-colors"
        >
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-[#F3F4FF] dark:bg-[#1E202C] flex items-center justify-center">
                <Calendar size={20} className="text-[#6C5CE7] dark:text-indigo-400" />
             </div>
             <div className="flex flex-col">
                <span className="text-[11px] text-gray-500 dark:text-gray-400">Tanggal Transaksi</span>
                <span className="text-[14px] font-bold text-gray-900 dark:text-white mt-0.5">
                  {transactionDate === getLocalDateString() 
                    ? `Hari ini, ${new Date(transactionDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'})}` 
                    : new Date(transactionDate).toLocaleDateString('id-ID', {weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'})}
                </span>
             </div>
          </div>
          <Pencil size={18} className="text-gray-400 dark:text-gray-500" />
        </div>

        <div className="bg-white dark:bg-[#151721] rounded-[24px] p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center">
           <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Nominal Transaksi</span>
           <div className={`text-4xl font-bold mb-4 ${transactionType === 'pemasukan' ? 'text-[#10B981] dark:text-[#4ADE80]' : 'text-[#F43F5E] dark:text-rose-500'}`}>
             Rp{amount === '0' || amount === '' ? '0' : parseInt(amount).toLocaleString('id-ID')}
           </div>
           <div className="w-full bg-[#F7F8FA] dark:bg-[#0B0C10] rounded-xl p-4 flex items-center border border-gray-100 dark:border-gray-800 focus-within:border-[#6C5CE7] transition-colors">
              <span className={`font-bold mr-2 ${transactionType === 'pemasukan' ? 'text-[#10B981] dark:text-[#4ADE80]' : 'text-[#F43F5E] dark:text-rose-500'}`}>Rp</span>
              <input 
                type="number" 
                min="0"
                placeholder="0" 
                value={amount === '0' ? '' : amount}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e') {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || parseFloat(val) >= 0) {
                    setAmount(val);
                  }
                }}
                className="bg-transparent w-full outline-none text-gray-900 dark:text-white font-medium text-[15px] placeholder:text-gray-400 dark:placeholder:text-gray-600"
              />
           </div>
        </div>

        <div>
           <span className="text-[12px] font-bold text-gray-700 dark:text-gray-300 ml-1 mb-2 block">Kategori</span>
           <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setSelectedCategory('lain-lain')}
                className={`p-4 flex flex-col items-center justify-center gap-2 rounded-[20px] border transition-all ${selectedCategory === 'lain-lain' ? 'bg-[#F3F4FF] dark:bg-indigo-900/30 border-[#6C5CE7] dark:border-indigo-500' : 'bg-white dark:bg-[#151721] border-gray-100 dark:border-gray-800'}`}
              >
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedCategory === 'lain-lain' ? 'bg-[#6C5CE7]' : 'bg-[#F3F4FF] dark:bg-[#1E202C]'}`}>
                    <MoreHorizontal size={16} className={selectedCategory === 'lain-lain' ? 'text-white' : 'text-[#6C5CE7] dark:text-indigo-400'} />
                 </div>
                 <span className={`text-[11px] font-bold ${selectedCategory === 'lain-lain' ? 'text-[#6C5CE7] dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>Lain-lain</span>
              </button>
              
              <button 
                onClick={() => setSelectedCategory('modal')}
                className={`p-4 flex flex-col items-center justify-center gap-2 rounded-[20px] border transition-all ${selectedCategory === 'modal' ? 'bg-[#F3F4FF] dark:bg-indigo-900/30 border-[#6C5CE7] dark:border-indigo-500' : 'bg-white dark:bg-[#151721] border-gray-100 dark:border-gray-800'}`}
              >
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedCategory === 'modal' ? 'bg-[#6C5CE7]' : 'bg-[#F3F4FF] dark:bg-[#1E202C]'}`}>
                    <PiggyBank size={16} className={selectedCategory === 'modal' ? 'text-white' : 'text-[#6C5CE7] dark:text-indigo-400'} />
                 </div>
                 <span className={`text-[11px] font-bold ${selectedCategory === 'modal' ? 'text-[#6C5CE7] dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>Modal Masuk</span>
              </button>

              <button 
                onClick={() => setSelectedCategory('penjualan')}
                className={`p-4 flex flex-col items-center justify-center gap-2 rounded-[20px] border transition-all ${selectedCategory === 'penjualan' ? 'bg-[#F3F4FF] dark:bg-indigo-900/30 border-[#6C5CE7] dark:border-indigo-500' : 'bg-white dark:bg-[#151721] border-gray-100 dark:border-gray-800'}`}
              >
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedCategory === 'penjualan' ? 'bg-[#6C5CE7]' : 'bg-[#F3F4FF] dark:bg-[#1E202C]'}`}>
                    <Store size={16} className={selectedCategory === 'penjualan' ? 'text-white' : 'text-[#6C5CE7] dark:text-indigo-400'} />
                 </div>
                 <span className={`text-[11px] font-bold ${selectedCategory === 'penjualan' ? 'text-[#6C5CE7] dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>Penjualan</span>
              </button>

              <button 
                onClick={() => setSelectedCategory('lainnya')}
                className={`p-4 flex flex-col items-center justify-center gap-2 rounded-[20px] border transition-all ${selectedCategory === 'lainnya' ? 'bg-[#F3F4FF] dark:bg-indigo-900/30 border-[#6C5CE7] dark:border-indigo-500' : 'bg-white dark:bg-[#151721] border-gray-100 dark:border-gray-800'}`}
              >
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedCategory === 'lainnya' ? 'bg-[#6C5CE7]' : 'bg-[#F3F4FF] dark:bg-[#1E202C]'}`}>
                    <MoreHorizontal size={16} className={selectedCategory === 'lainnya' ? 'text-white' : 'text-[#6C5CE7] dark:text-indigo-400'} />
                 </div>
                 <span className={`text-[11px] font-bold ${selectedCategory === 'lainnya' ? 'text-[#6C5CE7] dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>Lainnya</span>
              </button>

              {customCategories.filter(c => c.type === transactionType).map(c => {
                const ActIcon = kelolaIcons[c.iconIdx] || LayoutGrid;
                return (
                  <button 
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`p-4 flex flex-col items-center justify-center gap-2 rounded-[20px] border transition-all ${selectedCategory === c.id ? '' : 'bg-white dark:bg-[#151721] border-gray-100 dark:border-gray-800'}`}
                    style={selectedCategory === c.id ? { borderColor: c.color, backgroundColor: `${c.color}20` } : {}}
                  >
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center`} style={{ backgroundColor: selectedCategory === c.id ? c.color : `${c.color}20` }}>
                        <ActIcon size={16} className={selectedCategory === c.id ? 'text-white' : ''} style={selectedCategory !== c.id ? { color: c.color } : {}} />
                     </div>
                     <span className={`text-[11px] font-bold`} style={{ color: selectedCategory === c.id ? c.color : '' }}>{c.name}</span>
                  </button>
                )
              })}

              <button 
                onClick={() => {
                  setNewCatType(transactionType);
                  setShowAddCatModal(true);
                }}
                className="col-span-2 p-4 flex flex-col items-center justify-center gap-2 rounded-[20px] border bg-transparent border-dashed border-[#6C5CE7] dark:border-indigo-500/50 hover:bg-[#F3F4FF] dark:hover:bg-indigo-900/20 transition-colors"
              >
                 <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F3F4FF] dark:bg-indigo-900/30">
                    <Plus size={16} className="text-[#6C5CE7] dark:text-indigo-400" />
                 </div>
                 <span className="text-[11px] font-bold text-[#6C5CE7] dark:text-indigo-400">Tambah</span>
              </button>
           </div>
        </div>

        <div className="mt-2 text-left">
           <textarea 
              rows={2}
              placeholder="Catatan (opsional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-white dark:bg-[#151721] rounded-[20px] p-4 text-[13px] border border-gray-100 dark:border-gray-800 focus:border-[#6C5CE7] dark:focus:border-indigo-500 outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 resize-none shadow-sm transition-colors"
           ></textarea>
        </div>

        <div>
           <span className="text-[12px] font-bold text-gray-700 dark:text-gray-300 ml-1 mb-2 block">Lampiran Foto (Nota/Resi)</span>
           <button className="w-full py-4 rounded-[20px] bg-white dark:bg-[#151721] border border-gray-100 dark:border-gray-800 flex items-center justify-center gap-2.5 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <Camera size={20} className="text-[#6C5CE7] dark:text-indigo-400" />
              <span className="font-bold text-[13px] text-[#6C5CE7] dark:text-indigo-400">Tambah Foto Nota</span>
           </button>
        </div>

        <button 
           onClick={handleSave}
           className="w-full mt-2 py-4 rounded-full bg-[#1A1A2E] dark:bg-[#1E202C] border border-transparent dark:border-gray-800 flex items-center justify-center gap-2 shadow-xl hover:bg-black dark:hover:bg-[#2A2D3E] transition-colors"
        >
           <Check size={20} className="text-white dark:text-gray-300" />
           <span className="font-bold text-[14px] text-white">Simpan Transaksi</span>
        </button>
      </main>

      <div className="absolute bottom-6 flex justify-center items-center gap-6 w-full">
           <button 
             onClick={startRecording}
             className={`w-[56px] h-[56px] ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-[#6C5CE7] hover:bg-indigo-600'} text-white rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-[0_8px_20px_rgba(108,92,231,0.5)] shrink-0`}
           >
             <Mic size={26} strokeWidth={2.5} className={isRecording ? 'animate-pulse' : ''} />
           </button>
           <button 
             onClick={onBack}
             className="text-[13px] font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
           >
             Tutup
           </button>
      </div>

      <AddCategoryModal 
        show={showAddCatModal}
        onClose={() => setShowAddCatModal(false)}
        type={newCatType}
        setType={setNewCatType}
        newCatName={newCatName}
        setNewCatName={setNewCatName}
        newCatColor={newCatColor}
        setNewCatColor={setNewCatColor}
        newCatIcon={newCatIcon}
        setNewCatIcon={setNewCatIcon}
        onSave={() => {
          const newId = newCatName.toLowerCase().replace(/\s+/g, '-');
          setCustomCategories([
             ...customCategories, 
             { id: newId, name: newCatName, type: newCatType, color: newCatColor, iconIdx: newCatIcon }
          ]);
          setSelectedCategory(newId);
          setTransactionType(newCatType);
          setShowAddCatModal(false);
          setNewCatName('');
        }}
      />
      <SelectDateModal 
        show={showDateModal}
        onClose={() => setShowDateModal(false)}
        date={transactionDate}
        setDate={setTransactionDate}
      />
    </div>
  );
}

const colors = [
  '#6C5CE7', '#818CF8', '#2DD4BF', '#34D399', '#A7F3D0', '#FDE047'
];

const kelolaIcons = [
  Store, Banknote, PiggyBank, Landmark, TrendingUp,
  ShoppingBag, Truck, Smartphone, Home, Calculator,
  Bookmark, Zap, MoreHorizontal, LayoutGrid, Tag,
  Star, Heart, Flag, Briefcase
];

function SelectDateModal({ show, onClose, date, setDate }: { show: boolean, onClose: () => void, date: string, setDate: (d: string) => void }) {
  const [selectedDate, setSelectedDate] = useState(date);
  
  useEffect(() => { if (show) setSelectedDate(date) }, [show, date]);

  if (!show) return null;

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white dark:bg-[#151721] w-full max-w-[340px] rounded-[28px] p-5 relative z-[101] flex flex-col max-h-[85vh]">
        <h2 className="font-bold text-[18px] text-gray-900 dark:text-white mb-4">Pilih Tanggal Transaksi</h2>
        
        <div className="flex gap-2 mb-4">
           <button 
             onClick={() => { const d = getLocalDateString(); setSelectedDate(d); setDate(d); onClose(); }} 
             className="flex-1 py-2.5 rounded-[12px] bg-[#F3F4FF] dark:bg-indigo-900/30 text-[#6C5CE7] dark:text-indigo-400 font-bold text-[13px] hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
           >
             Hari Ini
           </button>
           <button 
             onClick={() => { const d = new Date(); d.setDate(d.getDate() - 1); const str = getLocalDateString(d); setSelectedDate(str); setDate(str); onClose(); }} 
             className="flex-1 py-2.5 rounded-[12px] bg-[#F3F4FF] dark:bg-indigo-900/30 text-[#6C5CE7] dark:text-indigo-400 font-bold text-[13px] hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
           >
             Kemarin
           </button>
        </div>

        <div className="mb-6">
          <span className="text-[12px] font-bold text-gray-700 dark:text-gray-300 ml-1 mb-2 block">Pilih Manual</span>
          <input 
            type="date" 
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full bg-transparent border border-gray-200 dark:border-gray-800 rounded-[16px] px-4 py-3.5 text-[14px] text-gray-900 dark:text-white outline-none focus:border-[#6C5CE7] dark:focus:border-indigo-500 transition-colors cursor-pointer"
            style={{ colorScheme: 'auto' }}
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-[13px] hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Batal</button>
          <button 
            onClick={() => { setDate(selectedDate); onClose(); }} 
            className="flex-1 py-3.5 rounded-xl bg-[#6C5CE7] text-white font-bold text-[13px] hover:bg-indigo-600 shadow-[0_4px_12px_rgba(108,92,231,0.3)] transition-colors"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

function AddCategoryModal({ show, onClose, type, setType, newCatName, setNewCatName, newCatColor, setNewCatColor, newCatIcon, setNewCatIcon, onSave }: any) {
  if (!show) return null;
  return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <div className="bg-white dark:bg-[#151721] w-full max-w-[340px] rounded-[28px] p-5 relative z-[101] flex flex-col max-h-[85vh]">
            <h2 className="font-bold text-[18px] text-gray-900 dark:text-white mb-4">Kategori Baru</h2>
            
            <div className="bg-[#F7F8FA] dark:bg-[#1E202C] rounded-xl p-1 flex mb-5">
               <button 
                 onClick={() => setType('pengeluaran')}
                 className={`flex-1 py-2.5 rounded-lg text-[13px] font-bold transition-colors ${type === 'pengeluaran' ? 'bg-[#6C5CE7] text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
               >
                 Pengeluaran
               </button>
               <button 
                 onClick={() => setType('pemasukan')}
                 className={`flex-1 py-2.5 rounded-lg text-[13px] font-bold transition-colors ${type === 'pemasukan' ? 'bg-[#6C5CE7] text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
               >
                 Pemasukan
               </button>
            </div>

            <div className="bg-[#F3F4FF] dark:bg-indigo-900/20 rounded-[20px] p-4 flex items-center gap-4 mb-4 border border-transparent dark:border-indigo-500/10">
               <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: newCatColor }}>
                 {(() => {
                   const ActIcon = kelolaIcons[newCatIcon] || LayoutGrid;
                   return <ActIcon size={20} className="text-white" />;
                 })()}
               </div>
               <span className="text-[15px] font-medium text-gray-400 dark:text-indigo-200/50">
                 {newCatName || 'Nama Kategori'}
               </span>
            </div>

            <div className="mb-5">
              <input 
                type="text" 
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                maxLength={30}
                placeholder="Nama Kategori"
                className="w-full bg-transparent border border-gray-200 dark:border-gray-800 rounded-[16px] px-4 py-3.5 text-[14px] text-gray-900 dark:text-white outline-none focus:border-[#6C5CE7] dark:focus:border-indigo-500 transition-colors placeholder:text-gray-400"
               />
               <div className="text-[11px] text-gray-400 mt-1.5 ml-2">{newCatName.length}/30</div>
            </div>

            <div className="mb-5 flex-shrink-0">
               <span className="text-[13px] font-bold text-gray-900 dark:text-white mb-3 block">Warna</span>
               <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                 {colors.map((c: string) => (
                   <button 
                     key={c}
                     onClick={() => setNewCatColor(c)}
                     className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center relative shadow-sm"
                     style={{ backgroundColor: c }}
                   >
                     {newCatColor === c && <div className="absolute inset-x-0 w-full h-full rounded-full border-2 border-white dark:border-[#151721] scale-110" />}
                     {newCatColor === c && <Check size={16} className="text-white drop-shadow-md" />}
                   </button>
                 ))}
               </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 -mx-2 px-2 no-scrollbar">
               <span className="text-[13px] font-bold text-gray-900 dark:text-white mb-3 block">Ikon</span>
               <div className="grid grid-cols-5 gap-3">
                 {kelolaIcons.map((IconRef, idx) => (
                   <button 
                     key={idx}
                     onClick={() => setNewCatIcon(idx)}
                     className={`aspect-square rounded-[14px] flex items-center justify-center transition-colors ${newCatIcon === idx ? 'bg-[#6C5CE7] text-white shadow-md' : 'bg-[#F7F8FA] dark:bg-[#1E202C] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                   >
                     <IconRef size={20} className={newCatIcon === idx ? 'text-white' : ''} />
                   </button>
                 ))}
               </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
               <button 
                 onClick={onClose}
                 className="px-5 py-3 text-[13px] font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
               >
                 Batal
               </button>
               <button 
                 onClick={onSave}
                 disabled={!newCatName.trim()}
                 className="px-6 py-3 bg-[#6C5CE7] hover:bg-indigo-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl text-[13px] font-bold transition-colors shadow-sm disabled:shadow-none"
               >
                 Simpan
               </button>
            </div>
          </div>
        </div>
  );
}

function KelolaKategoriScreen({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<'pengeluaran' | 'pemasukan'>('pengeluaran');
  const [showModal, setShowModal] = useState(false);
  
  const [newCatType, setNewCatType] = useState<'pengeluaran' | 'pemasukan'>('pengeluaran');
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6C5CE7'); 
  const [newCatIcon, setNewCatIcon] = useState(0);

  const pengeluaranCats = [
    { name: 'Belanja Barang/Jasa', icon: ShoppingBag },
    { name: 'Gaji & Upah', icon: Users },
    { name: 'Lain-lain', icon: MoreHorizontal },
    { name: 'Sosial', icon: Heart }, 
    { name: 'Tagihan', icon: Zap },
    { name: 'Transport', icon: Truck },
  ];

  const pemasukanCats = [
    { name: 'Lain-lain', icon: MoreHorizontal },
    { name: 'Modal Masuk', icon: PiggyBank },
    { name: 'Penjualan', icon: Store },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[#F7F8FA] dark:bg-[#0B0C10] overflow-hidden relative">
      <header className="flex items-center p-4 pt-6 pb-2 relative z-20">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-[17px] text-gray-900 dark:text-white ml-2">Kelola Kategori</h1>
      </header>

      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button 
          onClick={() => setTab('pengeluaran')}
          className={`flex-1 py-4 text-[13px] font-bold text-center border-b-2 transition-colors ${tab === 'pengeluaran' ? 'border-[#6C5CE7] text-[#6C5CE7] dark:text-indigo-400 dark:border-indigo-500' : 'border-transparent text-gray-500 dark:text-gray-400'}`}
        >
          Pengeluaran
        </button>
        <button 
          onClick={() => setTab('pemasukan')}
          className={`flex-1 py-4 text-[13px] font-bold text-center border-b-2 transition-colors ${tab === 'pemasukan' ? 'border-[#6C5CE7] text-[#6C5CE7] dark:text-indigo-400 dark:border-indigo-500' : 'border-transparent text-gray-500 dark:text-gray-400'}`}
        >
          Pemasukan
        </button>
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-2">
        <div className="flex flex-col gap-1 mt-2 pb-24">
          {(tab === 'pengeluaran' ? pengeluaranCats : pemasukanCats).map((cat, i) => (
            <div key={i} className="flex items-center gap-4 py-3 px-2">
               <div className="w-12 h-12 rounded-full bg-[#F3F4FF] dark:bg-[#1E202C] flex items-center justify-center shrink-0">
                  <cat.icon size={20} className="text-[#6C5CE7] dark:text-indigo-400" />
               </div>
               <div className="flex flex-col">
                  <span className="font-bold text-[14px] text-gray-900 dark:text-white">{cat.name}</span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">Kategori bawaan</span>
               </div>
            </div>
          ))}
        </div>
      </main>

      <div className="absolute right-6 bottom-8 z-30">
        <button 
          onClick={() => {
            setNewCatType(tab);
            setShowModal(true);
          }}
          className="w-14 h-14 bg-[#6C5CE7] text-white rounded-full flex items-center justify-center hover:bg-indigo-600 transition-all shadow-[0_4px_14px_rgba(108,92,231,0.4)]"
        >
          <Plus size={28} />
        </button>
      </div>

      <AddCategoryModal 
        show={showModal}
        onClose={() => setShowModal(false)}
        type={newCatType}
        setType={setNewCatType}
        newCatName={newCatName}
        setNewCatName={setNewCatName}
        newCatColor={newCatColor}
        setNewCatColor={setNewCatColor}
        newCatIcon={newCatIcon}
        setNewCatIcon={setNewCatIcon}
        onSave={() => setShowModal(false)}
      />
    </div>
  );
}

function KebijakanPrivasiScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col h-full bg-[#10121B] text-gray-100 overflow-hidden relative font-sans">
      <header className="flex items-center gap-3 p-4 pt-6 border-b border-gray-800/50 sticky top-0 bg-[#10121B]/90 backdrop-blur z-10">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-300 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-lg text-white">Kebijakan Privasi</h1>
      </header>

      <main className="px-5 py-6 pb-32 overflow-y-auto w-full flex-1 flex flex-col gap-8">
        
        <section>
          <div className="flex items-center gap-3 mb-4">
             <div className="w-8 h-8 rounded-lg bg-emerald-900/40 flex items-center justify-center border border-emerald-500/20">
                <span className="text-emerald-400 text-xs font-mono">04</span>
             </div>
             <h2 className="font-bold text-[18px] text-white">Keamanan & Penyimpanan</h2>
          </div>
          <p className="text-sm text-gray-400 mb-5 leading-relaxed">
            Kami menerapkan langkah-langkah keamanan berikut untuk melindungi data Anda:
          </p>

          <div className="flex flex-col gap-3">
             <div className="bg-[#181A25] rounded-[16px] p-4 border border-gray-800 flex gap-4">
                <Cloud size={20} className="text-gray-300 shrink-0 mt-1" />
                <div className="flex flex-col gap-1.5">
                   <span className="text-[13px] font-mono text-amber-500">Cloud Sync (Firebase — Asia)</span>
                   <p className="text-[13px] text-gray-400 leading-relaxed">
                     Data tersimpan di server Firebase dengan enkripsi penuh menggunakan TLS/HTTPS saat transmisi dan encryption-at-rest saat penyimpanan.
                   </p>
                </div>
             </div>

             <div className="bg-[#181A25] rounded-[16px] p-4 border border-gray-800 flex gap-4">
                <div className="shrink-0 mt-1 opacity-80 text-lg">📦</div>
                <div className="flex flex-col gap-1.5">
                   <span className="text-[13px] font-mono text-teal-400">Penyimpanan Lokal Terisolasi</span>
                   <p className="text-[13px] text-gray-400 leading-relaxed">
                     Database internal ponsel diproteksi sistem Android dan tidak dapat diakses oleh aplikasi lain. Fitur <code className="text-gray-300 text-xs bg-gray-800 px-1 py-0.5 rounded">allowBackup</code> dinonaktifkan untuk melindungi data keuangan Anda dari backup cloud standar yang kurang aman.
                   </p>
                </div>
             </div>

             <div className="bg-[#181A25] rounded-[16px] p-4 border border-gray-800 flex gap-4">
                <Lock size={20} className="text-amber-400 shrink-0 mt-1" />
                <div className="flex flex-col gap-1.5">
                   <span className="text-[13px] font-mono text-teal-400">Enkripsi PIN</span>
                   <p className="text-[13px] text-gray-400 leading-relaxed">
                     PIN disimpan sebagai hash kriptografi satu arah — bukan teks asli. Bahkan pengembang tidak dapat membaca PIN Anda.
                   </p>
                </div>
             </div>

             <div className="bg-[#181A25] rounded-[16px] p-4 border border-gray-800 flex gap-4">
                <Fingerprint size={20} className="text-pink-400 shrink-0 mt-1" />
                <div className="flex flex-col gap-1.5">
                   <span className="text-[13px] font-mono text-teal-400">Biometrik via Android Keystore</span>
                   <p className="text-[13px] text-gray-400 leading-relaxed">
                     Data biometrik (sidik jari, wajah) diproses sepenuhnya oleh sistem Android dan hardware perangkat. Aplikasi hanya menerima sinyal "berhasil/gagal" tanpa menyimpan data biometrik apapun.
                   </p>
                </div>
             </div>
          </div>

          <div className="bg-amber-900/20 border border-amber-500/20 rounded-[16px] p-4 mt-5 flex gap-3">
             <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
             <p className="text-[13px] text-amber-200/80 leading-relaxed">
               Meskipun kami menerapkan berbagai langkah keamanan, tidak ada sistem yang 100% aman. Kami menyarankan Anda mengaktifkan PIN dan/atau biometrik di aplikasi untuk perlindungan tambahan.
             </p>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
             <div className="w-8 h-8 rounded-lg bg-emerald-900/40 flex items-center justify-center border border-emerald-500/20">
                <span className="text-emerald-400 text-xs font-mono">05</span>
             </div>
             <h2 className="font-bold text-[18px] text-white">Layanan Pihak Ketiga</h2>
          </div>
          <p className="text-sm text-gray-400 mb-5 leading-relaxed">
            Catat-in bekerja sama dengan penyedia berikut yang masing-masing...
          </p>
        </section>
        
      </main>
    </div>
  );
}

function RiwayatTransaksiScreen({ onBack, transactions, initialFilter }: { onBack: () => void, transactions: Transaction[], initialFilter: 'semua' | 'pemasukan' | 'pengeluaran' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'semua' | 'pemasukan' | 'pengeluaran'>(initialFilter);

  const filteredTransactions = transactions
    .filter(t => activeFilter === 'semua' || t.type === activeFilter)
    .filter(t => 
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.note.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="w-full h-full flex flex-col bg-[#F7F8FA] dark:bg-[#0F111A] relative text-gray-900 dark:text-gray-100">
      <header className="flex justify-between items-center p-4 pt-6 pb-2 relative z-20">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors z-10">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-[17px] text-gray-900 dark:text-white absolute left-1/2 -translate-x-1/2">Riwayat Transaksi</h1>
        <button className="p-2 -mr-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors z-10">
          <Plus size={24} />
        </button>
      </header>

      <main className="px-4 pb-32 flex flex-col gap-4 overflow-y-auto w-full flex-1">
        
        {/* Search Bar */}
        <div className="w-full bg-white dark:bg-[#151721] rounded-[16px] px-4 py-3 flex items-center gap-3 border border-gray-200 dark:border-gray-800 focus-within:border-[#6C5CE7] dark:focus-within:border-indigo-500 transition-colors">
          <Search size={20} className="text-gray-400 dark:text-gray-500" />
          <input 
            type="text" 
            placeholder="Cari transaksi..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent w-full outline-none text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveFilter('semua')}
            className={`py-2 px-5 rounded-xl text-[13px] font-medium transition-colors border ${activeFilter === 'semua' ? 'bg-[#151721] text-white border-transparent dark:bg-gray-800' : 'bg-transparent text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
          >
            Semua
          </button>
          <button 
            onClick={() => setActiveFilter('pemasukan')}
            className={`py-2 px-5 rounded-xl text-[13px] font-medium transition-colors border ${activeFilter === 'pemasukan' ? 'bg-[#059669] text-white border-transparent' : 'bg-transparent text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
          >
            Pemasukan
          </button>
          <button 
            onClick={() => setActiveFilter('pengeluaran')}
            className={`py-2 px-5 rounded-xl text-[13px] font-medium transition-colors border ${activeFilter === 'pengeluaran' ? 'bg-[#151721] text-white border-transparent dark:bg-gray-800' : 'bg-transparent text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
          >
            Pengeluaran
          </button>
        </div>

        <span className="text-[11px] text-gray-500 dark:text-gray-400">{filteredTransactions.length} transaksi</span>



        {/* Transaction List */}
        <div className="flex flex-col gap-3 mt-1">
          {filteredTransactions.map(trx => (
            <div key={trx.id} className="bg-white dark:bg-[#202028] rounded-[20px] p-4 flex items-center justify-between border border-gray-100 dark:border-gray-800 shadow-sm">
               <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${trx.type === 'pemasukan' ? 'bg-green-50 dark:bg-emerald-900/20 text-green-500 dark:text-emerald-400' : 'bg-red-50 dark:bg-rose-900/20 text-red-500 dark:text-rose-400'}`}>
                     {trx.type === 'pemasukan' ? <Store size={20} className="text-[#059669] dark:text-emerald-400" /> : <Store size={20} className="text-red-500 dark:text-rose-400" />}
                  </div>
                  <div className="flex flex-col">
                     <span className="font-bold text-[15px] text-gray-900 dark:text-white">{trx.category || 'Transaksi'}</span>
                     <span className="text-[12px] text-gray-500 dark:text-gray-400">{new Date(trx.date).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}, {new Date(trx.createdAt).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
                     {trx.note && <span className="text-[12px] text-gray-500 dark:text-gray-400 italic mt-0.5">{trx.note}</span>}
                  </div>
               </div>
               <div className={`font-bold text-[15px] ${trx.type === 'pemasukan' ? 'text-[#059669] dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                  {trx.type === 'pemasukan' ? '+' : '-'}Rp{trx.amount.toLocaleString('id-ID')}
               </div>
            </div>
          ))}
          {filteredTransactions.length === 0 && (
            <div className="text-center py-10 font-bold text-gray-500 text-sm">Tidak ada transaksi yang cocok</div>
          )}
        </div>
        
        <div className="mt-8 text-center">
            <span className="text-[11px] text-gray-500 dark:text-gray-600">Powered by Install-In</span>
        </div>

      </main>
    </div>
  );
}



function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const savedPin = localStorage.getItem('app_pin');
  const isBiometricEnabled = localStorage.getItem('app_biometric') === 'true';

  useEffect(() => {
    if (isBiometricEnabled) {
      handleBiometric();
    }
  }, []);

  const handleBiometric = async () => {
    try {
      const success = await authenticateBiometric();
      if (success) {
        onUnlock();
      }
    } catch (err) {
      console.error("Biometric failed:", err);
    }
  };

  const handlePinInput = (val: string) => {
    setPinInput(val);
    setErrorMsg('');
    if (val.length === 6) {
      // Delay slightly so the 6th dot renders
      setTimeout(() => {
        const hashed = hashData(val);
        // Fallback backward compatibility for unhashed PINs
        if (hashed === savedPin || val === savedPin) {
          if (val === savedPin) {
            localStorage.setItem('app_pin', hashed);
          }
          onUnlock();
        } else {
          setErrorMsg('PIN salah, silakan coba lagi.');
          setPinInput('');
        }
      }, 150);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#0B0C10] flex flex-col items-center justify-center relative p-5">
      <div className="flex flex-col items-center gap-4 mb-8 text-center">
         <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Lock size={32} className="text-[#6C5CE7] dark:text-indigo-400" />
         </div>
         <h1 className="font-bold text-2xl text-gray-900 dark:text-white">Masukkan PIN</h1>
         <p className="text-sm text-gray-500 dark:text-gray-400">Silakan masukkan PIN Anda untuk membuka CatatIn.</p>
      </div>

      <div className="flex justify-center gap-4 mb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`w-4 h-4 rounded-full transition-colors ${i < pinInput.length ? 'bg-[#6C5CE7]' : 'bg-gray-300 dark:bg-gray-700'}`} />
        ))}
      </div>
      
      <div className="h-6 w-full flex justify-center mb-2">
         {errorMsg && <span className="text-rose-500 text-sm font-bold animate-pulse">{errorMsg}</span>}
      </div>

      <PinNumpad value={pinInput} onChange={handlePinInput} />

      {isBiometricEnabled && (
        <button onClick={handleBiometric} className="mt-10 p-4 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 text-[#6C5CE7] dark:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
          <Fingerprint size={28} />
        </button>
      )}
    </div>
  );
}

export default function App() {
  const [isLocked, setIsLocked] = useState(!!localStorage.getItem('app_pin'));
  const [activeTab, setActiveTab] = useState('beranda');
  const [historyFilter, setHistoryFilter] = useState<'semua' | 'pemasukan' | 'pengeluaran'>('semua');
  const [theme, setTheme] = useState<'sistem' | 'terang' | 'gelap'>('sistem');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isBiometricEnabled, setBiometricEnabled] = useState(localStorage.getItem('app_biometric') === 'true');
  const [pin, setPin] = useState(localStorage.getItem('app_pin') || '');
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('app_transactions');
      if (saved) {
         // Coba dekripsi
         const pin = localStorage.getItem('app_pin') || undefined;
         const decrypted = decryptData(saved, pin);
         if (decrypted) {
            return JSON.parse(decrypted);
         }
         // Fallback ke raw JSON jika belum dienkripsi sebelumnya
         return JSON.parse(saved);
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const pinToUse = pin || undefined;
    const encrypted = encryptData(JSON.stringify(transactions), pinToUse);
    localStorage.setItem('app_transactions', encrypted);
    
    // Sync ke Firebase secara asinkron jika user login
    if (user && transactions.length > 0) {
      syncTransactionsToCloud(user.uid, transactions);
    }
  }, [transactions, user, pin]);

  useEffect(() => {
    let unsubscribeCloud: (() => void) | undefined;
    
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      // Bersihkan listener lama jika ada
      if (unsubscribeCloud) {
        unsubscribeCloud();
        unsubscribeCloud = undefined;
      }
      
      // Jika login, aktifkan real-time sync dari Firestore
      if (currentUser) {
        unsubscribeCloud = subscribeToTransactions(currentUser.uid, (cloudTransactions) => {
          if (cloudTransactions) {
            setTransactions(prev => mergeTransactions(prev, cloudTransactions));
          }
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeCloud) unsubscribeCloud();
    };
  }, []);

  useEffect(() => {
    let mode = theme;
    if (mode === 'sistem') {
      mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'gelap' : 'terang';
    }
    if (mode === 'gelap') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
     if (!user) {
        alert("Silakan login dengan Google (di menu Profil) untuk mengaktifkan sinkronisasi awan.");
        return;
     }
     setIsSyncing(true);
     const success = await syncTransactionsToCloud(user.uid, transactions);
     if (!success) {
        alert("Gagal mengunggah data ke awan. Periksa koneksi internet Anda.");
        setIsSyncing(false);
        return;
     }

     const cloudTransactions = await fetchTransactionsFromCloud(user.uid);
     if (cloudTransactions) {
        setTransactions(prev => mergeTransactions(prev, cloudTransactions));
     }
     setIsSyncing(false);
     alert("Sinkronisasi berhasil!");
  };

  const handleSaveTransaction = (trx: Transaction) => {
    setTransactions(prev => [...prev, trx]);
  };

  if (isLocked) {
    return <LockScreen onUnlock={() => setIsLocked(false)} />
  }

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-950 flex justify-center text-gray-800 dark:text-gray-200 font-sans">
      <div className="w-full max-w-md bg-[#F7F8FA] dark:bg-gray-900 h-screen relative shadow-2xl overflow-hidden flex flex-col transition-colors duration-300">
        
        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'beranda' && <HomeScreen onNavigate={setActiveTab} onFilter={setHistoryFilter} transactions={transactions} kelolaIcons={kelolaIcons} onSync={handleManualSync} isSyncing={isSyncing} />}
          {activeTab === 'laporan' && <LaporanScreen onBack={() => setActiveTab('beranda')} />}
          {activeTab === 'analisis' && <AnalisisScreen onBack={() => setActiveTab('beranda')} />}
          {activeTab === 'profil' && (
            <ProfilScreen 
              onBack={() => setActiveTab('beranda')} 
              onManageCategory={() => setActiveTab('kelola_kategori')} 
              onShowPrivacy={() => setActiveTab('privasi')} 
              theme={theme} 
              setTheme={setTheme} 
              user={user} 
              login={loginWithGoogle} 
              logout={logoutUser} 
              onSync={handleManualSync} 
              isSyncing={isSyncing}
              appPin={pin}
              setAppPin={setPin}
              isBiometricEnabled={isBiometricEnabled}
              setBiometricEnabled={setBiometricEnabled}
              onLockNow={() => setIsLocked(true)}
            />
          )}
          {activeTab === 'catat_transaksi' && <CatatTransaksiScreen onBack={() => setActiveTab('beranda')} onSaveTransaction={handleSaveTransaction} />}
          {activeTab === 'kelola_kategori' && <KelolaKategoriScreen onBack={() => setActiveTab('profil')} />}
          {activeTab === 'riwayat_transaksi' && <RiwayatTransaksiScreen onBack={() => setActiveTab('beranda')} transactions={transactions} initialFilter={historyFilter} />}
          {activeTab === 'privasi' && <KebijakanPrivasiScreen onBack={() => setActiveTab('profil')} />}
        </div>

        {/* Floating Bottom Navigation Container */}
        {activeTab !== 'catat_transaksi' && activeTab !== 'kelola_kategori' && activeTab !== 'riwayat_transaksi' && activeTab !== 'privasi' && (
           <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-center">
           <div className="bg-[#F8F9FE]/95 dark:bg-gray-800/95 backdrop-blur-md rounded-[36px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-none border border-transparent dark:border-gray-700 px-2 py-1.5 w-full flex justify-between items-center relative">
             <button 
               onClick={() => setActiveTab('beranda')}
               className="flex flex-col items-center p-2 min-w-[64px] rounded-2xl transition-colors"
             >
               <Home size={22} className={`mb-1 transition-colors ${activeTab === 'beranda' ? 'text-[#6C5CE7]' : 'text-[#A0AEC0]'}`} />
               <span className={`text-[10px] transition-colors ${activeTab === 'beranda' ? 'text-[#6C5CE7] font-bold' : 'text-[#A0AEC0] font-medium'}`}>Beranda</span>
             </button>
             <button 
               onClick={() => setActiveTab('laporan')}
               className="flex flex-col items-center p-2 min-w-[64px] rounded-2xl transition-colors"
             >
               <FileBarChart size={22} className={`mb-1 transition-colors ${activeTab === 'laporan' ? 'text-[#6C5CE7]' : 'text-[#A0AEC0]'}`} />
               <span className={`text-[10px] transition-colors ${activeTab === 'laporan' ? 'text-[#6C5CE7] font-bold' : 'text-[#A0AEC0] font-medium'}`}>Laporan</span>
             </button>

             {/* Center Spacer for FAB */}
             <div className="w-[64px]"></div>

             <button 
               onClick={() => setActiveTab('analisis')}
               className="flex flex-col items-center p-2 min-w-[64px] rounded-2xl transition-colors"
             >
               <Sparkles size={22} className={`mb-1 transition-colors ${activeTab === 'analisis' ? 'text-[#6C5CE7]' : 'text-[#A0AEC0]'}`} />
               <span className={`text-[10px] transition-colors ${activeTab === 'analisis' ? 'text-[#6C5CE7] font-bold' : 'text-[#A0AEC0] font-medium'}`}>Analisis</span>
             </button>
             <button 
               onClick={() => setActiveTab('profil')}
               className="flex flex-col items-center p-2 min-w-[64px] rounded-2xl transition-colors"
             >
               <User size={22} className={`mb-1 transition-colors ${activeTab === 'profil' ? 'text-[#6C5CE7]' : 'text-[#A0AEC0]'}`} />
               <span className={`text-[10px] transition-colors ${activeTab === 'profil' ? 'text-[#6C5CE7] font-bold' : 'text-[#A0AEC0] font-medium'}`}>Profil</span>
             </button>
             
             {/* FAB (Floating Action Button) overlayed on dock */}
             <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[60%] rounded-full bg-white/50 dark:bg-gray-800/80 p-[5px] backdrop-blur-sm">
               <button 
                  onClick={() => setActiveTab('catat_transaksi')}
                  className="w-[58px] h-[58px] bg-[#6C5CE7] text-white rounded-full flex items-center justify-center hover:bg-indigo-600 hover:scale-105 transition-all shadow-[0_8px_20px_rgba(108,92,231,0.4)] relative">
                 <div className="absolute inset-x-0 w-full h-full rounded-full border border-white/20"></div>
                 <Mic size={26} strokeWidth={2.5} />
               </button>
             </div>
           </div>
         </div>
        )}
      </div>
    </div>
  );
}
