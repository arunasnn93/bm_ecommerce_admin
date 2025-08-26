# Rate Limiting Guide & Fixes

## 🚨 Issue Identified: Excessive API Calls After Login

### Root Cause
The Dashboard page was making aggressive API calls immediately after login:
- **Dashboard stats**: Every 30 seconds
- **Recent orders**: Every 60 seconds  
- **Recent users**: Every 60 seconds

When user logs in → redirects to dashboard → **3 queries fire instantly** → rate limit exceeded (429 error)

## ✅ Fixes Applied

### 1. Dashboard Query Optimization
```typescript
// BEFORE (Aggressive)
refetchInterval: 30000, // 30 seconds
refetchInterval: 60000, // 60 seconds

// AFTER (Conservative)
refetchInterval: 5 * 60 * 1000, // 5 minutes
staleTime: 2 * 60 * 1000, // Fresh for 2 minutes
enabled: !!user, // Only fetch when authenticated
```

### 2. Global React Query Settings
```typescript
// Added 429 error handling
retry: (failureCount, error: any) => {
  if (error?.response?.status === 429) {
    return false; // Don't retry rate limits
  }
  return failureCount < 2;
}
```

### 3. Authentication-Aware Queries
```typescript
// Only fetch when user is authenticated
enabled: !!user,
```

## 📊 Current API Call Frequency

| Component | Before | After | Reduction |
|-----------|--------|--------|-----------|
| Dashboard Stats | 30s | 5min | **10x less** |
| Recent Orders | 60s | 10min | **10x less** |
| Recent Users | 60s | 10min | **10x less** |

## 🛠️ Debugging Rate Limits

### Check Current Rate Limit Status
```bash
# Check backend headers
curl -I http://localhost:3000/health

# Look for these headers:
# ratelimit-limit: 100
# ratelimit-remaining: 85
# ratelimit-reset: 544
```

### Monitor API Calls in Browser
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Look for excessive calls to `/api/` endpoints
4. Check response headers for rate limit info

### Login Page Rate Limit Headers
The login error will show:
```json
{
  "status": 429,
  "rateLimitInfo": {
    "ratelimit-limit": "100",
    "ratelimit-remaining": "0", 
    "ratelimit-reset": "544"
  }
}
```

## 🔧 Quick Fixes

### If Rate Limited Right Now:
1. **Wait**: Check `ratelimit-reset` header for exact wait time
2. **Clear Cache**: Hard refresh (Cmd+Shift+R)
3. **Incognito Mode**: Fresh session without cached requests
4. **Backend Reset**: Restart your backend if possible

### For Development:
```bash
# Use the rate limit fix script
./fix-rate-limit.sh
```

### Emergency Query Disable:
```typescript
// Temporarily disable all dashboard queries
enabled: false, // Add this to any useQuery
```

## 🎯 Best Practices Moving Forward

### Query Design:
- **Stale Time**: Data fresh for 5+ minutes
- **Refetch Interval**: 5+ minutes minimum
- **Authentication Guard**: `enabled: !!user`
- **Error Handling**: Don't retry 429 errors

### Backend Considerations:
- Development: 1000+ requests/15min
- Production: 100 requests/15min
- Whitelist localhost in development
- Progressive backoff for repeated failures

### Monitoring:
- Track query frequency in React Query DevTools
- Monitor rate limit headers in Network tab
- Log excessive API calls in console

## 🚀 Performance Benefits

- **Reduced Server Load**: 10x fewer API calls
- **Better UX**: No more rate limit errors during login
- **Battery Saving**: Less network activity on mobile
- **Cost Reduction**: Fewer backend requests

## 📋 Rate Limit Checklist

- [ ] Dashboard queries use 5+ minute intervals
- [ ] All queries have `enabled: !!user`
- [ ] React Query doesn't retry 429 errors
- [ ] Backend has development-friendly limits
- [ ] Rate limit fix script is available
- [ ] Team knows monitoring techniques
