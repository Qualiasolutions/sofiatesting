# SOPHIA AI — ADMIN DASHBOARD SPECIFICATION

> **Purpose:** This document defines the complete specification for Sophia's Admin Dashboard. The dashboard provides administrative control over agents, listings, system health, and platform activity for Zyprus Property Group.

---

## SECTION 1: ADMIN DASHBOARD OVERVIEW

### 1.1 System Architecture

The Admin Dashboard is a protected area for managing the SOFIA AI platform and its integrations.

| Component | Description |
|-----------|-------------|
| Location | `/admin` route (protected) |
| Layout | `app/(admin)/admin/layout.tsx` |
| Authentication | NextAuth session required |
| Authorization | Role-based permissions |
| UI Framework | React with shadcn/ui components |

### 1.2 Access Control

| Role | Description | Permissions |
|------|-------------|-------------|
| `superadmin` | Full access to all features | All permissions |
| `admin` | Default role for authenticated users | Based on `permissions` object |
| Guest | No access | Redirected to /login |

### 1.3 Permission System

```
Access Check Flow:
1. Check session exists (redirect to /login if not)
2. Query adminUserRole table for user
3. If no role found → Grant default "admin" role with null permissions
4. null permissions = no restrictions (full access)
5. Specific permissions = granular feature access
```

---

## SECTION 2: NAVIGATION STRUCTURE

### 2.1 Sidebar Navigation

| Page | Path | Icon | Required Permission |
|------|------|------|---------------------|
| Dashboard | `/admin` | LayoutDashboard | None |
| Live Activity | `/admin/activity` | Activity | None |
| Agents Registry | `/admin/agents-registry` | Users | `manage_users` |
| Listings Review | `/admin/listings` | Building2 | None |
| Execution Logs | `/admin/logs` | FileText | `view_agent_logs` |
| System Status | `/admin/status` | Activity | `view_system_health` |
| Integrations | `/admin/integrations` | Database | `manage_integrations` |
| Calculators | `/admin/calculators` | Calculator | `manage_calculators` |
| Settings | `/admin/settings` | Settings | `manage_settings` |

### 2.2 Permission Filtering

```typescript
// Navigation items filtered by permission
const hasPermission = (requiredPermission: string | null) => {
  if (!requiredPermission) return true;
  if (role === "superadmin") return true;
  return permissions?.[requiredPermission] === true;
};
```

---

## SECTION 3: MAIN DASHBOARD

### 3.1 Key Metrics Cards

| Metric | Icon | Color | Data Source |
|--------|------|-------|-------------|
| Total Agents | Users | Blue | `zyprusAgent` count |
| Active Agents | UserCheck | Green | `isActive = true` count |
| Pending Approval | UserPlus | Orange | `registeredAt IS NULL` count |
| System Status | Activity | Purple | Health check status |

### 3.2 Charts Section

| Chart | Type | Data | Description |
|-------|------|------|-------------|
| Agent Activity | Bar Chart | Daily interactions | 7-day activity trend |
| Regional Distribution | Pie Chart | Agents by region | Geographic spread |

### 3.3 Recent Activity Widgets

| Widget | Content | Limit |
|--------|---------|-------|
| Recent Agents | Newest agents added | 5 items |
| System Health | Latest health checks | 5 items |

### 3.4 Dashboard Data Query

```typescript
async function getDashboardStats() {
  // 1. Agent counts
  const totalAgents = await db.select({ count: count() }).from(zyprusAgent);
  const activeAgents = await db.select({ count: count() })
    .from(zyprusAgent)
    .where(eq(zyprusAgent.isActive, true));
  const pendingAgents = await db.select({ count: count() })
    .from(zyprusAgent)
    .where(isNull(zyprusAgent.registeredAt));

  // 2. Regional distribution
  const regionalStats = await db.select({
    name: zyprusAgent.region,
    value: count()
  }).from(zyprusAgent).groupBy(zyprusAgent.region);

  // 3. System health logs
  const healthLogs = await db.select()
    .from(systemHealthLog)
    .orderBy(desc(systemHealthLog.timestamp))
    .limit(5);

  // 4. Recent agents
  const recentAgents = await db.select()
    .from(zyprusAgent)
    .orderBy(desc(zyprusAgent.createdAt))
    .limit(5);
}
```

