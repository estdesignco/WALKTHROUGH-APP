/* ENHANCED FURNITURE GALLERY SYSTEM
 * Features:
 * - Larger product images
 * - Click to zoom functionality  
 * - Multiple image carousel
 * - Color variation selection
 * - Full-screen gallery view
 */

class EnhancedFurnitureGallery {
    constructor() {
        this.currentProduct = null;
        this.currentImageIndex = 0;
        this.zoomLevel = 1;
        this.initializeGallery();
    }

    initializeGallery() {
        // Add gallery modal HTML to page
        this.createGalleryModal();
        
        // Enhance existing product cards
        this.enhanceProductCards();
        
        // Add event listeners
        this.addEventListeners();
    }

    createGalleryModal() {
        const modalHTML = `
            <div id="furniture-gallery-modal" class="fixed inset-0 bg-black bg-opacity-90 hidden z-50">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="relative max-w-6xl w-full">
                        <!-- Close button -->
                        <button id="gallery-close" class="absolute top-4 right-4 text-white text-3xl z-10 hover:text-gray-300">
                            ×
                        </button>
                        
                        <!-- Main image container -->
                        <div class="relative bg-white rounded-lg overflow-hidden">
                            <!-- Product info header -->
                            <div class="bg-gray-100 p-4 border-b">
                                <h2 id="gallery-product-name" class="text-2xl font-bold text-gray-800"></h2>
                                <p id="gallery-product-info" class="text-gray-600"></p>
                            </div>
                            
                            <!-- Image display area -->
                            <div class="relative" style="height: 500px;">
                                <img id="gallery-main-image" 
                                     class="w-full h-full object-contain cursor-zoom-in"
                                     alt="Product Image">
                                
                                <!-- Zoom overlay -->
                                <div id="gallery-zoom-overlay" class="absolute inset-0 hidden overflow-hidden">
                                    <img id="gallery-zoomed-image" 
                                         class="cursor-zoom-out transform-gpu"
                                         style="transform-origin: center; transition: transform 0.3s;">
                                </div>
                                
                                <!-- Navigation arrows -->
                                <button id="gallery-prev" class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70">
                                    ←
                                </button>
                                <button id="gallery-next" class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70">
                                    →
                                </button>
                            </div>
                            
                            <!-- Image thumbnails -->
                            <div class="p-4 border-t">
                                <div class="flex space-x-2 overflow-x-auto" id="gallery-thumbnails">
                                    <!-- Thumbnails will be inserted here -->
                                </div>
                            </div>
                            
                            <!-- Color variations -->
                            <div id="gallery-color-variations" class="p-4 border-t hidden">
                                <h3 class="font-bold text-gray-800 mb-2">Available Colors:</h3>
                                <div class="flex space-x-2" id="gallery-color-options">
                                    <!-- Color options will be inserted here -->
                                </div>
                            </div>
                            
                            <!-- Image controls -->
                            <div class="p-4 bg-gray-50 flex justify-between items-center">
                                <div class="flex space-x-2">
                                    <button id="gallery-zoom-in" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                        Zoom In
                                    </button>
                                    <button id="gallery-zoom-out" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                        Zoom Out
                                    </button>
                                    <button id="gallery-reset-zoom" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                                        Reset
                                    </button>
                                </div>
                                <div class="text-sm text-gray-600">
                                    <span id="gallery-image-counter">1 of 1</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    enhanceProductCards() {
        // Make existing product images larger and add hover effects
        const productCards = document.querySelectorAll('.furniture-product-card');
        
        productCards.forEach(card => {
            const img = card.querySelector('img');
            if (img) {
                // Make images larger
                img.style.width = '100%';
                img.style.height = '250px';  // Larger than before
                img.style.objectFit = 'cover';
                img.style.cursor = 'pointer';
                
                // Add hover effect
                img.addEventListener('mouseenter', () => {
                    img.style.transform = 'scale(1.05)';
                    img.style.transition = 'transform 0.3s ease';
                });
                
                img.addEventListener('mouseleave', () => {
                    img.style.transform = 'scale(1)';
                });
                
                // Add click to open gallery
                img.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.openGallery(card);
                });
            }
        });
    }

    addEventListeners() {
        // Gallery modal controls
        document.getElementById('gallery-close').addEventListener('click', () => {
            this.closeGallery();
        });
        
        document.getElementById('gallery-prev').addEventListener('click', () => {
            this.previousImage();
        });
        
        document.getElementById('gallery-next').addEventListener('click', () => {
            this.nextImage();
        });
        
        // Zoom controls
        document.getElementById('gallery-zoom-in').addEventListener('click', () => {
            this.zoomIn();
        });
        
        document.getElementById('gallery-zoom-out').addEventListener('click', () => {
            this.zoomOut();
        });
        
        document.getElementById('gallery-reset-zoom').addEventListener('click', () => {
            this.resetZoom();
        });
        
        // Main image click to zoom
        document.getElementById('gallery-main-image').addEventListener('click', () => {
            this.toggleZoom();
        });
        
        // Close modal on background click
        document.getElementById('furniture-gallery-modal').addEventListener('click', (e) => {
            if (e.target.id === 'furniture-gallery-modal') {
                this.closeGallery();
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('furniture-gallery-modal').classList.contains('hidden')) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.previousImage();
                    break;
                case 'ArrowRight':
                    this.nextImage();
                    break;
                case 'Escape':
                    this.closeGallery();
                    break;
                case '+':
                case '=':
                    this.zoomIn();
                    break;
                case '-':
                    this.zoomOut();
                    break;
            }
        });
    }

    async openGallery(productCard) {
        // Extract product data from card
        const productName = productCard.querySelector('.product-name')?.textContent || 'Unknown Product';
        const productVendor = productCard.querySelector('.product-vendor')?.textContent || 'Unknown Vendor';
        const productPrice = productCard.querySelector('.product-price')?.textContent || 'Price not available';
        const productSku = productCard.dataset.sku || '';
        
        // Fetch enhanced product data from API
        try {
            const response = await fetch(`/api/furniture/furniture-catalog/search?query=${productSku}`);
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const product = data.results[0];
                this.currentProduct = {
                    name: product.name,
                    vendor: product.vendor,
                    price: product.cost,
                    sku: product.sku,
                    images: product.image_gallery || [{ base64: product.image_url, type: 'main' }],
                    colorVariations: product.color_variations || {}
                };
            } else {
                // Fallback to basic data
                this.currentProduct = {
                    name: productName,
                    vendor: productVendor,
                    price: productPrice,
                    sku: productSku,
                    images: [{ base64: productCard.querySelector('img')?.src, type: 'main' }],
                    colorVariations: {}
                };
            }
        } catch (error) {
            console.error('Failed to fetch enhanced product data:', error);
            // Use basic data from card
            this.currentProduct = {
                name: productName,
                vendor: productVendor,
                price: productPrice,
                sku: productSku,
                images: [{ base64: productCard.querySelector('img')?.src, type: 'main' }],
                colorVariations: {}
            };
        }
        
        this.currentImageIndex = 0;
        this.zoomLevel = 1;
        
        // Populate gallery
        this.populateGallery();
        
        // Show modal
        document.getElementById('furniture-gallery-modal').classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    populateGallery() {
        // Update product info
        document.getElementById('gallery-product-name').textContent = this.currentProduct.name;
        document.getElementById('gallery-product-info').textContent = 
            `${this.currentProduct.vendor} • ${this.currentProduct.sku} • $${this.currentProduct.price}`;
        
        // Update main image
        this.updateMainImage();
        
        // Populate thumbnails
        this.populateThumbnails();
        
        // Populate color variations
        this.populateColorVariations();
        
        // Update counter
        this.updateImageCounter();
    }

    updateMainImage() {
        const mainImg = document.getElementById('gallery-main-image');
        const zoomedImg = document.getElementById('gallery-zoomed-image');
        
        if (this.currentProduct.images[this.currentImageIndex]) {
            const imageData = this.currentProduct.images[this.currentImageIndex];
            mainImg.src = imageData.base64;
            zoomedImg.src = imageData.base64;
        }
    }

    populateThumbnails() {
        const container = document.getElementById('gallery-thumbnails');
        container.innerHTML = '';
        
        this.currentProduct.images.forEach((image, index) => {
            const thumb = document.createElement('img');
            thumb.src = image.base64;
            thumb.className = `w-16 h-16 object-cover rounded cursor-pointer border-2 ${
                index === this.currentImageIndex ? 'border-blue-500' : 'border-gray-200'
            }`;
            thumb.addEventListener('click', () => {
                this.currentImageIndex = index;
                this.updateMainImage();
                this.populateThumbnails(); // Refresh to update active state
                this.updateImageCounter();
            });
            container.appendChild(thumb);
        });
    }

    populateColorVariations() {
        const container = document.getElementById('gallery-color-variations');
        const optionsContainer = document.getElementById('gallery-color-options');
        
        if (Object.keys(this.currentProduct.colorVariations).length > 0) {
            container.classList.remove('hidden');
            optionsContainer.innerHTML = '';
            
            Object.entries(this.currentProduct.colorVariations).forEach(([color, images]) => {
                const colorButton = document.createElement('button');
                colorButton.className = 'px-4 py-2 border rounded hover:bg-gray-100';
                colorButton.textContent = color;
                colorButton.addEventListener('click', () => {
                    // Switch to color variation images
                    this.currentProduct.images = images;
                    this.currentImageIndex = 0;
                    this.populateGallery();
                });
                optionsContainer.appendChild(colorButton);
            });
        } else {
            container.classList.add('hidden');
        }
    }

    updateImageCounter() {
        document.getElementById('gallery-image-counter').textContent = 
            `${this.currentImageIndex + 1} of ${this.currentProduct.images.length}`;
    }

    previousImage() {
        if (this.currentImageIndex > 0) {
            this.currentImageIndex--;
            this.updateMainImage();
            this.populateThumbnails();
            this.updateImageCounter();
        }
    }

    nextImage() {
        if (this.currentImageIndex < this.currentProduct.images.length - 1) {
            this.currentImageIndex++;
            this.updateMainImage();
            this.populateThumbnails();
            this.updateImageCounter();
        }
    }

    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel * 1.5, 5);
        this.applyZoom();
    }

    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel / 1.5, 1);
        this.applyZoom();
    }

    resetZoom() {
        this.zoomLevel = 1;
        this.applyZoom();
        document.getElementById('gallery-zoom-overlay').classList.add('hidden');
    }

    toggleZoom() {
        if (this.zoomLevel === 1) {
            this.zoomIn();
        } else {
            this.resetZoom();
        }
    }

    applyZoom() {
        const zoomedImg = document.getElementById('gallery-zoomed-image');
        const overlay = document.getElementById('gallery-zoom-overlay');
        
        if (this.zoomLevel > 1) {
            overlay.classList.remove('hidden');
            zoomedImg.style.transform = `scale(${this.zoomLevel})`;
        } else {
            overlay.classList.add('hidden');
        }
    }

    closeGallery() {
        document.getElementById('furniture-gallery-modal').classList.add('hidden');
        document.body.style.overflow = ''; // Restore scrolling
        this.resetZoom();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EnhancedFurnitureGallery();
});

// CSS Styles for enhanced gallery (add to your stylesheet)
const galleryStyles = `
<style>
.furniture-product-card img {
    transition: transform 0.3s ease;
}

.furniture-product-card img:hover {
    transform: scale(1.05);
}

#gallery-zoom-overlay {
    cursor: zoom-out;
}

#gallery-main-image {
    transition: transform 0.3s ease;
}

.gallery-thumbnail.active {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 2px #3b82f6;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', galleryStyles);
