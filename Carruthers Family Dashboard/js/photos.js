/**
 * Carruthers Family Dashboard - Polaroid Photo of the Day Module
 * Displays rotating memories in a warm vintage Polaroid frame with subtle
 * crossfade transitions, Google Drive integration, and high-res curated fallbacks.
 */

const PhotoModule = {
  // Curated warm, comforting family & nature photographs for instant zero-downtime display
  fallbackPhotos: [
    {
      url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1000&q=80',
      caption: 'Autumn walks & golden leaves',
      date: 'Whiteshell Provincial Park'
    },
    {
      url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1000&q=80',
      caption: 'Crisp morning smiles together',
      date: 'Family Adventure'
    },
    {
      url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1000&q=80',
      caption: 'Capturing sunny afternoon moments',
      date: 'Backyard Memories'
    },
    {
      url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1000&q=80',
      caption: 'Laughter, cozy sweaters & stories',
      date: 'Winnipeg Autumn'
    },
    {
      url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1000&q=80',
      caption: 'Sunny bike rides and park visits',
      date: 'Assiniboine Park'
    },
    {
      url: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=1000&q=80',
      caption: 'Cozy weekend pancake breakfast',
      date: 'Kitchen Warmth'
    }
  ],

  photos: [],
  currentIndex: 0,
  timerId: null,

  init() {
    this.photos = [...this.fallbackPhotos];
    
    // Check if custom photos or Drive photos are stored
    this.loadStoredPhotos();

    // Setup initial photo
    this.currentIndex = Math.floor(Math.random() * this.photos.length);
    this.displayPhoto(this.currentIndex);

    // Bind next button
    const nextBtn = document.getElementById('photo-next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextPhoto());
    }

    // Set rotation timer (default: every 4 hours or as configured)
    const settings = window.StorageEngine.getSettings();
    const intervalMs = (settings.photoIntervalMinutes || 240) * 60000;
    this.timerId = setInterval(() => this.nextPhoto(), intervalMs);
  },

  loadStoredPhotos() {
    try {
      const stored = localStorage.getItem('carruthers_drive_photos');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.photos = parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load custom photos:', e);
    }
  },

  displayPhoto(index) {
    if (!this.photos || this.photos.length === 0) return;
    const photo = this.photos[index % this.photos.length];

    const imgEl = document.getElementById('polaroid-img');
    const captionEl = document.getElementById('polaroid-caption');
    const dateEl = document.getElementById('polaroid-date');

    if (!imgEl) return;

    // Crossfade effect
    imgEl.classList.add('fade-out');

    setTimeout(() => {
      imgEl.src = photo.url;
      imgEl.onload = () => {
        imgEl.classList.remove('fade-out');
      };
      // Fallback if load is cached
      setTimeout(() => imgEl.classList.remove('fade-out'), 100);

      if (captionEl) captionEl.textContent = photo.caption || 'Cherished Moments';
      if (dateEl) dateEl.textContent = photo.date || 'Carruthers Family';
    }, 280);
  },

  nextPhoto() {
    this.currentIndex = (this.currentIndex + 1) % this.photos.length;
    this.displayPhoto(this.currentIndex);
  },

  // Called when Google Apps Script returns a list of photo URLs from the Drive folder
  updatePhotosFromDrive(drivePhotoList) {
    if (Array.isArray(drivePhotoList) && drivePhotoList.length > 0) {
      this.photos = drivePhotoList;
      localStorage.setItem('carruthers_drive_photos', JSON.stringify(drivePhotoList));
      this.nextPhoto();
      if (window.DashboardApp) {
        window.DashboardApp.showToast(`Loaded ${drivePhotoList.length} photos from Google Drive!`);
      }
    }
  }
};

window.PhotoModule = PhotoModule;
