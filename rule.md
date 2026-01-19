# Project Phases

## Phase 1: Environment & Local Data Architecture
- [x] Initialize project
- [x] Local database schema (Products, Transactions, Ledger)
- [x] Repository layer for CRUD operations
- Current Status: COMPLETED

## Phase 2: The "Big Icon" Sales Engine
- [x] Sales Dashboard (3x3 grid)
- [x] Tapping records sale, haptic feedback, checkmark animation
- [x] Quick Amount keypad
- [x] Recent Activity list
- Current Status: COMPLETED

## Phase 3: The Expense & Credit (Udhaar) Module
- [x] "Expense Mode" toggle (UI turns Red, records OUT)
- [x] Credit Ledger (Udhaar) screen
- [x] WhatsApp balance reminder integration
- [x] Credit transactions update Ledger table
- Current Status: COMPLETED

## Phase 4: Financial Health Dashboard & Backup
- [x] Business Health screen
- [x] Daily Profit calculation (Sales - Expenses)
- [x] Profit trend visual indicator (Up/Down Arrow)
- [x] Data Safety (Backup) button with sync simulation
- Current Status: COMPLETED

# Technical Debt
- Sync service is currently simulated; real integration with Firebase/Supabase pending keys.
- Analytics over longer periods (monthly/yearly) could be added.

## Phase 5: Voice Logic (Current)
- **STT Engine:** Native Device STT (with Sarvam AI API ready for production)
- **Supported Phrases:** [Amount] + [Product Name] in Hindi/English
  - Examples: "Dus rupaye ka chai", "Coffee 20 rupees", "Samosa bees taka"
- **State Logic:** Record -> Parse -> Confirm -> Transaction Write
- **Parser Location:** `client/lib/voice-parser.ts`
- **Component Location:** `client/components/VoiceInputButton.tsx`
- **Parsing Logic:**
  - Regex-based number extraction (supports Hindi numerals: ek, do, teen, dus, bees, etc.)
  - Product name matching against existing Products table (fuzzy matching)
  - Transaction type detection via keywords (becha/sale vs kharcha/expense)
  - Confidence score calculation (0-1 scale)
- **Confirmation Loop:** 
  - TTS speaks: "Adding ₹X for [Product]. Confirm?"
  - Modal shows giant Green Checkmark for confirmation
  - Low confidence (<0.3) shows "Try Again" icon
- **Current Status:** IMPLEMENTED
- **Next Phase:** Optimization & Beta Testing

## Context Lock
- **Active Constraints:** Offline-first remains priority. Voice requires data (unless using Native).
- **Recent Refactor:** Voice input now triggers the same 'Transaction' logic as the Icon grid.
- **Voice Integration:** VoiceInputButton added to SalesScreen between Quick Sale grid and Quick Amount keypad.