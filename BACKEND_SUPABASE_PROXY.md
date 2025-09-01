# Backend Supabase Storage Proxy Implementation

## Problem
The frontend is getting **400 Bad Request** errors when trying to load images from Supabase storage due to CORS (Cross-Origin Resource Sharing) issues. The Supabase storage bucket is not configured to allow requests from the Vercel domain.

## Solution
Implement a **backend proxy endpoint** that fetches images from Supabase storage and serves them through your Railway backend, which already has proper CORS configuration.

## Backend Implementation

### 1. Add Supabase Client Configuration

First, ensure you have the Supabase client configured in your backend:

```javascript
// In your backend (Node.js/Express)
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
```

### 2. Create Proxy Endpoint

Add this endpoint to your backend API:

```javascript
// Proxy endpoint for Supabase storage
app.get('/api/proxy/supabase-storage/:bucket/:path(*)', async (req, res) => {
  try {
    const { bucket, path } = req.params;
    
    console.log(`🔍 [PROXY] Fetching from bucket: ${bucket}, path: ${path}`);
    
    // Get the file from Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
    
    if (error) {
      console.error('❌ [PROXY] Supabase error:', error);
      return res.status(404).json({ 
        error: 'Image not found',
        details: error.message 
      });
    }
    
    // Convert the blob to buffer
    const buffer = await data.arrayBuffer();
    
    // Set appropriate headers
    res.setHeader('Content-Type', data.type || 'image/jpeg');
    res.setHeader('Content-Length', buffer.byteLength);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Send the image data
    res.send(Buffer.from(buffer));
    
    console.log(`✅ [PROXY] Successfully served image: ${bucket}/${path}`);
    
  } catch (error) {
    console.error('❌ [PROXY] Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Handle OPTIONS requests for CORS preflight
app.options('/api/proxy/supabase-storage/:bucket/:path(*)', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});
```

### 3. Alternative: Direct File URL Approach

If the above doesn't work, you can also try using Supabase's direct file URL approach:

```javascript
// Alternative proxy endpoint using direct file URL
app.get('/api/proxy/supabase-storage/:bucket/:path(*)', async (req, res) => {
  try {
    const { bucket, path } = req.params;
    
    console.log(`🔍 [PROXY] Fetching from bucket: ${bucket}, path: ${path}`);
    
    // Get the public URL from Supabase
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    if (!data.publicUrl) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Fetch the image from the public URL
    const response = await fetch(data.publicUrl);
    
    if (!response.ok) {
      console.error('❌ [PROXY] Fetch error:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: 'Failed to fetch image',
        status: response.status 
      });
    }
    
    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    
    // Set appropriate headers
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Content-Length', imageBuffer.byteLength);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Send the image data
    res.send(Buffer.from(imageBuffer));
    
    console.log(`✅ [PROXY] Successfully served image: ${bucket}/${path}`);
    
  } catch (error) {
    console.error('❌ [PROXY] Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});
```

### 4. Environment Variables

Make sure you have these environment variables in your Railway backend:

```env
SUPABASE_URL=https://fitobjouvvxbpqdcgxvg.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 5. Dependencies

Ensure you have the Supabase client installed:

```bash
npm install @supabase/supabase-js
```

## Testing the Proxy

After implementing the proxy, test it with:

```bash
# Test the proxy endpoint
curl -I "https://api.groshly.com/api/proxy/supabase-storage/Beena%20Stores/Store%20Images/1756649550140-cd6ba9946ac1dbfe.png"
```

## Expected Response

The proxy should return:
- **Status**: 200 OK
- **Headers**: Proper CORS headers and content-type
- **Body**: The actual image data

## Frontend Integration

The frontend is already configured to use this proxy. The `getSupabaseImageUrl` function will automatically convert Supabase URLs to use your backend proxy:

```
Original: https://fitobjouvvxbpqdcgxvg.supabase.co/storage/v1/object/public/Beena%20Stores/Store%20Images/1756649550140-cd6ba9946ac1dbfe.png

Proxy: https://api.groshly.com/api/proxy/supabase-storage/Beena%20Stores/Store%20Images/1756649550140-cd6ba9946ac1dbfe.png
```

## Benefits

1. **Solves CORS Issues**: Images are served through your backend which has proper CORS configuration
2. **Better Performance**: Can implement caching at the backend level
3. **Security**: Can add authentication/authorization if needed
4. **Consistency**: All API calls go through the same domain

## Next Steps

1. Implement the proxy endpoint in your Railway backend
2. Test the endpoint directly
3. Deploy the backend changes
4. Test the frontend image loading

The frontend will automatically start working once the backend proxy is implemented!
