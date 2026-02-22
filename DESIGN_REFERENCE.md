# Design Reference Checklist

| Component File Path | Route | Current Styling State | Notes |
| :--- | :--- | :--- | :--- |
| `App.tsx` | App Entry & Routing | Working | Redirects unauth to `/` and auth to `/deck` |
| `components/Layout.tsx` | All Authenticated Views | Working | Built new Dark Sidebar & Mobile NavBar |
| `components/views/LandingPage.tsx` | `/` and `/home` | Working | Created premium Landing Page with pricing |
| `components/auth/AuthPage.tsx` | `/login` | Working | Merged login/signup into single glassmorphic page |
| `components/views/StudyWall.tsx` | `/deck` | Working | Syntactically stripped and adjusted button/card bounds |
| `components/views/StudyRooms.tsx` | `/rooms` | Working | Applied standardized rounded-xl for cards, rounded-lg for buttons |
| `components/views/AIDeck.tsx` | `/mastermind` | Working | Restored card borders and padding, ringed inputs |
| `components/views/Profile.tsx` | `/profile` | Working | Normalized modals, updated background contrasts |
| `components/views/MentorDashboard.tsx` | `/mentor` | Working | Replaced excessive 5rem rounded sizes globally |
| `components/views/DirectMessages.tsx` | Sub-view | Working | Applied new Tailwind rule presets |
| `components/views/ExamSession.tsx` | Sub-view | Working | Auto-converted to new style spec |
| `components/views/LibraryVault.tsx` | Sub-view | Working | Adjusted backgrounds for modal overrides |
| `components/views/MockTests.tsx` | Sub-view | Working | Re-standardized button classes (`px-4 py-2`) |
| `components/views/StudentStore.tsx` | Sub-view | Working | Unified standard focus rings across inputs |
| `components/views/TeachersDeck.tsx` | Sub-view | Working | Updated card paddings and transitions |
| `components/views/TeachersLounge.tsx` | Sub-view | Working | Replaced uncompiled classes with standard ones |
