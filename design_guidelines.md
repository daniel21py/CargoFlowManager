# Design Guidelines: TMS Webapp Gestionale

## Design Approach
**Selected System:** Material Design (adapted for enterprise logistics)
**Rationale:** Information-dense logistics management requires clear hierarchy, excellent readability, and proven interaction patterns for data tables, forms, and drag & drop interfaces.

## Core Design Principles
1. **Data Clarity First:** Every interface optimized for quick scanning and data entry
2. **Workflow Efficiency:** Minimal clicks between common tasks
3. **Professional Simplicity:** Clean, business-appropriate aesthetic without unnecessary decoration
4. **Spatial Consistency:** Predictable layouts that build user confidence

---

## Typography

**Font Family:** 
- Primary: Inter (via Google Fonts CDN)
- Fallback: system-ui, -apple-system, sans-serif

**Type Scale:**
- Page Titles: text-2xl font-semibold (24px)
- Section Headers: text-lg font-semibold (18px)
- Table Headers: text-sm font-medium uppercase tracking-wide
- Body/Data: text-base (16px)
- Labels: text-sm font-medium (14px)
- Helper Text: text-xs (12px)

---

## Layout System

**Spacing Units:** Tailwind units 2, 4, 6, 8, 12
- Form field gaps: gap-4
- Section padding: p-6 or p-8
- Card padding: p-6
- Table cell padding: px-4 py-3
- Button padding: px-4 py-2

**Container Strategy:**
- Main content area: max-w-7xl mx-auto with px-6
- Sidebar (anagrafiche lists): w-80 fixed left
- Content area: ml-80 for main working space
- Modal/Form overlays: max-w-2xl

**Grid Patterns:**
- Anagrafica cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Form fields: Two-column layout (grid-cols-2 gap-4) for related data pairs
- Drag & drop columns: Flexible grid based on number of giri (typically 3-5 columns)

---

## Component Library

### Navigation
- **Top Bar:** Full-width header with logo, current page title, user info, logout
- **Side Navigation:** Fixed left sidebar with icon+text menu items (Dashboard, Spedizioni, Giri, Anagrafiche dropdown, Pianificazione)
- Active states: Solid background with accent indication

### Data Tables
- **Structure:** Clean rows with alternating subtle backgrounds, sticky header row
- **Columns:** Left-aligned text, right-aligned numbers, centered icons/badges
- **Actions:** Icon buttons on row hover (edit, delete) or kebab menu for multiple actions
- **Badges:** Status indicators (INSERITA, ASSEGNATA, etc.) as rounded pills with semantic backgrounds

### Forms
- **Input Fields:** Full-width with floating labels or top labels, clear focus states with border accent
- **Required Fields:** Asterisk indicator on label
- **Field Groups:** Related fields in bordered cards with subtle background
- **Buttons:** Primary action (solid), secondary (outlined), danger (for delete)
- **Layout:** Logical grouping with consistent spacing, clear visual hierarchy

### Drag & Drop Interface (Pianificazione)
- **Column Design:** Vertical sections with header showing autista/turno info, capacity indicators
- **Cards:** Each spedizione as draggable card showing numero, cliente, città, colli, peso
- **Dragging State:** Subtle elevation shadow, slight opacity, smooth transitions
- **Drop Zones:** Clear visual feedback with dashed borders or background highlighting
- **Empty State:** Helpful message "Trascina spedizioni qui" in empty giro columns

### Modals/Dialogs
- **Overlay:** Semi-transparent backdrop
- **Dialog:** Centered, max-w-2xl, elevated shadow, clear close button
- **Form Modals:** Title, form fields, action buttons footer (Annulla/Salva)

### Anagrafiche Lists
- **List View:** Card-based with key information visible, click to edit
- **Quick Actions:** Edit/delete icons on card hover
- **Add Button:** Prominent floating action button or header button "Nuovo Cliente/Autista/Mezzo"

### Filters & Search
- **Search Bar:** Prominent with icon, placeholder text
- **Date Picker:** Calendar input for data selection
- **Dropdown Filters:** Clear labels, multi-select capability where needed
- **Applied Filters:** Visible chips with remove option

---

## Interaction Patterns

**Feedback:**
- Success notifications: Toast/snackbar top-right, auto-dismiss after 3s
- Error messages: Inline below field or alert banner
- Loading states: Spinner overlay for full-page, skeleton for partial updates

**Hover States:**
- Table rows: Subtle background change
- Buttons: Slight darkening/lightening
- Draggable cards: Cursor change + subtle elevation

**Focus Management:**
- Clear focus rings on all interactive elements
- Tab order follows logical flow
- Auto-focus first field in modals

---

## Specific Screen Layouts

**Login:** Centered card on neutral background, logo, username/password fields, login button

**Dashboard/Home:** Summary cards showing oggi's stats (spedizioni da assegnare, giri attivi, etc.), quick actions

**Spedizioni List:** Search/filter bar, table view with columns (numero, data, cliente, destinatario, stato, azioni)

**Nuova Spedizione Form:** Two-column layout, grouped sections (Dati Cliente, Dati DDT, Destinatario, Dettagli Spedizione)

**Pianificazione Giornaliera:** Date/turno selector at top, horizontal scrollable columns for each giro plus "Non Assegnate" column on left

**Anagrafiche:** List view with cards, add button, modal forms for create/edit

---

## Icons
**Library:** Heroicons (via CDN)
- Navigation icons (truck, users, clipboard-list, calendar)
- Action icons (plus, pencil, trash, check, x)
- Status indicators (clock, truck-loading, check-circle, exclamation)