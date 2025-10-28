# **App Name**: SmartSocConnect

## Core Features:

- Role-Based System: Role-Based Access Control (RBAC) to manage different user roles (Admin, Resident, Security, Receptionist) and permissions.
- Maintenance Management: Residents can view bills. Admin can generate bills and manage bills chat with residence send notices ,requests, bills.
- Complaint Ticketing System: Residents can create and view complaint tickets. Admin/staff can update the status. Email & toast notifications on updates.
- Visitor Log System: Security can log visitors with photo, vehicle type, vehicle number, mobile number, Intime/out time and purpose. Residents get notified in real time. Visitor history exportable in PDF/Excel format.
- Announcement & Noticeboard: Admin posts event updates/notices. All users see role-based updates.
- AI Chatbot for FAQs: Integrate a Next.js-based chatbot for FAQs using Gemini API; uses a tool to determine which tips from the knowledge base would address how to pay a bill, or raise a complaint.

## Style Guidelines:

- Primary: `#2563eb` (Blue-600) for action buttons and active tabs
- Secondary: `#f59e0b` (Amber-500) for highlights and status indicators
- Background: `#f9fafb` (Gray-50) for page backgrounds
- Card/Panel: `#ffffff` (White) for cards and tables
- Text (Primary): `#1f2937` (Gray-800) for main content
- Text (Muted): `#6b7280` (Gray-500) for labels and hints
- Success: `#10b981` (Green-500) for payment status and resolved tickets
- Danger: `#ef4444` (Red-500) for overdue items and high-priority tickets
- Warning: `#facc15` (Yellow-400) for upcoming events and attention alerts
- Use Inter, Poppins, or Manrope for a clean, modern appearance.
- Headings: Semi-bold, slightly spaced (tracking-wide), uppercase optional
- Body Text: Comfortable line height (leading-relaxed)
- Font Sizes: text-2xl for headers, text-base for normal text, text-sm for captions/hints
- Global padding: px-4 py-6 (mobile), px-8 py-8 (desktop)
- Consistent spacing units: 4, 8, 12, 16, 24
- Grid system: Use CSS Grid/Flexbox for dashboard cards and forms
- Use gap-4, gap-6, and gap-8 between components
- Sidebar with icons (Lucide or Heroicons) and labels
- Active route highlighted with a left border or filled background
- Collapsible sidebar for mobile
- Role-based menu visibility
- Cards with rounded corners (rounded-2xl) and soft shadows (shadow-md)
- Tables with hover states, striped rows, and sticky headers
- Progress bars, pie charts, and line charts using Recharts or Chart.js
- Use floating labels or bordered inputs (input input-bordered)
- Add icon support inside inputs (relative pl-10)
- Validations: Error text in red with text-sm text-red-500
- Use framer-motion for Page transitions, Animated cards/widgets, Dropdown and modals
- Duration: 300–500ms with ease-in-out