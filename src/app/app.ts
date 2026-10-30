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

export type PresetKey = 'sage' | 'olive' | 'eucalyptus' | 'matcha' | 'pine' | 'custom';
export type HarmonyMode = 'complementary' | 'analogous' | 'split' | 'triadic' | 'monochrome';
export type DarkTint = 'organic' | 'neutral' | 'oled';

export interface PresetDef {
  key: PresetKey;
  name: string;
  subtitle: string;
  hue: number;
  saturation: number;
  harmony: HarmonyMode;
  tag: string;
  dotColor: string;
  accentDotColor: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // Theme state - DARK IS DEFAULT per Adrianna's choice!
  theme = signal<'light' | 'dark'>('dark');
  currentPreset = signal<PresetKey>('sage');
  density = signal<'spacious' | 'compact'>('spacious');

  // Interactive Color Wheel Generator state
  customHue = signal<number>(152); // Sage default: ~152 deg
  customSaturation = signal<number>(38); // Soft muted: ~38%
  customHarmony = signal<HarmonyMode>('complementary');
  darkTint = signal<DarkTint>('organic'); // 'organic' = cozy forest night tint

  // Network info
  localIp = '192.168.1.3';
  localUrl = 'http://192.168.1.3:4200';
  copiedUrl = signal<boolean>(false);
  showNetworkBar = signal<boolean>(false);

  // Active view tab: on mobile it shows one screen at a time
  currentTab = signal<'home' | 'expenses' | 'add' | 'wife-picker' | 'limits' | 'all'>('wife-picker');

  // Mobile layout state
  desktopTableView = signal<boolean>(false);

  // Filters for table
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');
  selectedUser = signal<string>('all');
  selectedStatus = signal<string>('all');

  // 5 Presets inspired by Sage, Nature and Color Theory
  presets: PresetDef[] = [
    {
      key: 'sage',
      name: 'Leśna Szałwia & Len',
      subtitle: 'Klasyczna, uspokajająca zieleń szałwii z terakotowym akcentem. Zwycięzca Ady!',
      hue: 152,
      saturation: 38,
      harmony: 'complementary',
      tag: '⭐ Faworyt Ady',
      dotColor: '#529b71',
      accentDotColor: '#d97736'
    },
    {
      key: 'olive',
      name: 'Ciepła Oliwka & Bursztyn',
      subtitle: 'Głęboka, śródziemnomorska oliwka z ciepłym miodowo-bursztynowym blaskiem.',
      hue: 98,
      saturation: 42,
      harmony: 'complementary',
      tag: 'Ciepły & Przytulny',
      dotColor: '#8a9a4e',
      accentDotColor: '#d98b2b'
    },
    {
      key: 'eucalyptus',
      name: 'Eukaliptus & Cynamon',
      subtitle: 'Chłodniejsza, miękka srebrzysta zieleń z cynamonowo-miedzianym akcentem.',
      hue: 172,
      saturation: 32,
      harmony: 'complementary',
      tag: 'Świeży & Spokojny',
      dotColor: '#4ea193',
      accentDotColor: '#c76e48'
    },
    {
      key: 'matcha',
      name: 'Herbata Matcha & Limonka',
      subtitle: 'Kremowa ziołowa zieleń w harmonii analogicznej z akcentem świeżej mięty.',
      hue: 132,
      saturation: 44,
      harmony: 'analogous',
      tag: 'Organiczna Harmonia',
      dotColor: '#5fa563',
      accentDotColor: '#84cc16'
    },
    {
      key: 'pine',
      name: 'Morski Mech & Koral',
      subtitle: 'Głęboki iglasty odcień mchu połączony z rozproszonym miękkim koralem.',
      hue: 164,
      saturation: 46,
      harmony: 'split',
      tag: 'Głęboki & Szlachetny',
      dotColor: '#3d947b',
      accentDotColor: '#e06c58'
    }
  ];

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

  // Color wheel calculations: Primary Hue & Accent Hue
  calculatedAccentHue = computed(() => {
    const h = this.customHue();
    const mode = this.customHarmony();

    switch (mode) {
      case 'complementary':
        return (h + 180) % 360;
      case 'analogous':
        return (h + 35) % 360;
      case 'split':
        return (h + 150) % 360;
      case 'triadic':
        return (h + 120) % 360;
      case 'monochrome':
        return h;
    }
  });

  // Coordinates on SVG Color Wheel (Radius = 52, Center = 70, 70)
  wheelCoordinates = computed(() => {
    const r = 48;
    const cx = 65;
    const cy = 65;
    
    // Primary dot coordinates
    const pRad = ((this.customHue() - 90) * Math.PI) / 180;
    const px = cx + r * Math.cos(pRad);
    const py = cy + r * Math.sin(pRad);

    // Accent dot coordinates
    const aRad = ((this.calculatedAccentHue() - 90) * Math.PI) / 180;
    const ax = cx + r * Math.cos(aRad);
    const ay = cy + r * Math.sin(aRad);

    return { cx, cy, px, py, ax, ay };
  });

