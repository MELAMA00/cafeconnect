import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 4000;

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// middleware to protect admin routes
function requireAdmin(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change-me');
    req.user = {
      adminId: payload.adminId || payload.id,
      email: payload.email,
      cafeId: payload.cafeId,
    };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// health
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// improved login route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      console.log('❌ Login missing credentials');
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      console.log('❌ Login no admin for', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, admin.password).catch(() => false);
    if (!valid) {
      console.log('❌ Login bad password for', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        adminId: admin.id,
        cafeId: admin.cafeId,
        email: admin.email,
      },
      process.env.JWT_SECRET || 'change-me',
      { expiresIn: '7d' }
    );

    console.log('✅ Login success for', email, 'cafe', admin.cafeId);

    return res.json({
      token,
      email: admin.email,
      cafeId: admin.cafeId,
    });
  } catch (e) {
    console.error('🔥 Login server error', e);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// debug route to check if admin/cafe is seeded in Render DB
// we'll remove this later
app.get('/api/debug-status', async (req, res) => {
  try {
    const cafes = await prisma.cafe.findMany({
      include: { admins: true },
    });

    return res.json({
      cafes: cafes.map(c => ({
        id: c.id,
        name: c.name,
        admins: c.admins.map(a => ({
          id: a.id,
          email: a.email,
          cafeId: a.cafeId,
        })),
      })),
    });
  } catch (err) {
    console.error('debug-status error', err);
    return res.status(500).json({ error: 'debug_failed' });
  }
});

// menu routes
app.get('/api/menu', async (req, res) => {
  try {
    // If authenticated: take cafeId from JWT.
    // If not authenticated: require cafeId in query.
    let cafeId = null;
    const auth = req.headers['authorization'] || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'change-me');
        cafeId = payload.cafeId;
      } catch {}
    }
    if (!cafeId) {
      cafeId = Number(req.query.cafeId);
      if (!cafeId) return res.status(400).json({ error: 'Missing cafeId' });
    }

    const items = await prisma.menuItem.findMany({
      where: { archived: false, cafeId },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    const mapped = items.map(i => ({
      ...i,
      soldOut: !i.available,
    }));

    res.json(mapped);
  } catch (e) {
    console.error('Menu fetch error', e);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

app.post('/api/menu', requireAdmin, async (req, res) => {
  try {
    const { name, category, price, description, imageUrl, available } = req.body || {};
    if (!name || !category || typeof price !== 'number') {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const created = await prisma.menuItem.create({
      data: {
        name,
        category,
        price,
        description: description || null,
        imageUrl: imageUrl || null,
        available: available ?? true,
        cafeId: req.user.cafeId,
      },
    });
    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

app.put('/api/menu/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, category, price, description, imageUrl, available } = req.body || {};
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item || item.cafeId !== req.user.cafeId) {
      return res.status(404).json({ error: 'Not found' });
    }
    const updated = await prisma.menuItem.update({
      where: { id },
      data: { name, category, price, description, imageUrl, available },
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

app.put('/api/menu/:id/availability', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { available } = req.body || {};
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item || item.cafeId !== req.user.cafeId) {
      return res.status(404).json({ error: 'Not found' });
    }
    const updated = await prisma.menuItem.update({
      where: { id },
      data: { available: !!available },
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

app.put('/api/menu/:id/archive', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item || item.cafeId !== req.user.cafeId) {
      return res.status(404).json({ error: 'Not found' });
    }
    const updated = await prisma.menuItem.update({
      where: { id },
      data: { archived: true },
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to archive item' });
  }
});

app.delete('/api/menu/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item || item.cafeId !== req.user.cafeId) {
      return res.status(404).json({ error: 'Not found' });
    }
    await prisma.menuItem.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// orders routes
app.post('/api/orders', async (req, res) => {
  try {
    const { cafeId, tableId, items } = req.body || {};
    if (!cafeId || !tableId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const table = await prisma.table.findUnique({ where: { id: Number(tableId) } });
    if (!table || table.cafeId !== Number(cafeId)) {
      return res.status(400).json({ error: 'Invalid table for cafe' });
    }

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          cafeId: Number(cafeId),
          tableId: Number(tableId),
          status: 'new',
        },
      });

      for (const i of items) {
        if (!i.menuItemId || !i.qty) continue;
        await tx.orderItem.create({
          data: {
            orderId: created.id,
            menuItemId: i.menuItemId,
            quantity: i.qty,
            notes: i.notes || null,
          },
        });
      }

      await tx.table.update({
        where: { id: Number(tableId) },
        data: { status: 'occupied' },
      });

      return created;
    });

    res.status(201).json(order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const auth = req.headers['authorization'] || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    let where = {};
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'change-me');
        where = { cafeId: payload.cafeId };
      } catch {}
    } else {
      const { cafeId, tableId } = req.query;
      if (!cafeId) return res.status(400).json({ error: 'Missing cafeId' });
      where = { cafeId: Number(cafeId) };
      if (tableId) where.tableId = Number(tableId);
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { menuItem: true } } },
    });

    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.put('/api/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};
    if (!['new', 'preparing', 'served', 'paid'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const found = await prisma.order.findUnique({ where: { id } });
    if (!found || found.cafeId !== req.user.cafeId) {
      return res.status(404).json({ error: 'Not found' });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
    });

    if (status === 'paid') {
      await prisma.table.update({
        where: { id: updated.tableId },
        data: { status: 'free' },
      });
    }

    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// requests routes
app.post('/api/requests', async (req, res) => {
  try {
    const { cafeId, tableId, type } = req.body || {};
    if (!cafeId || !tableId || !['water', 'bill', 'waiter'].includes(type)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const table = await prisma.table.findUnique({ where: { id: Number(tableId) } });
    if (!table || table.cafeId !== Number(cafeId)) {
      return res.status(400).json({ error: 'Invalid table for cafe' });
    }

    const created = await prisma.request.create({
      data: {
        cafeId: Number(cafeId),
        tableId: Number(tableId),
        type,
        status: 'new',
      },
    });

    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create request' });
  }
});

app.get('/api/requests', requireAdmin, async (req, res) => {
  try {
    const requests = await prisma.request.findMany({
      where: { status: 'new', cafeId: req.user.cafeId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

app.put('/api/requests/:id/status', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};
    if (status !== 'done') {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const found = await prisma.request.findUnique({ where: { id } });
    if (!found || found.cafeId !== req.user.cafeId) {
      return res.status(404).json({ error: 'Not found' });
    }

    const updated = await prisma.request.update({
      where: { id },
      data: { status },
    });

    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update request status' });
  }
});

// seeding
async function ensureSeed() {
  let cafe = await prisma.cafe.findFirst({ where: { id: 1 } });
  if (!cafe) {
    try {
      cafe = await prisma.cafe.create({
        data: { id: 1, name: 'Default Cafe', address: 'Online' },
      });
      console.log('✅ Seeded default cafe (id=1)');
    } catch {
      cafe = await prisma.cafe.create({
        data: { name: 'Default Cafe', address: 'Online' },
      });
      console.log(`✅ Seeded default cafe (id=${cafe.id})`);
    }
  }

  const existingAdmin = await prisma.admin.findFirst({
    where: { email: 'admin@cafe.com' },
  });

  if (!existingAdmin) {
    const hashed = await bcrypt.hash('admin123', 10);
    await prisma.admin.create({
      data: {
        email: 'admin@cafe.com',
        password: hashed,
        cafeId: cafe.id,
      },
    });
    console.log('✅ Seeded default admin admin@cafe.com / admin123');
  } else {
    console.log('ℹ️ Admin already exists, skipping seed');
  }
}

// start server after seed
ensureSeed()
  .catch(console.error)
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`API running on port ${PORT}`);
    });
  });
