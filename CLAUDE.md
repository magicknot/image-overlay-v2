# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A client-side profile picture generator that allows users to upload images, position and zoom them within a circular viewport, and download circular profile pictures. Built with vanilla JavaScript and HTML5 Canvas.

## How to Run

Open `perfil.html` directly in a web browser. No build process, server, or dependencies required.

## Code Architecture

### Files
- `perfil.html` - Single-page HTML with embedded CSS (~1.2MB due to base64 images)
- `script.js` - JavaScript for Canvas-based image manipulation (~1.2MB due to base64 images)

### Key JavaScript Components

**State Management:**
- `userImage` / `defaultImage` - Loaded image objects
- `overlayImage` - Overlay applied on top of user image
- `scale` - Zoom level (0.5-3.0)
- `pos` - Image x/y position
- `isDragging` / `dragStart` - Drag interaction state
- `lastTouchDistance` - Touch pinch-to-zoom tracking

**Core Functions:**
- `loadDefaultImage()` - Loads default preview image on page load
- `resetPosition()` - Centers image and resets zoom to 1.0
- `draw()` - Main render loop that composites image layers onto canvas
- `downloadImage()` - Exports 400x400px circular PNG
- `getTouchDistance()` - Calculates pinch gesture distance for mobile zoom

**Interaction Model:**
- File input triggers image load via `imageInput.addEventListener('change')`
- Mouse drag via `mousedown`/`mousemove`/`mouseup` events on canvas
- Touch drag/pinch via `touchstart`/`touchmove`/`touchend` with multi-touch support
- Zoom slider updates `scale` variable
- Reset button calls `resetPosition()`

### Canvas Rendering

The `draw()` function renders at 400x400px:
1. Clears canvas
2. Draws user/default image (scaled by `scale`, positioned by `pos`)
3. Applies overlay image on top

Images are centered and scaled to fit the circular viewport using `ctx.drawImage()` with calculated dimensions.

### Language

UI is in Portuguese ("CRIA O TEU PERFIL ACIMA DE TUDO" = "CREATE YOUR PROFILE ABOVE ALL").