  // Dynamic CSS variables injected on .app-container
  dynamicThemeStyles = computed(() => {
    const h = this.customHue();
    const s = this.customSaturation();
    const ah = this.calculatedAccentHue();
    const isDark = this.theme() === 'dark';
    const tint = this.darkTint();

    if (isDark) {
      // Warm, cozy organic dark mode with sage/earthen undertones
      let bgPage = `hsl(${h}, 18%, 8%)`;
      let bgSurface = `hsl(${h}, 15%, 13%)`;
      let bgSubtle = `hsl(${h}, 16%, 10%)`;
      let bgHover = `hsl(${h}, 14%, 18%)`;
      let border = `hsl(${h}, 12%, 21%)`;

      if (tint === 'neutral') {
        bgPage = '#0f172a';
        bgSurface = '#1e293b';
        bgSubtle = '#141e2e';
        bgHover = '#334155';
        border = '#334155';
      } else if (tint === 'oled') {
        bgPage = '#000000';
        bgSurface = '#121212';
        bgSubtle = '#080808';
        bgHover = '#1f1f1f';
        border = '#2a2a2a';
      }

      return {
        '--primary': `hsl(${h}, ${s + 10}%, 62%)`,
        '--primary-hover': `hsl(${h}, ${s + 10}%, 70%)`,
        '--primary-light': `hsl(${h}, ${Math.min(s, 35)}%, 20%)`,
        '--primary-ring': `hsla(${h}, ${s}%, 62%, 0.25)`,
        '--accent': `hsl(${ah}, ${Math.min(s + 20, 85)}%, 64%)`,
        '--accent-light': `hsl(${ah}, ${Math.min(s, 35)}%, 22%)`,
        '--bg-page': bgPage,
        '--bg-surface': bgSurface,
        '--bg-subtle': bgSubtle,
        '--bg-hover': bgHover,
        '--border': border,
        '--text-main': '#f8fafc',
        '--text-muted': `hsl(${h}, 10%, 72%)`,
        '--table-stripe': `hsl(${h}, 15%, 11%)`,
        '--chip-bg': `hsl(${h}, 14%, 17%)`,
      };
    } else {
      // Light Mode with soft linen/sage warmth
      return {
        '--primary': `hsl(${h}, ${s}%, 30%)`,
        '--primary-hover': `hsl(${h}, ${s}%, 24%)`,
        '--primary-light': `hsl(${h}, ${s}%, 93%)`,
        '--primary-ring': `hsla(${h}, ${s}%, 30%, 0.25)`,
        '--accent': `hsl(${ah}, ${Math.min(s + 15, 85)}%, 48%)`,
        '--accent-light': `hsl(${ah}, 40%, 94%)`,
        '--bg-page': `hsl(${h}, 15%, 98%)`,
        '--bg-surface': '#ffffff',
        '--bg-subtle': `hsl(${h}, 15%, 94%)`,
        '--bg-hover': `hsl(${h}, 15%, 90%)`,
        '--border': `hsl(${h}, 12%, 87%)`,
        '--text-main': '#0f172a',
        '--text-muted': '#64748b',
        '--table-stripe': `hsl(${h}, 10%, 97%)`,
        '--chip-bg': `hsl(${h}, 12%, 93%)`,
      };
    }
  });

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

  // Recent 3 transactions for home screen
  recentTransactions = computed(() => {
    return this.transactions().slice(0, 3);
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

  // Apply a preset
  selectPreset(preset: PresetDef) {
    this.currentPreset.set(preset.key);
    this.customHue.set(preset.hue);
    this.customSaturation.set(preset.saturation);
    this.customHarmony.set(preset.harmony);
  }

  // Set custom slider
  onHueChange(hue: number) {
    this.customHue.set(Number(hue));
    this.currentPreset.set('custom');
  }

  onSaturationChange(sat: number) {
    this.customSaturation.set(Number(sat));
    this.currentPreset.set('custom');
  }

  setHarmony(mode: HarmonyMode) {
    this.customHarmony.set(mode);
    this.currentPreset.set('custom');
  }

  setDarkTint(tint: DarkTint) {
    this.darkTint.set(tint);
  }

  // Roll dice for an earthy harmonized nature theme
  randomizeEarthyTheme() {
    // Earthy green/botanical hues: 80° (olive) to 180° (teal/sea moss)
    const earthHues = [88, 98, 115, 128, 142, 152, 160, 168, 175];
    const randomHue = earthHues[Math.floor(Math.random() * earthHues.length)];
    const randomSat = Math.floor(Math.random() * 25) + 30; // 30% - 55%
    const harmonies: HarmonyMode[] = ['complementary', 'analogous', 'split'];
    const randomHarmony = harmonies[Math.floor(Math.random() * harmonies.length)];

    this.customHue.set(randomHue);
    this.customSaturation.set(randomSat);
    this.customHarmony.set(randomHarmony);
    this.currentPreset.set('custom');
  }

  // Switchers
  toggleTheme() {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
  }

  setDensity(d: 'spacious' | 'compact') {
    this.density.set(d);
  }

  setTab(tab: 'home' | 'expenses' | 'add' | 'wife-picker' | 'limits' | 'all') {
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
