# Micro-Vendor Ledger

A mobile-first ledger application designed for micro-vendors to track sales, expenses, and customer credit with offline-first persistence.

## 🚀 Features

- **One-Tap Sales Engine**: 3x3 grid of large, high-contrast cards for instant sale recording.
- **Expense Mode**: Toggle between Income and Expense tracking with visual feedback.
- **Credit Ledger (Udhaar)**: Manage customer debts and send balance reminders via WhatsApp.
- **Business Health Dashboard**: Real-time profit/loss insights with daily trends.
- **Data Safety**: Local SQLite storage for 100% offline functionality with cloud backup support.
- **Liquid Glass UI**: Modern iOS 26+ inspired interface with fluid animations and haptic feedback.

## 🛠 Tech Stack

- **Frontend**: React Native (Expo SDK 54)
- **Navigation**: React Navigation v7
- **Database**: 
  - Local: SQLite via `expo-sqlite`
  - Server: PostgreSQL with Drizzle ORM (for sync)
- **State Management**: TanStack React Query & Local React State
- **Animations**: React Native Reanimated
- **Backend**: Express.js (v5)

## 📂 Project Structure

- `client/`: React Native mobile application code.
  - `components/`: Reusable UI components.
  - `screens/`: Application screens (Sales, Ledger, Inventory, Health).
  - `lib/repositories/`: Data access layer using Repository pattern.
- `server/`: Express backend serving APIs and landing page.
- `shared/`: Shared types and database schemas.

## 🏁 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Application**:
   - Backend: `npm run server:dev`
   - Frontend: `npm run expo:dev`

3. **Test on Device**:
   Scan the QR code from the Expo dev server using the Expo Go app.

## 📱 Design Principles

- **Mobile First**: Optimized for one-handed operation in fast-paced market environments.
- **Accessibility**: High-contrast typography and large touch targets.
- **Data Integrity**: WAL mode enabled in SQLite for reliable local persistence.
