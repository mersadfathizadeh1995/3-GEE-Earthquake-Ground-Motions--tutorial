document.addEventListener('DOMContentLoaded', () => {
    let cur = 0;
    const slides = document.querySelectorAll('.slide');
    const total = slides.length;
    const bN = document.getElementById('bN');
    const bP = document.getElementById('bP');
    const sNum = document.getElementById('sNum');
    const prog = document.getElementById('prog');
    const tocBtn = document.getElementById('tocBtn');
    const sidebar = document.getElementById('sidebar');
    const tocList = document.getElementById('tocList');

    // Build TOC
    slides.forEach((s, i) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#';
        a.textContent = `${i + 1}. ${s.dataset.title || 'Slide ' + (i + 1)}`;
        a.addEventListener('click', e => { e.preventDefault(); goTo(i); });
        li.appendChild(a);
        tocList.appendChild(li);
    });

    tocBtn.addEventListener('click', () => sidebar.classList.toggle('open'));

    // Global Event Delegation for Quiz and Charts
    document.addEventListener('click', e => {
        const qbtn = e.target.closest('.qbtn');
        if (qbtn) {
            const correct = qbtn.dataset.quizCorrect === 'true';
            const id = qbtn.dataset.quizId;
            quiz(qbtn, correct, id);
        }

        const rsBtn = e.target.closest('.btn.bs[data-rs-mode]');
        if (rsBtn) {
            const mode = rsBtn.dataset.rsMode;
            setRS(mode);
        }
    });

    function goTo(n) {
        if (n < 0 || n >= total) return;
        slides[cur].classList.remove('active');
        cur = n;
        slides[cur].classList.add('active');
        update();
        sidebar.classList.remove('open');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    bN.addEventListener('click', () => goTo(cur + 1));
    bP.addEventListener('click', () => goTo(cur - 1));
    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') goTo(cur + 1);
        if (e.key === 'ArrowLeft') goTo(cur - 1);
    });

    function update() {
        bP.disabled = cur === 0;
        bN.textContent = cur === total - 1 ? '🎉 Done' : 'Next ▶';
        sNum.textContent = `${cur + 1} / ${total}`;
        prog.style.width = `${(cur / (total - 1)) * 100}%`;

        // TOC active
        tocList.querySelectorAll('a').forEach((a, i) => {
            a.classList.toggle('active', i === cur);
        });

        // Init charts lazily
        if (slides[cur].id === '' || true) {
            const rsCanvas = slides[cur].querySelector('#rsChart');
            if (rsCanvas && !rsCanvas._done) { initRS(rsCanvas); rsCanvas._done = true; }
            const rotdCanvas = slides[cur].querySelector('#rotdChart');
            if (rotdCanvas && !rotdCanvas._done) { initRotD(rotdCanvas); rotdCanvas._done = true; }
        }
    }

    // Response Spectrum Chart
    let rsChartObj = null;
    function initRS(canvas) {
        const ctx = canvas.getContext('2d');
        const periods = [0.01, 0.02, 0.05, 0.075, 0.1, 0.15, 0.2, 0.3, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 5.0];
        const rock = [0.42, 0.48, 0.72, 0.92, 1.05, 0.98, 0.85, 0.62, 0.38, 0.22, 0.15, 0.08, 0.05, 0.025, 0.01];
        const soil = [0.35, 0.40, 0.55, 0.68, 0.82, 0.95, 1.12, 1.05, 0.78, 0.55, 0.42, 0.28, 0.18, 0.10, 0.05];

        rsChartObj = new Chart(ctx, {
            type: 'line',
            data: {
                labels: periods.map(String),
                datasets: [
                    { label: 'Rock Site', data: rock, borderColor: '#4f8cff', backgroundColor: 'rgba(79,140,255,.1)', borderWidth: 2, fill: true, tension: .4 },
                    { label: 'Soil Site', data: soil, borderColor: '#f87171', backgroundColor: 'rgba(248,113,113,.1)', borderWidth: 2, fill: true, tension: .4, hidden: true }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#f0f4ff' } } },
                scales: {
                    x: { title: { display: true, text: 'Period (s)', color: '#7b8ba8' }, ticks: { color: '#7b8ba8' }, grid: { color: 'rgba(255,255,255,.06)' } },
                    y: { title: { display: true, text: 'Sa (g)', color: '#7b8ba8' }, ticks: { color: '#7b8ba8' }, grid: { color: 'rgba(255,255,255,.06)' }, beginAtZero: true }
                }
            }
        });
    }

    window.setRS = function(mode) {
        if (!rsChartObj) return;
        const ds = rsChartObj.data.datasets;
        if (mode === 'rock') { ds[0].hidden = false; ds[1].hidden = true; }
        else if (mode === 'soil') { ds[0].hidden = true; ds[1].hidden = false; }
        else { ds[0].hidden = false; ds[1].hidden = false; }
        rsChartObj.update();
    };

    // RotD Chart
    function initRotD(canvas) {
        const ctx = canvas.getContext('2d');
        const periods = [0.01, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 3.0, 5.0, 10.0];
        const ratios = [1.19, 1.19, 1.19, 1.21, 1.23, 1.24, 1.24, 1.25, 1.26, 1.29];
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: periods.map(String),
                datasets: [{
                    label: 'RotD100/RotD50',
                    data: ratios,
                    borderColor: '#22d3ee',
                    backgroundColor: 'rgba(34,211,238,.1)',
                    borderWidth: 2, fill: true, tension: .3,
                    pointBackgroundColor: '#22d3ee', pointRadius: 5
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#f0f4ff' } } },
                scales: {
                    x: { title: { display: true, text: 'Period (s)', color: '#7b8ba8' }, ticks: { color: '#7b8ba8' }, grid: { color: 'rgba(255,255,255,.06)' } },
                    y: { title: { display: true, text: 'Ratio', color: '#7b8ba8' }, ticks: { color: '#7b8ba8' }, grid: { color: 'rgba(255,255,255,.06)' }, min: 1.15, max: 1.35 }
                }
            }
        });
    }

    // Quiz handler
    const answers = {
        q1: 'The earth acts as a low-pass filter — shorter wavelengths (higher freq) are scattered and absorbed more easily.',
        q2: 'Ia accounts for ALL cycles of motion (both amplitude and duration), not just the single peak value.',
        q3: 'Correct! PGA = 0.02g never exceeds the 0.05g threshold, so bracketed duration = 0.',
        q4: 'Correct! Intensity, Frequency Content, and Duration are the three primary targets.',
        q5: 'Correct! D = A/ω² — displacement grows as frequency decreases.',
        q6: 'Correct! Forward directivity manifests primarily in the fault-normal direction.',
        q7: 'Correct! Stable regions (East/Central US) have lower attenuation — waves travel much further.',
        q8: 'Correct! ft0 = Vs_avg / (5.0 × Height) from Ashford et al. (1997).'
    };

    window.quiz = function(btn, correct, id) {
        const fb = document.getElementById('fb-' + id);
        btn.parentElement.querySelectorAll('.qbtn').forEach(b => b.classList.remove('ok', 'no'));
        if (correct) {
            btn.classList.add('ok');
            fb.innerHTML = '<span class="text-green">✓ ' + (answers[id] || 'Correct!') + '</span>';
        } else {
            btn.classList.add('no');
            fb.innerHTML = '<span class="text-red">✗ Try again!</span>';
        }
    };

    update();
});
