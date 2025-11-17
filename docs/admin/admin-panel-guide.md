# SOFIA Admin Panel Guide

**Last Updated**: 2025-01-17
**Version**: 3.1.0
**Status**: ✅ Production Ready

## Overview

The SOFIA Admin Panel provides comprehensive management capabilities for the Cyprus real estate AI assistant platform. This guide covers all admin functionality, user management, system monitoring, and operational workflows.

## Access Requirements

### Authentication

- **URL**: `https://sofiatesting.vercel.app/admin`
- **Authentication Required**: Yes (via NextAuth)
- **Role-Based Access**: Admin role verification required
- **Database Schema**: Migration 0013_fearless_viper must be applied

### User Roles

```typescript
// Database schema defines user roles
type UserRole = 'admin' | 'user' | 'guest';

// Admin panel access requires adminUserRole export
import { adminUserRole } from '@/lib/db/schema';
```

## Dashboard Overview

### Main Dashboard (`/admin`)

**Purpose**: System-wide overview and quick actions
**Components**:
- Overview metrics
- Recent activity log
- System health status
- Quick action buttons

#### Key Metrics Displayed

- **Total Users**: Registered user count
- **Active Sessions**: Current user sessions
- **Properties Uploaded**: Today's upload count
- **AI Requests**: API call volume
- **Success Rate**: Property upload percentage
- **System Health**: Overall platform status

#### Quick Actions

- **View All Users**: Navigate to user management
- **Monitor Agents**: Access agent execution logs
- **Check Integrations**: View third-party service status
- **System Health**: Detailed health monitoring

### Data Sources

```typescript
// Dashboard data aggregation
const dashboardMetrics = {
  totalUsers: await db.select().from(users),
  activeSessions: await redis.keys('session:*'),
  todayUploads: await db.select()
    .from(propertyListings)
    .where(eq(propertyListings.createdAt, today)),
  systemHealth: await checkSystemHealth()
};
```

## User Management

### User Overview (`/admin/users`)

**Purpose**: Complete user lifecycle management
**Features**: User search, role management, activity tracking

#### User Information Displayed

- **User Profile**: Name, email, registration date
- **Authentication**: Provider (Google, Email, Guest)
- **Activity**: Last login, message count, property uploads
- **Role Management**: Current role, role change capability
- **Status**: Active, suspended, or archived

#### User Actions

```typescript
// Role management operations
const updateUserRole = async (userId: string, newRole: UserRole) => {
  await db.update(users)
    .set({ role: newRole, updatedAt: new Date() })
    .where(eq(users.id, userId));
};

// User suspension
const suspendUser = async (userId: string, reason: string) => {
  await db.update(users)
    .set({ status: 'suspended', suspensionReason: reason })
    .where(eq(users.id, userId));
};
```

#### User Search and Filtering

- **Search**: By name, email, or user ID
- **Filter**: By role, registration date range, activity level
- **Sort**: By various user attributes
- **Pagination**: Configurable page sizes

### User Analytics

- **Registration Trends**: New users over time
- **Activity Patterns**: Peak usage times
- **Feature Usage**: Property uploads, chat messages
- **Geographic Distribution**: User locations (if available)

## Agent Monitoring

### Agent Execution (`/admin/agents`)

**Purpose**: Monitor AI agent performance and execution
**Components**: Execution logs, performance metrics, error tracking

#### Execution Metrics

- **Total Executions**: Agent run count
- **Success Rate**: Percentage of successful executions
- **Average Duration**: Execution time statistics
- **Error Distribution**: Common error types
- **Resource Usage**: CPU and memory consumption

#### Execution Logs Table

```typescript
// Agent execution log structure
interface AgentExecutionLog {
  id: string;
  agentType: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  status: 'success' | 'error' | 'timeout';
  inputTokens: number;
  outputTokens: number;
  errorMessage?: string;
  metadata: Record<string, any>;
}
```

#### Performance Analytics

- **Response Time Trends**: Performance over time
- **Token Usage**: Input/output consumption
- **Error Patterns**: Common failure scenarios
- **User Impact**: Affected users and sessions

### Agent Configuration

