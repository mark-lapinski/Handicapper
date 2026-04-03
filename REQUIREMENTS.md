az# Handicapper - Requirements Document

## Executive Summary
**Handicapper** is an Angular-based web application that enables golfers to track their scoring and calculate their golf handicap index using the USGA (United States Golf Association) handicap formula. The application prompts users to enter round details, validates data using course metrics obtained from LLM integration, and computes handicap differentials to maintain an accurate handicap index.

---

## 1. Project Overview

### Purpose
The Handicapper application eliminates manual handicap calculations by providing a streamlined, user-friendly interface for golfers to:
- Record individual round scores
- Capture course and playing condition metadata
- Automatically calculate handicap differentials
- Track handicap index over time using USGA standards
- Leverage LLM technology to retrieve course data (slope rating and course rating)

### Target Users
- Golfers of all skill levels seeking to maintain an official or personal handicap
- Golf clubs and organizations managing member handicaps
- Casual golfers who want to track improvement

---

## 2. Core Features

### 2.1 Dashboard & Score Overview
**Feature:** Display user's previous scores and current handicap index on app launch

**Requirements:**
- **On First Visit (No Scores):**
  - Display welcome message: "Welcome to Handicapper! Let's get started."
  - Prominent button: "Enter Your First Score"
  - Brief explanation of what Handicapper does
  
- **On Subsequent Visits (Has Scores):**
  - Display current handicap index prominently (large, centered)
  - Show summary stats:
    - Number of scores on record
    - Most recent score (date, course, differential)
    - Trend indicator (up/down/stable)
  - Display last 5-10 scores in a quick-view table
  - Button to "Record New Score" (primary CTA)

**Acceptance Criteria:**
- App detects if user has prior scores and shows appropriate view
- Dashboard loads instantly from in-app memory
- Users can navigate to "Record Score" from any view
- Stats update in real-time after score entry

### 2.2 Score Entry & Capture
**Feature:** Record a round of golf with all relevant metadata

**Requirements:**
- Support both 9-hole and 18-hole rounds
- Mandatory fields:
  - **Golf Course Name** (text input)
  - **Course Location** (text input, e.g., city/state)
  - **Tee Color Played** (White, Blue, Black, Red, Gold, etc. dropdown)
  - **Score** (total strokes for the round)
  - **Date of Round** (defaults to today)
  - **Course Rating** (lookup suggestion with manual confirmation or override)
  - **Slope Rating** (lookup suggestion with manual confirmation or override)
- Optional fields:
  - Handicap conditions (e.g., weather, course conditions)
  - Playing partner names
  - Notes or comments

**Acceptance Criteria:**
- Users cannot submit a score without required fields
- Form validates numeric input for scores, course rating, slope rating
- Date picker prevents future dates
- After entering course name, location, and tee color, users can request suggested ratings
- App returns suggested course rating and slope rating, then requires user to confirm or override
- Users can always manually edit confirmed values before saving

### 2.3 Course Data Integration via LLM
**Feature:** Retrieve suggested course slope rating and course rating from an LLM API

**Current Requirements:**
- Integrate with LLM API using `POST` request to retrieve suggested values by course name + course location + tee color
- Accept response formats including plain text (e.g., `Rating: 73.4, Slope: 138`) and JSON
- Show suggested values in the UI and require explicit user action:
  - **Confirm** to apply returned values to form fields
  - **Override** to keep manual entry
- If lookup fails, allow manual entry and continue score submission flow
- Keep score submission independent from lookup success

### 2.4 USGA Handicap Calculation
**Feature:** Compute handicap differential for each score using USGA formula

**USGA Formula:**
```
Handicap Differential = (Score - Course Rating) × 113 / Slope Rating
```

**Requirements:**
- Calculate differential for every submitted score
- Store differential alongside score record
- Round differential to 1 decimal place
- Display running list of most recent differentials (e.g., last 20)

**Acceptance Criteria:**
- Formula correctly implements USGA standard
- Differential displayed to users after submission
- Historical differential list is sortable and filterable

### 2.5 Handicap Index Calculation & Display
**Feature:** Calculate and display the user's current handicap index

**USGA Standard:**
- Handicap Index = average of the lowest 8 differentials from the last 20 scores
- Update in real-time as new scores are added

**Requirements:**
- Display current handicap index prominently on dashboard
- Show:
  - Most recent score differential
  - Number of scores on record
  - Last 20 scores with dates, courses, and differentials
  - Handicap index trend (chart showing progression over time)
- Separate displays for 9-hole and 18-hole indexes (if applicable)