---

## SECTION 4: AGENTS REGISTRY

### 4.1 Overview

The Agents Registry manages all Zyprus real estate agents across platforms (Web, Telegram, WhatsApp).

| Feature | Description |
|---------|-------------|
| Path | `/admin/agents-registry` |
| Data Source | `zyprusAgent` table |
| Pagination | Server-side (default 50 per page) |
| Filtering | Region, Role, Active status |
| Search | Name, email search |

### 4.2 Agent Metrics

| Metric | Color | Description |
|--------|-------|-------------|
| Total Agents | Default | All registered agents |
| Active Agents | Green | Currently active |
| Pending Registration | Orange | Awaiting approval |

### 4.3 Agent Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `fullName` | string | Agent full name |
| `email` | string | Agent email |
| `region` | string | Geographic region |
| `role` | string | Agent role |
| `isActive` | boolean | Active status |
| `registeredAt` | timestamp | Registration date |
| `createdAt` | timestamp | Record creation |
| `telegramChatId` | string | Linked Telegram |
| `whatsappPhone` | string | Linked WhatsApp |

### 4.4 Agent Actions

| Action | Description |
|--------|-------------|
| View Details | Open agent profile |
| Edit | Modify agent information |
| Link Telegram | Associate Telegram chat ID |
| Link WhatsApp | Associate WhatsApp phone |
| Activate/Deactivate | Toggle active status |
| Delete | Remove agent (soft delete) |

---

## SECTION 5: LISTINGS REVIEW

### 5.1 Overview

Listings Review allows admins to review and approve property listings submitted via Telegram/WhatsApp/Web.

| Feature | Description |
|---------|-------------|
| Path | `/admin/listings` |
| Data Source | `propertyListing` table |
| Filtering | Status filter (all, draft, uploaded, failed) |
| Actions | Upload to Zyprus, View external link |

### 5.2 Listing Metrics

| Metric | Icon | Color | Description |
|--------|------|-------|-------------|
| Pending Review | Clock | Yellow | Draft listings awaiting action |
| Uploaded | CheckCircle | Green | Successfully uploaded to Zyprus |
| Total | Building2 | Blue | All listings count |

### 5.3 Listing Table Columns

| Column | Content |
|--------|---------|
| Property | Name, type, bedrooms, size, price |
| Owner | Owner name, phone number |
| Reference / Notes | Reference ID, duplicate warning, AI notes |
| Features | Swimming pool, parking, AC badges |
| Status | Draft, Uploaded, Failed badge |
| Created | Time ago, source (Telegram/Web) |
| Actions | Upload button, View external link |

### 5.4 Status Badges

| Status | Badge Color | Icon |
|--------|-------------|------|
| `uploaded` | Green | CheckCircle |
| `failed` | Red | XCircle |
| `draft` | Yellow | Clock |

### 5.5 Duplicate Detection Display

```
If listing.duplicateDetected:
  Show orange badge: "⚠️ Potential Duplicate"

If listing.propertyNotes:
  Show clickable link: "📄 View AI Notes"
  Opens toast with full notes content
```

### 5.6 Upload Action

```typescript
const handleUpload = async (listingId: string) => {
  const response = await fetch("/api/listings/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId }),
  });

  if (response.ok) {
    toast.success("Listing uploaded to Zyprus!");
    // Open Zyprus listing in new tab if URL returned
  }
};
```

---

## SECTION 6: EXECUTION LOGS

### 6.1 Overview

Execution Logs shows AI agent interactions and tool executions.

| Feature | Description |
|---------|-------------|
| Path | `/admin/logs` |
| Permission | `view_agent_logs` |
| Data Source | `agentExecutionLog` table |

### 6.2 Log Entry Fields

| Field | Description |
|-------|-------------|
| `id` | Unique log ID |
| `agentType` | "chat", "telegram", "whatsapp" |
| `action` | Action performed |
| `modelUsed` | AI model used |
| `success` | Boolean result |
| `metadata` | JSON details |
| `timestamp` | Execution time |

---

## SECTION 7: SYSTEM STATUS

### 7.1 Overview

System Status monitors health of all platform services.

| Feature | Description |
|---------|-------------|
| Path | `/admin/status` |
| Permission | `view_system_health` |
| Data Source | `systemHealthLog` table |

