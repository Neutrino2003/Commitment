# TickTick Clone - Frontend

This is the Neo-Brutalist frontend for the TickTick Clone, built with Next.js 15 and Tailwind CSS.

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

3.  **Open in Browser**:
    Navigate to [http://localhost:3000](http://localhost:3000).

## Architecture

-   **Framework**: Next.js 15 (App Router)
-   **Styling**: Tailwind CSS v4 with custom Neo-Brutalist design tokens.
-   **State Management**: TanStack Query (React Query).
-   **API Client**: Axios with JWT interceptors.
-   **Icons**: Lucide React.
-   **Animations**: Framer Motion.

## Design System

The design follows a "Balanced Neo-Brutalist" approach:
-   **Colors**: Focus Yellow (`#FFD700`), Paper White (`#FFFFFF`), Ink Black (`#1A1A1A`).
-   **Shadows**: Hard, directional shadows (`4px 4px 0px 0px`).
-   **Borders**: Thick, solid borders (`3px`).
-   **Typography**: Bold, high-contrast headings.

## Project Structure

-   `app/`: Next.js App Router pages and layouts.
-   `components/`: Reusable UI components.
    -   `dashboard/`: Components specific to the dashboard view.
    -   `layout/`: Global layout components (Sidebar, etc.).
    -   `ui/`: Generic UI primitives (NeoButton, NeoCard).
-   `lib/`: Utilities and API client.
-   `hooks/`: Custom React hooks (e.g., `useTasks`).