**Acceptance Criteria:**
- Handicap index updates automatically upon new score entry
- Index is calculated correctly per USGA standards
- Users can see which differentials contribute to their index

### 2.6 Score History & Management
**Feature:** View, edit, and delete historical scores

**Requirements:**
- List all scores in a sortable, searchable table:
  - Course name, date, tee color, score, differential, 9/18-hole designation
- Edit a score (recalculates differential automatically)
- Delete a score (updates index accordingly)
- Filter by:
  - Date range
  - Course name
  - Hole count (9 vs 18)
- Export score history (CSV format)

**Acceptance Criteria:**
- Edits trigger handicap index recalculation
- Deletions remove score and its differential from index calculation
- Filters return results in <500ms
- Export includes all relevant columns

---

## 3. Technical Requirements

### 3.1 Architecture
- **Frontend:** Angular (latest, with standalone components)
- **Styling:** CSS with responsive design
- **State Management:** Angular services (no external state library required initially)
- **Backend Integration:** LLM API (TBD) for course data retrieval

### 3.2 Data Models (Iteration 1)

#### Score Record
```typescript
{
  id: string;                    // Unique identifier (UUID)
  courseName: string;            // Golf course name (user-entered)
  teeColor: string;              // Tee color played (White, Blue, Black, Red, etc.)
  scoreValue: number;            // Total strokes
  holeCount: number;             // 9 or 18
  courseRating: number;          // User-entered or defaulted to 72.0
  slopeRating: number;           // User-entered or defaulted to 113
  handicapDifferential: number;  // Calculated via USGA formula
  date: Date;                    // When the round was played
  createdAt: Date;               // When the score was entered
  notes?: string;                // Optional user notes
}
```

#### App State (In-Memory)
```typescript
{
  scores: Score[];               // Array of all score records
  handicapIndex: number;         // Calculated from last 8 of 20 scores
  lastUpdated: Date;             // When handicap was last recalculated
}
```

**Storage Strategy:**
- Keep scores array in memory (JavaScript state)
- Persist to localStorage as JSON after each crud operation
- Restore from localStorage on app init
- No user auth or profile in iteration 1

### 3.3 LLM Integration Points
- **Active in Iteration 1 prototype**
- API Endpoint: `https://api.openai.com/v1/responses`
- Query Input: course name + course location + tee color
- Response Parsing: supports both structured JSON and text pattern `Rating: X, Slope: Y`
- UX Requirement: user must confirm suggested ratings or choose override before final submit
- Error Handling: fallback to manual rating entry if API call fails or returns invalid data

### 3.4 Storage (Iteration 1)
- **Primary:** In-app memory (JavaScript arrays/objects)
- **Persistence:** localStorage API (for browser refresh/reload)
- **Scope:** Single user, single browser
- **Future:** Backend database with user authentication & multi-device sync (Iteration 2+)

**No external APIs for data persistence in Iteration 1**

### 3.5 UI/UX Requirements
- **Responsive Design:** Mobile-first, works on iPad and desktop
- **Accessibility:** WCAG 2.1 AA compliance
- **Performance:** <2s page load, <500ms form submission
- **Navigation:** Clear sidebar or top nav, logical flow from score entry → history → index

---

## 4. User Workflows

### Workflow 1: First-Time User (No Prior Scores)
1. User opens app
2. Dashboard detects no scores and shows welcome screen:
   - "Welcome to Handicapper!"
   - "Let's calculate your golf handicap"
   - **Button: "Enter Your First Score"**
3. User clicks button → Score entry form opens
4. User fills in:
   - Course name
  - Course location
   - Tee color
   - 9 or 18 holes
   - Score
  - Uses rating lookup to get suggested course and slope ratings
  - Confirms suggestions or overrides manually
   - Date
5. Form validates all required fields
6. On submit:
   - USGA differential calculated locally
   - Score stored in app memory & localStorage
   - Dashboard updates to show:
     - Handicap index
     - First score entry confirmation
     - "Record Another Score" prompt

### Workflow 2: Returning User (Has Prior Scores)
1. User opens app
2. Dashboard loads instantly showing:
   - Current handicap index (large, prominent)
   - Last 5 scores in table format
   - Summary stats (e.g., "5 scores on record")
