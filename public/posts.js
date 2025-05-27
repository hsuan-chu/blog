// 檢查是否已登入
fetch('/me')
  .then(res => res.json())
  .then(data => {
    const userInfo = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logoutBtn');
    if (!data.loggedIn) {
      window.location.href = '/login.html';
    } else {
      // 顯示暱稱
      userInfo.textContent = `你好，${data.user.nickname}`;
      logoutBtn.style.display = 'inline-block';

      // 綁定登出事件
      logoutBtn.onclick = function() {
        fetch('/logout', { method: 'POST' })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              window.location.href = '/login.html';
            }
          });
      };

      // 綁定發文事件
      const form = document.getElementById('postForm');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        formData.append('date', new Date().toLocaleString());
        const res = await fetch('/addPost', {
          method: 'POST',
          body: formData
        });
        const result = await res.json();
        alert(result.success ? '發文成功！' : result.message);
        if (result.success) {
          window.location.href = '/';
        }
      });
    }
  });