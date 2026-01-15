// --- DADOS DO SISTEMA (MANTIDOS E PROTEGIDOS) ---
const quizQuestions = [
    { q: "Qual a profundidade ideal das compressões em adultos?", opts: ["2 a 3 cm", "3 a 4 cm", "5 a 6 cm", "Mais de 7 cm"], correct: 2, cat: "Compressões" },
    { q: "Qual a frequência de compressões por minuto recomendada?", opts: ["80-100", "100-120", "120-140", "60-80"], correct: 1, cat: "Ritmo" },
    { q: "No DEA, após ligar o aparelho, qual o próximo passo?", opts: ["Aplicar o choque", "Colar as pás no tórax", "Realizar 30 compressões", "Checar o pulso"], correct: 1, cat: "DEA" },
    { q: "Qual a relação compressão-ventilação com 1 socorrista em adultos?", opts: ["15:2", "30:2", "5:1", "10:2"], correct: 1, cat: "Protocolo" },
    { q: "O que caracteriza o 'Gasping'?", opts: ["Respiração normal", "Ausência total de respiração", "Respiração agônica e ineficaz", "Tosse produtiva"], correct: 2, cat: "Identificação" }
];

const finalExamQuestions = [
    { q: "Vítima inconsciente, sem pulso e sem respiração. Qual o ritmo do DEA chocável?", opts: ["Assistolia", "Fibrilação Ventricular", "Ritmo Sinusal", "Atividade Elétrica Sem Pulso"], correct: 1 },
    { q: "Na manobra de Heimlich em adultos, onde posicionar as mãos?", opts: ["Sobre o esterno", "Abaixo do umbigo", "Entre o umbigo e o apêndice xifoide", "Nas costas"], correct: 2 }
];

const protocolsData = {
    extra: [
        { title: "Reconhecimento", color: "bg-blue-900", steps: ["Avaliar segurança da cena", "Checar responsividade", "Chamar ajuda/SAMU", "Verificar respiração/pulso"] },
        { title: "RCP Precoce", color: "bg-blue-800", steps: ["Iniciar 30 compressões", "2 ventilações", "Frequência 100-120/min", "Retorno total do tórax"] },
        { title: "Desfibrilação", color: "bg-blue-700", steps: ["Ligar o DEA", "Seguir comandos de voz", "Afastar durante análise", "Aplicar choque se indicado"] }
    ],
    intra: [
        { title: "Vigilância", color: "bg-emerald-900", steps: ["Monitorização contínua", "Reconhecimento de sinais pré-PCR", "Acionamento do Time de Resposta Rápida"] },
        { title: "Suporte Avançado", color: "bg-emerald-700", steps: ["Acesso venoso/IO", "Administração de Adrenalina", "Via aérea avançada"] }
    ]
};

const flashcards = [
    { front: "Frequência RCP", back: "100-120 BPM", sub: "Batidas por minuto" },
    { front: "Profundidade Adulto", back: "5 - 6 cm", sub: "Evitar profundidade excessiva" },
    { front: "Relação 30:2", back: "Adultos", sub: "1 ou 2 socorristas" }
];

// --- VARIÁVEIS DE ESTADO ---
let attempts = JSON.parse(localStorage.getItem('ls_attempts')) || [];
let sessionResults = [];
let currentQIndex = 0;
let learningChartInstance = null;

// --- FUNÇÕES DE NAVEGAÇÃO E TEMA ---
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

window.openAuthModal = () => document.getElementById('auth-modal')?.classList.remove('hidden');
window.closeAuthModal = () => document.getElementById('auth-modal')?.classList.add('hidden');

// --- LÓGICA DO SIMULADOR ---
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
        localStorage.setItem('ls_attempts', JSON.stringify(attempts));
        
        document.getElementById('quiz-ui').classList.add('hidden');
        document.getElementById('quiz-intro').classList.remove('hidden');
        document.getElementById('quiz-intro').innerHTML = `
            <div class="p-12 text-center">
                <h3 class="text-4xl font-black mb-4">Nota: ${score}%</h3>
                <div class="flex gap-4 justify-center">
                    <button onclick="window.startQuiz()" class="bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs">Refazer</button>
                    <button onclick="window.showView('avaliacao')" class="bg-slate-800 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs">Ver Dashboard</button>
                </div>
            </div>`;
        window.updateDashboard();
    }
};

// --- LÓGICA DO DASHBOARD ---
window.updateDashboard = () => {
    if (attempts.length === 0) return;

    document.getElementById('stats-placeholder')?.classList.add('hidden');
    document.getElementById('stats-container')?.classList.remove('hidden');

    const lastScore = attempts[attempts.length - 1];
    const bestScore = Math.max(...attempts);
    const avgScore = Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length);

    document.getElementById('avg-score').innerText = `${avgScore}%`;
    document.getElementById('total-attempts').innerText = attempts.length;
    document.getElementById('best-score').innerText = `${bestScore}%`;
    document.getElementById('latest-score').innerText = `${lastScore}%`;

    window.renderLearningChart();
};

window.renderLearningChart = () => {
    const ctx = document.getElementById('learningChart');
    if (!ctx || typeof Chart === 'undefined') return;

    if (learningChartInstance) learningChartInstance.destroy();

    learningChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: attempts.map((_, i) => `Sessão ${i + 1}`),
            datasets: [{
                label: 'Desempenho %',
                data: attempts,
                borderColor: '#1e40af',
                backgroundColor: 'rgba(30, 64, 175, 0.1)',
                fill: true, tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }
    });
};

// --- INICIALIZAÇÃO ---
window.onload = () => {
    // Carregar Tema
    if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark');
    
    // Carregar Flashcards
    const flashGrid = document.getElementById('flashcards-grid');
    if(flashGrid) flashGrid.innerHTML = flashcards.map(f => `
        <div class="flashcard-container h-64 cursor-pointer" onclick="this.classList.toggle('flipped')">
            <div class="flashcard-inner h-full w-full">
                <div class="flashcard-front bg-white dark:bg-slate-900 border flex items-center justify-center p-6 text-center font-bold">${f.front}</div>
                <div class="flashcard-back bg-blue-700 text-white flex flex-col items-center justify-center p-6 text-center">
                    <h4 class="text-2xl font-black mb-2">${f.back}</h4>
                    <p class="text-[10px] uppercase opacity-70">${f.sub}</p>
                </div>
            </div>
        </div>`).join('');

    // Carregar Dashboard se houver dados
    if (attempts.length > 0) window.updateDashboard();
    
    window.showView('hero');
};