3. User clicks **"Record New Score"** or "Add Score"
4. Score entry form opens (pre-filled with today's date)
5. User enters:
   - Course name
  - Course location
   - Tee color
   - Hole count
   - Score
  - Requests suggested course & slope ratings from lookup
  - Confirms suggestions or overrides manually
   - Optional: conditions/notes
6. Form validates (all required fields present, numeric validations)
7. Error handling:
   - If score > 150 or < 30 → warning: "This score seems unusual. Proceed?"
   - If course/slope ratings missing → error: "Please enter course and slope ratings"
8. On submit:
   - Differential calculated using USGA formula
   - Handicap index recalculated (last 8 of 20 scores)
   - Score added to history and app memory
   - Success message: "Score recorded! Your handicap index is [X.X]"
   - Dashboard updates automatically
9. User option to "Record Another" or return to dashboard

### Workflow 3: View Score History
1. From dashboard, user clicks "View All Scores" or "Score History"
2. Table displays all scores:
   - Date, course, tee color, score, differential
   - Sorted by date (newest first)
3. User can:
   - Search by course name
   - Filter by date range (optional in v1)
   - Click a row to view/edit/delete
4. Click "Back" or "Dashboard" to return

### Workflow 4: Edit or Delete a Score
1. From score history table, user clicks "Edit" or "..." menu on a score row
2. Edit form opens with score data pre-filled
3. User modifies score, course rating, slope rating, or date
4. On save:
   - Differential recalculated
   - Handicap index recalculated
   - Confirmation message shown
   - Dashboard updates
5. **Delete** option:
   - User clicks "Delete" → confirmation dialog: "Remove this score? This will recalculate your index."
   - On confirm, score removed from memory and localStorage
   - Handicap index recalculated
   - Dashboard and history list update

### Workflow 5: View Detailed Statistics (Nice-to-Have, v1.1)
- Show last 10 scores chart (visual trend)
- Average score over last 5 rounds
- Best/worst 9-hole and 18-hole scores

---

## 5. Non-Functional Requirements

### Performance
- Page load time: <2 seconds
- Form submission: <500ms
- LLM API call timeout: 5 seconds (fallback to defaults on timeout)

### Security
- User data stored securely (LocalStorage initially; encrypted DB later)
- No sensitive data in URLs
- HTTPS enforcement (once deployed)

### Scalability
- Support at least 1,000 users initially
- Support scores for 500+ courses
- LLM caching to reduce API calls

### Usability
- Intuitive form flow, minimal clicks required
- Clear error messages
- Mobile-friendly interface
- Dark mode support (nice-to-have)

---

## 6. Out of Scope for Iteration 1

**Iteration 1 Exclusions:**
- User authentication & account management
- Backend database or cloud sync
- Multi-user support
- Charts and trending visualizations
- CSV export
- Comparison with other golfers/clubs
- Tournament management
- Handicap categories (by age, gender, etc.)
- Mobile app (web is responsive, no native apps)
- GDPR/data deletion features
- Admin dashboard

**Deferred to Later Iterations:**
- All items above planned for v2.0+ roadmap

---

## 7. Acceptance Testing Criteria

### Unit Tests
- USGA formula calculation (verify with known test cases)
- Handicap index derivation (last 8 of 20 scores)
- Form validation (required fields, numeric constraints)

### Integration Tests
- LLM API integration (mock responses, fallback behavior)
- Score CRUD operations (create, read, update, delete)
- Index recalculation on data changes

### User Acceptance Testing (UAT)
- End-to-end score entry and index calculation
- Export functionality produces valid CSV
- Mobile responsiveness on iOS Safari and Android Chrome
- Performance benchmarks met

---

## 8. Deliverables (Iteration 1)

1. **Angular Application** with features in Section 2 (all v1.0 features)
2. **REQUIREMENTS.md** (this document, refined)
3. **Score & Handicap Service** (in-memory + localStorage)
4. **Unit Tests** (USGA formula, handicap index calculation)
5. **E2E Tests** (score entry, dashboard, history workflows)
6. **User Guide / README** with screenshots
7. **Deployment Configuration** (GitHub Actions, Azure Static Web Apps)
8. **No Backend Required** for v1.0

---

## 9. Timeline & Milestones

| **Iteration** | **Features** | **Target** |
|-------|----------|------------|
| **v1.0 (MVP)** | Dashboard, score entry, LLM-assisted rating lookup with confirm/override, USGA calc, history, edit/delete | March 20, 2026 |
| **v1.1** | Charts/trends, improved UX, CSV export, error handling polish | April 1, 2026 |
| **v2.0** | User auth, backend DB, multi-device sync, rating lookup caching | May 15, 2026 |
| **v2.1+** | Competitive features, API, mobile app, analytics | TBD |

---

## 10. Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | [TBD] | | |
| Tech Lead | | | |
| QA Lead | | | |

---

**Last Updated:** March 3, 2026  
**Version:** 1.0
