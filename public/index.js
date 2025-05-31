
fetch('/me')
  .then(res => res.json())
  .then(data => {
    const postBtn = document.getElementById('postBtn');
    let loginBtn = document.getElementById('loginBtn');
    const userInfo = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logoutBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (data.loggedIn) {
      postBtn.classList.remove('hide');
      postBtn.style.display = 'inline-block';
      if (loginBtn) loginBtn.classList.add('hide');
      
      userInfo.innerHTML = `你好，<span id="userNameLink" style="color:#1976d2;cursor:pointer;text-decoration:underline;">${data.user.nickname}</span>`;
      logoutBtn.classList.remove('hide');
      deleteAccountBtn.classList.remove('hide');
      
      setTimeout(() => {
        document.getElementById('userNameLink').onclick = function() {
          const filtered = allPosts.filter(post => post.author === data.user.nickname);
          renderPosts(filtered, data.user.nickname);
          document.getElementById('clearSearchBtn').style.display = 'inline-block';
          document.getElementById('searchInput').value = '';
        };
      }, 0);
    } else {
      postBtn.classList.add('hide');
      if (!loginBtn) {
        loginBtn = document.createElement('button');
        loginBtn.id = 'loginBtn';
        loginBtn.textContent = '登入';
        loginBtn.onclick = () => location.href = 'login.html';
        postBtn.parentNode.insertBefore(loginBtn, postBtn);
      }
      loginBtn.classList.remove('hide');
      userInfo.textContent = '';
      logoutBtn.classList.add('hide');
      deleteAccountBtn.classList.add('hide');
    }
  });

document.getElementById('logoutBtn').onclick = function () {
  fetch('/logout', { method: 'POST' })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        window.location.href = '/login.html';
      }
    });
};

document.addEventListener('DOMContentLoaded', () => {
  const deleteBtn = document.getElementById('deleteAccountBtn');
  deleteBtn.onclick = async function() {
    if (confirm('確定要刪除帳號嗎？此操作無法復原！')) {
      const res = await fetch('/deleteAccount', { method: 'POST' });
      const result = await res.json();
      alert(result.message);
      if (result.success) {
        window.location.href = '/register.html';
      }
    }
  };
});
let allPosts = [];
  
function renderPosts(posts, keyword = '') {
  const postList = document.getElementById('postList');
  postList.innerHTML = '';
  let reg = null;
  if (keyword) {
    reg = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  }
  posts.forEach(post => {
    const div = document.createElement('div');
    div.className = 'post-card';
    let title = post.title;
    let content = post.content.length > 100 ? post.content.slice(0, 100) + '...' : post.content;
    let author = post.author;
    if (reg) {
      title = title.replace(reg, '<mark>$1</mark>');
      content = content.replace(reg, '<mark>$1</mark>');
      author = author.replace(reg, '<mark>$1</mark>');
    }
    div.innerHTML = `
      <h2><a href="post.html?id=${post.id}">${title}</a></h2>
      <p class="author">作者：${author}｜${post.date}</p>
      ${post.image ? `<img src="${post.image}" style="max-width:200px;max-height:150px;display:block;margin-bottom:8px;">` : ''}
      <p>${content}</p>
    `;
    postList.appendChild(div);
  });
}
  
  fetch('/posts')
    .then(res => res.json())
    .then(data => {
      allPosts = data;
      renderPosts(allPosts);
    });
  
  document.getElementById('searchBtn').onclick = function() {
    const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!keyword) {
      renderPosts(allPosts);
      document.getElementById('clearSearchBtn').style.display = 'none';
      return;
    }
    const lowerKeyword = keyword.toLowerCase();
    const filtered = allPosts.filter(post =>
      post.title.toLowerCase().includes(keyword) ||
      post.content.toLowerCase().includes(keyword)||
      post.author.toLowerCase().includes(keyword)
    );
    renderPosts(filtered , keyword);
    document.getElementById('clearSearchBtn').style.display = 'inline-block';
  };
  
  document.getElementById('clearSearchBtn').onclick = function() {
    document.getElementById('searchInput').value = '';
    renderPosts(allPosts);
    this.style.display = 'none';
  };
  
  document.getElementById('searchInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      document.getElementById('searchBtn').click();
    }
  });
  