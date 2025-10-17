const imageInput = document.getElementById('imageUpload');
const zoomSlider = document.getElementById('zoomSlider');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

let userImage = null;
let defaultImage = null;
let isDefaultImage = true;
let overlayImage = new Image();

let scale = 1;
let pos = { x: 0, y: 0 };
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let lastTouchDistance = null;

// Load the overlay image
overlayImage.onload = () => {
    canvas.width = 1080;
    canvas.height = 1350;
    // Once overlay is loaded, load the default preview image
    loadDefaultImage();
};
    overlayImage.src = 'transparencia.png';

function loadDefaultImage() {
    defaultImage = new Image();
    defaultImage.crossOrigin = "anonymous";
    defaultImage.onload = () => {
    userImage = defaultImage;
    isDefaultImage = true;
    scale = 1.4; // Zoom out to 70%
    zoomSlider.value = scale;
    pos = {
        x: (canvas.width - defaultImage.width * scale) / 2 - 50,
        y: (canvas.height - defaultImage.height * scale) / 2 + 500
    };
    draw();
    zoomSlider.disabled = true;
    resetBtn.disabled = true;
    downloadBtn.disabled = true;
    };
    defaultImage.src = 'https://images.squarespace-cdn.com/content/682f57827481367eb4ae3e19/75c59175-d63a-4fa8-a5fd-6cdd0ef72bf0/default-preview.png';
}

function resetPosition() {
    if (!userImage || isDefaultImage) {
        return
    };

    // canvas.width = Math.max(userImage.width, userImage.height);
    // canvas.height = Math.max(userImage.width, userImage.height);

    scale = 1.5;
    zoomSlider.value = scale;
    pos = {
        x: (canvas.width - userImage.width * scale) / 2,
        y: (canvas.height - userImage.height * scale) / 2
    };
    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (userImage) {
    const w = userImage.width * scale;
    const h = userImage.height * scale;

    // Snap boundaries (no white gaps)
    const minX = Math.min(0, canvas.width - w);
    const minY = Math.min(0, canvas.height - h);
    const maxX = Math.max(0, canvas.width - w);
    const maxY = Math.max(0, canvas.height - h);

    pos.x = Math.min(maxX, Math.max(minX, pos.x));
    pos.y = Math.min(maxY, Math.max(minY, pos.y));

    ctx.drawImage(userImage, pos.x, pos.y, w, h);
    }

    // Apply radial gradient underneath the overlay
    // Position: 52.05% horizontal, 0% vertical
    const centerX = canvas.width * 0.5205;
    const centerY = 0;

    // Radii: 117.3% width, 74.99% height (elliptical)
    const radiusX = canvas.width * 1.173;
    const radiusY = canvas.height * 0.7499;
    const radius = Math.max(radiusX, radiusY);

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(235, 37, 44, 0)');
    gradient.addColorStop(0.45, 'rgba(235, 37, 44, 0)');
    gradient.addColorStop(1, '#EB252C');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the overlay on top
    ctx.drawImage(overlayImage, 0, 0, canvas.width, canvas.height);
}

function downloadImage() {
    // Only allow download if user uploaded their own image
    if (isDefaultImage) return;
    
    const link = document.createElement('a');
    link.download = 'perfil-noronha-lopes.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

imageInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
    userImage = new Image();
    userImage.onload = () => {
        isDefaultImage = false; // User uploaded their own image
        resetPosition();
        zoomSlider.disabled = false;
        resetBtn.disabled = false;
        downloadBtn.disabled = false; // NOW enable download
    };
    userImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

zoomSlider.addEventListener('input', () => {
    scale = parseFloat(zoomSlider.value);
    draw();
});

// Drag (Mouse)
canvas.addEventListener('mousedown', e => {
    if (isDefaultImage) {
        return
    }

    isDragging = true;
    const rect = canvas.getBoundingClientRect();
    dragStart.x = (e.clientX - rect.left) * (canvas.width / rect.width) - pos.x;
    dragStart.y = (e.clientY - rect.top) * (canvas.height / rect.height) - pos.y;
});

canvas.addEventListener('mousemove', e => {
    if (isDefaultImage) {
        return
    }

    if (!isDragging) return;
    const rect = canvas.getBoundingClientRect();
    pos.x = (e.clientX - rect.left) * (canvas.width / rect.width) - dragStart.x;
    pos.y = (e.clientY - rect.top) * (canvas.height / rect.height) - dragStart.y;
    draw();
});

window.addEventListener('mouseup', () => {
    if (isDefaultImage) {
        return
    }

    isDragging = false;
});

// Touch drag/zoom
canvas.addEventListener('touchstart', e => {
    if (isDefaultImage) {
        return
    }

    if (e.touches.length === 1) {
    isDragging = true;
    const rect = canvas.getBoundingClientRect();
    dragStart.x = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width) - pos.x;
    dragStart.y = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height) - pos.y;
    } else if (e.touches.length === 2) {
    lastTouchDistance = getTouchDistance(e.touches);
    }
});

canvas.addEventListener('touchmove', e => {
    e.preventDefault();

    if (isDefaultImage) {
        return
    }
    
    if (e.touches.length === 1 && isDragging) {
    const rect = canvas.getBoundingClientRect();
    pos.x = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width) - dragStart.x;
    pos.y = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height) - dragStart.y;
    draw();
    } else if (e.touches.length === 2) {
    const currentDistance = getTouchDistance(e.touches);
    if (lastTouchDistance) {
        const delta = currentDistance / lastTouchDistance;
        scale *= delta;
        scale = Math.max(0.5, Math.min(3, scale));
        zoomSlider.value = scale;
        draw();
    }
    lastTouchDistance = currentDistance;
    }
}, { passive: false });

window.addEventListener('touchend', () => {
    if (isDefaultImage) {
        return
    }
    
    isDragging = false;
    lastTouchDistance = null;
});

function getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

// Double-click to reset
canvas.addEventListener('dblclick', () => {
    resetPosition();
});

// Reset button
resetBtn.addEventListener('click', resetPosition);

// Dropdown menu functionality
const phraseBtn = document.getElementById('phraseBtn');
const phraseDropdown = document.getElementById('phraseDropdown');
const phraseOptions = document.querySelectorAll('.phrase-option');

// Toggle dropdown when button is clicked
phraseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    phraseDropdown.classList.toggle('show');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!phraseBtn.contains(e.target) && !phraseDropdown.contains(e.target)) {
        phraseDropdown.classList.remove('show');
    }
});

// Function to load overlay image based on selected phrase
function loadOverlayImage(phraseName) {
    const overlayMap = {
        'transparencia': 'transparencia.png',
        'associativismo': 'associativismo.png',
        'competencia': 'competencia.png',
        'ecletismo': 'ecletismo.png',
        'benfica-europeu': 'benficaeuropeu.png'
    };

    const filename = overlayMap[phraseName];
    if (filename) {
        overlayImage = new Image();
        overlayImage.onload = () => {
            draw();
        };
        overlayImage.src = filename;
    }
}

// Handle phrase selection
phraseOptions.forEach(option => {
    option.addEventListener('click', (e) => {
        const selectedPhrase = e.target.dataset.phrase;
        const selectedText = e.target.textContent;

        // Update button text to show selected phrase with arrow
        phraseBtn.textContent = selectedText + ' ▼';

        // Close dropdown
        phraseDropdown.classList.remove('show');

        // Load the corresponding overlay image for the selected phrase
        loadOverlayImage(selectedPhrase);
    });
});