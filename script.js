// --- 1. FUNÇÕES GLOBAIS DE INTERFACE (Navegação e Menu) ---
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('-translate-x-full');
    }
};

window.showView = function(viewId) {
    // Esconde todas as seções
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.add('hidden');
        section.style.display = 'none';
        section.classList.remove('active');
    });

    // Mostra a tela selecionada
    const target = document.getElementById('view-' + viewId) || document.getElementById(viewId);
    if (target) {
        target.classList.remove('hidden');
        target.style.display = 'block';
        target.classList.add('active');
    }

    // Fecha a sidebar (importante para celular)
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.add('-translate-x-full');

    // Se trocar de tela, para o metrônomo por segurança
    if (viewId !== 'metronomo' && metroState.isRunning) window.stopMetronome();

    window.scrollTo(0, 0);
};

// --- 2. CONFIGURAÇÕES E ESTADO DO APP ---
const appId = 'lifesupport-pro-v1';
let currentQIndex = 0;
let currentFIndex = 0; 
let sessionResults = [];
let finalExamResults = [];

// --- 3. FUNCIONALIDADES TÉCNICAS (Dark Mode, Acordeão, Metrônomo) ---

window.toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    const moon = document.getElementById('moon-icon');
    const sun = document.getElementById('sun-icon');
    if (moon && sun) {
        if (isDark) {
            moon.classList.add('hidden');
            sun.classList.remove('hidden');
        } else {
            moon.classList.remove('hidden');
            sun.classList.add('hidden');
        }
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

window.toggleAccordion = (button) => {
    const item = button.parentElement;
    const isActive = item.classList.contains('active');
    document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));
    if (!isActive) item.classList.add('active');
};

let metroState = {
    isRunning: false,
    bpm: 110,
    interval: null,
    audioCtx: null
};

window.setBPM = (val) => {
    metroState.bpm = val;
    document.querySelectorAll('.bpm-btn').forEach(b => {
        b.classList.remove('bg-blue-600', 'shadow-lg', 'scale-105', 'dark:bg-blue-700');
        if (b.id === `bpm-${val}`) b.classList.add('bg-blue-600', 'shadow-lg', 'scale-105', 'dark:bg-blue-700');
    });
    const display = document.getElementById('bpm-display');
    if(display) display.innerHTML = `${val} <span class="text-[10px] uppercase opacity-60">BPM</span>`;
    if (metroState.isRunning) { window.stopMetronome(); window.startMetronome(); }
};

window.startMetronome = () => {
    if (!metroState.audioCtx) metroState.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (metroState.audioCtx.state === 'suspended') metroState.audioCtx.resume();
    const ms = 60000 / metroState.bpm;
    const btn = document.getElementById('metro-toggle');
    const ring = document.getElementById('metro-pulse-ring');
    metroState.interval = setInterval(() => { window.playTick(); window.triggerPulse(); }, ms);
    metroState.isRunning = true;
    btn.innerText = "Parar Batida";
    btn.className = "w-full bg-rose-600 text-white py-6 rounded-[2rem] font-black text-2xl shadow-2xl transition-all uppercase tracking-tighter italic";
};

window.stopMetronome = () => {
    const btn = document.getElementById('metro-toggle');
    clearInterval(metroState.interval);
    metroState.isRunning = false;
    btn.innerText = "Iniciar Batida";
    btn.className = "w-full bg-white text-blue-900 py-6 rounded-[2rem] font-black text-2xl shadow-2xl transition-all uppercase tracking-tighter italic";
};

window.toggleMetronome = () => metroState.isRunning ? window.stopMetronome() : window.startMetronome();

window.playTick = () => {
    const osc = metroState.audioCtx.createOscillator();
    const gain = metroState.audioCtx.createGain();
    osc.frequency.setValueAtTime(880, metroState.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, metroState.audioCtx.currentTime + 0.1);
    osc.connect(gain); gain.connect(metroState.audioCtx.destination);
    osc.start(); osc.stop(metroState.audioCtx.currentTime + 0.1);
};

