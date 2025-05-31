const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const session = require('express-session');

const app = express();

const port = process.env.PORT || 3000;
const upload = multer({ dest: path.join(__dirname, 'public', 'uploads') });

app.use(session({
  secret: '101058',
  resave: false,
  saveUninitialized: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const dbPath = path.join(__dirname, 'test_user.db');
const db = new sqlite3.Database(dbPath);

db.run(`CREATE TABLE IF NOT EXISTS user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  nickname TEXT,
  email TEXT
)`);

db.run(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    author TEXT,
    date TEXT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    postId INTEGER,
    nickname TEXT,
    content TEXT,
    date TEXT
  )
`);



app.use(session({
  secret: '12121212121', 
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 3600000 }
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/addUser', (req, res) => {
  const { username, password, nickname, email } = req.body;

  const query = 'INSERT INTO user (username, password, nickname, email) VALUES (?, ?, ?, ?)';
  db.run(query, [username, password, nickname, email], function (err) {
    if (err) {
      console.error('Register failed:', err);
      return res.status(400).json({ success: false, message: '帳號已存在或註冊失敗。' });
    }
    res.json({ success: true, message: '註冊成功' });
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM user WHERE username = ? AND password = ?';
  db.get(query, [username, password], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: '伺服器錯誤' });
    if (!row) return res.status(401).json({ success: false, message: '帳號或密碼錯誤' });

    req.session.user = { username: row.username, nickname: row.nickname };
    res.json({ success: true, message: '登入成功' });
  });
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

app.post('/addPost', upload.single('image'), (req, res) => {
  if (!req.session.user) {
    return res.json({ success: false, message: '未登入' });
  }
  const { title, content, date } = req.body;
  const author = req.session.user.nickname;
  let imagePath = null;
  if (req.file) {
    imagePath = '/uploads/' + req.file.filename;
  }
  db.run(
    'INSERT INTO posts (title, content, author, date, image) VALUES (?, ?, ?, ?, ?)',
    [title, content, author, date, imagePath],
    function (err) {
      if (err) return res.json({ success: false, message: '發文失敗' });
      res.json({ success: true });
    }
  );
});


app.get('/posts', (req, res) => {
  const { user } = req.query;
  let query = 'SELECT * FROM posts';
  let params = [];

  if (user) {
    query += ' WHERE author = ?';
    params.push(user);
  }

  query += ' ORDER BY date DESC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

app.get('/post/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM posts WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(row);
  });
});

app.get('/comments', (req, res) => {
  const postId = req.query.postId;
  db.all('SELECT * FROM comments WHERE postId = ? ORDER BY date DESC', [postId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});
app.post('/addComment', (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false, message: '未登入' });
  const { postId, content } = req.body;
  const nickname = req.session.user.nickname;
  const date = new Date().toLocaleString();
  db.run('INSERT INTO comments (postId, nickname, content, date) VALUES (?, ?, ?, ?)',
    [postId, nickname, content, date],
    function (err) {
      if (err) return res.status(500).json({ success: false, message: '留言失敗' });
      res.json({ success: true });
    }
  );
});

app.post('/deleteAccount', (req, res) => {
  if (!req.session.user) {
    return res.json({ success: false, message: '未登入' });
  }
  const username = req.session.user.username;
  db.run('DELETE FROM user WHERE username = ?', [username], function(err) {
    if (err) return res.json({ success: false, message: '刪除失敗' });
    req.session.destroy(() => {
      res.json({ success: true, message: '帳號已刪除' });
    });
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
