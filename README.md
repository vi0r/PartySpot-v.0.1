# PartySpot: Cologne Nightlife Reimagined 🕺📍

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stack: Next.js 14](https://img.shields.io/badge/Stack-Next.js%2014-black)](https://nextjs.org/)
[![Database: Supabase](https://img.shields.io/badge/Database-Supabase-green)](https://supabase.com/)

PartySpot is a premium, mobile-first social discovery platform designed to help people find the best parties, clubs, and events in Cologne. It's more than just an event calendar; it's a full ecosystem for nightlife enthusiasts.

---

## 🌟 Key Features

### 1. Interactive Heatmap (Mapbox)
Visualize all clubs and ongoing events on a custom-styled, lag-free map of Cologne. Find the hottest spots at a glance.

### 2. Social Networking & Networking
- **Public Profiles:** Personalized pages for every user.
- **Friend System:** Seamless friend requests and management.
- **Who's Going:** See who else is attending an event and find your squad before you head out.

### 3. Real-time In-App Messenger
Instant messaging powered by Supabase Realtime. Features heartbeat connection monitoring, message status indicators, and keyboard-aware layout optimization for mobile.

### 4. Vibe-Check Feed ("Reels")
A TikTok-style feed of short videos and photos from venues, allowing you to feel the "vibe" before you arrive.

### 5. Premium Mobile UX
- Optimized for **Safe Areas** (iPhone Dynamic Island, etc.).
- Robust **Onboarding** flows.
- **PWA Ready**: Installable on home screens for a native feel.

---

## 🏗 Technical Architecture

The project follows **Clean Architecture** principles to ensure scalability and maintainability:

- **`src/presentation`**: React components, Next.js pages, and UI hooks.
- **`src/application`**: Global state management (Zustand) and business logic.
- **`src/domain`**: Core entities, TypeScript types, and Zod validation schemas.
- **`src/infrastructure`**: External services (Supabase clients, Mapbox integration).

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database/Auth**: Supabase (PostgreSQL + Realtime)
- **State**: Zustand
- **Animations**: Framer Motion
- **Native Bridge**: Capacitor (iOS/Android)

---

## 🚀 Getting Started

1. **Clone and Install**:
```bash
git clone https://github.com/vi0r/partyspot.git
cd partyspot
npm install
```

2. **Environment Variables**:
Copy `.env.example` to `.env.local` and add your keys:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN`

3. **Database Setup**:
Execute the scripts in `supabase/scripts/` in your Supabase SQL Editor to set up tables, RLS policies, and triggers.

4. **Run Development**:
```bash
npm run dev
```

---

## 🇷🇺 Описание на русском

**PartySpot** — это современная мобильная платформа и социальная сеть для поиска лучших вечеринок и ночных клубов Кёльна.

**Основные возможности:**
- **Интерактивная карта (Mapbox):** Быстрый поиск заведений и событий на карте города.
- **Социальные функции:** Профили пользователей, система друзей и нетворкинг ("Кто идет?").
- **Real-time Мессенджер:** Мгновенный чат на базе Supabase Realtime.
- **Лента "Reels":** Просмотр атмосферы заведений через короткие видео.
- **Премиальный UX:** Полная адаптация под мобильные устройства и Safe Areas.

---

## ⚖️ License
Distributed under the MIT License. See `LICENSE` for more information.
