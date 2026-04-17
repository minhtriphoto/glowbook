import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';

// Initialize Database
const db = new Database('app.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    avatar TEXT
  );
  
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    userId TEXT,
    name TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    createdAt TEXT
  );
  
  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    userId TEXT,
    clientId TEXT,
    clientName TEXT,
    serviceType TEXT,
    price REAL,
    date TEXT,
    location TEXT,
    status TEXT
  );
`);

async function startServer() {
  const app = express();
  
  app.use(express.json());
  app.use(cookieParser());

  // --- AUTH MIDDLEWARE ---
  const requireAuth = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      req.userId = decoded.userId;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // --- AUTH ROUTES ---
  app.get('/api/auth/url', (req, res) => {
    const { redirectUri } = req.query;
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID || '',
      redirect_uri: redirectUri as string,
      scope: 'read:user user:email',
    });
    res.json({ url: `https://github.com/login/oauth/authorize?${params}` });
  });

  app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
    const { code } = req.query;
    try {
      // 1. Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code
        })
      });
      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        throw new Error('No access token returned from GitHub');
      }

      // 2. Get user info
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json'
        }
      });
      const githubUser = await userResponse.json();
      
      // Get primary email
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json'
        }
      });
      const emails = await emailResponse.json();
      const primaryEmail = emails.find((e: any) => e.primary)?.email || emails[0]?.email;

      // 3. Upsert user in DB
      const userId = `github_${githubUser.id}`;
      const stmt = db.prepare('INSERT INTO users (id, name, email, avatar) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, email=excluded.email, avatar=excluded.avatar');
      stmt.run(userId, githubUser.name || githubUser.login, primaryEmail || '', githubUser.avatar_url);

      // 4. Generate JWT & Set Cookie
      const jwtToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', jwtToken, {
        secure: true,
        sameSite: 'none',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // 5. Send success to popup opener
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);

    } catch (error: any) {
      console.error('Github auth error:', error);
      res.status(500).send('Authentication failed: ' + error.message);
    }
  });

  app.get('/api/auth/me', requireAuth, (req: any, res: any) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    res.json({ user });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token', { secure: true, sameSite: 'none', httpOnly: true });
    res.json({ success: true });
  });

  // --- APP ROUTES ---
  app.get('/api/clients', requireAuth, (req: any, res: any) => {
    const clients = db.prepare('SELECT * FROM clients WHERE userId = ? ORDER BY createdAt DESC').all(req.userId);
    res.json({ clients });
  });

  app.post('/api/clients', requireAuth, (req: any, res: any) => {
    const { name, phone, email, notes } = req.body;
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    
    db.prepare('INSERT INTO clients (id, userId, name, phone, email, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.userId, name, phone, email, notes, createdAt);
      
    res.json({ id, name, phone, email, notes, createdAt });
  });

  app.get('/api/bookings', requireAuth, (req: any, res: any) => {
    const bookings = db.prepare('SELECT * FROM bookings WHERE userId = ? ORDER BY date ASC').all(req.userId);
    // Parse numeric date back to number or string so frontend works
    const parsed = bookings.map(b => ({ ...b, date: new Date(b.date).getTime() }));
    res.json({ bookings: parsed });
  });

  app.post('/api/bookings', requireAuth, (req: any, res: any) => {
    const { clientId, clientName, serviceType, price, date, location } = req.body;
    const id = uuidv4();
    
    db.prepare('INSERT INTO bookings (id, userId, clientId, clientName, serviceType, price, date, location, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.userId, clientId, clientName, serviceType, price, date, location || 'Studio', 'pending');
      
    res.json({ id });
  });

  app.put('/api/bookings/:id/status', requireAuth, (req: any, res: any) => {
    const { status } = req.body;
    db.prepare('UPDATE bookings SET status = ? WHERE id = ? AND userId = ?').run(status, req.params.id, req.userId);
    res.json({ success: true });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
