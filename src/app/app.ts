import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  category: 'Spożywcze' | 'Rachunki' | 'Dom' | 'Paliwo' | 'Zdrowie' | 'Rozrywka' | 'Przychód';
  amount: number;
  type: 'expense' | 'income';
  paidBy: 'Rafał' | 'Adrianna' | 'Wspólne';
  source: 'GoCardless' | 'Karta' | 'Gotówka' | 'Przelew';
  hasReceipt: boolean;
  status: 'Zaksięgowane' | 'Do weryfikacji' | 'Nowe z banku';
  split: '50/50' | '100% On' | '100% Ona';
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // Theme state
  theme = signal<'light' | 'dark'>('light');
  palette = signal<'sage' | 'emerald' | 'indigo'>('sage');
  density = signal<'spacious' | 'compact'>('spacious');

  // Network info
  localIp = '192.168.1.3';
  localUrl = 'http://192.168.1.3:4200';
  copiedUrl = signal<boolean>(false);

  // Active view tab
  currentTab = signal<'all' | 'table' | 'forms' | 'wife-picker'>('all');

  // Mobile layout state
  mobileCardView = signal<boolean>(true);
  showAddExpenseModal = signal<boolean>(false);

  // Filters for table
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');
  selectedUser = signal<string>('all');
  selectedStatus = signal<string>('all');

  // Form mock models
  newExpense = {
    title: 'Zakupy weekendowe',
    amount: 245.80,
    category: 'Spożywcze',
    date: '2026-10-30',
    paidBy: 'Adrianna',
    splitRatio: '50/50',
    account: 'Konto Wspólne (PKO BP / GoCardless)',
    notes: 'Kupiono zapas chemii i świeże warzywa',
    receiptAttached: true,
    receiptFileName: 'paragon_biedronka_3010.jpg'
  };

  budgetLimit = {
    category: 'Spożywcze',
    limitAmount: 2200,
    currentSpent: 1650,
    alertThreshold: 80,
    enableNotifications: true
  };

  // Mock data
  transactions = signal<Transaction[]>([
    {
      id: 'TX-1001',
      date: '2026-10-30',
      merchant: 'Biedronka',
      category: 'Spożywcze',
      amount: -184.20,
      type: 'expense',
      paidBy: 'Adrianna',
      source: 'GoCardless',
      hasReceipt: true,
      status: 'Do weryfikacji',
      split: '50/50'
    },
    {
      id: 'TX-1002',
      date: '2026-10-29',
      merchant: 'PGNiG Gaz Domowy',
      category: 'Rachunki',
      amount: -340.50,
      type: 'expense',
      paidBy: 'Rafał',
      source: 'Przelew',
      hasReceipt: false,
      status: 'Zaksięgowane',
      split: '50/50'
    },
    {
      id: 'TX-1003',
      date: '2026-10-28',
      merchant: 'Lidl Supermarket',
      category: 'Spożywcze',
      amount: -96.40,
      type: 'expense',
      paidBy: 'Rafał',
      source: 'GoCardless',
      hasReceipt: true,
      status: 'Zaksięgowane',
      split: '50/50'
    },
    {
      id: 'TX-1004',
      date: '2026-10-27',
      merchant: 'Castorama Dom i Ogród',
      category: 'Dom',
      amount: -215.00,
      type: 'expense',
      paidBy: 'Wspólne',
      source: 'Karta',
      hasReceipt: true,
      status: 'Nowe z banku',
      split: '50/50'
    },
    {
      id: 'TX-1005',
      date: '2026-10-26',
      merchant: 'Orlen Stacja Paliw',
      category: 'Paliwo',
      amount: -260.00,
      type: 'expense',
      paidBy: 'Rafał',
      source: 'Karta',
      hasReceipt: true,
      status: 'Zaksięgowane',
      split: '100% On'
    },
    {
      id: 'TX-1006',
      date: '2026-10-25',
      merchant: 'Rossmann Drogeria',
      category: 'Dom',
      amount: -89.90,
      type: 'expense',
      paidBy: 'Adrianna',
      source: 'GoCardless',
      hasReceipt: true,
      status: 'Zaksięgowane',
      split: '50/50'
    },
    {
      id: 'TX-1007',
      date: '2026-10-24',
      merchant: 'PGE Dystrybucja Prąd',
      category: 'Rachunki',
      amount: -198.00,
      type: 'expense',
      paidBy: 'Wspólne',
      source: 'GoCardless',
      hasReceipt: false,
      status: 'Zaksięgowane',
      split: '50/50'
    },
    {
      id: 'TX-1008',
      date: '2026-10-22',
      merchant: 'Apteka DOZ',
      category: 'Zdrowie',
      amount: -64.50,
      type: 'expense',
      paidBy: 'Adrianna',
      source: 'Karta',
      hasReceipt: true,
      status: 'Zaksięgowane',
      split: '50/50'
    },
    {
      id: 'TX-1009',
      date: '2026-10-20',
      merchant: 'Wynagrodzenie / Wpłata',
      category: 'Przychód',
      amount: 8450.00,
      type: 'income',
      paidBy: 'Rafał',
      source: 'Przelew',
      hasReceipt: false,
      status: 'Zaksięgowane',
      split: '100% On'
    },
    {
      id: 'TX-1010',
      date: '2026-10-18',
      merchant: 'Netflix + Spotify Duo',
      category: 'Rozrywka',
      amount: -78.00,
      type: 'expense',
      paidBy: 'Rafał',
      source: 'GoCardless',
      hasReceipt: false,
      status: 'Zaksięgowane',
      split: '50/50'
    }
  ]);

  // Filtered transactions computation
  filteredTransactions = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    const user = this.selectedUser();
    const stat = this.selectedStatus();

    return this.transactions().filter(t => {
      const matchesQuery = !query || 
        t.merchant.toLowerCase().includes(query) || 
        t.id.toLowerCase().includes(query);
      const matchesCat = cat === 'all' || t.category === cat;
      const matchesUser = user === 'all' || t.paidBy === user;
      const matchesStatus = stat === 'all' || t.status === stat;

      return matchesQuery && matchesCat && matchesUser && matchesStatus;
    });
  });

  // Totals
  totalSpent = computed(() => {
    return this.filteredTransactions()
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  });

  totalIncome = computed(() => {
    return this.filteredTransactions()
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  });

  // Switchers
  toggleTheme() {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
  }

  setPalette(p: 'sage' | 'emerald' | 'indigo') {
    this.palette.set(p);
  }

  setDensity(d: 'spacious' | 'compact') {
    this.density.set(d);
  }

  setTab(tab: 'all' | 'table' | 'forms' | 'wife-picker') {
    this.currentTab.set(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  copyNetworkUrl() {
    navigator.clipboard?.writeText(this.localUrl).then(() => {
      this.copiedUrl.set(true);
      setTimeout(() => this.copiedUrl.set(false), 2500);
    });
  }

  onReceiptSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.newExpense.receiptFileName = input.files[0].name;
      this.newExpense.receiptAttached = true;
    }
  }

  removeReceipt() {
    this.newExpense.receiptAttached = false;
    this.newExpense.receiptFileName = '';
  }
}