window.triggerPulse = () => {
    const visual = document.getElementById('metro-visual');
    if (visual) {
        visual.classList.add('scale-105');
        setTimeout(() => visual.classList.remove('scale-105'), 100);
    }
};

// --- 4. BANCO DE DADOS (Simulador e Flashcards) ---

const quizQuestions = [
    { cat: "Segurança", q: "Qual a prioridade absoluta ao abordar uma vítima caída?", opts: ["Pulso.", "Segurança cena.", "Iniciar RCP.", "Gritar."], correct: 1 },
    { cat: "Técnica", q: "Qual é a frequência ideal das compressões?", opts: ["80 BPM.", "100-120 BPM.", "O mais rápido.", "60 BPM."], correct: 1 },
    { cat: "Protocolo", q: "Relação C:V Adulto?", opts: ["15:2.", "30:2.", "50:2.", "Só C."], correct: 1 }
];

const flashcards = [
    { front: "Ritmo RCP Adulto", back: "100-120 BPM", sub: "Ritmo de 'Stayin Alive'", cat: "Técnica" },
    { front: "C : V Adulto", back: "30 : 2", sub: "30 Compressões : 2 Sopros", cat: "Protocolo" }
];

// --- 5. LÓGICA DO SIMULADOR ---

window.startQuiz = () => {
    currentQIndex = 0; sessionResults = [];
    document.getElementById('quiz-intro').classList.add('hidden');
    document.getElementById('quiz-ui').classList.remove('hidden');
    window.renderQuestion();
};

window.renderQuestion = () => {
    const q = quizQuestions[currentQIndex];
    document.getElementById('q-count').innerText = `${currentQIndex + 1} / ${quizQuestions.length}`;
    document.getElementById('q-progress').style.width = `${((currentQIndex + 1) / quizQuestions.length) * 100}%`;
    document.getElementById('quiz-content').innerHTML = `
        <h3 class="text-2xl font-black mb-10 text-blue-950 dark:text-blue-400">${q.q}</h3>
        <div class="space-y-4">
            ${q.opts.map((o, i) => `
                <button onclick="window.submitAnswer(${i})" class="w-full text-left p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 hover:bg-blue-50 flex items-center group transition-all">
                    <span class="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border flex items-center justify-center mr-6 font-black group-hover:bg-blue-600 group-hover:text-white">${i+1}</span>
                    <span class="font-bold text-slate-700 dark:text-slate-300 uppercase text-xs">${o}</span>
                </button>
            `).join('')}
        </div>`;
};

window.submitAnswer = (i) => {
    const q = quizQuestions[currentQIndex];
    sessionResults.push({ correct: i === q.correct });
    if (currentQIndex < quizQuestions.length - 1) {
        currentQIndex++; window.renderQuestion();
    } else {
        const score = Math.round((sessionResults.filter(r => r.correct).length / quizQuestions.length) * 100);
        document.getElementById('quiz-ui').classList.add('hidden');
        document.getElementById('quiz-intro').classList.remove('hidden');
        document.getElementById('quiz-intro').innerHTML = `<div class="text-center"><h3 class="text-4xl font-black mb-4">Resultado: ${score}%</h3><button onclick="window.startQuiz()" class="bg-blue-700 text-white px-8 py-4 rounded-2xl">Refazer</button></div>`;
    }
};

// --- 6. AUTH MODAL ---
window.openAuthModal = () => document.getElementById('auth-modal').classList.replace('hidden', 'flex');
window.closeAuthModal = () => document.getElementById('auth-modal').classList.replace('flex', 'hidden');

// --- 7. INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark');
    
    // Renderiza Flashcards
    const fGrid = document.getElementById('flashcards-grid');
    if(fGrid) fGrid.innerHTML = flashcards.map(f => `<div class="h-64 cursor-pointer" onclick="this.classList.toggle('flipped')"><div class="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-md h-full flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800 text-center"><span>${f.cat}</span><h4 class="text-xl font-bold">${f.front}</h4></div></div>`).join('');

    // Inicia na tela Hero
    window.showView('hero');
});
