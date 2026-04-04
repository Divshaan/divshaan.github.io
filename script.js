document.addEventListener('DOMContentLoaded', function() {

    // --- Scroll Reveal Observer ---
    (function initRevealSystem() {
        // Auto-stagger: add reveal classes to children of [data-stagger] containers
        document.querySelectorAll('[data-stagger]').forEach(grid => {
            const children = grid.children;
            const type = grid.dataset.stagger;
            const cls = type === 'image' ? 'reveal-image' : 'reveal';
            for (let i = 0; i < children.length; i++) {
                children[i].classList.add(cls);
                const delay = Math.min(i, 5);
                children[i].classList.add('reveal-delay-' + (delay + 1));
            }
        });

        const revealElements = document.querySelectorAll('.reveal, .reveal-heading, .reveal-image');
        const footerEl = document.querySelector('footer');

        if (revealElements.length > 0 || footerEl) {
            // Check if element is in the viewport
            function isInViewport(el) {
                const rect = el.getBoundingClientRect();
                return rect.top < window.innerHeight - 50 && rect.bottom > 0;
            }

            // On load: stagger elements already visible in viewport
            // so they cascade in instead of all appearing at once
            setTimeout(() => {
                const inView = [];
                const belowFold = [];

                revealElements.forEach(el => {
                    if (isInViewport(el)) {
                        inView.push(el);
                    } else {
                        belowFold.push(el);
                    }
                });

                // Stagger above-fold elements with 120ms intervals
                inView.forEach((el, i) => {
                    setTimeout(() => {
                        el.classList.add('visible');
                    }, i * 120);
                });

                // Footer if in view
                if (footerEl && isInViewport(footerEl)) {
                    setTimeout(() => {
                        footerEl.classList.add('visible');
                    }, inView.length * 120);
                }

                // Set up observer for remaining below-fold elements
                const revealObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('visible');
                            revealObserver.unobserve(entry.target);
                        }
                    });
                }, {
                    threshold: 0.15,
                    rootMargin: '0px 0px -50px 0px'
                });

                belowFold.forEach(el => revealObserver.observe(el));
                if (footerEl && !isInViewport(footerEl)) {
                    revealObserver.observe(footerEl);
                }
            }, 300);
        }
    })();

    // --- Hero Section Animations ---
    const heroSection = document.querySelector('.hero');
    if (heroSection && typeof gsap !== 'undefined') {
        const heroH1 = heroSection.querySelector('h1');
        const heroSubtitle = heroSection.querySelector('.subtitle');
        const heroCta = heroSection.querySelector('.hero-cta');

        // ===== 1. TEXT SCRAMBLE / DECODE EFFECT =====
        const finalText = 'DIVSHAAN SINGH BRAR';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&*!?<>{}[]';
        const scrambleDuration = 1500; // ms
        const frameInterval = 40; // ms per frame
        const totalFrames = scrambleDuration / frameInterval;

        let currentFrame = 0;
        heroH1.textContent = finalText.replace(/[^ ]/g, () => chars[Math.floor(Math.random() * chars.length)]);

        const scrambleInterval = setInterval(() => {
            currentFrame++;
            const progress = currentFrame / totalFrames;
            // Characters resolve left-to-right based on progress
            const resolved = Math.floor(progress * finalText.length);

            let display = '';
            for (let i = 0; i < finalText.length; i++) {
                if (finalText[i] === ' ') {
                    display += ' ';
                } else if (i < resolved) {
                    display += finalText[i];
                } else {
                    display += chars[Math.floor(Math.random() * chars.length)];
                }
            }
            heroH1.textContent = display;

            if (currentFrame >= totalFrames) {
                clearInterval(scrambleInterval);
                heroH1.textContent = finalText;
            }
        }, frameInterval);

        // ===== 2. STAGGERED ENTRANCE ANIMATIONS (GSAP) =====
        const tl = gsap.timeline();
        tl.to(heroH1, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out'
        })
        .to(heroSubtitle, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power3.out'
        }, '-=0.5')
        .to(heroCta, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power3.out'
        }, '-=0.3');

    }

    // ===== 3D BACKGROUND PARTICLE NETWORK (THREE.JS) =====
    (function init3DBackground() {
        if (typeof THREE === 'undefined') return;

        const container = document.getElementById('bg-animation');
        if (!container) return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isMobile = window.innerWidth < 768;
        const PARTICLE_COUNT = isMobile ? 60 : 120;
        const CONNECTION_DISTANCE = isMobile ? 120 : 150;
        const FIELD_SIZE = 400;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.z = 350;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        // Mouse tracking for parallax
        const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

        // Create particles
        const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
        const particleVelocities = [];

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            particlePositions[i3] = (Math.random() - 0.5) * FIELD_SIZE * 2;
            particlePositions[i3 + 1] = (Math.random() - 0.5) * FIELD_SIZE * 2;
            particlePositions[i3 + 2] = (Math.random() - 0.5) * FIELD_SIZE * 2;

            particleVelocities.push({
                x: (Math.random() - 0.5) * 0.3,
                y: (Math.random() - 0.5) * 0.3,
                z: (Math.random() - 0.5) * 0.3
            });
        }

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: 0xA8FF00,
            size: isMobile ? 2.5 : 2,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });

        const points = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(points);

        // Line connections
        const maxLines = PARTICLE_COUNT * PARTICLE_COUNT;
        const linePositions = new Float32Array(maxLines * 6);
        const lineColors = new Float32Array(maxLines * 6);
        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
        lineGeometry.setDrawRange(0, 0);

        const lineMaterial = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });

        const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(lineSegments);

        // Animation
        let animFrameId;
        const baseRotationSpeed = 0.0003;

        function animate() {
            animFrameId = requestAnimationFrame(animate);

            if (document.hidden) return;

            const positions = particleGeometry.attributes.position.array;

            // Update particle positions
            if (!prefersReducedMotion) {
                for (let i = 0; i < PARTICLE_COUNT; i++) {
                    const i3 = i * 3;
                    const vel = particleVelocities[i];

                    positions[i3] += vel.x;
                    positions[i3 + 1] += vel.y;
                    positions[i3 + 2] += vel.z;

                    // Bounce off boundaries
                    if (Math.abs(positions[i3]) > FIELD_SIZE) vel.x *= -1;
                    if (Math.abs(positions[i3 + 1]) > FIELD_SIZE) vel.y *= -1;
                    if (Math.abs(positions[i3 + 2]) > FIELD_SIZE) vel.z *= -1;
                }
                particleGeometry.attributes.position.needsUpdate = true;
            }

            // Update line connections
            let lineCount = 0;
            const lPos = lineGeometry.attributes.position.array;
            const lCol = lineGeometry.attributes.color.array;

            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const i3 = i * 3;
                for (let j = i + 1; j < PARTICLE_COUNT; j++) {
                    const j3 = j * 3;
                    const dx = positions[i3] - positions[j3];
                    const dy = positions[i3 + 1] - positions[j3 + 1];
                    const dz = positions[i3 + 2] - positions[j3 + 2];
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    if (dist < CONNECTION_DISTANCE) {
                        const alpha = 1 - (dist / CONNECTION_DISTANCE);
                        const idx = lineCount * 6;

                        lPos[idx] = positions[i3];
                        lPos[idx + 1] = positions[i3 + 1];
                        lPos[idx + 2] = positions[i3 + 2];
                        lPos[idx + 3] = positions[j3];
                        lPos[idx + 4] = positions[j3 + 1];
                        lPos[idx + 5] = positions[j3 + 2];

                        // Neon green with fading alpha (encoded in brightness)
                        const r = 0.66 * alpha;
                        const g = 1.0 * alpha;
                        const b = 0.0 * alpha;
                        lCol[idx] = r; lCol[idx + 1] = g; lCol[idx + 2] = b;
                        lCol[idx + 3] = r; lCol[idx + 4] = g; lCol[idx + 5] = b;

                        lineCount++;
                    }
                }
            }
            lineGeometry.setDrawRange(0, lineCount * 2);
            lineGeometry.attributes.position.needsUpdate = true;
            lineGeometry.attributes.color.needsUpdate = true;

            // Subtle auto-rotation
            if (!prefersReducedMotion) {
                points.rotation.y += baseRotationSpeed;
                points.rotation.x += baseRotationSpeed * 0.5;
                lineSegments.rotation.y = points.rotation.y;
                lineSegments.rotation.x = points.rotation.x;
            }

            // Smooth mouse parallax
            mouse.x += (mouse.targetX - mouse.x) * 0.05;
            mouse.y += (mouse.targetY - mouse.y) * 0.05;
            camera.position.x = mouse.x * 30;
            camera.position.y = -mouse.y * 30;
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
        }

        // Event listeners
        document.addEventListener('mousemove', function(e) {
            mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.targetY = (e.clientY / window.innerHeight) * 2 - 1;
        });

        window.addEventListener('resize', function() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Cleanup on page unload
        window.addEventListener('beforeunload', function() {
            cancelAnimationFrame(animFrameId);
            particleGeometry.dispose();
            particleMaterial.dispose();
            lineGeometry.dispose();
            lineMaterial.dispose();
            renderer.dispose();
        });

        animate();
    })();

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
