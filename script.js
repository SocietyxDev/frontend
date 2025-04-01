const API_URL = "https://your-backend-app.vercel.app/api/convert";

document.getElementById('upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Show loading
  const loading = document.createElement('div');
  loading.className = 'loading';
  loading.textContent = 'Converting to Ghibli style...';
  document.body.appendChild(loading);

  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    document.getElementById('result').src = result.url;
  } catch (error) {
    alert('Error converting image!');
  } finally {
    loading.remove();
  }
});
