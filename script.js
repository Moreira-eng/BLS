const appId = 'lifesupport-pro-v1';
let attempts = [];
let sessionResults = [];
let currentQIndex = 0;
let learningChartInstance = null;

// --- NAVEGAÇÃO BÁSICA ---
window.showView = (v) => {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`view-${v}`);
    if(target) target.classList.add('active');
    window.scrollTo(0,0);
};

window.toggleSidebar = () => {
    document.getElementById('sidebar')?.classList.toggle('-translate-x-full');
    document.getElementById('sidebar-overlay')?.classList.toggle('active');
};

// --- DARK MODE (CORRIGIDO) ---
window.toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    const moon = document.getElementById('moon-icon');
    const sun = document.getElementById('sun-icon');
    if (moon && sun) {
        moon.classList.toggle('hidden', isDark);
        sun.classList.toggle('hidden', !isDark);
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

// --- LOGIN (MODAL) ---
window.openAuthModal = () => document.getElementById('auth-modal')?.classList.remove('hidden');
window.closeAuthModal = () => document.getElementById('auth-modal')?.classList.add('hidden');

// --- SIMULADO (QUIZ) ---
window.startQuiz = () => {
    currentQIndex = 0; 
    sessionResults = [];
    document.getElementById('quiz-intro').classList.add('hidden');
    document.getElementById('quiz-ui').classList.remove('hidden');
    window.renderQuestion();
};

window.renderQuestion = () => {
    const q = quizQuestions[currentQIndex];
    document.getElementById('q-count').innerText = `${currentQIndex + 1} / ${quizQuestions.length}`;
    document.getElementById('q-progress').style.width = `${((currentQIndex + 1) / quizQuestions.length) * 100}%`;
    document.getElementById('quiz-content').innerHTML = `
        <h3 class="text-2xl font-black mb-10 leading-tight">${q.q}</h3>
        <div class="space-y-4">
            ${q.opts.map((o, i) => `<button onclick="window.submitAnswer(${i})" class="w-full text-left p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all font-bold text-xs uppercase">${i+1}. ${o}</button>`).join('')}
        </div>`;
};

window.submitAnswer = (i) => {
    const q = quizQuestions[currentQIndex];
    sessionResults.push({ correct: i === q.correct });

    if (currentQIndex < quizQuestions.length - 1) {
        currentQIndex++; 
        window.renderQuestion();
    } else {
        const score = Math.round((sessionResults.filter(r => r.correct).length / quizQuestions.length) * 100);
        attempts.push(score);
        
        document.getElementById('quiz-ui').classList.add('hidden');
        document.getElementById('quiz-intro').classList.remove('hidden');
        document.getElementById('quiz-intro').innerHTML = `
            <div class="p-12 text-center">
                <h3 class="text-4xl font-black mb-4 italic">Nota: ${score}%</h3>
                <button onclick="window.showView('avaliacao')" class="bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs">Ver Dashboard</button>
            </div>`;
        window.updateDashboard(score);
    }
};

// --- DASHBOARD E GRÁFICO ---
window.updateDashboard = (lastScore) => {
    document.getElementById('stats-placeholder')?.classList.add('hidden');
    document.getElementById('stats-container')?.classList.remove('hidden');
    document.getElementById('avg-score').innerText = `${lastScore}%`;
    document.getElementById('total-attempts').innerText = attempts.length;
    document.getElementById('latest-score').innerText = `${lastScore}%`;
    document.getElementById('best-score').innerText = `${Math.max(...attempts)}%`;
    window.renderLearningChart();
};

window.renderLearningChart = () => {
    const ctx = document.getElementById('learningChart');
    if (!ctx) return;
    if (learningChartInstance) learningChartInstance.destroy();
    learningChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: attempts.map((_, i) => `Sessão ${i + 1}`),
            datasets: [{
                label: 'Evolução %',
                data: attempts,
                borderColor: '#1e40af',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(30, 64, 175, 0.1)'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
};

// Inicialização de Tema
if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark');
