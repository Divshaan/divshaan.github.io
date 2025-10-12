document.addEventListener('DOMContentLoaded', function() {
    // --- Page Transition Logic ---
    const transitionOverlay = document.getElementById('page-transition-overlay');

    if (transitionOverlay) {
        // Function to handle outgoing transition before actual navigation
        function handleOutgoingTransition(href) {
            transitionOverlay.classList.add('animate');
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

        // Use 'pageshow' to handle back/forward cache restoration
        window.addEventListener('pageshow', function(event) {
            // event.persisted is true if the page was loaded from the back-forward cache
            if (event.persisted) {
                // Instantly remove the animation class to un-stick the overlay
                transitionOverlay.classList.remove('animate');
            }
        });

        // Initial removal of overlay animation for direct page loads
        setTimeout(() => {
            if (transitionOverlay) {
                transitionOverlay.classList.remove('animate');
            }
        }, 50);
    }

    // --- General Slider Initializer ---
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

    // --- 404 Page Glitch Dodger Game Logic ---
    const gameCanvas = document.getElementById('glitch-game');
    if (gameCanvas) {
        const ctx = gameCanvas.getContext('2d');
        const scoreEl = document.getElementById('score');
        
        let score = 0;
        let gameOver = false;
        
        // Player
        const player = {
            x: gameCanvas.width / 2 - 15,
            y: gameCanvas.height - 30,
            width: 30,
            height: 10,
            speed: 8,
            dx: 0
        };
        
        // Enemies (Glitches)
        const enemies = [];
        const enemyProto = {
            width: 20,
            height: 20,
            speed: 3
        };

        function createEnemy() {
            enemies.push({
                x: Math.random() * (gameCanvas.width - enemyProto.width),
                y: -enemyProto.height,
                width: enemyProto.width,
                height: enemyProto.height,
                speed: Math.random() * 2 + enemyProto.speed
            });
        }
        
        function drawPlayer() {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(player.x, player.y, player.width, player.height);
        }

        function drawEnemies() {
            ctx.fillStyle = '#A8FF00';
            enemies.forEach(enemy => {
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            });
        }
        
        function update() {
            if(gameOver) return;

            ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
            
            // Move player
            player.x += player.dx;

            // Wall detection for player
            if (player.x < 0) player.x = 0;
            if (player.x + player.width > gameCanvas.width) player.x = gameCanvas.width - player.width;

            drawPlayer();

            // Update and draw enemies
            enemies.forEach((enemy, index) => {
                enemy.y += enemy.speed;
                // Collision detection
                if (
                    player.x < enemy.x + enemy.width &&
                    player.x + player.width > enemy.x &&
                    player.y < enemy.y + enemy.height &&
                    player.y + player.height > enemy.y
                ) {
                   endGame();
                }

                // If enemy is off screen
                if (enemy.y > gameCanvas.height) {
                    enemies.splice(index, 1);
                    score++;
                    scoreEl.innerText = score;
                    createEnemy();
                }
            });

            drawEnemies();
            
            requestAnimationFrame(update);
        }
        
        function moveRight() { player.dx = player.speed; }
        function moveLeft() { player.dx = -player.speed; }
        function stopMove() { player.dx = 0; }

        function keyDown(e) {
            if (e.key === 'ArrowRight' || e.key === 'd') moveRight();
            else if (e.key === 'ArrowLeft' || e.key === 'a') moveLeft();
        }

        function keyUp(e) {
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'ArrowLeft' || e.key === 'a') stopMove();
        }

        // Touch controls
        let touchStartX = 0;
        function touchStart(e) {
            touchStartX = e.touches[0].clientX;
        }
        function touchMove(e) {
            const touchX = e.touches[0].clientX;
            const diff = touchX - touchStartX;
            if (diff > 5) moveRight();
            else if (diff < -5) moveLeft();
            else stopMove();
        }
        function touchEnd() {
            stopMove();
        }

        function startGame() {
            score = 0;
            scoreEl.innerText = 0;
            enemies.length = 0;
            player.x = gameCanvas.width / 2 - player.width / 2;
            gameOver = false;
            for(let i=0; i<3; i++) {
                setTimeout(createEnemy, i * 1000);
            }
            update();
        }

        function endGame() {
            gameOver = true;
            setTimeout(startGame, 1000); // Restart after 1 second
        }

        // Event Listeners
        document.addEventListener('keydown', keyDown);
        document.addEventListener('keyup', keyUp);
        gameCanvas.addEventListener('touchstart', touchStart);
        gameCanvas.addEventListener('touchmove', touchMove);
        gameCanvas.addEventListener('touchend', touchEnd);

        // Set initial canvas size
        function resizeCanvas() {
            const container = document.getElementById('game-container');
            gameCanvas.width = container.clientWidth;
            gameCanvas.height = container.clientWidth * (3/4); // 4:3 aspect ratio
            player.y = gameCanvas.height - 30; // Reset player y on resize
        }
        
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        startGame();
    }
});
