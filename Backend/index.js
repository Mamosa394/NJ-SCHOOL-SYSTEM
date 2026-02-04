require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase client - using the keys from your .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Required in .env file:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=your-project-url');
  console.error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key');
  process.exit(1);
}

console.log('🔧 Initializing Supabase with:');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // React frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Optional: Parse Supabase JWT from Authorization header
const extractSupabaseUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        req.user = user;
        req.supabaseToken = token;
      }
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next();
  }
};

// Apply auth middleware to all routes (optional)
app.use(extractSupabaseUser);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'Express.js',
    supabase: 'Connected',
    timestamp: new Date().toISOString()
  });
});

// Auth endpoints that work with Supabase
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || '',
          created_at: new Date().toISOString()
        }
      }
    });

    if (error) {
      console.error('Supabase registration error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      message: data.user?.identities?.length === 0 
        ? 'Registration successful! Please check your email for confirmation.'
        : 'Registration successful!',
      user: data.user,
      session: data.session
    });

  } catch (error) {
    console.error('Server registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Supabase login error:', error);
      return res.status(401).json({ error: error.message });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: data.user,
      session: data.session,
      access_token: data.session.access_token
    });

  } catch (error) {
    console.error('Server login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const token = req.supabaseToken;
    
    if (token) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase logout error:', error);
      }
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Server logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/profile', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated. Please login first.'
      });
    }

    res.json({
      success: true,
      user: req.user
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected route example
app.get('/api/protected/data', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Use the authenticated user's token to make Supabase requests
    const userToken = req.supabaseToken;
    
    // Create a client with the user's token for row-level security
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      }
    });

    // Example: Get user's data from a table with RLS
    const { data: userData, error } = await userSupabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      message: `Welcome ${req.user.email}`,
      user: req.user,
      profile: userData || {}
    });

  } catch (error) {
    console.error('Protected route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Example CRUD operations for a todos table
app.get('/api/todos', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Create client with user's token for RLS
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${req.supabaseToken}`
        }
      }
    });

    const { data, error } = await userSupabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      todos: data || []
    });

  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/todos', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({
        error: 'Title is required'
      });
    }

    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${req.supabaseToken}`
        }
      }
    });

    const { data, error } = await userSupabase
      .from('todos')
      .insert({
        user_id: req.user.id,
        title,
        description: description || '',
        completed: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Todo created successfully',
      todo: data
    });

  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test Supabase connection
app.get('/api/test', async (req, res) => {
  try {
    // Test auth connection
    const { data: sessionData } = await supabase.auth.getSession();
    
    // Test database connection (try to get server time from Supabase)
    const { data: timeData, error } = await supabase
      .from('todos')
      .select('created_at')
      .limit(1);

    res.json({
      success: true,
      message: 'Supabase connection test',
      supabaseUrl: supabaseUrl,
      authWorking: !!sessionData,
      databaseWorking: !error,
      hasTables: timeData !== null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      supabaseUrl: supabaseUrl
    });
  }
});

// Serve static files in production (if you're serving React build)
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

app.get("/api/students", async (req, res) => {
  const { data, error } = await supabase
    .from("students")
    .select("*");

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📚 API available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
});