- **Model Settings**: AI model configurations
- **Rate Limits**: Per-user and global limits
- **Feature Flags**: Toggle agent capabilities
- **A/B Testing**: Experimental configurations

## Integration Monitoring

### Integration Overview (`/admin/integrations`)

**Purpose**: Monitor third-party service integrations
**Services**: Zyprus, AI Gateway, Telegram, Redis, Database

#### Zyprus Integration Status

```typescript
interface ZyprusStatus {
  apiStatus: 'healthy' | 'degraded' | 'down';
  lastSuccessfulUpload: Date;
  uploadCount24h: number;
  errorRate: number;
  circuitBreakerStatus: 'closed' | 'open' | 'half-open';
  authenticationStatus: 'valid' | 'expired' | 'invalid';
}
```

#### AI Gateway Status

```typescript
interface AIProviderStatus {
  claude: {
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    errorRate: number;
    modelStatus: Record<string, 'available' | 'unavailable'>;
  };
  gemini: {
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    errorRate: number;
    modelStatus: Record<string, 'available' | 'unavailable'>;
  };
}
```

#### Communication Services

**Telegram Bot Status**:
- Bot connectivity
- Message delivery rate
- Webhook status
- Active subscribers

**WhatsApp Status** (Future):
- API connectivity
- Message templates
- Phone number status

#### Infrastructure Services

**Database Status**:
- Connection health
- Query performance
- Backup status
- Storage usage

**Redis/KV Status**:
- Connection health
- Memory usage
- Cache hit rates
- Key statistics

## System Health Monitoring

### Health Metrics

#### Application Performance

- **Response Times**: API endpoint latency
- **Error Rates**: HTTP error distribution
- **Throughput**: Requests per minute
- **Availability**: Uptime percentage

#### Infrastructure Health

- **Server Resources**: CPU, memory, disk usage
- **Database Performance**: Query times, connection pool
- **Cache Performance**: Hit rates, memory usage
- **Network Latency**: External API response times

#### Business Metrics

- **User Engagement**: Daily active users
- **Feature Adoption**: Property upload rates
- **Conversion Rates**: Property creation success
- **Customer Satisfaction**: User feedback scores

### Alert System

```typescript
// Alert configuration
interface AlertConfig {
  metric: string;
  threshold: number;
  operator: '>' | '<' | '=' | '>=';
  severity: 'info' | 'warning' | 'critical';
  notificationChannels: ('email' | 'slack' | 'webhook')[];
}

// Example alert configurations
const alerts = [
  {
    metric: 'error_rate',
    threshold: 5,
    operator: '>',
    severity: 'warning',
    notificationChannels: ['email', 'slack']
  },
  {
    metric: 'response_time',
    threshold: 2000,
    operator: '>',
    severity: 'critical',
    notificationChannels: ['email', 'webhook']
  }
];
```

## Audit Logging

### Activity Tracking

All admin actions are logged for security and compliance:

```typescript
// Audit log structure
interface AdminAuditLog {
  id: string;
  adminUserId: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  changes?: Record<string, any>;
}
```

### Tracked Actions

- **User Management**: Role changes, suspensions, deletions
- **System Configuration**: Settings changes, feature flags
- **Data Access**: Record exports, bulk operations
- **Authentication**: Login attempts, permission changes

## Security Features

### Access Control

- **Role-Based Access**: Minimum privilege principle
- **Two-Factor Authentication**: Optional enhanced security
- **Session Management**: Secure session handling
- **IP Restrictions**: Configurable access limitations

### Data Protection

- **PII Protection**: Personal data encryption
- **Audit Trails**: Complete action logging
- **Data Retention**: Configurable retention policies
- **Compliance**: GDPR and data protection regulations

## Reporting

### Pre-built Reports

1. **User Activity Report**: Daily, weekly, monthly usage
2. **Property Upload Report**: Success rates, error analysis
3. **Performance Report**: System metrics over time
4. **Financial Report**: API costs, token usage

### Custom Reports

- **Date Range Selection**: Flexible time periods
- **Metric Selection**: Choose specific KPIs
- **Export Options**: CSV, PDF, Excel formats
- **Scheduled Reports**: Automated delivery

## Troubleshooting

### Common Issues

#### Dashboard Not Loading

