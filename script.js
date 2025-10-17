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
    scale = 1;
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
    defaultImage.src = 'default-picture.png';
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

    // Step 1: Draw solid red background
    ctx.fillStyle = '#EB252C';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Step 2: Draw user image with adjusted blend mode
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

        // Create a temporary canvas to desaturate and apply blend mode
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext('2d');

        // Draw image to temp canvas
        tempCtx.drawImage(userImage, 0, 0, w, h);

        // Reduce saturation by overlaying grayscale version
        tempCtx.globalCompositeOperation = 'saturation';
        tempCtx.fillStyle = 'hsl(0, 0%, 50%)';
        tempCtx.fillRect(0, 0, w, h);
        tempCtx.globalCompositeOperation = 'source-over';

        // Apply lighten blend mode
        ctx.globalCompositeOperation = 'lighten';
        ctx.drawImage(tempCanvas, pos.x, pos.y);
        ctx.globalCompositeOperation = 'source-over'; // Reset blend mode
    }

    // Step 3: Apply elliptical radial gradient (only in the specified rectangle area)
    // From Figma: Rectangle at top:485px, height:865px, gradient at 52.05% 0% (relative)
    ctx.save();

    // Clip to the gradient rectangle area
    const rectTop = 485;
    const rectHeight = 865;
    ctx.beginPath();
    ctx.rect(0, rectTop, canvas.width, rectHeight);
    ctx.clip();

    // Gradient center position (52.05% horizontal, at top of rectangle)
    const centerX = canvas.width * 0.5205;
    const centerY = rectTop; // Top of the gradient rectangle

    // Calculate ellipse radii based on Figma values (117.3% width, 74.99% height)
    const radiusX = canvas.width * 1.173;
    const radiusY = rectHeight * 0.7499;

    // Transform canvas to create elliptical effect
    ctx.translate(centerX, centerY);
    ctx.scale(1, radiusY / radiusX);
    ctx.translate(-centerX, -centerY);

    // Create circular gradient (will be elliptical due to scale)
    const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radiusX
    );

    // Color stops: transparent from 0-45%, then fade to solid red at 100%
    gradient.addColorStop(0, 'rgba(235, 37, 44, 0)');
    gradient.addColorStop(0.45, 'rgba(235, 37, 44, 0)');
    gradient.addColorStop(1, 'rgba(235, 37, 44, 1)');

    ctx.fillStyle = gradient;
    ctx.fillRect(-canvas.width, -canvas.height, canvas.width * 3, canvas.height * 3);

    // Restore canvas state
    ctx.restore();

    // Step 4: Draw the overlay on top
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