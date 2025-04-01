// Replace with your Vercel backend URL later
const API_URL = "https://your-backend-app.vercel.app/api/convert";

document.getElementById('upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(API_URL, {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  document.getElementById('result').src = result.url;
});