**Symptoms**: Blank page, loading spinner
**Causes**: Database connection, authentication, permissions
**Solutions**:
1. Check database connectivity
2. Verify user has admin role
3. Clear browser cache
4. Check browser console for errors

#### Data Not Updating

**Symptoms**: Stale metrics, old data
**Causes**: Cache issues, database lag
**Solutions**:
1. Clear Redis cache
2. Check database replication
3. Verify background jobs running
4. Check system time synchronization

#### Permission Errors

**Symptoms**: Access denied, missing data
**Causes**: Role configuration, database schema
**Solutions**:
1. Verify user role assignment
2. Check database migration status
3. Review permission configuration
4. Contact system administrator

### Debug Tools

```bash
# Check database migration
pnpm db:studio

# Verify Redis connection
redis-cli ping

# Check application logs
npx vercel logs sofiatesting.vercel.app

# Monitor system resources
top -p $(pgrep node)
```

## API Endpoints

### Admin API Routes

```typescript
// GET /api/admin/users
// List all users with pagination and filtering
GET /api/admin/users?page=1&limit=50&role=admin&search=john

// PUT /api/admin/users/[id]/role
// Update user role
PUT /api/admin/users/user-id-123/role
{
  "role": "admin",
  "reason": "Promoted to admin access"
}

// GET /api/admin/metrics
// Get dashboard metrics
GET /api/admin/metrics?period=24h

// GET /api/admin/health
// Get system health status
GET /api/admin/health

// GET /api/admin/audit-logs
// Get audit log entries
GET /api/admin/audit-logs?page=1&limit=100&action=role_change
```

## Database Schema

### Admin Tables (Migration 0013)

```sql
-- Users with admin roles
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Agent execution logs
CREATE TABLE agent_execution_logs (
  id UUID PRIMARY KEY,
  agent_type VARCHAR(100),
  user_id UUID REFERENCES users(id),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status VARCHAR(20),
  input_tokens INTEGER,
  output_tokens INTEGER,
  error_message TEXT,
  metadata JSONB
);

-- Admin audit logs
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY,
  admin_user_id UUID REFERENCES users(id),
  action VARCHAR(100),
  resource VARCHAR(100),
  resource_id UUID,
  timestamp TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  changes JSONB
);

-- System health logs
CREATE TABLE system_health_logs (
  id UUID PRIMARY KEY,
  metric_name VARCHAR(100),
  value DECIMAL,
  status VARCHAR(20),
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- Integration status tracking
CREATE TABLE integration_status (
  id UUID PRIMARY KEY,
  service_name VARCHAR(100),
  status VARCHAR(20),
  last_check TIMESTAMP DEFAULT NOW(),
  error_message TEXT,
  metadata JSONB
);
```

## Performance Optimization

### Dashboard Performance

- **Data Caching**: Redis caching for dashboard metrics
- **Lazy Loading**: Component-level data fetching
- **Pagination**: Efficient data pagination
- **Database Indexes**: Optimized query performance

### Monitoring Performance

- **Background Jobs**: Async metric collection
- **Sampling**: Rate-limited data collection
- **Compression**: Compressed API responses
- **CDN**: Static asset optimization

## Future Enhancements

### Planned Features

1. **Real-time Updates**: WebSocket-based live monitoring
2. **Advanced Analytics**: Machine learning insights
3. **Mobile Support**: Responsive admin interface
4. **Multi-tenant**: Organization-based access control
5. **API Documentation**: Swagger/OpenAPI integration

### Roadmap

- **Q1 2025**: Enhanced user analytics, custom reports
- **Q2 2025**: Real-time monitoring, mobile app
- **Q3 2025**: Advanced security features, compliance tools
- **Q4 2025**: AI-powered insights, predictive analytics

## Related Documentation

- [API Documentation](../api/zyprus-integration.md)
- [Property Upload Workflow](../development/property-upload-workflow.md)
- [Bug Fixes Report](../bug-fixes/zyprus-property-upload-critical-fixes-2025-01-17.md)
- [Database Schema](../../lib/db/schema.ts)

---

**Last Updated**: 2025-01-17
**Maintainers**: SOFIA Development Team
**Status**: ✅ Production Ready