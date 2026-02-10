# 🚀 CoStudy Pre-Launch Checklist

**Last Updated**: 2026-02-09  
**Target**: Production-ready launch

---

## 📊 Current Status Overview

| Category | Status | Details |
|----------|--------|---------|
| **Frontend** | 🟡 Partial | UI complete, some features use mock data |
| **Backend API** | 🟢 Working | api.costudy.in operational |
| **Database** | 🟡 Partial | Schema ready, migrations need verification |
| **RAG Data** | 🟢 Good | 26,433 chunks (7,500 MCQs, 6,129 answers, 137 essays) |
| **Authentication** | 🟢 Working | Supabase auth with CORS fallback |
| **Payments** | 🔴 Not Ready | Simulated only, no real integration |
| **Email** | 🔴 Not Ready | No transactional email setup |

---

## 🗄️ DATABASE & BACKEND

### Tables to Verify in Supabase

Run these checks in Supabase SQL Editor:

```sql
-- Check if all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

| Table | Required | Status |
|-------|----------|--------|
| `user_profiles` | ✅ Core | ⬜ Verify |
| `posts` | ✅ Core | ⬜ Verify |
| `comments` | ✅ Core | ⬜ Verify |
| `chat_conversations` | ✅ Core | ⬜ Verify |
| `chat_participants` | ✅ Core | ⬜ Verify |
| `chat_messages` | ✅ Core | ⬜ Verify |
| `alignments` | ✅ CAN Feature | ⬜ Verify |
| `study_rooms` | ✅ Core | ⬜ Verify |
| `study_room_members` | ✅ Cluster | ⬜ Verify |
| `study_room_missions` | ✅ Cluster | ⬜ Verify |
| `study_room_messages` | ✅ Core | ⬜ Verify |
| `study_room_resources` | ✅ Core | ⬜ Verify |
| `teacher_broadcasts` | ✅ Teacher | ⬜ Verify |
| `student_enrollments` | ✅ Teacher | ⬜ Verify |
| `notifications` | ✅ Core | ⬜ Verify |
| `vouches` | ✅ Social | ⬜ Verify |
| `post_summaries` | ✅ AI | ⬜ Verify |
| `mcq_war_sessions` | ⚡ MCQ War | ⬜ Verify |
| `mcq_war_participants` | ⚡ MCQ War | ⬜ Verify |
| `whiteboard_sessions` | ⚡ Cluster | ⬜ Verify |
| `group_subscriptions` | 💰 Premium | ⬜ Verify |
| `group_invites` | 💰 Premium | ⬜ Verify |
| `mentor_availability` | 👨‍🏫 Faculty | ⬜ Verify |
| `mentor_sessions` | 👨‍🏫 Faculty | ⬜ Verify |
| `session_payments` | 💰 Faculty | ⬜ Verify |
| `wallet_transactions` | 💰 Wallet | ⬜ Verify |
| `badges` | 🏆 Gamification | ⬜ Verify |
| `user_badges` | 🏆 Gamification | ⬜ Verify |
| `room_leaderboard` | 🏆 Competition | ⬜ Verify |
| `document_sections` | 📚 RAG | ✅ Working (26,433 rows) |

### Database Functions to Verify

| Function | Purpose | Status |
|----------|---------|--------|
| `match_documents` | RAG vector search | ✅ Working |
| `calculate_group_discount` | Group pricing | ⬜ Verify |
| `increment_room_members` | Room count | ⬜ Verify |
| `increment_post_vouches` | Vouch system | ⬜ Verify |
| `update_cluster_streak` | Streak tracking | ⬜ Verify |
| `reset_daily_contributions` | Daily reset | ⬜ Verify |

### RLS Policies

- ⬜ Verify all RLS policies are enabled
- ⬜ Test authenticated user access
- ⬜ Test anonymous user restrictions

---

## 🎯 FEATURE CHECKLIST

### Core Features (Must Have for Launch)

#### 1. Authentication ✅
- [x] Sign up with email/password
- [x] Sign in with email/password
- [x] Session persistence
- [x] CORS fallback handling
- [ ] **Email verification flow** ⚠️
- [ ] **Password reset flow** ⚠️
- [ ] Social login (Google) - Optional

#### 2. User Profiles 🟡
- [x] Profile creation on signup
- [x] Profile viewing
- [x] Profile editing
- [ ] **Avatar upload** (currently using placeholder)
- [ ] Profile completion percentage
- [ ] Public profile pages

#### 3. AI Deck (Study Assistant) ✅
- [x] Chat with CMA tutor
- [x] RAG-powered responses
- [x] Notes generation
- [x] Flashcard generation
- [x] Topic blueprints
- [x] Essay evaluation
- [ ] Save generated content to profile
- [ ] History persistence

#### 4. Study Wall (Social Feed) 🟡
- [x] View posts
- [x] Create posts
- [x] Comments
- [ ] **Vouch system** (UI exists, backend connection?)
- [ ] Post filtering by tags
- [ ] Post search
- [ ] AI summary button

#### 5. Study Rooms 🟡
- [x] View rooms
- [x] Join rooms
- [x] Room chat
- [ ] **Room creation** (user-created)
- [ ] MCQ War Room functionality
- [ ] Whiteboard integration
- [ ] Signal lights (active status)
- [ ] Cluster streak tracking

#### 6. Mock Tests 🔴 **CRITICAL**
- [x] Test UI/UX (Prometric-style)
- [x] Timer functionality
- [x] Question navigation
- [ ] **Connect to real MCQ database** ⚠️
- [ ] Score calculation
- [ ] Performance analytics
- [ ] Save results to profile
- [ ] Leaderboard integration

#### 7. Direct Messages 🟡
- [x] Conversation list
- [x] Message sending
- [ ] Real-time updates (Supabase Realtime)
- [ ] Unread indicators
- [ ] Contextual messaging (from posts)

### Revenue Features (Required for Monetization)

#### 8. Payment Integration 🔴 **CRITICAL**
- [ ] **Razorpay/Stripe integration**
- [ ] Individual subscription (₹499/mo, ₹3999/yr)
- [ ] Group subscription with discounts
- [ ] Payment success/failure handling
- [ ] Invoice generation
- [ ] Subscription management

#### 9. Student Store 🔴
- [ ] **Real product catalog** (currently hardcoded)
- [ ] Purchase flow with real payments
- [ ] Content unlocking mechanism
- [ ] Purchase history

#### 10. Premium Features 🔴
- [ ] Feature gating (free vs pro)
- [ ] Usage limits for free tier
- [ ] Upgrade prompts
- [ ] Group premium study room creation

### Teacher/Mentor Features

#### 11. Teachers Lounge 🟡
- [x] Mentor listing
- [ ] **Real mentor data from DB** (currently mock)
- [ ] Mentor search/filter
- [ ] Booking flow
- [ ] Review system

#### 12. Mentor Dashboard 🟡
- [x] Dashboard UI
- [ ] **Real student data**
- [ ] Broadcast functionality
- [ ] Earnings tracking
- [ ] Session scheduling

#### 13. Faculty Hive 🔴
- [ ] Mentor availability management
- [ ] Flash session requests
- [ ] Split payment handling
- [ ] Escrow and release

### Advanced Features (Phase 2)

#### 14. CMA Alignment Network (CAN) 🟡
- [x] Alignment UI
- [ ] Send/receive alignment requests
- [ ] Active alignment tracking
- [ ] Streak system
- [ ] Cross-timezone matching

#### 15. Gamification 🟡
- [x] Badge definitions in DB
- [ ] Badge awarding logic
- [ ] Badge display on profiles
- [ ] Leaderboards
- [ ] XP/Reputation system

---

## 💾 DATA READINESS

### RAG Knowledge Base

```
Current Status (api.costudy.in/api/stats/chunks):
- MCQ Questions: 7,500 ✅
- MCQ Answers: 6,129 ✅
- Essays: 137 ⚠️ (Low - need more)
- Other Content: 12,667 ✅
- Total: 26,433 chunks
```

#### Data Quality Checks
- [ ] MCQ questions have proper formatting (A/B/C/D options)
- [ ] MCQ answers are linked to questions
- [ ] Essay content covers all CMA topics
- [ ] Remove duplicate/spam content
- [ ] Verify Part 1 vs Part 2 coverage

#### Data Gaps to Address
- [ ] More essay content for Part 2
- [ ] Practice scenarios for ethics section
- [ ] Current year IMA standards updates
- [ ] More worked examples

### Seed Data Required

- [ ] Default study rooms (5-10 topic-based rooms)
- [ ] Sample mentor profiles
- [ ] Welcome posts on Study Wall
- [ ] Badge definitions (13 badges in migration)

---

## 🔐 SECURITY & COMPLIANCE

### Security Checklist
- [ ] All API endpoints require authentication where needed
- [ ] Rate limiting on API endpoints
- [ ] Input sanitization (XSS prevention)
- [ ] SQL injection prevention (using parameterized queries)
- [ ] CORS properly configured
- [ ] Environment variables secured
- [ ] No secrets in frontend code

### Privacy & Legal
- [ ] Privacy Policy page
- [ ] Terms of Service page
- [ ] Cookie consent banner
- [ ] Data deletion capability
- [ ] GDPR compliance (if serving EU users)

---

## 🚀 DEPLOYMENT & INFRASTRUCTURE

### Production Environment
- [x] Frontend deployed on Coolify
- [x] API deployed on Coolify
- [x] Supabase database configured
- [ ] Custom domain SSL (costudy.in)
- [ ] API domain SSL (api.costudy.in)
- [ ] CDN for static assets

### Monitoring & Analytics
- [ ] Error tracking (Sentry recommended)
- [ ] Analytics (Google Analytics / Plausible)
- [ ] API monitoring
- [ ] Database performance monitoring
- [ ] Uptime monitoring

### Performance
- [ ] Lighthouse score > 80
- [ ] Bundle size optimization
- [ ] Image optimization
- [ ] Lazy loading implemented
- [ ] Database indexes (created in migration)

---

## 📧 COMMUNICATION SETUP

### Email (Transactional)
- [ ] Email service setup (Resend/Postmark/SendGrid)
- [ ] Welcome email template
- [ ] Password reset email template
- [ ] Subscription confirmation template
- [ ] Payment receipt template
- [ ] Weekly digest template (optional)

### Notifications
- [ ] In-app notification system
- [ ] Push notifications (optional)
- [ ] Email notification preferences

---

## 📱 UX/UI POLISH

### Mobile Responsiveness
- [ ] Test all pages on mobile
- [ ] Fix any layout issues
- [ ] Touch-friendly interactions

### Accessibility
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast compliance

### Loading States
- [x] Loading spinners present
- [ ] Skeleton loaders for better UX
- [ ] Error state handling

### Empty States
- [ ] No posts yet
- [ ] No messages yet
- [ ] No results found

---

## 🧪 TESTING

### Manual Testing
- [ ] Complete signup flow
- [ ] Complete login flow
- [ ] Create and view posts
- [ ] Join study room and chat
- [ ] Use AI Deck features
- [ ] Start mock test
- [ ] Edit profile
- [ ] Send direct message

### Edge Cases
- [ ] Slow network handling
- [ ] Session expiry handling
- [ ] Invalid input handling
- [ ] Empty state handling

---

## 📋 LAUNCH PRIORITY

### Phase 1: MVP Launch (Minimum Viable)
1. ⬜ Verify all database tables exist
2. ⬜ **Connect MockTests to real MCQ data**
3. ⬜ **Setup payment integration (Razorpay)**
4. ⬜ Add email verification flow
5. ⬜ Add password reset flow
6. ⬜ Privacy Policy & Terms pages
7. ⬜ Basic error tracking
8. ⬜ Full manual testing pass

### Phase 2: Enhanced Launch
1. ⬜ Complete vouch system
2. ⬜ Real mentor data integration
3. ⬜ Group subscription flow
4. ⬜ Badge awarding system
5. ⬜ Notification system
6. ⬜ Analytics integration

### Phase 3: Full Feature Launch
1. ⬜ Faculty Hive with payments
2. ⬜ MCQ War Rooms
3. ⬜ Whiteboard integration
4. ⬜ CAN advanced features
5. ⬜ Mobile app (future)

---

## 🛠️ IMMEDIATE ACTION ITEMS

### Today/This Week
1. **Verify Database Tables**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

2. **Connect Mock Tests to Real Data**
   - Modify `fetchExamQuestions` in `fetsService.ts`
   - Use `/api/mcq/practice` endpoint

3. **Setup Razorpay**
   - Create Razorpay account
   - Get API keys
   - Add payment endpoints to API
   - Integrate in StudentStore

4. **Add Missing Pages**
   - `/privacy` - Privacy Policy
   - `/terms` - Terms of Service

---

## 📞 CONTACTS & RESOURCES

- **Supabase Dashboard**: [Your Supabase URL]
- **Coolify Dashboard**: [Your Coolify URL]
- **GitHub Repos**:
  - Frontend: https://github.com/hy4k/costudy
  - API: https://github.com/hy4k/costudy-api
- **Live URLs**:
  - App: https://costudy.in
  - API: https://api.costudy.in

---

*This checklist should be updated as items are completed. Mark with ✅ when done.*
