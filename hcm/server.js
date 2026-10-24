/*
  PeopleOps Cloud HCM - dependency-free runnable MVP
  Run: node server.js
*/

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const SEED_PATH = path.join(ROOT, 'data', 'seed.json');
const DB_PATH = path.join(ROOT, 'data', 'db.local.json');

const COLLECTIONS = new Set([
  'employees',
  'requisitions',
  'candidates',
  'benefitPlans',
  'enrollments',
  'payrollRuns',
  'expenseReports',
  'performanceReviews',
  'assets',
  'journals',
  'tasks',
  'auditLogs',
  'users'
]);

const SAFE_USER_FIELDS = ['id', 'name', 'email', 'role', 'employeeId'];

function ensureDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.copyFileSync(SEED_PATH, DB_PATH);
  }
}

function loadDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function id(prefix) {
  return `${prefix}_${crypto.randomBytes(5).toString('hex')}`;
}

function nowIso() {
  return new Date().toISOString();
}

function safeUser(user) {
  if (!user) return null;
  return Object.fromEntries(SAFE_USER_FIELDS.map((field) => [field, user[field]]));
}

function getJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });
  });
}

function send(res, status, payload, headers = {}) {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    'Content-Type': typeof payload === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers
  });
  res.end(body);
}

function sendError(res, status, message, details) {
  send(res, status, { error: message, details });
}

function readSession(req, db) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return { user: null, token: null };
  const session = db.sessions?.[token];
  if (!session || new Date(session.expiresAt) < new Date()) return { user: null, token: null };
  return { user: db.users.find((u) => u.id === session.userId), token };
}

function createSession(db, user) {
  db.sessions = db.sessions || {};
  const token = crypto.randomBytes(24).toString('hex');
  const minutes = db.settings?.security?.sessionMinutes || 480;
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  db.sessions[token] = { userId: user.id, expiresAt };
  return { token, expiresAt };
}

function audit(db, actor, action, entityType, entityId, metadata = {}) {
  db.auditLogs = db.auditLogs || [];
  db.auditLogs.unshift({
    id: id('audit'),
    timestamp: nowIso(),
    actorId: actor?.id || 'system',
    actorName: actor?.name || 'System',
    action,
    entityType,
    entityId,
    metadata
  });
  db.auditLogs = db.auditLogs.slice(0, 500);
}

function hasWriteAccess(user, collection) {
  if (!user) return false;
  const role = user.role;
  if (role === 'Super Admin') return true;
  const rights = {
    'HR Admin': ['employees', 'requisitions', 'candidates', 'benefitPlans', 'enrollments', 'performanceReviews', 'tasks'],
    'Payroll Admin': ['employees', 'payrollRuns', 'journals', 'tasks'],
    'Benefits Admin': ['benefitPlans', 'enrollments', 'tasks'],
    'Finance Admin': ['expenseReports', 'journals', 'payrollRuns', 'tasks'],
    'IT Admin': ['assets', 'tasks'],
    Manager: ['candidates', 'expenseReports', 'performanceReviews', 'tasks']
  };
  return rights[role]?.includes(collection) || false;
}

function applySecurity(record, collection, user) {
  if (!record || collection !== 'employees') return record;
  const copy = { ...record };
  if (!['Super Admin', 'HR Admin', 'Payroll Admin'].includes(user?.role)) {
    delete copy.salary;
    delete copy.ssnMasked;
  }
  return copy;
}

function getCollectionPrefix(collection) {
  const prefixes = {
    employees: 'emp',
    requisitions: 'req',
    candidates: 'cand',
    benefitPlans: 'ben',
    enrollments: 'enr',
    payrollRuns: 'pay',
    expenseReports: 'exp',
    performanceReviews: 'rev',
    assets: 'asset',
    journals: 'jrnl',
    tasks: 'task',
    users: 'usr'
  };
  return prefixes[collection] || 'rec';
}

function routeParts(req) {
  const parsed = new URL(req.url, `http://${req.headers.host}`);
  return {
    parsed,
    parts: parsed.pathname.split('/').filter(Boolean)
  };
}

function serveStatic(req, res) {
  const parsed = new URL(req.url, `http://${req.headers.host}`);
  let filePath = path.normalize(path.join(PUBLIC_DIR, parsed.pathname === '/' ? 'index.html' : parsed.pathname));
  if (!filePath.startsWith(PUBLIC_DIR)) return sendError(res, 403, 'Forbidden');
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }
  const ext = path.extname(filePath).toLowerCase();
  const type = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml'
  }[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type });
  fs.createReadStream(filePath).pipe(res);
}

