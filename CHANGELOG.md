# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.120.0] - 2026-02-17

### Added

- **Prompt Persistence in Tasks Generator**: Auto-save draft with 2s debounce, restore on reload/project switch, save/load/rename/delete named prompts per user and project in RTDB

## [1.119.1] - 2026-02-17

### Added

- Unit test coverage expansion for utility modules (email-sanitizer, workday-utils, cache-manager, developer-normalizer) - 142 new tests

## [1.119.0] - 2026-02-17

### Added

- **Changelog Modal**: Version badge in footer is now a clickable button that opens a modal displaying the full project changelog with formatted sections and styles

## [1.118.1] - 2026-02-17

### Fixed

- **Dark Mode in Tasks Generator**: Removed ThemeVariables from AiDocumentUploader shadow DOM to fix dark mode. CSS variables now correctly inherit from `:root` where ThemeManagerService sets dark values

## [1.118.0] - 2026-02-17

### Added

- **Tasks Generator**: Renamed "Uploads" tab to "Tasks Generator" with dual input modes
- **Text Input Mode**: New textarea option for generating tasks/bugs from plain text (in addition to document upload)
- **Input Mode Toggle**: Switch between "Write text" and "Upload document" within the Tasks Generator section

### Changed

- **Tab Naming**: "Uploads" → "Tasks Generator" across all references (adminproject, app-controller)
- **Button Text**: "Generar Cards" → "Generar tareas" for clarity
- **CSS Variables**: Replaced all hardcoded colors in AiDocumentUploader with theme-aware CSS variables

## [1.117.8] - 2026-02-17

### Removed

- **Tickets Section**: Removed unauthorized Tickets section that was not properly scoped for current permissions

## [1.117.7] - 2026-02-16

### Changed

- Pre-build configuration updates and version management improvements

## [1.2.0] - Q3 2025

### Added

- **Architectural Refactoring**: Complete refactoring to improve code sustainability and maintainability
- **Event Delegation System**: Centralized event management system replacing scattered event listeners
- **Permission Service**: Centralized permission management eliminating code duplication across components
- **Filter Service**: Generic filtering system that eliminates duplication between TaskFilters, BugFilters, etc.
- **Modal Service**: Centralized modal management with stacking, confirmation, and form modals
- **Integration Service**: Migration service to seamlessly integrate existing components with new services

### Changed

- **Event Handling**: Migrated from individual event listeners to event delegation pattern for better performance
- **Code Structure**: Separated responsibilities using service-oriented architecture with dependency injection
- **Permission Logic**: Consolidated permission checks from multiple components into single service
- **Filter Management**: Unified filter logic across all card types with configurable filter types
- **Modal Creation**: Standardized modal creation and management across the application
- **App Controller**: Refactored to use new services with cleaner separation of concerns

### Fixed

- **Code Coupling**: Eliminated tight coupling between components using service layer
- **Event Memory Leaks**: Improved event cleanup with centralized delegation system
- **Permission Inconsistencies**: Unified permission logic ensuring consistent behavior
- **Code Duplication**: Removed repetitive patterns across filter components and permission checks
- **Modal Management**: Fixed modal stacking and cleanup issues with centralized service

### Technical Improvements

- **Factory Patterns**: Implemented for card creation and filtering to reduce repetition
- **Observer/Mediator Patterns**: For better component communication and decoupling
- **Template Method Pattern**: To eliminate code duplication in similar operations
- **Service Layer**: Clean separation between business logic and UI components
- **Event System**: Robust event delegation with priority handling and cleanup
- **Performance**: Reduced memory usage and improved event handling efficiency

## [1.1.0] - Q2 2025

### Added

- **Project Management System**: Complete project management system with admin permissions
- **Comprehensive Notification System**: Real-time notifications using Firebase Realtime Database
- **Developer Select Improvements**: Name-to-email mapping for developers and stakeholders
- **Notification Display Optimization**: Limited read notifications display (max 5) while maintaining all unread
- **Point Recalculation System**: Automatic point recalculation when scoring system changes
- **Stakeholder Management**: Enhanced stakeholder management with both name and email support
- **Project-specific Stakeholder Loading**: Dynamic loading of stakeholders per project

