# Mobile UI Overhaul Plan

This plan addresses all mobile responsiveness issues across the home page, specifically targeting the navigation bar, carousels, and section paddings.

## Proposed Changes

### 1. Navigation Bar (Header)
Currently, the navigation links stack vertically on small screens, pushing content down and looking cluttered.
- **[MODIFY] src/components/Header.jsx**: Implement a hamburger menu icon for screens under 768px. When clicked, it will open a sleek, full-screen mobile menu overlay containing all navigation links.
- **[MODIFY] src/styles/index.css**: Add styling for the hamburger icon, the mobile overlay menu, and animations for opening/closing the drawer. Hide standard navigation links on mobile.

### 2. Carousel Sizing for Mobile
Currently, the carousels try to squeeze 3-4 cards horizontally even on tiny phone screens, making them unreadable.
- **[MODIFY] src/styles/index.css**: Add targeted `@media (max-width: 768px)` rules so that both the Team and Initiatives carousels only show **1 card** at a time on mobile.

### 3. Section Padding (Inline Style Bug)
Currently, the `TeamSection` and `InitiativesSection` have hardcoded inline styles (`style={{ padding: '8rem 0 0 0' }}`) to fix the title spacing. Inline styles cannot be overridden by mobile CSS media queries, causing massive gaps on mobile.
- **[MODIFY] src/components/TeamSection.jsx**: Replace inline styles with a dynamic CSS class (e.g., `.carousel-active`).
- **[MODIFY] src/components/InitiativesSection.jsx**: Replace inline styles with the same CSS class.
- **[MODIFY] src/styles/index.css**: Define `.carousel-active { padding: 8rem 0 0 0; }` for desktop, but reduce it to `padding: 4rem 0 0 0;` for mobile screens.

### 4. Typography & Spacing
- **[MODIFY] src/styles/index.css**: Reduce the hero title font size further on mobile (down to 2rem) and tighten up general section padding (from 8rem to 4rem) so the mobile view feels compact and app-like.

## User Review Required
> [!IMPORTANT]
> The hamburger menu will use a full-screen overlay (navy blue background) to ensure links are easy to tap on mobile. If you prefer a simple drop-down instead, let me know!

## Verification Plan
1. I will apply these changes.
2. I will ask you to open your browser's Developer Tools and test the mobile view (e.g., iPhone 14 Pro layout) to confirm the hamburger menu works and the carousels are appropriately sized.
