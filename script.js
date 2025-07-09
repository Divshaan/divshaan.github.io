document.addEventListener('DOMContentLoaded', function() {
    
    // --- Page Transition Logic (Global) ---
    const transitionOverlay = document.getElementById('page-transition-overlay');
    if (transitionOverlay) {
        document.querySelectorAll('a').forEach(link => {
            const href = link.getAttribute('href');
            // Apply transition only to internal links that are not hash links or mailto
            if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !link.hasAttribute('target')) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    transitionOverlay.classList.add('animate');
                    setTimeout(() => { window.location.href = href; }, 700); // Match animation duration
                });
            }
        });
    }

    // --- General Slider Initializer (for Homepage Featured Projects and potentially Modals) ---
    // Using a Map to keep track of active intervals for multiple auto-playing sliders
    const activeSliders = new Map();

    function initializeSlider(sliderElement, isAutoPlaying) {
        const sliderId = sliderElement.dataset.slider;
        if (!sliderId) return; // Slider needs a data-slider ID

        const container = sliderElement.querySelector('.slider-container') || sliderElement;
        const slides = container.querySelectorAll('.slide');
        const prev = container.querySelector('.prev');
        const next = container.querySelector('.next');
        let slideIndex = 0;

        if (slides.length <= 1) {
            // Hide navigation if there's only one slide
            if(prev) prev.style.display = 'none';
            if(next) next.style.display = 'none';
            return;
        }

        function showSlide(n) {
            slides.forEach(slide => slide.classList.remove('active'));
            slideIndex = (n + slides.length) % slides.length; // Loop around
            slides[slideIndex].classList.add('active');
        }

        const startSlider = () => {
            if (isAutoPlaying) {
                stopSlider(); // Ensure only one interval runs per slider
                const interval = setInterval(() => showSlide(++slideIndex), 3000);
                activeSliders.set(sliderId, interval);
            }
        };

        const stopSlider = () => {
            if (activeSliders.has(sliderId)) {
                clearInterval(activeSliders.get(sliderId));
                activeSliders.delete(sliderId);
            }
        };

        // Add event listeners for manual navigation (if present)
        if (prev && next) {
            prev.addEventListener('click', (e) => { e.stopPropagation(); showSlide(--slideIndex); stopSlider(); });
            next.addEventListener('click', (e) => { e.stopPropagation(); showSlide(++slideIndex); stopSlider(); });
        }
        
        // Auto-play / hover pause logic
        if (isAutoPlaying) {
            container.addEventListener('mouseenter', stopSlider);
            container.addEventListener('mouseleave', startSlider);
        }

        // Initial display and start
        showSlide(slideIndex);
        startSlider();
    }

    // --- Initialize Sliders on Page Load (For Homepage Featured Projects) ---
    document.querySelectorAll('.project-card[data-slider]').forEach(slider => {
        // Autoplay is ON for homepage sliders
        initializeSlider(slider, true); 
    });


    // --- Modal Logic (if you decide to use modals for image pop-ups again) ---
    // Your previous code had modal logic, but no modals in the provided HTML.
    // I'm keeping this structure here in case you re-introduce modals,
    // for example, for enlarged project images on category pages.
    const modalTriggers = document.querySelectorAll('[data-modal-target]');
    const body = document.querySelector('body');

    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const modal = document.getElementById(trigger.dataset.modalTarget);
            if(modal) {
                modal.classList.add('active');
                body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
                // If there's a slider inside the modal, initialize it (no autoplay)
                const modalSliderElement = modal.querySelector('[data-slider]');
                if (modalSliderElement) {
                    initializeSlider(modalSliderElement, false); // Autoplay is OFF for modal sliders
                }
            }
        });
    });

    function closeModal() {
        const activeModal = document.querySelector('.modal.active');
        if(activeModal) {
            // Stop any sliders that were initialized in the modal
            const modalSliderElement = activeModal.querySelector('[data-slider]');
            if (modalSliderElement) {
                const sliderId = modalSliderElement.dataset.slider;
                if (activeSliders.has(sliderId)) {
                    clearInterval(activeSliders.get(sliderId));
                    activeSliders.delete(sliderId);
                }
            }
            activeModal.classList.remove('active');
            body.style.overflow = 'auto'; // Re-enable scrolling
        }
    }

    document.querySelectorAll('.modal-close').forEach(button => {
        button.addEventListener('click', closeModal);
    });

    window.addEventListener('click', event => {
        if (event.target.classList.contains('modal')) {
            closeModal();
        }
    });

    window.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeModal();
        }
    });

    // --- Smooth scroll for on-page links (e.g., to #work, #about) ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Custom Video Player Logic ---
    const videoPlayer = document.querySelector('.custom-video-player');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const progressBar = document.getElementById('progress-bar');
    const timeDisplay = document.getElementById('time-display');

    if (videoPlayer && playPauseBtn && progressBar && timeDisplay) {
        // Play/Pause functionality
        function togglePlay() {
            if (videoPlayer.paused || videoPlayer.ended) {
                videoPlayer.play();
            } else {
                videoPlayer.pause();
            }
        }

        function updatePlayButton() {
            // Toggle 'paused' class to change button icon
            playPauseBtn.classList.toggle('paused', !videoPlayer.paused);
        }

        playPauseBtn.addEventListener('click', togglePlay);
        videoPlayer.addEventListener('click', togglePlay); // Click video to play/pause
        videoPlayer.addEventListener('play', updatePlayButton);
        videoPlayer.addEventListener('pause', updatePlayButton);

        // Progress bar and time display functionality
        function formatTime(timeInSeconds) {
            const minutes = Math.floor(timeInSeconds / 60);
            const seconds = Math.floor(timeInSeconds % 60);
            return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }

        function updateProgress() {
            if (videoPlayer.duration) { // Ensure duration is available
                progressBar.value = (videoPlayer.currentTime / videoPlayer.duration) * 100;
                timeDisplay.textContent = `${formatTime(videoPlayer.currentTime)} / ${formatTime(videoPlayer.duration)}`;
            } else {
                timeDisplay.textContent = `00:00 / 00:00`; // Default if duration not loaded yet
            }
        }

        videoPlayer.addEventListener('timeupdate', updateProgress);
        
        // Allow seeking by dragging progress bar
        progressBar.addEventListener('input', () => {
            if (videoPlayer.duration) {
                videoPlayer.currentTime = (progressBar.value / 100) * videoPlayer.duration;
            }
        });

        // Initialize time display on metadata load
        videoPlayer.addEventListener('loadedmetadata', updateProgress);
    }

    // For carousel containers on social media page (or similar)
    // You had a specific CSS for this, but no direct JS for its behavior
    // If you need specific carousel navigation beyond simple overflow scroll,
    // you'd add more JS here. For now, it relies on CSS scroll-snap.
});