function computeDashboard(db) {
  const employees = db.employees || [];
  const active = employees.filter((e) => e.status === 'Active');
  const onboarding = employees.filter((e) => e.status === 'Onboarding');
  const openReqs = (db.requisitions || []).filter((r) => r.status === 'Open');
  const openTasks = (db.tasks || []).filter((t) => t.status !== 'Done');
  const pendingExpenses = (db.expenseReports || []).filter((e) => !['Paid', 'Rejected'].includes(e.status));
  const payrollDrafts = (db.payrollRuns || []).filter((p) => ['Draft', 'Previewed'].includes(p.status));
  const monthlyPayrollLiability = active.reduce((sum, employee) => sum + Number(employee.salary || 0) / 12, 0);

  return {
    headcount: active.length,
    onboarding: onboarding.length,
    openRoles: openReqs.length,
    openTasks: openTasks.length,
    pendingExpenseAmount: roundMoney(pendingExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0)),
    payrollRunsPending: payrollDrafts.length,
    monthlyPayrollLiability: roundMoney(monthlyPayrollLiability),
    departments: groupCount(active, 'department'),
    locations: groupCount(active, 'location'),
    recentAudit: (db.auditLogs || []).slice(0, 8)
  };
}

function groupCount(records, key) {
  return records.reduce((acc, item) => {
    const value = item[key] || 'Unassigned';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function previewPayroll(db, runId, actor) {
  const run = db.payrollRuns.find((p) => p.id === runId);
  if (!run) throw new Error('Payroll run not found');
  const activeEmployees = db.employees.filter((e) => ['Active', 'Onboarding'].includes(e.status));
  const grossPay = activeEmployees.reduce((sum, employee) => sum + Number(employee.salary || 0) / 26, 0);
  const deductions = activeEmployees.length * 120;
  const employeeTaxes = grossPay * 0.18;
  const employerTaxes = grossPay * 0.085;
  run.grossPay = roundMoney(grossPay);
  run.deductions = roundMoney(deductions);
  run.employeeTaxes = roundMoney(employeeTaxes);
  run.employerTaxes = roundMoney(employerTaxes);
  run.netPay = roundMoney(grossPay - deductions - employeeTaxes);
  run.employeeCount = activeEmployees.length;
  run.status = 'Previewed';
  run.previewedAt = nowIso();
  audit(db, actor, 'previewed', 'payrollRuns', run.id, { grossPay: run.grossPay, netPay: run.netPay });
  return run;
}

function approvePayroll(db, runId, actor) {
  const run = db.payrollRuns.find((p) => p.id === runId);
  if (!run) throw new Error('Payroll run not found');
  if (run.status === 'Draft') previewPayroll(db, runId, actor);
  run.status = 'Approved';
  run.approvedAt = nowIso();
  const journal = {
    id: id('jrnl'),
    source: 'Payroll',
    date: run.payDate,
    status: 'Draft',
    description: `${run.payGroup} payroll journal for ${run.periodStart} to ${run.periodEnd}`,
    totalDebit: roundMoney(run.grossPay + run.employerTaxes),
    totalCredit: roundMoney(run.netPay + run.employeeTaxes + run.deductions + run.employerTaxes),
    lines: [
      { account: 'Payroll Expense', debit: run.grossPay, credit: 0 },
      { account: 'Employer Tax Expense', debit: run.employerTaxes, credit: 0 },
      { account: 'Cash / Payroll Clearing', debit: 0, credit: run.netPay },
      { account: 'Employee Tax Liability', debit: 0, credit: run.employeeTaxes },
      { account: 'Benefit Deduction Liability', debit: 0, credit: run.deductions },
      { account: 'Employer Tax Liability', debit: 0, credit: run.employerTaxes }
    ]
  };
  db.journals.unshift(journal);
  audit(db, actor, 'approved', 'payrollRuns', run.id, { journalId: journal.id });
  return { run, journal };
}

function createOnboarding(db, payload, actor) {
  const employee = {
    id: id('emp'),
    employeeNumber: payload.employeeNumber || `E-${1000 + db.employees.length + 1}`,
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    department: payload.department || 'Unassigned',
    location: payload.location || 'Remote',
    jobTitle: payload.jobTitle || 'New Hire',
    managerId: payload.managerId || null,
    employmentType: payload.employmentType || 'Full-Time',
    status: 'Onboarding',
    hireDate: payload.hireDate || new Date().toISOString().slice(0, 10),
    salary: Number(payload.salary || 0),
    payType: payload.payType || 'Salary',
    costCenter: payload.costCenter || 'UNASSIGNED',
    ssnMasked: '***-**-pending'
  };
  db.employees.unshift(employee);

  const defaultTasks = [
    ['Onboarding', 'Complete personal information', 'Employee'],
    ['Onboarding', 'Complete I-9', 'HR Admin'],
    ['Onboarding', 'Complete W-4', 'Employee'],
    ['Onboarding', 'Add direct deposit', 'Employee'],
    ['Benefits', 'Select benefits or waive coverage', 'Employee'],
    ['IT', 'Assign laptop and provision core apps', 'IT Admin'],
    ['Accounting', 'Validate cost center and payroll journal mapping', 'Finance Admin']
  ];
  const dueDate = employee.hireDate;
  defaultTasks.forEach(([type, title, ownerRole]) => {
    db.tasks.unshift({
      id: id('task'),
      type,
      title,
      ownerRole,
      employeeId: employee.id,
      dueDate,
      status: 'Open'
    });
  });

  audit(db, actor, 'created_onboarding', 'employees', employee.id, { taskCount: defaultTasks.length });
  return employee;
}

function createOffboarding(db, payload, actor) {
  const employee = db.employees.find((e) => e.id === payload.employeeId);
  if (!employee) throw new Error('Employee not found');
  employee.status = 'Offboarding';
  employee.terminationDate = payload.terminationDate || new Date().toISOString().slice(0, 10);
  employee.terminationReason = payload.reason || 'Not specified';

  const defaultTasks = [
    ['Payroll', 'Review final pay and deductions', 'Payroll Admin'],
    ['Benefits', 'Terminate benefits and trigger COBRA handoff', 'Benefits Admin'],
    ['IT', 'Revoke SSO, email, and app access', 'IT Admin'],
    ['IT', 'Recover laptop and assigned devices', 'IT Admin'],
    ['HR', 'Conduct exit interview', 'HR Admin'],
    ['Accounting', 'Close expense reports and corporate card', 'Finance Admin']
  ];

  defaultTasks.forEach(([type, title, ownerRole]) => {
    db.tasks.unshift({
      id: id('task'),
      type,
      title,
      ownerRole,
      employeeId: employee.id,
      dueDate: employee.terminationDate,
      status: 'Open'
    });
  });

  audit(db, actor, 'created_offboarding', 'employees', employee.id, { taskCount: defaultTasks.length });
  return employee;
}

function approveExpense(db, reportId, actor, status) {
  const report = db.expenseReports.find((e) => e.id === reportId);
  if (!report) throw new Error('Expense report not found');
  report.status = status;
  report.approvedAt = nowIso();
  report.approvedBy = actor?.id;
  audit(db, actor, status.toLowerCase().replaceAll(' ', '_'), 'expenseReports', report.id, { amount: report.amount });
  return report;
}

async function handleApi(req, res) {
  const db = loadDb();
  const { parsed, parts } = routeParts(req);
  const [, resource, idOrAction, subAction] = parts;
  const method = req.method;
  const { user, token } = readSession(req, db);

  if (resource === 'health') {
    return send(res, 200, { ok: true, app: 'PeopleOps Cloud HCM', timestamp: nowIso() });
  }

  if (resource === 'auth' && idOrAction === 'login' && method === 'POST') {
    const body = await getJsonBody(req);
    const found = db.users.find((u) => u.email.toLowerCase() === String(body.email || '').toLowerCase() && u.password === body.password);
    if (!found) return sendError(res, 401, 'Invalid email or password');
    const session = createSession(db, found);
    audit(db, found, 'logged_in', 'users', found.id);
    saveDb(db);
    return send(res, 200, { user: safeUser(found), ...session });
  }

  if (resource === 'auth' && idOrAction === 'me' && method === 'GET') {
    if (!user) return sendError(res, 401, 'Not authenticated');
    return send(res, 200, { user: safeUser(user), tokenExpiresAt: db.sessions?.[token]?.expiresAt });
  }

  if (resource === 'auth' && idOrAction === 'logout' && method === 'POST') {
    if (token && db.sessions) delete db.sessions[token];
    saveDb(db);
    return send(res, 200, { ok: true });
  }

  if (!user) return sendError(res, 401, 'Not authenticated');

  if (resource === 'dashboard' && method === 'GET') {
    return send(res, 200, computeDashboard(db));
  }

  if (resource === 'settings') {
    if (method === 'GET') return send(res, 200, db.settings);
    if (method === 'PUT') {
      if (user.role !== 'Super Admin') return sendError(res, 403, 'Super Admin role required');
      const body = await getJsonBody(req);
      db.settings = deepMerge(db.settings, body);
      audit(db, user, 'updated', 'settings', 'tenant');
      saveDb(db);
      return send(res, 200, db.settings);
    }
  }

  if (resource === 'workflows' && idOrAction === 'onboard' && method === 'POST') {
    if (!hasWriteAccess(user, 'employees')) return sendError(res, 403, 'Insufficient access');
    const body = await getJsonBody(req);
    if (!body.firstName || !body.lastName || !body.email) return sendError(res, 400, 'firstName, lastName, and email are required');
    const created = createOnboarding(db, body, user);
    saveDb(db);
    return send(res, 201, created);
  }

  if (resource === 'workflows' && idOrAction === 'offboard' && method === 'POST') {
    if (!hasWriteAccess(user, 'employees')) return sendError(res, 403, 'Insufficient access');
    const body = await getJsonBody(req);
    const updated = createOffboarding(db, body, user);
    saveDb(db);
    return send(res, 200, updated);
  }

  if (resource === 'payrollRuns' && idOrAction && subAction === 'preview' && method === 'POST') {
    if (!hasWriteAccess(user, 'payrollRuns')) return sendError(res, 403, 'Insufficient access');
    const run = previewPayroll(db, idOrAction, user);
    saveDb(db);
    return send(res, 200, run);
  }

  if (resource === 'payrollRuns' && idOrAction && subAction === 'approve' && method === 'POST') {
    if (!hasWriteAccess(user, 'payrollRuns')) return sendError(res, 403, 'Insufficient access');
    const result = approvePayroll(db, idOrAction, user);
    saveDb(db);
    return send(res, 200, result);
  }

  if (resource === 'expenseReports' && idOrAction && ['manager-approve', 'finance-approve', 'reject', 'mark-paid'].includes(subAction) && method === 'POST') {
    if (!hasWriteAccess(user, 'expenseReports')) return sendError(res, 403, 'Insufficient access');
    const nextStatus = {
      'manager-approve': 'Manager Approved',
      'finance-approve': 'Finance Approved',
      reject: 'Rejected',
      'mark-paid': 'Paid'
    }[subAction];
    const report = approveExpense(db, idOrAction, user, nextStatus);
    saveDb(db);
    return send(res, 200, report);
  }

  if (COLLECTIONS.has(resource)) {
    const collection = resource;
    if (collection === 'users' && user.role !== 'Super Admin') return sendError(res, 403, 'Super Admin role required');

    if (method === 'GET' && !idOrAction) {
      const q = String(parsed.searchParams.get('q') || '').toLowerCase();
      let items = db[collection] || [];
      if (q) items = items.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
      const safeItems = items.map((item) => collection === 'users' ? safeUser(item) : applySecurity(item, collection, user));
      return send(res, 200, safeItems);
    }

    if (method === 'GET' && idOrAction) {
      const found = (db[collection] || []).find((item) => item.id === idOrAction);
      if (!found) return sendError(res, 404, 'Record not found');
      return send(res, 200, collection === 'users' ? safeUser(found) : applySecurity(found, collection, user));
    }

    if (method === 'POST' && !idOrAction) {
      if (!hasWriteAccess(user, collection)) return sendError(res, 403, 'Insufficient access');
      const body = await getJsonBody(req);
      const created = { id: body.id || id(getCollectionPrefix(collection)), ...body, createdAt: nowIso(), updatedAt: nowIso() };
      if (collection === 'users') created.password = created.password || 'demo123';
      db[collection].unshift(created);
      audit(db, user, 'created', collection, created.id);
      saveDb(db);
      return send(res, 201, collection === 'users' ? safeUser(created) : created);
    }

    if (method === 'PUT' && idOrAction) {
      if (!hasWriteAccess(user, collection)) return sendError(res, 403, 'Insufficient access');
      const body = await getJsonBody(req);
      const items = db[collection] || [];
      const index = items.findIndex((item) => item.id === idOrAction);
      if (index < 0) return sendError(res, 404, 'Record not found');
      items[index] = { ...items[index], ...body, id: idOrAction, updatedAt: nowIso() };
      audit(db, user, 'updated', collection, idOrAction, { fields: Object.keys(body) });
      saveDb(db);
      return send(res, 200, collection === 'users' ? safeUser(items[index]) : items[index]);
    }

    if (method === 'DELETE' && idOrAction) {
      if (!hasWriteAccess(user, collection)) return sendError(res, 403, 'Insufficient access');
      const before = db[collection].length;
      db[collection] = db[collection].filter((item) => item.id !== idOrAction);
      if (db[collection].length === before) return sendError(res, 404, 'Record not found');
      audit(db, user, 'deleted', collection, idOrAction);
      saveDb(db);
      return send(res, 200, { ok: true });
    }
  }

  return sendError(res, 404, 'Route not found');
}

function deepMerge(target, source) {
  const output = { ...(target || {}) };
  for (const [key, value] of Object.entries(source || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      output[key] = deepMerge(output[key], value);
    } else {
      output[key] = value;
    }
  }
  return output;
}

const server = http.createServer(async (req, res) => {
  try {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    if (req.url.startsWith('/api/')) return await handleApi(req, res);
    return serveStatic(req, res);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, error.message || 'Unexpected server error');
  }
});

ensureDb();
server.listen(PORT, () => {
  console.log(`PeopleOps Cloud HCM running at http://localhost:${PORT}`);
  console.log('Demo login: admin@acme.test / demo123');
});
