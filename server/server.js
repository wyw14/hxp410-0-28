const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 41128;

const DATA_DIR = path.join(__dirname, 'data');
const SECRETS_FILE = path.join(DATA_DIR, 'secrets.json');
const ANNOUNCEMENTS_FILE = path.join(DATA_DIR, 'announcements.json');
const ADMIN_PASSWORD = 'admin123456';

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(SECRETS_FILE)) {
  fs.writeFileSync(SECRETS_FILE, JSON.stringify([]));
}

if (!fs.existsSync(ANNOUNCEMENTS_FILE)) {
  fs.writeFileSync(ANNOUNCEMENTS_FILE, JSON.stringify([]));
}

app.use(cors());
app.use(express.json());

function readSecrets() {
  const data = fs.readFileSync(SECRETS_FILE, 'utf8');
  return JSON.parse(data);
}

function writeSecrets(secrets) {
  fs.writeFileSync(SECRETS_FILE, JSON.stringify(secrets, null, 2));
}

function readAnnouncements() {
  const data = fs.readFileSync(ANNOUNCEMENTS_FILE, 'utf8');
  return JSON.parse(data);
}

function writeAnnouncements(announcements) {
  fs.writeFileSync(ANNOUNCEMENTS_FILE, JSON.stringify(announcements, null, 2));
}

function verifyAdmin(req, res, next) {
  const password = req.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: '管理员密码错误' });
  }
  next();
}

app.post('/api/secrets', (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: '秘密内容不能为空' });
    }

    const secrets = readSecrets();
    const newSecret = {
      id: uuidv4(),
      content: content.trim(),
      status: '已宽恕',
      createdAt: new Date().toISOString()
    };

    secrets.push(newSecret);
    writeSecrets(secrets);

    res.json({
      success: true,
      message: '你的秘密已被宽恕',
      secret: newSecret
    });
  } catch (error) {
    console.error('保存秘密时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/secrets/random', (req, res) => {
  try {
    const secrets = readSecrets();
    const forgivenSecrets = secrets.filter(s => s.status === '已宽恕');

    if (forgivenSecrets.length === 0) {
      return res.json({
        hasSecret: false,
        message: '还没有被宽恕的秘密，成为第一个分享的人吧'
      });
    }

    const randomIndex = Math.floor(Math.random() * forgivenSecrets.length);
    const randomSecret = forgivenSecrets[randomIndex];

    res.json({
      hasSecret: true,
      secret: {
        id: randomSecret.id,
        content: randomSecret.content,
        status: randomSecret.status
      }
    });
  } catch (error) {
    console.error('获取随机秘密时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/announcements/latest', (req, res) => {
  try {
    const announcements = readAnnouncements();
    const activeAnnouncements = announcements
      .filter(a => a.status === 'active')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (activeAnnouncements.length === 0) {
      return res.json({ hasAnnouncement: false });
    }

    const latest = activeAnnouncements[0];
    res.json({
      hasAnnouncement: true,
      announcement: {
        id: latest.id,
        title: latest.title,
        content: latest.content,
        createdAt: latest.createdAt
      }
    });
  } catch (error) {
    console.error('获取最新公告时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/announcements', (req, res) => {
  try {
    const announcements = readAnnouncements();
    const activeAnnouncements = announcements
      .filter(a => a.status === 'active')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({
      announcements: activeAnnouncements.map(a => ({
        id: a.id,
        title: a.title,
        content: a.content,
        status: a.status,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt
      }))
    });
  } catch (error) {
    console.error('获取公告列表时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.post('/api/admin/login', verifyAdmin, (req, res) => {
  res.json({ success: true, message: '验证成功' });
});

app.get('/api/admin/announcements', verifyAdmin, (req, res) => {
  try {
    const announcements = readAnnouncements();
    const sorted = announcements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({
      announcements: sorted.map(a => ({
        id: a.id,
        title: a.title,
        content: a.content,
        status: a.status,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt
      }))
    });
  } catch (error) {
    console.error('获取公告列表时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.post('/api/admin/announcements', verifyAdmin, (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: '公告标题不能为空' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ error: '公告内容不能为空' });
    }

    const announcements = readAnnouncements();
    const newAnnouncement = {
      id: uuidv4(),
      title: title.trim(),
      content: content.trim(),
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    announcements.push(newAnnouncement);
    writeAnnouncements(announcements);

    res.json({
      success: true,
      message: '公告发布成功',
      announcement: newAnnouncement
    });
  } catch (error) {
    console.error('发布公告时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.put('/api/admin/announcements/:id/deactivate', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const announcements = readAnnouncements();
    const index = announcements.findIndex(a => a.id === id);

    if (index === -1) {
      return res.status(404).json({ error: '公告不存在' });
    }

    announcements[index].status = 'inactive';
    announcements[index].updatedAt = new Date().toISOString();
    writeAnnouncements(announcements);

    res.json({
      success: true,
      message: '公告已停用',
      announcement: announcements[index]
    });
  } catch (error) {
    console.error('停用公告时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.put('/api/admin/announcements/:id/activate', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const announcements = readAnnouncements();
    const index = announcements.findIndex(a => a.id === id);

    if (index === -1) {
      return res.status(404).json({ error: '公告不存在' });
    }

    announcements[index].status = 'active';
    announcements[index].updatedAt = new Date().toISOString();
    writeAnnouncements(announcements);

    res.json({
      success: true,
      message: '公告已恢复',
      announcement: announcements[index]
    });
  } catch (error) {
    console.error('恢复公告时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`忏悔室后端服务运行在 http://localhost:${PORT}`);
});
