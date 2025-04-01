// ======================
// DOM Elements
// ======================
const uploadTrigger = document.getElementById('uploadTrigger');
const imageUpload = document.getElementById('imageUpload');
const fileName = document.getElementById('fileName');
const originalImage = document.getElementById('originalImage');
const ghibliImage = document.getElementById('ghibliImage');
const convertBtn = document.getElementById('convertBtn');
const loading = document.getElementById('loading');
const errorBox = document.getElementById('errorBox');

// ======================
// Configuration
// ======================
const API_URL = "https://backend-five-umber-71.vercel.app/api/convert";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ======================
// Event Listeners
// ======================
uploadTrigger.addEventListener('click', () => imageUpload.click());

imageUpload.addEventListener('change', handleImageUpload);
convertBtn.addEventListener('click', handleConversion);

// ======================
// Core Functions
// ======================

/**
 * Handles image upload and preview
 */
function handleImageUpload(e) {
  clearErrors();
  const file = e.target.files[0];
  
  if (!file) return;

  // Validate file
  if (!validateImage(file)) {
    return;
  }

  // Update UI
  fileName.textContent = `Selected: ${file.name}`;
  convertBtn.disabled = false;
  ghibliImage.style.display = 'none';

  // Preview original image
  previewImage(file);
}

/**
 * Validates the uploaded image
 */
function validateImage(file) {
  // Check file type
  if (!file.type.match(/image\/(jpeg|png|webp)/)) {
    showError("Please upload a JPG, PNG, or WEBP image");
    return false;
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    showError(`Image too large (max ${MAX_FILE_SIZE/1024/1024}MB)`);
    return false;
  }

  return true;
}

/**
 * Handles the conversion process
 */
async function handleConversion() {
  const file = imageUpload.files[0];
  if (!file) return;

  clearErrors();
  showLoading(true);

  try {
    // Try API conversion first
    const result = await convertWithAPI(file);
    
    // Verify result
    if (!result.url) {
      throw new Error("No image URL returned from API");
    }

    // Display result
    ghibliImage.onload = () => {
      showLoading(false);
      logConversionStats(file, result.url);
    };
    
    ghibliImage.onerror = () => {
      throw new Error("Failed to load processed image");
    };

    ghibliImage.src = result.url;
    ghibliImage.style.display = 'block';

  } catch (apiError) {
    console.error("API Error:", apiError);
    
    // Fallback to client-side processing
    try {
      await convertClientSide(file);
    } catch (clientError) {
      console.error("Client-side Error:", clientError);
      showError(`Conversion failed: ${clientError.message}`);
    }
    
  } finally {
    showLoading(false);
  }
}

/**
 * Converts image using backend API
 */
async function convertWithAPI(file) {
  const formData = new FormData();
  formData.append('image', file);

  const startTime = Date.now();
  
  const response = await fetch(API_URL, {
    method: 'POST',
    body: formData
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "API request failed");
  }

  console.log(`API conversion took ${Date.now() - startTime}ms`);
  return result;
}

/**
 * Fallback client-side conversion
 */
async function convertClientSide(file) {
  console.warn("Using client-side fallback");
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw original image
          ctx.drawImage(img, 0, 0);
          
          // Apply Ghibli-style effects
          applyClientSideEffects(ctx, canvas.width, canvas.height);
          
          // Convert to data URL
          ghibliImage.src = canvas.toDataURL('image/jpeg', 0.9);
          ghibliImage.style.display = 'block';
          resolve();
          
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Applies client-side image effects
 */
function applyClientSideEffects(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Ghibli-style transformations
  for (let i = 0; i < data.length; i += 4) {
    // Boost greens and saturation
    data[i + 1] = Math.min(data[i + 1] * 1.4, 255); // Green channel
    
    // Soften other colors
    data[i] = data[i] * 0.9;     // Red
    data[i + 2] = data[i + 2] * 0.8; // Blue
    
    // Lighten overall
    data[i] = Math.min(data[i] + 20, 255);
    data[i + 1] = Math.min(data[i + 1] + 20, 255);
    data[i + 2] = Math.min(data[i + 2] + 20, 255);
  }
  
  ctx.putImageData(imageData, 0, 0);
}

// ======================
// Helper Functions
// ======================

function previewImage(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    originalImage.src = e.target.result;
    originalImage.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function showLoading(show) {
  loading.style.display = show ? 'block' : 'none';
  convertBtn.disabled = show;
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.style.display = 'block';
}

function clearErrors() {
  errorBox.style.display = 'none';
  errorBox.textContent = '';
}

function logConversionStats(file, resultUrl) {
  const originalSize = file.size;
  const processedSize = Math.round((resultUrl.length * 3) / 4); // Approx byte size
  
  console.group('Conversion Stats');
  console.log('Original:', formatBytes(originalSize));
  console.log('Processed:', formatBytes(processedSize));
  console.log('Ratio:', (processedSize / originalSize * 100).toFixed(2) + '%');
  console.groupEnd();
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ======================
// Debug Helpers
// ======================

window.debugAPI = async () => {
  if (!imageUpload.files[0]) {
    console.error("No image selected");
    return;
  }
  
  console.group('Debug API Request');
  try {
    const formData = new FormData();
    formData.append('image', imageUpload.files[0]);
    
    console.log("Sending to:", API_URL);
    const start = performance.now();
    
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData
    });
    
    const time = performance.now() - start;
    console.log(`Response time: ${time.toFixed(2)}ms`);
    console.log("Status:", response.status);
    
    const result = await response.json();
    console.log("Response:", result);
    
    if (!response.ok) {
      console.error("API Error:", result.error);
    }
    
  } catch (error) {
    console.error("Debug Error:", error);
  } finally {
    console.groupEnd();
  }
};
