// Replace with your ACTUAL backend URL
const API_URL = "https://backend-five-umber-71.vercel.app/api/convert";

document.getElementById('upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const loading = document.querySelector('.loading');
  
  loading.style.display = 'block'; // Show loader

  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    document.getElementById('ghibliImage').src = result.url;
  } catch (error) {
    alert('Conversion failed! Please try another image.');
  } finally {
    loading.style.display = 'none'; // Hide loader
  }
});
