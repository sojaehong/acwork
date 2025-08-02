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

## Project Memories

- 앞으로 모든 작업은 SUPERCLAUDE_GUIDE.md 보고 작업 단계마다 항상 백분 활용해서 작업해

## 🚀 SuperClaude Framework Integration

**CRITICAL**: Always utilize SuperClaude v3 framework for ALL development tasks in this project.

### Framework Components Available:
- **19 Professional Commands**: `/build`, `/implement`, `/analyze`, `/improve`, `/troubleshoot`, `/test`, etc.
- **9 Cognitive Personas**: architect, frontend, backend, analyzer, security, mentor, refactorer, performance, qa, devops, scribe
- **4 MCP Server Integration**: Context7, Sequential, Magic, Playwright
- **Wave Orchestration System**: Multi-stage execution with compound intelligence
- **Advanced Flag System**: 50+ optimization flags for enhanced performance

### Mandatory Usage Patterns:

#### For Development Tasks:
```bash
# Component/Feature Implementation
/implement [feature] --magic --c7 --persona-frontend --plan

# API/Backend Development  
/implement [api] --seq --persona-backend --validate

# Bug Analysis & Fixes
/troubleshoot [issue] --think --seq --persona-analyzer

# Performance Optimization
/improve --focus performance --persona-performance --think-hard
```

#### For Large-Scale Operations:
```bash
# System Analysis
/analyze @src/ --ultrathink --all-mcp --persona-architect --wave-mode auto

# Major Refactoring
/improve @project --wave-strategy enterprise --delegate auto --validate

# Quality Improvement (Iterative)
/improve --loop --iterations 5 --persona-refactorer --interactive
```

#### Auto-Activation Triggers:
- **Wave System**: complexity ≥0.7 + files >20 + operation_types >2
- **Sub-Agent Delegation**: >7 directories OR >50 files OR complexity >0.8  
- **Persona Selection**: Keyword-based with 75-95% confidence thresholds
- **Token Optimization**: `--uc` auto-activates when context >75%

### Project-Specific Optimizations:
- Vue 3 + Vuetify: Use `--persona-frontend --magic --c7` for UI components
- Firebase Integration: Use `--persona-backend --seq` for database operations
- PDF Generation: Use `--persona-frontend --validate` for document rendering
- State Management: Use `--persona-architect --think` for Pinia store modifications

### Quality Gates (Always Apply):
1. **Planning Phase**: Use `--plan` for complex operations
2. **Validation**: Use `--validate` for critical changes  
3. **Testing**: Use `--test --play` for E2E validation
4. **Documentation**: Use `--persona-scribe=ko` for Korean docs
5. **Performance**: Monitor with `--focus performance` flags

**Reference**: See SUPERCLAUDE_GUIDE.md for complete framework documentation.

**Enforcement**: Every development task MUST leverage appropriate SuperClaude commands, personas, and optimization strategies.