### 7.2 Monitored Services

| Service | Status Indicators |
|---------|-------------------|
| Database | Connection status, uptime |
| AI Gateway | Response status |
| Telegram Bot | Webhook status |
| WhatsApp Bot | Connection status |
| Zyprus API | OAuth status, circuit breaker state |

### 7.3 Health Status Colors

| Status | Color | Indicator |
|--------|-------|-----------|
| `healthy` | Green | Green dot |
| `degraded` | Yellow | Yellow dot |
| `unhealthy` | Red | Red dot |

---

## SECTION 8: API ENDPOINTS

### 8.1 Admin Listings API

**Endpoint:** `GET /api/admin/listings`

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by listing status |

**Response:**
```json
{
  "listings": [
    {
      "id": "uuid",
      "name": "Property Name",
      "price": "500000",
      "status": "draft",
      "ownerName": "John Smith",
      "ownerPhone": "+357 99 123 456",
      "referenceId": "AI-A1B2C3D4",
      "duplicateDetected": false,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 8.2 Admin Agents API

**Endpoint:** `GET /api/admin/agents`

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `region` | string | Filter by region |
| `role` | string | Filter by role |
| `isActive` | boolean | Filter by active status |

**Endpoint:** `POST /api/admin/agents/[id]/link-telegram`
**Endpoint:** `POST /api/admin/agents/[id]/link-whatsapp`

---

## SECTION 9: UI COMPONENTS

### 9.1 Layout Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `AdminLayout` | `app/(admin)/admin/layout.tsx` | Page wrapper with sidebar |
| `AdminSidebar` | `components/admin/sidebar.tsx` | Navigation sidebar |
| `AdminHeader` | `components/admin/header.tsx` | Top header bar |

### 9.2 Dashboard Components

| Component | Purpose |
|-----------|---------|
| `OverviewChart` | Bar chart for activity |
| `DistributionChart` | Pie chart for regions |
| `RecentActivity` | Recent agents widget |

### 9.3 Agents Components

| Component | Purpose |
|-----------|---------|
| `AgentsTable` | Agent listing table |
| `AgentProfileSheet` | Agent detail side panel |
| `AgentEditModal` | Edit agent form |
| `AgentsFilterBar` | Filter controls |
| `BulkActionDialogs` | Bulk operations |
| `ImportAgentsModal` | CSV import |

---

## SECTION 10: DATABASE SCHEMA

### 10.1 Admin User Role Table

```sql
CREATE TABLE admin_user_role (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  permissions JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 10.2 System Health Log Table

```sql
CREATE TABLE system_health_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  message TEXT,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### 10.3 Zyprus Agent Table

```sql
CREATE TABLE zyprus_agent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  region VARCHAR(100),
  role VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  registered_at TIMESTAMP,
  telegram_chat_id VARCHAR(50),
  whatsapp_phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## SECTION 11: BEHAVIOR SUMMARY MATRIX

| Task | Admin's Responsibility | System's Responsibility |
|------|------------------------|------------------------|
| Access control | Authenticate | Verify session and role |
| View dashboard | Navigate to /admin | Fetch and display stats |
| Review listings | Click status filter | Query and display listings |
| Upload listing | Click "Upload to Zyprus" | Execute Zyprus API upload |
| Manage agents | Edit/activate/deactivate | Update database records |
| View logs | Navigate to logs page | Query execution logs |
| Monitor health | View status page | Display health indicators |

---

## SECTION 12: CRITICAL RULES (ALWAYS ENFORCE)

1. **Authentication required** — Redirect to /login if no session

2. **Default admin access** — Grant admin role if no explicit role found

3. **Permission filtering** — Hide navigation items without permission

4. **Superadmin bypass** — Superadmin role has all permissions

5. **Session Pooler required** — Use Vercel-compatible DB connection

6. **Draft listings first** — Show pending reviews prominently

7. **Duplicate warnings** — Always display duplicate detection flags

8. **Reference ID display** — Show for listing identification

9. **Status badges** — Color-coded for quick scanning

10. **Real-time refresh** — Refresh button for listings table

---

*End of Admin Dashboard Specification*

**Sophia Zyprus AI Bot - Qualia Solutions**
