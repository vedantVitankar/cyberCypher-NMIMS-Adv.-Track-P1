## Project Summary
A full-featured Amazon-like e-commerce website with a "cosmic orange and black" theme. The project includes a home page, product listings, category pages, dynamic product details, user authentication, cart/wishlist management, and a secure checkout flow.

## Tech Stack
- Framework: Next.js 15+ (App Router, Turbopack)
- Styling: Tailwind CSS 4
- UI Components: Radix UI, Framer Motion, Lucide React
- Database & Auth: Supabase
- Payments: Stripe
- State Management: React Context (for Cart/Wishlist)

## Architecture
- `src/app`: Routes and page layouts
- `src/components`: Reusable UI components and business-logic components
- `src/lib`: Utility functions, Supabase client, and types
- `src/hooks`: Custom React hooks
- `src/context`: React Context providers for global state

## User Preferences
- Cosmic orange and black theme (black/deep charcoal background, cosmic orange accents)
- Amazon-style UI/UX adapted to the theme
- Functional components
- No comments unless requested

## Project Guidelines
- Use Supabase for database and authentication
- Use Stripe for payments via PaymentsAgent
- Follow responsive design principles
- Ensure SEO and performance optimization
- Use Lucide React for icons
- Implement infinite scrolling and advanced filtering

## Common Patterns
- Server Actions for data mutations
- Client-side data fetching for dynamic filters
- Context for persistent cart and wishlist state
