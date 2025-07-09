document.addEventListener('DOMContentLoaded', function() {
    
    // --- Page Transition Logic ---
    const transitionOverlay = document.getElementById('page-transition-overlay');

    if (transitionOverlay) {
        // Function to handle outgoing transition before actual navigation
        function handleOutgoingTransition(href) {
            transitionOverlay.classList.add('animate');
            // Use setTimeout to allow animation to play before navigating
            setTimeout(() => {
                window.location.href = href; // Perform actual navigation
            }, 700); // Match CSS animation duration
        }

        // Intercept clicks on internal links
        document.querySelectorAll('a').forEach(link => {
            const href = link.getAttribute('href');
            // Only apply to internal links, not hash links, mailto links, or external targets
            if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !link.hasAttribute('target')) {
                link.addEventListener('click', function(e) {
                    e.preventDefault(); // Prevent default browser navigation

                    // Check if current URL is different from target URL to avoid pushing duplicate history states
                    if (window.location.pathname !== href && window.location.href !== href) {
                        history.pushState({ path: href }, '', href); // Manually add state to browser history
                    }
                    
                    handleOutgoingTransition(href); // Trigger the transition and then navigate
                });
            }
        });

        // Handle popstate event (browser back/forward button clicks)
        window.addEventListener('popstate', function(event) {
            // popstate fires when history changes (e.g., back/forward buttons)
            // It might fire on initial page load in some browsers, so check event.state
            if (event.state && event.state.path) {
                // If there's a valid state from our pushState, navigate to it with transition
                handleOutgoingTransition(event.state.path);
            } else {
                // This handles cases like navigating back to the very first page in history
                // or a state not pushed by our script. A simple reload often works best here
                // to ensure the page state is correctly reconstructed.
                window.location.reload(); 
            }
        });

        // Initial removal of overlay animation if page loaded directly (not via transition).
        // This ensures the animation doesn't play when someone first lands on a page.
        // It's placed outside DOMContentLoaded to ensure it runs as early as possible.
        // Also, add a small timeout to ensure CSS is rendered before removing.
        setTimeout(() => {
            if (transitionOverlay.classList.contains('animate')) {
                transitionOverlay.classList.remove('animate');
            }
        }, 100); // Small delay to allow initial rendering
    }
});

document.addEventListener('DOMContentLoaded', function() {
    
    // --- General Slider Initializer ---
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

    // --- Custom Video Player Logic (Remains for any future self-hosted videos) ---
    const videoPlayer = document.querySelector('.custom-video-player');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const progressBar = document.getElementById('progress-bar');
    const timeDisplay = document.getElementById('time-display');

    if (videoPlayer && playPauseBtn && progressBar && timeDisplay) {
        function togglePlay() {
            if (videoPlayer.paused || videoPlayer.ended) {
                videoPlayer.play();
            } else {
                videoPlayer.pause();
            }
        }

        function updatePlayButton() {
            playPauseBtn.classList.toggle('paused', !videoPlayer.paused);
        }

        playPauseBtn.addEventListener('click', togglePlay);
        videoPlayer.addEventListener('click', togglePlay);
        videoPlayer.addEventListener('play', updatePlayButton);
        videoPlayer.addEventListener('pause', updatePlayButton);

        function formatTime(timeInSeconds) {
            const minutes = Math.floor(timeInSeconds / 60);
            const seconds = Math.floor(timeInSeconds % 60);
            return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }

        function updateProgress() {
            if (videoPlayer.duration) {
                progressBar.value = (videoPlayer.currentTime / videoPlayer.duration) * 100;
                timeDisplay.textContent = `${formatTime(videoPlayer.currentTime)} / ${formatTime(videoPlayer.duration)}`;
            } else {
                timeDisplay.textContent = `00:00 / 00:00`;
            }
        }

        videoPlayer.addEventListener('timeupdate', updateProgress);
        
        progressBar.addEventListener('input', () => {
            if (videoPlayer.duration) {
                videoPlayer.currentTime = (progressBar.value / 100) * videoPlayer.duration;
            }
        });

        videoPlayer.addEventListener('loadedmetadata', updateProgress);
    }
});
