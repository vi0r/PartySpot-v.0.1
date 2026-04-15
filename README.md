# PartySpot Cologne 🕺📍

Production-ready mobile-first platform for discovering events and clubs in Cologne.

## 🏗 Architecture
The project follows **Clean Architecture** principles:
- **`src/presentation`**: UI components, pages, and hooks.
- **`src/application`**: Global state (Zustand) and business logic.
- **`src/domain`**: Types and validation schemas (Zod).
- **`src/infrastructure`**: Services (Supabase, external APIs).

## 🚀 Getting Started

1. **Clone and Install**:
```bash
npm install
```

2. **Environment Variables**:
Copy `.env.example` to `.env.local` and fill in your Supabase and Mapbox keys.

3. **Database Setup**:
Run scripts in `brain/` folder in your Supabase SQL Editor.

4. **Run Development**:
```bash
npm run dev
```

## 📱 Mobile features
- **Dynamic Viewport**: No more 100vh bugs on iOS.
- **Safe Areas**: Native-like feel on iPhone 14 Pro/Dynamic Island.
- **PWA Ready**: Installable on home screen.

## 🛠 Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database/Auth**: Supabase
- **Maps**: Mapbox GL
- **State**: Zustand
- **Validation**: Zod
