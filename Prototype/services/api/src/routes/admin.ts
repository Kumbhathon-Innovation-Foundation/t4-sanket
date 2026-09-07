import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { generateToken, verifyPassword, requireAdminAuth, AuthenticatedRequest } from '../auth.js';

export const adminRouter = Router();

// POST /api/admin/login — Authenticate PRAVAH police officer & return JWT
adminRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const user = await db.getAdminUser(username);

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = verifyPassword(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: 'admin'
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: 'admin',
        department: 'PRAVAH Police Control Room'
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: String(err) });
  }
});

// POST /api/admin/route-status — Authenticated route override endpoint
adminRouter.post('/route-status', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { route_id, tier, crowd = 'moderate', message_hi, message_mr, message_en, updated_by } = req.body;

    if (!route_id || typeof tier !== 'number') {
      res.status(400).json({ error: 'route_id and tier (number) are required' });
      return;
    }

    const officer = updated_by || `${req.user?.username || 'PRAVAH Officer'} (Police Command Desk)`;

    const updated = await db.updateRouteStatus(
      route_id,
      tier,
      crowd,
      {
        hi: message_hi,
        mr: message_mr,
        en: message_en
      },
      officer
    );

    res.json({
      success: true,
      route: updated,
      broadcast_at: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update route status', details: String(err) });
  }
});

// POST /api/admin/reset — Reset all routes back to normal Tier 4
adminRouter.post('/reset', requireAdminAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const routes = await db.resetAllRoutes();
    res.json({
      success: true,
      routes,
      reset_at: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset routes', details: String(err) });
  }
});
