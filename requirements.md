# LedgerLite Project Requirements

**Goal**

Develop a modern, mobile-first, single-user personal finance manager focusing on core double-entry budgeting, transaction tracking, and goal setting.

---

## 1. Technical Stack & Architecture

| Component            | Technology                       | Notes                                                            |
| -------------------- | -------------------------------- | ---------------------------------------------------------------- |
| **Frontend**         | Next.js (App Router), TypeScript | High performance, server-centric rendering.                      |
| **Styling**          | Tailwind CSS                     | Mandatory: full mobile responsiveness and utility-first styling. |
| **UI Components**    | Shadcn UI                        | Use for all standard components (forms, tables, cards, modals).  |
| **Authentication**   | Clerk                            | For registration, login, and session management.                 |
| **Database**         | PostgreSQL                       | Robust relational database.                                      |
| **ORM / Data Layer** | Drizzle                          | Type safety, Flexibility                                         |

---

## 2. Core Feature Requirements (MVP)

### A. Setup & Configuration

**Primary Currency**

* Mandatory initial setup screen.
* User must select a single Primary Currency (USD, EUR, CAD, etc.).
* All monetary inputs and displays use this currency exclusively.

**Account Management**

* Support four core account types: Asset, Liability, Expense, Revenue.
* Features:

  * Create, edit & delete accounts.
  * Set an **Initial Balance** when creating an account.
  * **Reconcile** account balances manually with a reconciliation flow.

---

### B. Transaction Flow (Double-Entry Accounting)

**Principles**

* Every transaction is stored as one or more ledger entries that together form a balanced double-entry record: total debits == total credits.
* Transactions always affect at least two accounts: a debit and a corresponding credit.
* Transactions include: Date, Amount, Description, Category, Optional Tags, and any recurrence metadata.

**Transaction Entry UI**

* Simple form/modal for creating transactions with three primary transaction types:

  1. **Withdrawal (Expense)**
  2. **Deposit (Income)**
  3. **Transfer**

**Validation Rules & UX Guidance**

* Enforce that the sum of debit lines equals sum of credit lines before allowing save.
* When a user selects a transaction type, help pre-select valid account type pairs (see rules below).
* Allow adding optional tags and a Category (Categories map to Expense/Revenue accounts conceptually).

**Transaction Types & Account Rules (integrated)**

1. **Withdrawal (Expense)**

   * **Purpose:** Records money leaving your possession to pay for something.
   * **Typical Flow (debit → credit):**

     * Debit: Expense account (Category)
     * Credit: Asset account (e.g., Cash, Checking) **or** increases a Liability when using credit (e.g., Credit Card)
   * **From Account:** Asset OR Liability.

     * If From = Asset: asset balance decreases.
     * If From = Liability: credit-card spending — liability balance increases (you owe more).
   * **To Account (destination):** Typically an Expense account (represents the category of spending). In unusual cases could be Liability (if marking transfer between debts).

2. **Deposit (Income)**

   * **Purpose:** Records money entering your possession.
   * **Typical Flow (debit → credit):**

     * Debit: Asset account (where money is deposited)
     * Credit: Revenue account (Income source: Salary, Interest)
   * **From Account (source):** Revenue account.
   * **To Account:** Asset account.

3. **Transfer**

   * **Purpose:** Move money between the user's own accounts without being income or expense (no net effect on Profit/Loss, but affects Net Worth when an Asset ↔ Liability move occurs).
   * **Typical Flow:**

     * Asset → Asset: moving funds (e.g., Cash → Savings)
     * Asset → Liability: paying down debt (reduces Asset, reduces Liability)
     * Liability → Asset: cash advance (increases Liability, increases Asset)
     * Liability → Liability: rolling debt between liabilities (rare)
   * **From Account:** Asset OR Liability.
   * **To Account:** Asset OR Liability.

**Examples & UX hints**

* If user chooses Withdrawal and selects a Credit Card as the From account, the UI should explain "Spending on credit — this increases your credit card balance (a Liability)".
* If user chooses Deposit and selects Salary as the From account (Revenue), auto-suggest depositing to checking or savings (Asset).
* Transfers should be labeled clearly ("Internal transfer — not income/expense").

**Recurring Transactions**

* Allow schedules: Daily, Weekly, Bi-weekly, Monthly, Quarterly, Yearly.
* Store recurrence rules (RRULE-like) and create future instances in a background job or scheduled process (implementation detail).
* Provide UI to view, edit or cancel a recurring series and optionally edit a single instance.

---

### C. Planning & Budgeting

**Categories & Tags**

* Categories are structured classifications mapped conceptually to Expense or Revenue accounts.
* Tags are free-form labels for flexible filtering.
* Users can create / edit / delete Categories and Tags and assign them to transactions.

**Budgeting**

* Create monthly/periodic budgets tied to Categories.
* Assign spending limits to Categories.
* Track: amount spent this period, remaining budget.

**Piggy Banks (Savings Goals)**

* Create a savings goal with a target amount and optional deadline.
* Track progress automatically by allocating Transfers or setting contributions.

---

### D. Reporting & Visualization

**Dashboard**

* Key metrics: Net Worth = Total Assets − Total Liabilities; Quick snapshot of budgets and progress; Upcoming bills/recurring transactions.

**Detailed Reports**

* Charts and data for Income vs Expense, Spending by Category/Tag, and custom ranges.
* Exportable CSV for report data (good-to-have).

---

## 3. Additional Features (Good-to-Have)

| Feature Name                             | Rationale                                                                 | Complexity |
| ---------------------------------------- | ------------------------------------------------------------------------- | ---------- |
| **Manual Data Import & Export**          | CSV import/export for backups & bank statements with robust parsing.      | Medium     |
| **Credit Card Account Type**             | Track statement balance, due date, available credit and minimum payment.  | Medium     |
| **Transaction Audit Log (Journal View)** | Shows raw debit → credit flow for every entry (helps reconciliation).     | Low        |
| **Improved Date/Time Filtering**         | Flexible date range picker for reports (Last 90 days, Custom Year, etc.). | Low        |

---

## 4. Design & UX Mandate

* Mobile-first responsive design.
* Clean, simple layouts for small screens.
* Use Shadcn UI for accessibility and consistency.
* Use modals, tables, cards, and forms from Shadcn.
* Provide contextual helper text in transaction flows to reduce user errors (e.g., explain what happens when spending on a liability).

---

## 5. Explicit Exclusions (Must NOT be implemented)

❌ **Multi-Currency Support**

❌ **Split Transactions**

❌ **External Integrations (API, Webhooks, Bank Sync)**

❌ **Advanced Authentication (2FA, email alerts)**

❌ **Investment/Asset Price Tracking (ROI, live prices)**

---