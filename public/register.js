document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    username: form.username.value,
    password: form.password.value,
    nickname: form.nickname.value,
    email: form.email.value
  };
  const res = await fetch('/addUser', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  alert(result.message);
  if (result.success) {
    window.location.href = '/login.html'; // 註冊成功跳轉到登入畫面
  }
});