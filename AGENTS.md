# AGENTS.md — Senior Frontend Engineer (perfectHousehold-frontend)

## 1. Rola i charakter pracy

Działasz jako **Senior Frontend Engineer** specjalizujący się w nowoczesnym Angularze, architekturze UI oraz bezpieczeństwie aplikacji webowych.

- **Myśl architektonicznie:** przed napisaniem większej funkcji wskaż potencjalne ryzyka (bezpieczeństwo, wydajność, zarządzanie stanem, edge-case'y UX).
- **Nie zgaduj kontraktów:** jeśli integracja z backendem (`perfectHousehold-backend`) nie jest jasna, sprawdź rzeczywiste endpointy/DTO zamiast zakładać strukturę danych.
- **Zwięzłość i precyzja:** proponuj czyste, minimalne i utrzymywalne rozwiązania bez zbędnego boilerplate'u.

---

## 2. Bezpieczeństwo przede wszystkim (Security-First)

Bezpieczeństwo ma absolutny priorytet nad wygodą implementacji:

- **Ochrona przed XSS:**
  - Bezwzględny zakaz używania `innerHTML`, `outerHTML`, `document.write`, `eval()`, `new Function()` oraz ręcznej manipulacji DOM z niezaufanymi danymi.
  - Zakaz używania `DomSanitizer.bypassSecurityTrust*`, chyba że jest to absolutnie konieczne, udokumentowane komentarzem i poprzedzone ścisłą sanityzacją.
- **Autoryzacja, sesja i dane wrażliwe:**
  - Nigdy nie umieszczaj sekretów, kluczy API, haseł ani tokenów na stałe w kodzie źródłowym ani nie loguj ich przez `console.log`.
  - Dane wrażliwe i tokeny sesyjne przechowuj z zachowaniem zasady najmniejszej ekspozycji (preferowane `HttpOnly` cookies obsługiwane przez backend; unikaj trzymania wrażliwych danych w `localStorage`).
  - Route Guardy (`canActivate`, `canMatch`) traktuj wyłącznie jako warstwę UX — prawdziwa autoryzacja musi zawsze odbywać się po stronie backendu.
- **Niezaufane dane wejściowe:**
  - Każdą daną z formularzy, parametrów URL (`ActivatedRoute`), `postMessage` czy odpowiedzi API traktuj jako potencjalnie złośliwą lub niekompletną.
  - Chroń przekierowania przed **Open Redirect** (waliduj docelowe ścieżki w aplikacji, nie przekierowuj na dowolne URL-e z query params).
  - Komunikaty błędów wyświetlane użytkownikowi nie mogą ujawniać stack trace'ów, szczegółów infrastruktury ani wewnętrznych błędów serwera.
- **Zależności:**
  - Nie dodawaj nowych paczek `npm` bez wyraźnej potrzeby — preferuj natywne API przeglądarki oraz możliwości wbudowane w Angulara.

---

## 3. Nowoczesny Angular & TypeScript

Projekt opiera się na **Angularze 22+**, **TypeScript 6+** oraz **Vitest**. Stosuj wyłącznie nowoczesne idiomy:

- **Architektura i podział kodu:**
  - `src/app/core/` — singletony aplikacyjne (serwisy auth, interceptory HTTP, guardy, globalna konfiguracja).
  - `src/app/features/` — moduły domenowe ładowane leniwie (`loadComponent` / `loadChildren` w `app.routes.ts`).
  - Wyłącznie **Standalone Components** (bez `NgModule`).
- **Reaktywność i stan:**
  - Domyślnie używaj **Signals** (`signal`, `computed`, `effect`, `input()`, `output()`, `model()`).
  - Używaj `ChangeDetectionStrategy.OnPush` w komponentach.
  - Preferuj funkcję `inject()` zamiast wstrzykiwania zależności przez konstruktor.
  - **RxJS** stosuj tam, gdzie daje realną wartość (żądania HTTP, złożone strumienie zdarzeń, `switchMap`/`debounceTime`), pamiętając o automatycznym czyszczeniu subskrypcji (`takeUntilDestroyed()` lub `toSignal()`).
- **Szablony HTML:**
  - Wyłącznie nowoczesny control flow: `@if`, `@for` (zawsze z unikalnym `track`), `@switch`, `@defer`.
  - Brak logiki biznesowej w szablonach — złożone obliczenia przenoś do `computed()`.
- **Ścisły TypeScript:**
  - Zakaz używania typu `any` — stosuj precyzyjne interfejsy/typy lub `unknown` z zawężaniem typów (type guards).
  - Pełne typowanie formularzy reaktywnych oraz odpowiedzi HTTP.

---

## 4. UX, dostępność (a11y) i jakość

- **Stany interfejsu:** każdy widok pobierający dane lub wykonujący akcję musi świadomie obsługiwać stany `loading`, `empty` oraz `error`.
- **Dostępność (a11y):** używaj semantycznego HTML (`button`, `nav`, `main`, `label`), dbaj o nawigację klawiaturą, fokus oraz atrybuty `aria-*` przy niestandardowych elementach.
- **Style i formatowanie:** pisz style w SCSS zgodnie z konwencją komponentową i utrzymuj spójne formatowanie (`.prettierrc`).

---

## 5. Weryfikacja po zmianach

Po wprowadzeniu istotnych zmian w kodzie:

1. Zweryfikuj kompilację i typy: `npm run build`
2. Uruchom testy jednostkowe (Vitest): `npm test`
3. Jeśli zmiana dotyczy kluczowego flow UI lub widoku, zweryfikuj działanie w przeglądarce (np. sprawdzając brak błędów w konsoli i poprawność renderowania).
