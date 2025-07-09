document.addEventListener('DOMContentLoaded', function() {
    // --- Page Transition Logic ---
    const transitionOverlay = document.getElementById('page-transition-overlay');

    if (transitionOverlay) {
        // Function to handle outgoing transition before actual navigation
        function handleOutgoingTransition(href) {
            transitionOverlay.classList.add('animate');
            // UPDATED: Animation time set to 580ms
            setTimeout(() => {
                window.location.href = href; // Perform actual navigation
            }, 580); // Match CSS animation duration
        }

        // Intercept clicks on internal links
        document.querySelectorAll('a').forEach(link => {
            const href = link.getAttribute('href');
            // Only apply to internal links, not hash links, mailto links, or external targets
            if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !link.hasAttribute('target')) {
                link.addEventListener('click', function(e) {
                    e.preventDefault(); // Prevent default browser navigation
                    
                    handleOutgoingTransition(href); // Trigger the transition and then navigate
                });
            }
        });

        // Handle browser back/forward button clicks (popstate event)
        window.addEventListener('popstate', function(event) {
            if (transitionOverlay.classList.contains('animate')) {
                transitionOverlay.classList.remove('animate');
            }
            window.location.reload(); 
        });

        // Initial removal of overlay animation if page loaded directly (not via transition).
        setTimeout(() => {
            if (transitionOverlay) {
                transitionOverlay.classList.remove('animate');
            }
        }, 50); // Very short delay
    }
});

// --- Code below this line remains unchanged from previous versions ---
// --- General Slider Initializer ---
document.addEventListener('DOMContentLoaded', function() {
    const activeSliders = new Map();

    function initializeSlider(sliderElement, isAutoPlaying) {
        const sliderId = sliderElement.dataset.slider;
        if (!sliderId) return; 

        const container = sliderElement.querySelector('.slider-container') || sliderElement;
        const slides = container.querySelectorAll('.slide');
        const prev = container.querySelector('.prev');
        const next = container.querySelector('.next');
        let slideIndex = 0;

        if (slides.length <= 1) {
            if(prev) prev.style.display = 'none';
            if(next) next.style.display = 'none';
            return;
        }

        function showSlide(n) {
            slides.forEach(slide => slide.classList.remove('active'));
            slideIndex = (n + slides.length) % slides.length; 
            slides[slideIndex].classList.add('active');
        }

        const startSlider = () => {
            if (isAutoPlaying) {
                stopSlider(); 
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

        if (prev && next) {
            prev.addEventListener('click', (e) => { e.stopPropagation(); showSlide(--slideIndex); stopSlider(); });
            next.addEventListener('click', (e) => { e.stopPropagation(); showSlide(++slideIndex); stopSlider(); });
        }
        
        if (isAutoPlaying) {
            container.addEventListener('mouseenter', stopSlider);
            container.addEventListener('mouseleave', startSlider);
        }

        showSlide(slideIndex);
        startSlider();
    }

    document.querySelectorAll('.project-card[data-slider]').forEach(slider => {
        initializeSlider(slider, true); 
    });


    // --- Modal Logic ---
    const modalTriggers = document.querySelectorAll('[data-modal-target]');
    const body = document.querySelector('body');

    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const modal = document.getElementById(trigger.dataset.modalTarget);
            if(modal) {
                modal.classList.add('active');
                body.style.overflow = 'hidden'; 
                const modalSliderElement = modal.querySelector('[data-slider]');
                if (modalSliderElement) {
                    initializeSlider(modalSliderElement, false); 
                }
            }
        });
    });

    function closeModal() {
        const activeModal = document.querySelector('.modal.active');
        if(activeModal) {
            const modalSliderElement = activeModal.querySelector('[data-slider]');
            if (modalSliderElement) {
                const sliderId = modalSliderElement.dataset.slider;
                if (activeSliders.has(sliderId)) {
                    clearInterval(activeSliders.get(sliderId));
                    activeSliders.delete(sliderId);
                }
            }
            activeModal.classList.remove('active');
            body.style.overflow = 'auto'; 
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

    // --- Smooth scroll for on-page links ---
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
