// DOM Elements
const uploadTrigger = document.getElementById('uploadTrigger');
const imageUpload = document.getElementById('imageUpload');
const fileName = document.getElementById('fileName');
const originalImage = document.getElementById('originalImage');
const ghibliImage = document.getElementById('ghibliImage');
const convertBtn = document.getElementById('convertBtn');
const loading = document.getElementById('loading');

// Configuration
const API_URL = "https://backend-five-umber-71.vercel.app/api/convert";
let originalImageData = null;

// Event Listeners
uploadTrigger.addEventListener('click', () => imageUpload.click());

imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate image type
    if (!file.type.match('image.*')) {
        alert('Please select an image file (JPEG, PNG)');
        return;
    }

    fileName.textContent = `Selected: ${file.name}`;
    convertBtn.disabled = false;
    ghibliImage.style.display = 'none';

    // Preview original image
    const reader = new FileReader();
    reader.onload = (event) => {
        originalImage.src = event.target.result;
        originalImage.style.display = 'block';
        originalImageData = event.target.result; // Store for comparison
    };
    reader.readAsDataURL(file);
});

convertBtn.addEventListener('click', async () => {
    const file = imageUpload.files[0];
    if (!file) return;

    // Show loading state
    loading.style.display = 'block';
    convertBtn.disabled = true;
    ghibliImage.style.display = 'none';

    try {
        const formData = new FormData();
        formData.append('image', file);

        console.log('Starting conversion...');
        const startTime = Date.now();

        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const result = await response.json();
        console.log('Conversion successful in', (Date.now() - startTime) + 'ms');

        if (!result.url) {
            throw new Error('No image URL returned from API');
        }

        // Verify the image changed
        ghibliImage.onload = () => {
            console.log('Original image size:', originalImage.src.length);
            console.log('Processed image size:', result.url.length);
            
            if (result.url.length < originalImage.src.length * 0.9 || 
                result.url.length > originalImage.src.length * 1.5) {
                console.warn('Suspicious image size difference - possible no transformation');
            }
            
            loading.style.display = 'none';
            convertBtn.disabled = false;
            ghibliImage.style.display = 'block';
        };

        ghibliImage.onerror = () => {
            throw new Error('Failed to load processed image');
        };

        ghibliImage.src = result.url;

    } catch (error) {
        console.error('Conversion failed:', error);
        loading.style.display = 'none';
        convertBtn.disabled = false;
        
        alert(`Conversion failed: ${error.message}\nCheck console for details.`);
        
        // Fallback: Apply client-side effect if API fails
        if (originalImageData) {
            applyFallbackEffect();
        }
    }
});

// Client-side fallback effect (basic)
function applyFallbackEffect() {
    console.warn('Using fallback client-side effect');
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Simple color transformation
        for (let i = 0; i < data.length; i += 4) {
            // Boost green channel (Ghibli style)
            data[i + 1] = Math.min(data[i + 1] * 1.3, 255);
            // Soften blues
            data[i + 2] = data[i + 2] * 0.9;
        }
        
        ctx.putImageData(imageData, 0, 0);
        ghibliImage.src = canvas.toDataURL('image/jpeg');
        ghibliImage.style.display = 'block';
    };
    
    img.src = originalImageData;
}

// Debug helper
window.debugCompareImages = function() {
    if (!originalImageData || !ghibliImage.src) {
        console.error('No images to compare');
        return;
    }
    
    console.log('--- IMAGE COMPARISON ---');
    console.log('Original:', originalImageData.length, 'bytes');
    console.log('Processed:', ghibliImage.src.length, 'bytes');
    console.log('Difference:', 
        ((ghibliImage.src.length - originalImageData.length) / originalImageData.length * 100).toFixed(2) + '%');
};
