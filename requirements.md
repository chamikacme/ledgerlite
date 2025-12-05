# **LedgerLite Project Requirements: Simplified Personal Finance Manager**

## **Goal**

Develop a modern, mobile-first, single-user personal finance manager focusing on core double-entry budgeting, transaction tracking, and goal setting.

---

## **1. Technical Stack & Architecture**

### **Component Overview**

| Component            | Technology                       | Notes                                                            |
| -------------------- | -------------------------------- | ---------------------------------------------------------------- |
| **Frontend**         | Next.js (App Router), TypeScript | High performance, server-centric rendering.                      |
| **Styling**          | Tailwind CSS                     | Mandatory: full mobile responsiveness and utility-first styling. |
| **UI Components**    | Shadcn UI                        | Use for all standard components (forms, tables, cards, modals).  |
| **Authentication**   | Clerk                            | For registration, login, and session management.                 |
| **Database**         | PostgreSQL                       | Robust relational database.                                      |
| **ORM / Data Layer** | Drizzle                          | Type safety, Flexibility                                        |

---

## **2. Core Feature Requirements (MVP)**

### **A. Setup & Configuration**

#### **Primary Currency**

* Mandatory initial setup screen.
* User must select a single Primary Currency (USD, EUR, CAD, etc.).
* All monetary inputs and displays use this currency exclusively.

#### **Account Management**

* Support four core account types:

  * **Asset**
  * **Liability**
  * **Expense**
  * **Revenue**
* Ability to:

  * Create & manage accounts.
  * Set an **Initial Balance**.
  * **Reconcile** account balances manually.

---

### **B. Transaction Flow**

#### **Double-Entry System**

* Every transaction must have:

  * A **debit** entry.
  * A **corresponding credit** entry.

#### **Transaction Entry**

Simple form/modal for three transaction types:

1. **Withdrawal (Expense)**

   * Asset → Expense (or Liability)

2. **Deposit (Income)**

   * Revenue → Asset

3. **Transfer**

   * Asset/Liability A ↔ Asset/Liability B

#### **Details per Transaction**

* Date
* Amount
* Description
* Category
* Optional: Tags

#### **Recurring Transactions**

* Define schedules: Monthly, Bi-weekly, Weekly, etc.
* Automatically create future entries.

---

### **C. Planning & Budgeting**

#### **Categories & Tags**

* Create, edit, delete Categories (structured classification).
* Create Tags (free-form labeling).
* Assign both to transactions.

#### **Budgeting**

* Create monthly/periodic budgets.
* Assign spending limits to Categories.
* Track:

  * Amount spent this period.
  * Remaining budget.

#### **Piggy Banks (Savings Goals)**

* Set a target amount.
* Track progress toward that goal.

---

### **D. Reporting & Visualization**

#### **Dashboard**

* Overview of:

  * **Net Worth** = Total Assets − Total Liabilities
  * Current month’s budgets & progress

#### **Detailed Reports**

Charts + data for:

* Income vs. Expense
* Spending breakdown by Category or Tag
* Standard and custom date ranges

---

## **3. Additional Features (Good-to-Have)**

| Feature Name                             | Rationale                                                                            | Complexity |
| ---------------------------------------- | ------------------------------------------------------------------------------------ | ---------- |
| **Manual Data Import & Export**          | Users need CSV import/export for backups & bank statements. Includes robust parsing. | Medium     |
| **Credit Card Account Type**             | Track spending balance, statement balance, and due date.                             | Medium     |
| **Transaction Audit Log (Journal View)** | Shows debit → credit flow for every entry. Helps reconciliation.                     | Low        |
| **Improved Date/Time Filtering**         | Flexible date range picker for reports (Last 90 days, Custom Year, etc.).            | Low        |

---

## **4. Design & UX Mandate**

* **Mobile-first** responsive design.
* Clean, simple layouts for small screens.
* Use **Shadcn UI** for consistent quality and accessibility.
* Use modals, tables, cards, and forms from Shadcn.

---

## **5. Explicit Exclusions (Must NOT be implemented)**

❌ **Multi-Currency Support**
❌ **Split Transactions**
❌ **External Integrations (API, Webhooks, Bank Sync)**
❌ **Advanced Authentication (2FA, email alerts)**
❌ **Investment/Asset Price Tracking (ROI, live prices)**

---