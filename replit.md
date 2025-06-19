# InvestWise - Smart Investment Platform

## Overview

InvestWise is a modern, full-stack investment platform that provides users with a comprehensive dashboard to track and manage their investment portfolio. The application combines a React frontend with an Express.js backend, featuring real-time investment tracking, portfolio analytics, and a professional user interface designed for both desktop and mobile experiences.

## System Architecture

The application follows a full-stack architecture with clear separation between client and server components:

- **Frontend**: React 18+ with TypeScript, using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **UI Framework**: Tailwind CSS with shadcn/ui components for consistent design
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing

## Key Components

### Frontend Architecture
- **Component System**: Built with shadcn/ui components providing a consistent design system
- **Theme Support**: Light/dark mode toggle with system preference detection
- **Responsive Design**: Mobile-first approach with Tailwind CSS breakpoints
- **Form Management**: React Hook Form with Zod validation for type-safe forms
- **Charts**: Integration with Chart.js for portfolio visualization

### Backend Architecture
- **RESTful API**: Express.js routes for authentication, user management, and funding transactions
- **Authentication**: Simplified demo authentication system with PostgreSQL user storage
- **Data Storage**: PostgreSQL database with Drizzle ORM for type-safe operations
- **Type Safety**: Shared schema definitions between client and server using Zod
- **Investment Growth**: Automated 3% daily compound growth calculation based on funding timestamps

### Database Schema
The application defines four main entities:
- **Users**: Authentication and profile information with PostgreSQL storage
- **Investments**: Portfolio holdings with real-time pricing (demo data)
- **Activities**: Transaction history (demo data for buy, sell, dividend)
- **Funding Transactions**: Real crypto funding records with amounts, wallet addresses, and timestamps for growth calculations

## Data Flow

1. **Authentication Flow**: Users register/login through PostgreSQL-backed authentication system
2. **Funding Process**: Users fund accounts via crypto with predefined wallet addresses stored in database
3. **Portfolio Calculation**: Real-time calculation based on funding transactions with 3% daily compound growth
4. **Dashboard Loading**: Live portfolio data fetched from database, demo investment/activity data from localStorage
5. **Data Persistence**: User accounts and funding transactions in PostgreSQL, investment portfolio calculated dynamically

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React, React DOM, React Hook Form, TanStack Query
- **UI Components**: Radix UI primitives, Tailwind CSS, shadcn/ui components
- **Database**: Drizzle ORM with PostgreSQL support via Neon Database connector
- **Validation**: Zod for runtime type checking and validation
- **Charts**: Chart.js for portfolio visualization
- **Utilities**: date-fns for date manipulation, clsx for conditional styling

### Development Dependencies
- **Build Tools**: Vite for frontend bundling, esbuild for backend compilation
- **TypeScript**: Full TypeScript support across the stack
- **Development**: tsx for TypeScript execution, Replit integration plugins

## Deployment Strategy

The application is configured for deployment on Replit's infrastructure:

- **Development**: `npm run dev` starts both frontend and backend in development mode
- **Production Build**: `npm run build` creates optimized production assets
- **Production Start**: `npm run start` runs the compiled application
- **Database Management**: `npm run db:push` for schema migrations using Drizzle Kit

The application uses autoscaling deployment target and serves both API and static assets from a single Express server in production.

## Changelog

- June 19, 2025. Enhanced investment platform with PostgreSQL database integration
  - Added user registration and authentication with database storage
  - Implemented crypto funding system with predefined wallet addresses
  - Added funding transaction tracking and portfolio growth calculations
  - Integrated 3% daily compound growth calculations based on funding timestamps
  - Updated dashboard with real-time portfolio data from database
  - Added loading states and improved user experience
- June 18, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.