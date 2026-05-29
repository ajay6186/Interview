#!/bin/bash
# ============================================================
# TEAM SIMULATION LAB
# Simulate 3 developers working simultaneously
# Practice: conflicts, merges, rebases, code review
# ============================================================

REMOTE_DIR="/tmp/team-sim-remote"
DEV1_DIR="/tmp/team-sim-dev1"
DEV2_DIR="/tmp/team-sim-dev2"
DEV3_DIR="/tmp/team-sim-dev3"
rm -rf "$REMOTE_DIR" "$DEV1_DIR" "$DEV2_DIR" "$DEV3_DIR"

echo "Setting up team simulation environment..."

# Create shared remote
git init --bare "$REMOTE_DIR"

# Developer 1 sets up the project
git clone "$REMOTE_DIR" "$DEV1_DIR"
cd "$DEV1_DIR"
git config user.name "Alice"
git config user.email "alice@team.com"

cat > app.js << 'EOF'
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello World', version: '1.0' });
});

module.exports = app;
EOF

cat > auth.js << 'EOF'
function login(email, password) {
  return { token: null };  // TODO: implement
}

function logout(token) {
  return { success: false };  // TODO: implement
}

module.exports = { login, logout };
EOF

echo '{"name":"myapp","version":"1.0.0"}' > package.json
git add .
git commit -m "feat: initial project setup"
git push -u origin main

echo ""
echo "=============================================="
echo "PROJECT INITIALIZED by Alice"
echo "=============================================="

# Developer 2 and 3 clone
git clone "$REMOTE_DIR" "$DEV2_DIR"
cd "$DEV2_DIR"
git config user.name "Bob"
git config user.email "bob@team.com"

git clone "$REMOTE_DIR" "$DEV3_DIR"
cd "$DEV3_DIR"
git config user.name "Carol"
git config user.email "carol@team.com"

echo ""
echo "=== Scenario 1: Three devs work simultaneously ==="
echo ""

# Alice works on auth
cd "$DEV1_DIR"
git switch -c feat/auth-implementation
cat > auth.js << 'EOF'
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'dev-secret';

function login(email, password) {
  if (!email || !password) throw new Error('Credentials required');
  const token = jwt.sign({ email }, SECRET, { expiresIn: '24h' });
  return { token, email };
}

function logout(token) {
  // In production: add to blacklist
  return { success: true };
}

module.exports = { login, logout };
EOF
git add auth.js
git commit -m "feat: implement JWT auth"

# Bob works on the API
cd "$DEV2_DIR"
git switch -c feat/api-routes
cat > routes.js << 'EOF'
const { login, logout } = require('./auth');
const express = require('express');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = login(email, password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/logout', (req, res) => {
  const { token } = req.headers;
  res.json(logout(token));
});

module.exports = router;
EOF
git add routes.js
git commit -m "feat: add auth routes"

echo "// add middleware" >> routes.js
git add routes.js
git commit -m "feat: add error middleware to routes"

# Carol works on tests AND modifies auth.js (will conflict!)
cd "$DEV3_DIR"
git switch -c feat/add-tests
cat > auth.test.js << 'EOF'
const { login, logout } = require('./auth');

test('login returns token when credentials are valid', () => {
  const result = login('user@test.com', 'password123');
  expect(result).toHaveProperty('token');
});

test('login throws when email is missing', () => {
  expect(() => login(null, 'password')).toThrow('Credentials required');
});

test('logout returns success', () => {
  expect(logout('any-token')).toEqual({ success: true });
});
EOF

# Carol also needs to fix auth.js (will conflict with Alice's version!)
cat > auth.js << 'EOF'
function login(email, password) {
  if (!email) throw new Error('Email required');
  if (!password) throw new Error('Password required');
  return { token: 'mock-token', email };
}

function logout(token) {
  if (!token) throw new Error('Token required');
  return { success: true };
}

module.exports = { login, logout };
EOF
git add .
git commit -m "test: add auth unit tests and improve error messages"

echo ""
echo "=== All three developers finished their feature work ==="
echo ""
echo "=== Scenario 2: Integration — merge everything to main ==="
echo ""

# Alice merges first (no conflict with main since it hasn't changed)
cd "$DEV1_DIR"
git switch main
git pull
git merge feat/auth-implementation --no-ff -m "feat: merge JWT auth implementation"
git push
echo "Alice merged auth implementation ✓"

echo ""
# Bob updates and merges (no conflict with Alice's auth)
cd "$DEV2_DIR"
git switch main
git pull   # gets Alice's changes
git merge feat/api-routes --no-ff -m "feat: merge API routes"
git push
echo "Bob merged API routes ✓"

echo ""
# Carol has a CONFLICT with Alice's auth.js!
cd "$DEV3_DIR"
git switch main
git pull   # gets both Alice's and Bob's changes

echo "Merging Carol's tests (will CONFLICT in auth.js):"
git merge feat/add-tests --no-ff -m "test: merge auth tests" || true

echo ""
echo "=== CONFLICT detected in auth.js ==="
git status

echo ""
echo "Carol resolves: combine Alice's JWT version + Carol's better error messages"
cat > auth.js << 'EOF'
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'dev-secret';

function login(email, password) {
  if (!email) throw new Error('Email required');
  if (!password) throw new Error('Password required');
  const token = jwt.sign({ email }, SECRET, { expiresIn: '24h' });
  return { token, email };
}

function logout(token) {
  if (!token) throw new Error('Token required');
  // In production: add to blacklist
  return { success: true };
}

module.exports = { login, logout };
EOF

git add auth.js
git commit -m "test: merge auth tests - combined JWT + better error messages"
git push
echo "Carol resolved conflict and merged tests ✓"

echo ""
echo "=== Final project state ==="
cd "$DEV1_DIR"
git pull
git log --oneline --graph --all | head -20

echo ""
echo "=============================================="
echo "TEAM SIMULATION COMPLETE"
echo "=============================================="
echo ""
echo "What happened:"
echo "1. Alice implemented JWT auth"
echo "2. Bob added REST routes"
echo "3. Carol wrote tests — but had a conflict with Alice's auth.js"
echo "4. Carol resolved the conflict by combining both approaches"
echo ""
echo "Key learnings:"
echo "- Multiple branches can work in parallel"
echo "- Conflicts happen when the same file is modified differently"
echo "- Conflicts must be resolved manually — git can't guess"
echo "- Communication helps: 'I'm working on auth.js' prevents conflicts"
echo ""
echo "Practice this regularly to build team collaboration skills!"
