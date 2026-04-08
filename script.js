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

    // ===== 3D BACKGROUND ANIMATIONS (PAGE-SPECIFIC) =====
    (function init3DBackground() {
        if (typeof THREE === 'undefined') return;
        var container = document.getElementById('bg-animation');
        if (!container) return;

        var isMobile = window.innerWidth < 768;
        var starSizeScale = window.devicePixelRatio || 1;
        var mouse3D = { x: 0, y: 0, tx: 0, ty: 0 };
        var mouseWorld = new THREE.Vector3();

        // Shared renderer
        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
        camera.position.z = 400;
        var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        // Mouse tracking
        document.addEventListener('mousemove', function(e) {
            mouse3D.tx = (e.clientX / window.innerWidth) * 2 - 1;
            mouse3D.ty = -(e.clientY / window.innerHeight) * 2 + 1;
        });
        // Touch support
        document.addEventListener('touchmove', function(e) {
            mouse3D.tx = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
            mouse3D.ty = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
        });

        window.addEventListener('resize', function() {
            starSizeScale = window.devicePixelRatio || 1;
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });

        // Detect page
        var path = window.location.pathname;
        var page = 'home';
        if (path.indexOf('work.html') !== -1 && path.indexOf('more-work') === -1) page = 'work';
        else if (path.indexOf('about.html') !== -1) page = 'about';
        else if (path.indexOf('contact.html') !== -1) page = 'contact';
        else if (path.indexOf('more-work.html') !== -1) page = 'morework';

        var animFrameId;
        var animateFn;

        // ────────────────────────────────────────
        // HOME: Particle constellation with mouse repulsion
        // ────────────────────────────────────────
        if (page === 'home') {
            var PC = isMobile ? 80 : 150;
            var FIELD = 400;
            var CONN = isMobile ? 120 : 150;
            var REPULSE = 120;
            var positions = new Float32Array(PC * 3);
            var velocities = [];
            for (var i = 0; i < PC; i++) {
                positions[i*3]   = (Math.random()-0.5) * FIELD * 2;
                positions[i*3+1] = (Math.random()-0.5) * FIELD * 2;
                positions[i*3+2] = (Math.random()-0.5) * FIELD * 2;
                velocities.push({ x:(Math.random()-0.5)*0.4, y:(Math.random()-0.5)*0.4, z:(Math.random()-0.5)*0.4 });
            }
            var pGeo = new THREE.BufferGeometry();
            pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            var pMat = new THREE.PointsMaterial({ color:0xA8FF00, size:isMobile?3:2.5, transparent:true, opacity:0.85, sizeAttenuation:true });
            var pts = new THREE.Points(pGeo, pMat);
            scene.add(pts);

            var maxL = PC * PC;
            var lPos = new Float32Array(maxL * 6);
            var lCol = new Float32Array(maxL * 6);
            var lGeo = new THREE.BufferGeometry();
            lGeo.setAttribute('position', new THREE.BufferAttribute(lPos, 3));
            lGeo.setAttribute('color', new THREE.BufferAttribute(lCol, 3));
            lGeo.setDrawRange(0, 0);
            var lMat = new THREE.LineBasicMaterial({ vertexColors:true, transparent:true, opacity:0.4, blending:THREE.AdditiveBlending });
            var lines = new THREE.LineSegments(lGeo, lMat);
            scene.add(lines);

            animateFn = function() {
                mouse3D.x += (mouse3D.tx - mouse3D.x) * 0.08;
                mouse3D.y += (mouse3D.ty - mouse3D.y) * 0.08;
                // Convert mouse to world space
                mouseWorld.set(mouse3D.x, mouse3D.y, 0.5).unproject(camera);
                var dir = mouseWorld.sub(camera.position).normalize();
                var dist = -camera.position.z / dir.z;
                var mousePos = camera.position.clone().add(dir.multiplyScalar(dist));

                var p = pGeo.attributes.position.array;
                for (var i = 0; i < PC; i++) {
                    var i3 = i*3;
                    var v = velocities[i];
                    // Mouse repulsion
                    var dx = p[i3] - mousePos.x;
                    var dy = p[i3+1] - mousePos.y;
                    var d = Math.sqrt(dx*dx + dy*dy);
                    if (d < REPULSE && d > 0) {
                        var force = (REPULSE - d) / REPULSE * 2;
                        p[i3]   += (dx/d) * force;
                        p[i3+1] += (dy/d) * force;
                    }
                    p[i3] += v.x; p[i3+1] += v.y; p[i3+2] += v.z;
                    if (Math.abs(p[i3]) > FIELD) v.x *= -1;
                    if (Math.abs(p[i3+1]) > FIELD) v.y *= -1;
                    if (Math.abs(p[i3+2]) > FIELD) v.z *= -1;
                }
                pGeo.attributes.position.needsUpdate = true;

                // Lines
                var lc = 0;
                var la = lGeo.attributes.position.array;
                var ca = lGeo.attributes.color.array;
                for (var i = 0; i < PC; i++) {
                    for (var j = i+1; j < PC; j++) {
                        var dx = p[i*3]-p[j*3], dy = p[i*3+1]-p[j*3+1], dz = p[i*3+2]-p[j*3+2];
                        var dd = Math.sqrt(dx*dx+dy*dy+dz*dz);
                        if (dd < CONN) {
                            var a = 1-(dd/CONN); var idx = lc*6;
                            la[idx]=p[i*3]; la[idx+1]=p[i*3+1]; la[idx+2]=p[i*3+2];
                            la[idx+3]=p[j*3]; la[idx+4]=p[j*3+1]; la[idx+5]=p[j*3+2];
                            ca[idx]=0.66*a; ca[idx+1]=a; ca[idx+2]=0;
                            ca[idx+3]=0.66*a; ca[idx+4]=a; ca[idx+5]=0;
                            lc++;
                        }
                    }
                }
                lGeo.setDrawRange(0, lc*2);
                lGeo.attributes.position.needsUpdate = true;
                lGeo.attributes.color.needsUpdate = true;

                pts.rotation.y += 0.0003;
                pts.rotation.x += 0.00015;
                lines.rotation.copy(pts.rotation);
                camera.position.x += (mouse3D.x * 40 - camera.position.x) * 0.02;
                camera.position.y += (mouse3D.y * 40 - camera.position.y) * 0.02;
                camera.lookAt(scene.position);
            };
        }

        // ────────────────────────────────────────
        // WORK: Floating wireframe shapes that scatter from cursor
        // ────────────────────────────────────────
        else if (page === 'work') {
            var shapes = [];
            var SHAPE_COUNT = isMobile ? 12 : 25;
            var geometries = [
                new THREE.IcosahedronGeometry(15, 0),
                new THREE.OctahedronGeometry(15, 0),
                new THREE.TetrahedronGeometry(18, 0),
                new THREE.DodecahedronGeometry(14, 0),
                new THREE.BoxGeometry(18, 18, 18)
            ];
            var wireframeMat = new THREE.MeshBasicMaterial({ color:0xA8FF00, wireframe:true, transparent:true, opacity:0.35 });

            for (var i = 0; i < SHAPE_COUNT; i++) {
                var geo = geometries[Math.floor(Math.random() * geometries.length)];
                var mesh = new THREE.Mesh(geo, wireframeMat.clone());
                mesh.position.set((Math.random()-0.5)*700, (Math.random()-0.5)*500, (Math.random()-0.5)*400);
                mesh.userData = {
                    basePos: mesh.position.clone(),
                    rotSpeed: { x:(Math.random()-0.5)*0.01, y:(Math.random()-0.5)*0.01, z:(Math.random()-0.5)*0.01 },
                    floatOffset: Math.random() * Math.PI * 2,
                    floatSpeed: 0.3 + Math.random() * 0.5,
                    floatAmp: 10 + Math.random() * 20,
                    displaced: new THREE.Vector3()
                };
                scene.add(mesh);
                shapes.push(mesh);
            }

            var SCATTER_RADIUS = 200;
            var time = 0;
            animateFn = function() {
                mouse3D.x += (mouse3D.tx - mouse3D.x) * 0.08;
                mouse3D.y += (mouse3D.ty - mouse3D.y) * 0.08;
                mouseWorld.set(mouse3D.x, mouse3D.y, 0.5).unproject(camera);
                var dir = mouseWorld.sub(camera.position).normalize();
                var dist = -camera.position.z / dir.z;
                var mousePos = camera.position.clone().add(dir.multiplyScalar(dist));
                time += 0.016;

                for (var i = 0; i < shapes.length; i++) {
                    var m = shapes[i]; var u = m.userData;
                    // Float animation
                    var floatY = Math.sin(time * u.floatSpeed + u.floatOffset) * u.floatAmp;
                    var targetX = u.basePos.x;
                    var targetY = u.basePos.y + floatY;
                    var targetZ = u.basePos.z;

                    // Scatter from mouse
                    var dx = targetX - mousePos.x;
                    var dy = targetY - mousePos.y;
                    var d = Math.sqrt(dx*dx + dy*dy);
                    if (d < SCATTER_RADIUS && d > 0) {
                        var force = (SCATTER_RADIUS - d) / SCATTER_RADIUS;
                        u.displaced.x += (dx/d) * force * 8;
                        u.displaced.y += (dy/d) * force * 8;
                    }
                    u.displaced.multiplyScalar(0.92); // Dampen

                    m.position.x += (targetX + u.displaced.x - m.position.x) * 0.06;
                    m.position.y += (targetY + u.displaced.y - m.position.y) * 0.06;
                    m.position.z += (targetZ - m.position.z) * 0.06;

                    // Rotate toward mouse
                    m.rotation.x += u.rotSpeed.x + mouse3D.y * 0.003;
                    m.rotation.y += u.rotSpeed.y + mouse3D.x * 0.003;
                    m.rotation.z += u.rotSpeed.z;

                    // Glow near mouse
                    var proximity = Math.max(0, 1 - d / SCATTER_RADIUS);
                    m.material.opacity = 0.25 + proximity * 0.6;
                }
                camera.position.x += (mouse3D.x * 50 - camera.position.x) * 0.03;
                camera.position.y += (mouse3D.y * 50 - camera.position.y) * 0.03;
                camera.lookAt(scene.position);
            };
        }

        // ────────────────────────────────────────
        // ABOUT: Interactive night sky with twinkling stars
        // ────────────────────────────────────────
        else if (page === 'about') {
            var STAR_COUNT = isMobile ? 250 : 500;
            var SHOOT_MAX = 3;
            var sPositions = new Float32Array(STAR_COUNT * 3);
            var sSizes = new Float32Array(STAR_COUNT);
            var sBaseOpacities = [];
            var sPhases = [];

            for (var i = 0; i < STAR_COUNT; i++) {
                sPositions[i*3]   = (Math.random()-0.5) * 1200;
                sPositions[i*3+1] = (Math.random()-0.5) * 800;
                sPositions[i*3+2] = -200 + Math.random() * 200;
                sSizes[i] = (2.5 + Math.random() * 4.5) * starSizeScale;
                sBaseOpacities.push(0.3 + Math.random() * 0.7);
                sPhases.push({
                    speed: 0.15 + Math.random() * 0.6,
                    offset: Math.random() * Math.PI * 2,
                    twinkleIntensity: 0.3 + Math.random() * 0.7
                });
            }

            var sGeo = new THREE.BufferGeometry();
            sGeo.setAttribute('position', new THREE.BufferAttribute(sPositions, 3));
            sGeo.setAttribute('size', new THREE.BufferAttribute(sSizes, 1));

            // Custom shader for varied star sizes and twinkling
            var starVert = [
                'attribute float size;',
                'varying float vAlpha;',
                'uniform float uTime;',
                'void main() {',
                '  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);',
                '  gl_PointSize = size * (300.0 / -mvPos.z);',
                '  gl_Position = projectionMatrix * mvPos;',
                '  vAlpha = 1.0;',
                '}'
            ].join('\n');
            var starFrag = [
                'varying float vAlpha;',
                'void main() {',
                '  float d = length(gl_PointCoord - vec2(0.5));',
                '  if (d > 0.5) discard;',
                '  float glow = 1.0 - smoothstep(0.0, 0.5, d);',
                '  gl_FragColor = vec4(0.66, 1.0, 0.0, glow * glow * vAlpha);',
                '}'
            ].join('\n');

            var starMat = new THREE.ShaderMaterial({
                uniforms: { uTime: { value: 0 } },
                vertexShader: starVert,
                fragmentShader: starFrag,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });

            var stars = new THREE.Points(sGeo, starMat);
            scene.add(stars);

            // Shooting stars
            var shootingStars = [];
            var shootGeo = new THREE.BufferGeometry();
            var TRAIL_LEN = 20;
            var shootPositions = new Float32Array(SHOOT_MAX * TRAIL_LEN * 3);
            var shootColors = new Float32Array(SHOOT_MAX * TRAIL_LEN * 3);
            shootGeo.setAttribute('position', new THREE.BufferAttribute(shootPositions, 3));
            shootGeo.setAttribute('color', new THREE.BufferAttribute(shootColors, 3));
            shootGeo.setDrawRange(0, 0);
            var shootMat = new THREE.LineBasicMaterial({ vertexColors:true, transparent:true, opacity:0.8, blending:THREE.AdditiveBlending });
            var shootLines = new THREE.LineSegments(shootGeo, shootMat);
            scene.add(shootLines);

            function spawnShootingStar() {
                if (shootingStars.length >= SHOOT_MAX) return;
                var startX = (Math.random()-0.5) * 800;
                var startY = 200 + Math.random() * 200;
                shootingStars.push({
                    x: startX, y: startY, z: -50 + Math.random() * 50,
                    vx: -3 - Math.random() * 4,
                    vy: -4 - Math.random() * 3,
                    life: 1.0,
                    decay: 0.015 + Math.random() * 0.01,
                    trail: []
                });
            }

            var starTime = 0;
            var mouseGlow = { x: 0, y: 0 };

            camera.position.z = 400;

            animateFn = function() {
                mouse3D.x += (mouse3D.tx - mouse3D.x) * 0.06;
                mouse3D.y += (mouse3D.ty - mouse3D.y) * 0.06;
                mouseGlow.x += (mouse3D.x * 300 - mouseGlow.x) * 0.03;
                mouseGlow.y += (mouse3D.y * 200 - mouseGlow.y) * 0.03;
                starTime += 0.016;

                // Twinkle stars by modulating size
                var sizes = sGeo.attributes.size.array;
                for (var i = 0; i < STAR_COUNT; i++) {
                    var ph = sPhases[i];
                    var twinkle = Math.sin(starTime * ph.speed + ph.offset);
                    var brightness = sBaseOpacities[i] + twinkle * ph.twinkleIntensity * 0.4;
                    sizes[i] = Math.max(2 * starSizeScale, brightness * 5 * starSizeScale);

                    // Stars near mouse glow brighter
                    var dx = sPositions[i*3] - mouseGlow.x;
                    var dy = sPositions[i*3+1] - mouseGlow.y;
                    var dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < 150) {
                        var boost = (1 - dist/150) * 3;
                        sizes[i] = Math.min(9 * starSizeScale, sizes[i] + boost * starSizeScale);
                    }
                }
                sGeo.attributes.size.needsUpdate = true;
                starMat.uniforms.uTime.value = starTime;

                // Spawn shooting stars occasionally
                if (Math.random() < 0.008) spawnShootingStar();

                // Update shooting stars
                var segCount = 0;
                var sp = shootGeo.attributes.position.array;
                var sc = shootGeo.attributes.color.array;
                for (var i = shootingStars.length - 1; i >= 0; i--) {
                    var ss = shootingStars[i];
                    ss.trail.unshift({ x: ss.x, y: ss.y, z: ss.z });
                    if (ss.trail.length > TRAIL_LEN) ss.trail.pop();
                    ss.x += ss.vx;
                    ss.y += ss.vy;
                    ss.life -= ss.decay;

                    if (ss.life <= 0) { shootingStars.splice(i, 1); continue; }

                    for (var t = 0; t < ss.trail.length - 1; t++) {
                        var idx = segCount * 6;
                        var a = ss.trail[t]; var b = ss.trail[t+1];
                        sp[idx]=a.x; sp[idx+1]=a.y; sp[idx+2]=a.z;
                        sp[idx+3]=b.x; sp[idx+4]=b.y; sp[idx+5]=b.z;
                        var fade = (1 - t/ss.trail.length) * ss.life;
                        sc[idx]=fade*0.66; sc[idx+1]=fade; sc[idx+2]=0;
                        sc[idx+3]=fade*0.33; sc[idx+4]=fade*0.5; sc[idx+5]=0;
                        segCount++;
                    }
                }
                shootGeo.setDrawRange(0, segCount * 2);
                shootGeo.attributes.position.needsUpdate = true;
                shootGeo.attributes.color.needsUpdate = true;

                // Gentle parallax
                camera.position.x += (mouse3D.x * 30 - camera.position.x) * 0.02;
                camera.position.y += (mouse3D.y * 20 - camera.position.y) * 0.02;
                camera.lookAt(scene.position);
            };
        }

        // ────────────────────────────────────────
        // CONTACT: Particle vortex/spiral that follows mouse
        // ────────────────────────────────────────
        else if (page === 'contact') {
            var VORTEX_COUNT = isMobile ? 100 : 200;
            var vPositions = new Float32Array(VORTEX_COUNT * 3);
            var vParticles = [];
            for (var i = 0; i < VORTEX_COUNT; i++) {
                var angle = Math.random() * Math.PI * 2;
                var radius = 80 + Math.random() * 300;
                vPositions[i*3]   = Math.cos(angle) * radius;
                vPositions[i*3+1] = Math.sin(angle) * radius;
                vPositions[i*3+2] = (Math.random()-0.5) * 150;
                vParticles.push({
                    angle: angle,
                    radius: radius,
                    speed: 0.001 + Math.random() * 0.003,
                    baseZ: vPositions[i*3+2]
                });
            }
            var vGeo = new THREE.BufferGeometry();
            vGeo.setAttribute('position', new THREE.BufferAttribute(vPositions, 3));
            var vMat = new THREE.PointsMaterial({ color:0xA8FF00, size:isMobile?2:1.5, transparent:true, opacity:0.4, sizeAttenuation:true });
            var vPts = new THREE.Points(vGeo, vMat);
            scene.add(vPts);

            var vortexCenter = { x: 0, y: 0 };
            animateFn = function() {
                mouse3D.x += (mouse3D.tx - mouse3D.x) * 0.05;
                mouse3D.y += (mouse3D.ty - mouse3D.y) * 0.05;
                // Vortex center gently follows mouse
                vortexCenter.x += (mouse3D.x * 120 - vortexCenter.x) * 0.02;
                vortexCenter.y += (mouse3D.y * 120 - vortexCenter.y) * 0.02;

                var mouseSpeed = Math.sqrt(mouse3D.tx * mouse3D.tx + mouse3D.ty * mouse3D.ty);
                var speedMult = 1 + mouseSpeed * 1.2;

                var p = vGeo.attributes.position.array;
                for (var i = 0; i < VORTEX_COUNT; i++) {
                    var vp = vParticles[i];
                    vp.angle += vp.speed * speedMult;
                    var targetR = vp.radius + Math.sin(vp.angle * 2) * 10;
                    p[i*3]   = vortexCenter.x + Math.cos(vp.angle) * targetR;
                    p[i*3+1] = vortexCenter.y + Math.sin(vp.angle) * targetR;
                    p[i*3+2] = vp.baseZ + Math.sin(vp.angle * 3) * 15;
                }
                vGeo.attributes.position.needsUpdate = true;

                camera.position.x += (mouse3D.x * 25 - camera.position.x) * 0.02;
                camera.position.y += (mouse3D.y * 25 - camera.position.y) * 0.02;
                camera.lookAt(scene.position);
            };
        }

        // ────────────────────────────────────────
        // MORE WORK: Floating cubes that tilt toward mouse
        // ────────────────────────────────────────
        else if (page === 'morework') {
            var cubes = [];
            var CUBE_COUNT = isMobile ? 15 : 30;
            var cubeGeo = new THREE.BoxGeometry(12, 12, 12);
            for (var i = 0; i < CUBE_COUNT; i++) {
                var edgeMat = new THREE.MeshBasicMaterial({ color:0xA8FF00, wireframe:true, transparent:true, opacity:0.3 });
                var cube = new THREE.Mesh(cubeGeo, edgeMat);
                var scale = 0.5 + Math.random() * 2;
                cube.scale.set(scale, scale, scale);
                cube.position.set((Math.random()-0.5)*700, (Math.random()-0.5)*500, (Math.random()-0.5)*300);
                cube.userData = {
                    basePos: cube.position.clone(),
                    orbitAngle: Math.random() * Math.PI * 2,
                    orbitSpeed: 0.002 + Math.random() * 0.005,
                    orbitRadius: 5 + Math.random() * 15,
                    attracted: new THREE.Vector3()
                };
                scene.add(cube);
                cubes.push(cube);
            }

            var ATTRACT_RADIUS = 250;
            animateFn = function() {
                mouse3D.x += (mouse3D.tx - mouse3D.x) * 0.08;
                mouse3D.y += (mouse3D.ty - mouse3D.y) * 0.08;
                mouseWorld.set(mouse3D.x, mouse3D.y, 0.5).unproject(camera);
                var dir = mouseWorld.sub(camera.position).normalize();
                var dist = -camera.position.z / dir.z;
                var mousePos = camera.position.clone().add(dir.multiplyScalar(dist));

                for (var i = 0; i < cubes.length; i++) {
                    var c = cubes[i]; var u = c.userData;
                    u.orbitAngle += u.orbitSpeed;
                    var ox = u.basePos.x + Math.cos(u.orbitAngle) * u.orbitRadius;
                    var oy = u.basePos.y + Math.sin(u.orbitAngle) * u.orbitRadius;

                    // Attract toward mouse
                    var dx = mousePos.x - ox;
                    var dy = mousePos.y - oy;
                    var d = Math.sqrt(dx*dx + dy*dy);
                    if (d < ATTRACT_RADIUS && d > 0) {
                        var force = (ATTRACT_RADIUS - d) / ATTRACT_RADIUS;
                        u.attracted.x += (dx/d) * force * 3;
                        u.attracted.y += (dy/d) * force * 3;
                    }
                    u.attracted.multiplyScalar(0.94);

                    c.position.x += (ox + u.attracted.x - c.position.x) * 0.05;
                    c.position.y += (oy + u.attracted.y - c.position.y) * 0.05;

                    // Tilt toward mouse
                    var tiltX = mouse3D.y * 0.5;
                    var tiltY = mouse3D.x * 0.5;
                    c.rotation.x += (tiltX - c.rotation.x) * 0.02 + 0.003;
                    c.rotation.y += (tiltY - c.rotation.y) * 0.02 + 0.005;

                    // Brightness by proximity
                    var prox = Math.max(0, 1 - d / ATTRACT_RADIUS);
                    c.material.opacity = 0.2 + prox * 0.65;
                }
                camera.position.x += (mouse3D.x * 40 - camera.position.x) * 0.02;
                camera.position.y += (mouse3D.y * 40 - camera.position.y) * 0.02;
                camera.lookAt(scene.position);
            };
        }

        // Shared render loop
        function renderLoop() {
            animFrameId = requestAnimationFrame(renderLoop);
            if (document.hidden) return;
            if (animateFn) animateFn();
            renderer.render(scene, camera);
        }
        renderLoop();

        window.addEventListener('beforeunload', function() {
            cancelAnimationFrame(animFrameId);
            renderer.dispose();
        });
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
