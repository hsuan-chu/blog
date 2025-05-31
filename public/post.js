// 取得網址參數 id
const params = new URLSearchParams(window.location.search);
const postId = params.get('id');

fetch('/me')
  .then(res => res.json())
  .then(data => {
    const logoutBtn = document.getElementById('logoutBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (!data.loggedIn) {
      if (logoutBtn) logoutBtn.classList.add('hide');
      if (deleteAccountBtn) deleteAccountBtn.classList.add('hide');
    } else {
      if (logoutBtn) logoutBtn.classList.remove('hide');
      if (deleteAccountBtn) deleteAccountBtn.classList.remove('hide');
    }
  });
// 顯示文章內容
fetch(`/post/${postId}`)
  .then(res => res.json())
  .then(post => {
    if (!post) {
      document.getElementById('postDetail').innerHTML = '<p>找不到文章</p>';
      return;
    }
    const contentWithBr = post.content.replace(/\n/g, '<br>');
    document.getElementById('postDetail').innerHTML = `
      <h1>${post.title}</h1>
      <p class="author">作者：${post.author}｜${post.date}</p>
      ${post.image ? `<img src="${post.image}"style="max-width:100%;">` : ''}
      <p>${contentWithBr}</p>
    `;
  });

// 顯示留言
function loadComments() {
  fetch(`/comments?postId=${postId}`)
    .then(res => res.json())
    .then(comments => {
      const list = document.getElementById('commentsList');
      list.innerHTML = '';
      comments.forEach(c => {
        const commentContent = (c.content || '').replace(/\n/g, '<br>');
        const div = document.createElement('div');
        div.className = 'post-card';
        div.innerHTML = `<p><b>${c.nickname || '匿名'}</b>：${commentContent}</p><p style="font-size:0.9em;color:#888">${c.date}</p>`;
        list.appendChild(div);
      });
    });
}
loadComments();

// 留言送出
document.getElementById('commentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = e.target.content.value.trim();
  if (!content) return;
  const res = await fetch('/addComment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId, content })
  });
  const result = await res.json();
  if (result.success) {
    e.target.reset();
    loadComments();
  } else {
    alert(result.message || '留言失敗');
  }
});
