const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const auditRoutes = require('./routes/audit');
const auditsRoutes = require('./routes/audits');
const adminRoutes = require('./routes/admin');
const { assertStartupSecurity, getSafePublicConfig } = require('./utils/securityConfig');

const app = express();
const PORT = process.env.PORT || 4000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

assertStartupSecurity({ service: 'backend' });

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: '100kb' }));
app.use(morgan(process.env.LOG_FORMAT || 'combined'));
app.use(rateLimit({ windowMs: 60 * 1000, limit: 30 }));

app.get('/health', (_req, res) => res.json({ ok: true, ...getSafePublicConfig() }));
app.use('/audit', auditRoutes);
app.use('/audits', auditsRoutes);
app.use('/admin', adminRoutes);

app.listen(PORT, () => console.log(`Blockpages411 auditor backend v8 running on port ${PORT}`));