### Changed

- **Notification Bell**: Now limits displayed read notifications to 5 most recent
- **Validator Select**: Updated to use project-specific stakeholders with proper name display
- **TaskCard**: Added project-specific stakeholder loading and name-to-email mapping
- **ProjectForm**: Enhanced to support both name and email input for stakeholders

### Fixed

- **Object Display Issue**: Fixed "[object Object]" display in validator select
- **Stakeholder Loading**: Fixed defensive programming for both array and object stakeholder formats
- **Notification Overflow**: Prevented infinite notification lists while preserving all data
- **Merge Conflicts**: Successfully resolved conflicts during branch merge
- **Data Migration**: Backward compatibility for existing Firebase data structures

## [1.0.0] - Q1 2025

### Added

- **Firebase Storage Integration**: File upload functionality for attachments
- **Notification Bell Component**: Real-time notification system with push notifications
- **Project Management**: Complete project creation, editing, and management system
- **Stakeholder Management**: Email-based stakeholder management with Firebase integration
- **Point Recalculation**: Automatic point conversion between scoring systems
- **Comprehensive Card System**: Support for Tasks, Bugs, Epics, Sprints, Proposals, and QA Cards
- **Advanced Filtering**: Multi-criteria filtering for tasks and bugs
- **Table Views**: Comprehensive table views with sorting and filtering
- **Kanban Views**: Drag-and-drop Kanban boards for different card types
- **Sprint Management**: Sprint-based project management with point tracking
- **Gantt Charts**: Timeline visualization for epics and projects
- **Test Suite**: Initial test coverage with Vitest and jsdom
- **Related Tasks**: Task relationship management with reciprocal connections
- **Attachment System**: File attachment support for all card types
- **Push Notifications**: Real-time push notification system
- **User Permissions**: Role-based access control and project permissions

### Changed

- **Authentication**: Microsoft authentication integration
- **Database**: Firebase Realtime Database integration
- **Component Architecture**: LitElement web components
- **Styling System**: Centralized theme configuration and dynamic CSS generation
- **Build System**: Astro 5.x with environment-specific builds
- **Logging System**: Implemented Sinsole for intelligent logging control
- **Code Quality**: Comprehensive refactoring with TypeScript support

### Fixed

- **Performance**: Optimized Firebase listeners and data loading
- **UI/UX**: Improved responsive design and user experience
- **Security**: Enhanced Firebase security rules and data validation
- **Memory Management**: Proper cleanup of event listeners and subscriptions
- **Cross-browser Compatibility**: Improved compatibility across different browsers
- **Error Handling**: Robust error handling and user feedback

### Features

- **Task Management**: Create, edit, and manage development tasks with full lifecycle
- **Bug Tracking**: Comprehensive bug tracking and resolution with priority management
- **Epic Planning**: Long-term project planning with epics and Gantt visualization
- **Sprint Planning**: Agile sprint planning and management with point tracking
- **Business/Dev Points**: Dual point system for business and development estimation
- **Status Tracking**: Comprehensive status tracking for all card types
- **User Management**: User roles and permissions with project-specific access
- **Project Organization**: Multi-project support with admin management
- **Real-time Updates**: Live updates using Firebase Realtime Database
- **Responsive Interface**: Mobile-friendly design with PWA capabilities
- **Advanced Views**: Multiple view types (List, Kanban, Table, Gantt, Sprint)
- **Notification System**: Real-time notifications with push support
- **File Attachments**: Support for file uploads and attachments on all cards
- **Filtering & Search**: Advanced filtering and search capabilities
- **Data Export**: Export functionality for reports and analysis

### Technical Highlights

- **Modern Web Stack**: Astro, LitElement, Firebase
- **Real-time Database**: Firebase Realtime Database integration
- **Progressive Web App**: PWA capabilities with service worker
- **Security**: Comprehensive security rules and data validation
- **Performance**: Optimized loading and caching strategies
- **Accessibility**: WCAG compliance and screen reader support
- **Internationalization**: Multi-language support (Spanish/English)
- **Development Tools**: Comprehensive development and testing setup

---

## Contributing

Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please contact the development team or open an issue on GitHub.
