# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start Development Server:**
```bash
npm run dev
```

**Build for Production:**
```bash
npm run build
```

**Preview Production Build:**
```bash
npm run preview  
```

**Code Quality:**
```bash
npm run lint      # ESLint with auto-fix
npm run format    # Prettier formatting
```

## Architecture Overview

AC-Work is a Vue.js 3 SPA with Firebase backend for managing field service worker schedules, payroll, and document generation.

**Tech Stack:**
- Vue 3 (Composition API) + Vuetify 3 (Material Design)
- Pinia 2 for state management
- Vue Router 4 with authentication guards
- Firebase (Firestore DB + Anonymous Auth)
- Vite as build tool

**Key Dependencies:**
- `html2canvas` + `jspdf` for PDF document generation
- `date-fns` for date manipulation
- `@vueuse/core` for Vue composition utilities
- `flatpickr` for date picking

## Core Architecture Patterns

**State Management (Pinia Stores):**
- `userStore` (src/stores/user.js): Authentication, localStorage sync, retry logic
- `scheduleStore` (src/stores/schedule.js): CRUD operations for schedules/schedulesMeta collections
- `uiStore` (src/stores/ui.js): Global UI state (snackbars)
- `workerStore` (src/stores/worker.js): Worker list management

**Route Protection:**
- All routes require auth by default via `meta.requiresAuth: true`
- Router guard in src/router/index.js:119 checks localStorage and redirects unauthenticated users to /login

**Firebase Collections:**
- `users`: User profiles (uid, email, name, role)
- `schedules`: Work schedules (building, unit, room, tasks, status, date, memo, invoice, createdBy)  
- `schedulesMeta`: Date-specific metadata (date, startTime, workers[], notice, paidMap)
- `products`: Items for estimates/statements (name, spec, price)

## Document Generation System

**PDF Generation Flow (EstimateForm.vue, StatementForm.vue):**
1. User fills form or selects from Firestore `products` collection
2. `html2canvas` captures Vue component DOM as image
3. `jspdf` inserts captured image into PDF
4. Generated PDF/image downloaded to user

**Critical:** Components must be styled precisely for A4 paper ratio/resolution.

## Authentication Flow

1. LoginView.vue uses Firebase `signInAnonymously` 
2. User credentials verified against Firestore `users` collection
3. User info stored in `userStore` and persisted to localStorage
4. Router guard src/router/index.js:119 enforces authentication

## Development Guidelines

**Path Aliases:**
- Use `@/` for src directory imports

**Component Structure:**
- `<script setup>` with Composition API
- Order: `<template>`, `<script>`, `<style>`
- PascalCase for components (e.g., ScheduleCard.vue)

**Error Handling:**
- scheduleStore includes comprehensive error management with `setError()` and `clearError()`
- userStore has retry logic via `withRetry()` method

## Firebase Configuration

Firebase config located in src/firebase/config.js with project ID `ac-work-ad274`.

**Note:** This uses anonymous authentication - actual user verification happens against Firestore users collection, not Firebase Auth users.