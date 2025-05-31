require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const { Pool } = require('pg');

const app = express();

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';
const sessionSecret = process.env.SESSION_SECRET || 'defaultSecret';
const upload = multer({ dest: path.join(__dirname, 'public', 'uploads') });



const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(session({
  secret: '101058',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 3600000 }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

async function initTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "user" (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
      nickname TEXT,
      email TEXT
    );
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      title TEXT,
      content TEXT,
      author TEXT,
      date TEXT,
      image TEXT
    );
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      postId INTEGER,
      nickname TEXT,
      content TEXT,
      date TEXT
    );
  `);
}
initTables();


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/addUser', async (req, res) => {
  const { username, password, nickname, email } = req.body;
  try {
    await pool.query(
      'INSERT INTO "user" (username, password, nickname, email) VALUES ($1, $2, $3, $4)',
      [username, password, nickname, email]
    );
    res.json({ success: true, message: '註冊成功' });
  } catch (err) {
    console.error('Register failed:', err);
    res.status(400).json({ success: false, message: '帳號已存在或註冊失敗。' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM "user" WHERE username = $1 AND password = $2',
      [username, password]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: '帳號或密碼錯誤' });
    }
    const row = result.rows[0];
    req.session.user = { username: row.username, nickname: row.nickname };
    res.json({ success: true, message: '登入成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

app.get('/me', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.post('/addPost', upload.single('image'), async (req, res) => {
  if (!req.session.user) {
    return res.json({ success: false, message: '未登入' });
  }
  const { title, content, date } = req.body;
  const author = req.session.user.nickname;
  let imagePath = null;
  if (req.file) {
    imagePath = '/uploads/' + req.file.filename;
  }
  try {
    await pool.query(
      'INSERT INTO posts (title, content, author, date, image) VALUES ($1, $2, $3, $4, $5)',
      [title, content, author, date, imagePath]
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: '發文失敗' });
  }
});



app.get('/posts', async (req, res) => {
  const { user } = req.query;
  let query = 'SELECT * FROM posts';
  let params = [];
  if (user) {
    query += ' WHERE author = $1';
    params.push(user);
  }
  query += ' ORDER BY date DESC';
  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/post/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const result = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/comments', async (req, res) => {
  const postId = req.query.postId;
  try {
    const result = await pool.query(
      'SELECT * FROM comments WHERE postId = $1 ORDER BY date DESC',
      [postId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/addComment', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false, message: '未登入' });
  const { postId, content } = req.body;
  const nickname = req.session.user.nickname;
  const date = new Date().toLocaleString();
  try {
    await pool.query(
      'INSERT INTO comments (postId, nickname, content, date) VALUES ($1, $2, $3, $4)',
      [postId, nickname, content, date]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: '留言失敗' });
  }
});

app.post('/deleteAccount', async (req, res) => {
  if (!req.session.user) {
    return res.json({ success: false, message: '未登入' });
  }
  const username = req.session.user.username;
  try {
    await pool.query('DELETE FROM "user" WHERE username = $1', [username]);
    req.session.destroy(() => {
      res.json({ success: true, message: '帳號已刪除' });
    });
  } catch (err) {
    res.json({ success: false, message: '刪除失敗' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://${host}:${port}`);
});