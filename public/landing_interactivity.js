document.addEventListener('DOMContentLoaded', () => {
    // 1. Mouse-following Mesh Gradient
    const circles = document.querySelectorAll('.mesh-circle');
    document.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const x = (clientX / window.innerWidth - 0.5) * 100;
        const y = (clientY / window.innerHeight - 0.5) * 100;

        circles.forEach((circle, index) => {
            const factor = (index + 1) * 0.5;
            circle.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
        });
    });

    // 2. Mobile Menu Logic
    const menuToggle = document.getElementById('menuToggle');
    const mobileNav = document.getElementById('mobileNav');
    const body = document.body;

    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', () => {
            mobileNav.classList.toggle('active');
            body.classList.toggle('mobile-menu-active');
        });

        // Close on link click
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('active');
                body.classList.remove('mobile-menu-active');
            });
        });
    }

    // 3. Stats Counter Animation
    const stats = document.querySelectorAll('.stat-number');
    const observerOptions = { threshold: 0.5 };

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const endValue = target.getAttribute('data-value');
                animateValue(target, 0, parseFloat(endValue), 2000);
                statsObserver.unobserve(target);
            }
        });
    }, observerOptions);

    stats.forEach(stat => statsObserver.observe(stat));

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            let val = progress * (end - start) + start;
            
            // Format suffix
            const suffix = obj.getAttribute('data-suffix') || '';
            obj.innerHTML = Math.floor(val).toLocaleString() + suffix;
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // 4. Match Simulation Logic
    const simBody = document.getElementById('simBody');
    if (simBody) {
        const sequences = [
            "> Initializing WebRTC layer...",
            "> Scanning global servers...",
            "> Finding secure node in Frankfurt...",
            "> Peer found: United States [Interest: Gaming]",
            "> Establishing secure handshake...",
            "> Connection established! Latency: 42ms"
        ];

        let seqIndex = 0;
        function runSimulation() {
            if (!simBody) return;
            simBody.innerHTML = '';
            seqIndex = 0;
            
            function nextStep() {
                if (seqIndex < sequences.length) {
                    const line = document.createElement('div');
                    line.className = 'sim-line';
                    line.textContent = sequences[seqIndex];
                    simBody.appendChild(line);
                    seqIndex++;
                    setTimeout(nextStep, 1000);
                } else {
                    const match = document.createElement('div');
                    match.className = 'match-card sim-line';
                    match.innerHTML = `
                        <div class="avatar">👨‍💻</div>
                        <div>
                            <div style="font-weight: bold; color: white;">Alex Miller</div>
                            <div style="font-size: 0.8rem; color: #aaa;">Seattle, WA • Software Engineer</div>
                        </div>
                        <div style="margin-left: auto; color: var(--accent);">CONNECTED</div>
                    `;
                    simBody.appendChild(match);
                    setTimeout(runSimulation, 5000); // Restart after 5s
                }
            }
            nextStep();
        }
        
        // Start simulation when section visible
        const simSection = document.querySelector('.simulation-container');
        const simObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                runSimulation();
                simObserver.unobserve(simSection);
            }
        }, { threshold: 0.2 });
        simObserver.observe(simSection);
    }
});
