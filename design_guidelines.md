# Micro-Vendor Ledger - Design Guidelines

## 1. Brand Identity

**Purpose**: Enable micro-vendors to track sales, expenses, and customer credit without internet dependency. Built for speed, reliability, and clarity in fast-paced market environments.

**Aesthetic Direction**: **Organic/trust-building** - Earthy, grounded, and reliable. Like a well-worn physical ledger book translated to digital. Warm tones, generous spacing, and high-contrast typography that's readable in bright sunlight.

**Memorable Element**: The app uses a **paper texture background** on key screens, visually reinforcing the concept of a traditional ledger while remaining digital. Large, bold numerals for amounts create instant readability during rushed transactions.

## 2. Navigation Architecture

**Root Navigation**: Tab Bar (3 tabs)
- **Sales** (left): Record new transactions
- **Ledger** (center): Customer credit tracking
- **Inventory** (right): Product management

**Screen List**:
1. Sales Screen - Quick transaction entry, recent sales list
2. Transaction Detail - View/edit individual transaction
3. Ledger Screen - List of customers with outstanding balances
4. Customer Ledger Detail - Individual customer transaction history
5. Add Customer - Create new credit customer
6. Inventory Screen - Product catalog
7. Add/Edit Product - Product form
8. Settings - Profile, preferences, data export

## 3. Screen-by-Screen Specifications

### Sales Screen
- **Header**: Transparent, title "Sales", right button "Filter" icon
- **Layout**: Scrollable (top inset: headerHeight + 24)
- **Floating Action Button**: Large circular "+" button (bottom-right, bottom inset: tabBarHeight + 24)
- **Components**:
  - Today's total revenue card (prominent at top, shows total income/expense)
  - Transaction list (grouped by date, each showing product, amount, type badge)
  - Empty state: "No sales recorded" with cash register illustration
- **Safe Area**: Top: headerHeight + 24, Bottom: tabBarHeight + 24

### Transaction Detail (Modal)
- **Header**: Non-transparent, title "Transaction", left "Close" button
- **Layout**: Scrollable form (top inset: 24)
- **Components**:
  - Amount (large, prominent)
  - Product selector (dropdown or null for manual)
  - Type toggle (IN/OUT with color indicators)
  - Timestamp
  - Delete button (destructive, at bottom)
- **Safe Area**: Top: 24, Bottom: insets.bottom + 24

### Ledger Screen
- **Header**: Transparent, title "Customer Ledger", right "Search" icon
- **Layout**: List (top inset: headerHeight + 24)
- **Floating Action Button**: "Add Customer" (bottom-right, bottom inset: tabBarHeight + 24)
- **Components**:
  - Customer cards (name, phone, total owed with color coding: red if owed, green if clear)
  - Empty state: "No customers" with notebook illustration
- **Safe Area**: Top: headerHeight + 24, Bottom: tabBarHeight + 24

### Customer Ledger Detail
- **Header**: Non-transparent, customer name as title, left "Back", right "Edit"
- **Layout**: Scrollable (top inset: 24)
- **Components**:
  - Summary card (total owed, phone)
  - Transaction history list (chronological, shows date/amount/running balance)
  - "Record Payment" button (sticky at bottom)
- **Safe Area**: Top: 24, Bottom: insets.bottom + 24

### Add Customer (Modal)
- **Header**: Non-transparent, title "New Customer", left "Cancel", right "Save"
- **Layout**: Scrollable form (top inset: 24)
- **Components**: Name field, phone field, initial balance field
- **Safe Area**: Top: 24, Bottom: insets.bottom + 24

### Inventory Screen
- **Header**: Transparent, title "Products", right "Search" icon
- **Layout**: Grid (2 columns, top inset: headerHeight + 24)
- **Floating Action Button**: "Add Product" (bottom-right, bottom inset: tabBarHeight + 24)
- **Components**:
  - Product cards (icon, name, default price)
  - Empty state: "No products" with box illustration
- **Safe Area**: Top: headerHeight + 24, Bottom: tabBarHeight + 24

### Add/Edit Product (Modal)
- **Header**: Non-transparent, title "Product", left "Cancel", right "Save"
- **Layout**: Scrollable form (top inset: 24)
- **Components**: Name field, price field, icon picker (grid of preset icons)
- **Safe Area**: Top: 24, Bottom: insets.bottom + 24

### Settings
- **Header**: Transparent, title "Settings"
- **Layout**: Scrollable (top inset: headerHeight + 24)
- **Components**:
  - Profile section (avatar, display name)
  - Export data button
  - Theme toggle
  - About/version info
- **Safe Area**: Top: headerHeight + 24, Bottom: tabBarHeight + 24

## 4. Color Palette

- **Primary**: #D97706 (Warm amber - trustworthy, earthy)
- **Background**: #FFFBF5 (Warm off-white, paper-like)
- **Surface**: #FFFFFF (Cards, modals)
- **Text Primary**: #1F2937 (Dark gray)
- **Text Secondary**: #6B7280 (Medium gray)
- **Income**: #059669 (Forest green)
- **Expense/Debt**: #DC2626 (Deep red)
- **Border**: #E5E7EB (Light gray)

## 5. Typography

- **Primary Font**: Nunito (Google Font) - friendly, highly readable
- **Secondary Font**: System default for numerals
- **Type Scale**:
  - Display (amounts): 48pt, Bold
  - H1 (screen titles): 28pt, Bold
  - H2 (section headers): 20pt, SemiBold
  - Body: 16pt, Regular
  - Caption: 14pt, Regular

## 6. Assets to Generate

1. **icon.png** - App icon showing stylized ledger book with amber accent
2. **splash-icon.png** - Simplified ledger icon for launch screen
3. **empty-sales.png** - Minimalist cash register illustration (Sales screen empty state)
4. **empty-ledger.png** - Open notebook illustration (Ledger screen empty state)
5. **empty-inventory.png** - Stacked boxes illustration (Inventory screen empty state)
6. **avatar-vendor.png** - Default user avatar (Settings profile, warm earth tones)
7. **product-icon-generic.png** - Default product icon (used when no icon selected)
8. **product-icon-set** (8 variations) - Food, drink, tool, clothing, electronics, service, misc icons (Product icon picker)