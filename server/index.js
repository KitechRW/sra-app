const express  = require('express');
const cors     = require('cors');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const path     = require('path');
const db       = require('./db');
require('dotenv').config();

const app        = express();
const PORT       = process.env.PORT || 5000;
const HOST       = process.env.HOST || '127.0.0.1';
const JWT_SECRET = process.env.JWT_SECRET || 'sra-secret-2024';

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'sra-app' });
});

// ── Auth Middleware ──────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
};

// ════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.execute('SELECT * FROM users WHERE Email = ?', [email]);
    const user = rows[0];
    if (!user || !bcrypt.compareSync(password, user.Password))
      return res.status(400).json({ error: 'Invalid email or password' });
    const token = jwt.sign(
      { id: user.UserID, email: user.Email, role: user.Role, name: user.Name },
      JWT_SECRET, { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.UserID, name: user.Name, email: user.Email, role: user.Role } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const hash = bcrypt.hashSync(newPassword, 10);
    await db.execute('UPDATE users SET Password = ? WHERE Email = ?', [hash, email]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ════════════════════════════════════════════════════════════
app.get('/api/dashboard/stats', auth, async (req, res) => {
  try {
    const [[clients]]    = await db.execute('SELECT COUNT(*) AS total FROM Client');
    const [[bikes]]      = await db.execute(`SELECT COUNT(*) AS total, SUM(Status="active") AS active, SUM(Status="inactive") AS inactive FROM Bikes`);
    const [[riders]]     = await db.execute(`SELECT COUNT(*) AS total, SUM(Status="active") AS active FROM RiderRegistration`);
    const [[versements]] = await db.execute(`SELECT COUNT(*) AS total, COALESCE(SUM(AmountVersement),0) AS totalAmount FROM Versement`);
    const [[thisWeek]]   = await db.execute(`SELECT COALESCE(SUM(AmountVersement),0) AS amount FROM Versement WHERE WeekVersement = WEEK(NOW())`);
    const [[insurance]]  = await db.execute(`SELECT SUM(InsuranceEndDate < NOW()) AS expired, SUM(InsuranceEndDate BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY)) AS expiringSoon FROM Bikes`);
    const [[auth_exp]]   = await db.execute(`SELECT SUM(AuthorizationEndDate < NOW()) AS expired, SUM(AuthorizationEndDate BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY)) AS expiringSoon FROM Bikes`);

    res.json({
      totalClients:      clients.total,
      totalBikes:        bikes.total,
      activeBikes:       bikes.active,
      inactiveBikes:     bikes.inactive,
      totalRiders:       riders.total,
      activeRiders:      riders.active,
      totalVersements:   versements.total,
      totalAmount:       versements.totalAmount,
      thisWeekAmount:    thisWeek.amount,
      insuranceExpired:  insurance.expired,
      insuranceSoon:     insurance.expiringSoon,
      authExpired:       auth_exp.expired,
      authSoon:          auth_exp.expiringSoon,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════
// CLIENT
// ════════════════════════════════════════════════════════════
app.get('/api/clients', auth, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT c.*, COUNT(b.BikeID) AS BikeCount
      FROM Client c LEFT JOIN Bikes b ON b.OwnerBikeID = c.ClientID
      GROUP BY c.ClientID ORDER BY c.CreatedAt DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/clients/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Client WHERE ClientID = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Client not found' });
    const [bikes] = await db.execute('SELECT * FROM Bikes WHERE OwnerBikeID = ?', [req.params.id]);
    res.json({ ...rows[0], bikes });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/clients', auth, async (req, res) => {
  try {
    const { OwnerName, TIN, OwnerPhone, OwnerEmail, OwnerAddress, RegistrationNo } = req.body;
    const [result] = await db.execute(
      'INSERT INTO Client (OwnerName, TIN, OwnerPhone, OwnerEmail, OwnerAddress, RegistrationNo) VALUES (?,?,?,?,?,?)',
      [OwnerName, TIN||null, OwnerPhone||null, OwnerEmail||null, OwnerAddress||null, RegistrationNo||null]
    );
    const [rows] = await db.execute('SELECT * FROM Client WHERE ClientID = ?', [result.insertId]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/clients/:id', auth, async (req, res) => {
  try {
    const fields = ['OwnerName','TIN','OwnerPhone','OwnerEmail','OwnerAddress','RegistrationNo','NumberOfBikes'];
    const sets = [], vals = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { sets.push(`${f}=?`); vals.push(req.body[f]); }});
    if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
    vals.push(req.params.id);
    await db.execute(`UPDATE Client SET ${sets.join(',')} WHERE ClientID=?`, vals);
    const [rows] = await db.execute('SELECT * FROM Client WHERE ClientID=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/clients/:id', auth, async (req, res) => {
  try {
    await db.execute('DELETE FROM Client WHERE ClientID=?', [req.params.id]);
    res.json({ message: 'Client deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════
// BIKES
// ════════════════════════════════════════════════════════════
app.get('/api/bikes', auth, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT b.*, c.OwnerName, c.OwnerPhone,
        CASE WHEN b.InsuranceEndDate < NOW() THEN 'expired'
             WHEN b.InsuranceEndDate < DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 'expiring'
             ELSE 'valid' END AS InsuranceStatus,
        CASE WHEN b.AuthorizationEndDate < NOW() THEN 'expired'
             WHEN b.AuthorizationEndDate < DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 'expiring'
             ELSE 'valid' END AS AuthorizationStatus
      FROM Bikes b
      JOIN Client c ON c.ClientID = b.OwnerBikeID
      ORDER BY b.CreatedAt DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/bikes/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT b.*, c.OwnerName FROM Bikes b
      JOIN Client c ON c.ClientID = b.OwnerBikeID
      WHERE b.BikeID=?`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Bike not found' });
    const [riders] = await db.execute('SELECT * FROM RiderRegistration WHERE BikeID=?', [req.params.id]);
    res.json({ ...rows[0], riders });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/bikes', auth, async (req, res) => {
  try {
    const { OwnerBikeID, BikeModel, BikeType, BikeChassis, BikePlate,
            AuthorizationStartDate, AuthorizationEndDate, InsuranceStartDate, InsuranceEndDate } = req.body;
    const [result] = await db.execute(
      `INSERT INTO Bikes (OwnerBikeID,BikeModel,BikeType,BikeChassis,BikePlate,
        AuthorizationStartDate,AuthorizationEndDate,InsuranceStartDate,InsuranceEndDate)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [OwnerBikeID, BikeModel||null, BikeType||null, BikeChassis||null, BikePlate||null,
       AuthorizationStartDate||null, AuthorizationEndDate||null, InsuranceStartDate||null, InsuranceEndDate||null]
    );
    // Update client bike count
    await db.execute('UPDATE Client SET NumberOfBikes = (SELECT COUNT(*) FROM Bikes WHERE OwnerBikeID=?) WHERE ClientID=?', [OwnerBikeID, OwnerBikeID]);
    const [rows] = await db.execute('SELECT b.*, c.OwnerName FROM Bikes b JOIN Client c ON c.ClientID=b.OwnerBikeID WHERE b.BikeID=?', [result.insertId]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/bikes/:id', auth, async (req, res) => {
  try {
    const fields = ['BikeModel','BikeType','BikeChassis','BikePlate','AuthorizationStartDate',
                    'AuthorizationEndDate','InsuranceStartDate','InsuranceEndDate','Status'];
    const sets = [], vals = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { sets.push(`${f}=?`); vals.push(req.body[f]); }});
    if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
    vals.push(req.params.id);
    await db.execute(`UPDATE Bikes SET ${sets.join(',')} WHERE BikeID=?`, vals);
    const [rows] = await db.execute('SELECT b.*, c.OwnerName FROM Bikes b JOIN Client c ON c.ClientID=b.OwnerBikeID WHERE b.BikeID=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/bikes/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT OwnerBikeID FROM Bikes WHERE BikeID=?', [req.params.id]);
    await db.execute('DELETE FROM Bikes WHERE BikeID=?', [req.params.id]);
    if (rows[0]) await db.execute('UPDATE Client SET NumberOfBikes=(SELECT COUNT(*) FROM Bikes WHERE OwnerBikeID=?) WHERE ClientID=?', [rows[0].OwnerBikeID, rows[0].OwnerBikeID]);
    res.json({ message: 'Bike deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════
// RIDER REGISTRATION
// ════════════════════════════════════════════════════════════
app.get('/api/riders', auth, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT r.*, b.BikePlate, b.BikeModel, c.OwnerName
      FROM RiderRegistration r
      JOIN Bikes b ON b.BikeID = r.BikeID
      JOIN Client c ON c.ClientID = b.OwnerBikeID
      ORDER BY r.CreatedAt DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/riders/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT r.*, b.BikePlate, b.BikeModel FROM RiderRegistration r
      JOIN Bikes b ON b.BikeID=r.BikeID WHERE r.RiderRegistrationID=?`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Rider not found' });
    const [versements] = await db.execute('SELECT * FROM Versement WHERE RiderRegistrationID=? ORDER BY VersementDate DESC', [req.params.id]);
    res.json({ ...rows[0], versements });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/riders', auth, async (req, res) => {
  try {
    const { BikeID, Name, NationalID, Phone, PermitNumber } = req.body;
    const [result] = await db.execute(
      'INSERT INTO RiderRegistration (BikeID,Name,NationalID,Phone,PermitNumber) VALUES (?,?,?,?,?)',
      [BikeID, Name, NationalID, Phone||null, PermitNumber||null]
    );
    const [rows] = await db.execute(`SELECT r.*,b.BikePlate,b.BikeModel FROM RiderRegistration r JOIN Bikes b ON b.BikeID=r.BikeID WHERE r.RiderRegistrationID=?`, [result.insertId]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/riders/:id', auth, async (req, res) => {
  try {
    const fields = ['BikeID','Name','NationalID','Phone','PermitNumber','Status'];
    const sets = [], vals = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { sets.push(`${f}=?`); vals.push(req.body[f]); }});
    vals.push(req.params.id);
    await db.execute(`UPDATE RiderRegistration SET ${sets.join(',')} WHERE RiderRegistrationID=?`, vals);
    const [rows] = await db.execute('SELECT r.*,b.BikePlate,b.BikeModel FROM RiderRegistration r JOIN Bikes b ON b.BikeID=r.BikeID WHERE r.RiderRegistrationID=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/riders/:id', auth, async (req, res) => {
  try {
    await db.execute('DELETE FROM RiderRegistration WHERE RiderRegistrationID=?', [req.params.id]);
    res.json({ message: 'Rider deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════
// VERSEMENT
// ════════════════════════════════════════════════════════════
app.get('/api/versements', auth, async (req, res) => {
  try {
    const { week, bikeId, riderId } = req.query;
    let sql = `
      SELECT v.*, b.BikePlate, b.BikeModel, r.Name AS RiderName, r.Phone AS RiderPhone
      FROM Versement v
      JOIN Bikes b ON b.BikeID = v.BikeID
      JOIN RiderRegistration r ON r.RiderRegistrationID = v.RiderRegistrationID
      WHERE 1=1
    `;
    const params = [];
    if (week)    { sql += ' AND v.WeekVersement=?'; params.push(week); }
    if (bikeId)  { sql += ' AND v.BikeID=?';        params.push(bikeId); }
    if (riderId) { sql += ' AND v.RiderRegistrationID=?'; params.push(riderId); }
    sql += ' ORDER BY v.VersementDate DESC, v.VersementID DESC';
    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/versements', auth, async (req, res) => {
  try {
    const { BikeID, RiderRegistrationID, AmountVersement, VersementDate, WeekVersement } = req.body;
    const [result] = await db.execute(
      'INSERT INTO Versement (BikeID,RiderRegistrationID,AmountVersement,VersementDate,WeekVersement) VALUES (?,?,?,?,?)',
      [BikeID, RiderRegistrationID, AmountVersement, VersementDate, WeekVersement]
    );
    const [rows] = await db.execute(`
      SELECT v.*,b.BikePlate,b.BikeModel,r.Name AS RiderName
      FROM Versement v JOIN Bikes b ON b.BikeID=v.BikeID
      JOIN RiderRegistration r ON r.RiderRegistrationID=v.RiderRegistrationID
      WHERE v.VersementID=?`, [result.insertId]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/versements/:id', auth, async (req, res) => {
  try {
    await db.execute('DELETE FROM Versement WHERE VersementID=?', [req.params.id]);
    res.json({ message: 'Versement deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Weekly summary report ────────────────────────────────────
app.get('/api/reports/weekly', auth, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        v.WeekVersement,
        COUNT(DISTINCT v.BikeID)              AS TotalBikes,
        COUNT(DISTINCT v.RiderRegistrationID) AS TotalRiders,
        COUNT(v.VersementID)                  AS TotalPayments,
        SUM(v.AmountVersement)                AS TotalAmount,
        MIN(v.VersementDate)                  AS WeekStart,
        MAX(v.VersementDate)                  AS WeekEnd
      FROM Versement v
      GROUP BY v.WeekVersement
      ORDER BY v.WeekVersement DESC
      LIMIT 20
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Monthly summary report ───────────────────────────────────
app.get('/api/reports/monthly', auth, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        DATE_FORMAT(v.VersementDate,'%Y-%m')  AS Month,
        COUNT(DISTINCT v.BikeID)              AS TotalBikes,
        COUNT(DISTINCT v.RiderRegistrationID) AS TotalRiders,
        COUNT(v.VersementID)                  AS TotalPayments,
        SUM(v.AmountVersement)                AS TotalAmount
      FROM Versement v
      GROUP BY Month ORDER BY Month DESC LIMIT 12
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Per-bike report ──────────────────────────────────────────
app.get('/api/reports/bikes', auth, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        b.BikeID, b.BikePlate, b.BikeModel, b.BikeType,
        c.OwnerName,
        r.Name AS CurrentRider,
        COUNT(v.VersementID)       AS TotalPayments,
        COALESCE(SUM(v.AmountVersement),0) AS TotalCollected,
        MAX(v.VersementDate)       AS LastPayment
      FROM Bikes b
      JOIN Client c ON c.ClientID = b.OwnerBikeID
      LEFT JOIN RiderRegistration r ON r.BikeID = b.BikeID AND r.Status='active'
      LEFT JOIN Versement v ON v.BikeID = b.BikeID
      GROUP BY b.BikeID, r.RiderRegistrationID
      ORDER BY TotalCollected DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const startServer = async () => {
  try {
    await db.verifyConnection();
    app.listen(PORT, HOST, () => {
      console.log(`✅ SRA Server v2.0 running on http://localhost:${PORT}`);
    });
  } catch {
    process.exit(1);
  }
};

startServer();
