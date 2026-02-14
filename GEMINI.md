# Project Overview

This is a web application for agile project management called "Planning GameXP". It's built with Astro, Lit, and Firebase, and it follows the principles of eXtreme Programming (XP).

## Main Technologies

*   **Frontend:** Astro, Lit (for Web Components)
*   **Backend:** Firebase (Realtime Database, Firestore, Authentication, Cloud Functions, Cloud Messaging)
*   **Build Tool:** Vite (used by Astro)
*   **Testing:** Playwright (for end-to-end tests), Vitest (for unit tests)
*   **Styling:** Global CSS with CSS variables

## Architecture

The application uses a service-oriented architecture with the following key components:

*   **Centralized Services:** For managing permissions, filters, modals, and events.
*   **Event Delegation:** For efficient event handling.
*   **Separation of Responsibilities:** Business logic is separated from presentation.
*   **Design Patterns:** Factory, Observer, and Service-Oriented Architecture.

The main application logic is handled by the `AppController` class (`public/js/controllers/app-controller.js`), which initializes services, manages views, and handles user interactions.

# Building and Running

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/AgilePlanning-io/planning-game-xp.git
    cd planning-game-xp
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables by running `npm run setup` or manually creating `.env.dev`, `.env.pre`, and `.env.pro` from the templates.
4.  Configure Firebase:
    ```bash
    firebase login
    firebase init
    ```

## Development

*   Start the development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:4321`.

*   Run the Firebase emulators:
    ```bash
    npm run emulators
    ```

## Building

*   Build the application for production:
    ```bash
    npm run build
    ```
    The output will be in the `dist` directory.

*   Build the application for pre-production:
    ```bash
    npm run build-preview
    ```

## Testing

*   Run unit tests:
    ```bash
    npm run test
    ```

*   Run end-to-end tests:
    ```bash
    npm run test:e2e
    ```

# Development Conventions

*   **Web Components:** The application uses Lit for creating Web Components, which are located in the `public/js/wc` directory.
*   **Services:** Business logic is encapsulated in services, which are located in the `public/js/services` directory.
*   **Controllers:** Controllers handle user interactions and orchestrate the application's flow. The main controller is `public/js/controllers/app-controller.js`.
*   **Styling:** Global styles are defined in `src/layouts/Layout.astro` using the `<style is:global>` tag. CSS variables are used for theming.
*   **Environment Variables:** The application uses `.env` files for managing environment variables. The `dotenv` package is used to load these variables.
*   **Firebase:** The application is tightly integrated with Firebase. The Firebase configuration is generated dynamically by `scripts/generateFirebaseConfig.js`.
*   **Astro:** The application uses Astro for server-side rendering and as a build tool. The Astro configuration is in `astro.config.mjs`.