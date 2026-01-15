// REMOVEMOS OS IMPORTS DO FIREBASE PARA EVITAR TRAVAMENTOS
const appId = 'lifesupport-pro-v1';

let currentUser = null;
let attempts = [];
let currentQIndex = 0;
let currentFIndex = 0; 
let sessionResults = [];
let finalExamResults = [];
let learningChartInstance = null;

// --- CORREÇÃO DO DARK MODE ---
window.toggleTheme = () => {
    const html = document.documentElement;
    const moonIcon = document.getElementById('moon-icon');
    const sunIcon = document.getElementById('sun-icon');
    
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        if(moonIcon) moonIcon.classList.remove('hidden');
        if(sunIcon) sunIcon.classList.add('hidden');
        localStorage.setItem('theme', 'light');
    } else {
        html.classList.add('dark');
        if(moonIcon) moonIcon.classList.add('hidden');
        if(sunIcon) sunIcon.classList.remove('hidden');
        localStorage.setItem('theme', 'dark');
    }
};

// Verificação inicial do tema ao carregar a página
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    window.onload = () => {
        if(document.getElementById('moon-icon')) document.getElementById('moon-icon').classList.add('hidden');
        if(document.getElementById('sun-icon')) document.getElementById('sun-icon').classList.remove('hidden');
    };
}

// --- BOTÃO DE LOGIN (VERSÃO OFFLINE) ---
// Como desativamos o Firebase, vamos simular a área de usuário
window.openAuthModal = () => {
    alert("O sistema de Login via banco de dados está desativado nesta versão estática do GitHub. O simulado funcionará localmente.");
};

// --- OUTRAS FUNÇÕES GLOBAIS ---
window.toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if(sidebar) sidebar.classList.toggle('-translate-x-full');
    if(overlay) overlay.classList.toggle('active');
};

window.showView = (v) => {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`view-${v}`);
    if(target) target.classList.add('active');
    if (v !== 'metronomo' && typeof window.stopMetronome === 'function') window.stopMetronome();
    window.scrollTo(0,0);
};

window.toggleAccordion = (button) => {
    const item = button.parentElement;
    const isActive = item.classList.contains('active');
    document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));
    if (!isActive) item.classList.add('active');
};

// --- METRÔNOMO ---
let metroState = { isRunning: false, bpm: 110, interval: null, audioCtx: null };

window.setBPM = (val) => {
    metroState.bpm = val;
    document.querySelectorAll('.bpm-btn').forEach(b => {
        b.classList.remove('bg-blue-600', 'shadow-lg', 'scale-105', 'dark:bg-blue-700');
        if (b.id === `bpm-${val}`) b.classList.add('bg-blue-600', 'shadow-lg', 'scale-105', 'dark:bg-blue-700');
    });
    if (metroState.isRunning) { window.stopMetronome(); window.startMetronome(); }
};

window.startMetronome = () => {
    if (!metroState.audioCtx) metroState.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (metroState.audioCtx.state === 'suspended') metroState.audioCtx.resume();
    const ms = 60000 / metroState.bpm;
    const btn = document.getElementById('metro-toggle');
    metroState.interval = setInterval(() => { window.playTick(); window.triggerPulse(); }, ms);
    metroState.isRunning = true;
    if(btn) {
        btn.innerText = "Parar Batida";
        btn.classList.add('bg-rose-600');
    }
};

window.stopMetronome = () => {
    const btn = document.getElementById('metro-toggle');
    clearInterval(metroState.interval);
    metroState.isRunning = false;
    if(btn) {
        btn.innerText = "Iniciar Batida";
        btn.classList.remove('bg-rose-600');
    }
};

window.toggleMetronome = () => metroState.isRunning ? window.stopMetronome() : window.startMetronome();

window.playTick = () => {
    if(!metroState.audioCtx) return;
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

// --- LÓGICA DO QUIZ ---
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
    const content = document.getElementById('quiz-content');
    content.innerHTML = `
        <h3 class="text-2xl font-black mb-10 leading-tight">${q.q}</h3>
        <div class="space-y-4">
            ${q.opts.map((o, i) => `<button onclick="window.submitAnswer(${i})" class="w-full text-left p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all font-bold text-xs uppercase">${i+1}. ${o}</button>`).join('')}
        </div>`;
};

window.submitAnswer = (i) => {
    const q = quizQuestions[currentQIndex];
    sessionResults.push({ category: q.cat, correct: i === q.correct, questionIndex: currentQIndex });
    if (currentQIndex < quizQuestions.length - 1) {
        currentQIndex++; window.renderQuestion();
    } else {
        const score = Math.round((sessionResults.filter(r => r.correct).length / quizQuestions.length) * 100);
        document.getElementById('quiz-ui').classList.add('hidden');
        document.getElementById('quiz-intro').classList.remove('hidden');
        document.getElementById('quiz-intro').innerHTML = `<div class="p-12 text-center"><h3 class="text-4xl font-black mb-4">Resultado: ${score}%</h3><button onclick="window.startQuiz()" class="bg-blue-700 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs">Refazer</button></div>`;
    }
};

// --- LÓGICA AVALIAÇÃO FINAL ---
window.startFinalExam = () => {
    currentFIndex = 0; finalExamResults = [];
    document.getElementById('final-intro').classList.add('hidden');
    document.getElementById('final-ui').classList.remove('hidden');
    window.renderFinalQuestion();
};

window.renderFinalQuestion = () => {
    const q = finalExamQuestions[currentFIndex];
    document.getElementById('f-count').innerText = `${currentFIndex + 1} / ${finalExamQuestions.length}`;
    document.getElementById('f-progress').style.width = `${((currentFIndex + 1) / finalExamQuestions.length) * 100}%`;
    document.getElementById('final-content').innerHTML = `
        <h3 class="text-2xl font-black mb-10 leading-tight">${q.q}</h3>
        <div class="space-y-4">
            ${q.opts.map((o, i) => `<button onclick="window.submitFinalAnswer(${i})" class="w-full text-left p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all font-bold text-xs uppercase">${i+1}. ${o}</button>`).join('')}
        </div>`;
};

window.submitFinalAnswer = (i) => {
    const q = finalExamQuestions[currentFIndex];
    finalExamResults.push({ correct: i === q.correct });
    if (currentFIndex < finalExamQuestions.length - 1) {
        currentFIndex++; window.renderFinalQuestion();
    } else {
        const score = Math.round((finalExamResults.filter(r => r.correct).length / finalExamQuestions.length) * 100);
        document.getElementById('final-ui').classList.add('hidden');
        document.getElementById('final-intro').classList.remove('hidden');
        document.getElementById('final-intro').innerHTML = `<div class="p-12 text-center"><h3 class="text-4xl font-black mb-4">Resultado Final: ${score}%</h3><button onclick="window.startFinalExam()" class="bg-rose-700 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs">Tentar Novamente</button></div>`;
    }
};

// --- INICIALIZAÇÃO DOS DADOS ---
window.switchChain = (t) => {
    const display = document.getElementById('chain-display');
    if(display) display.innerHTML = protocolsData[t].map((e, i) => `<div onclick="window.showEloDetail('${t}', ${i})" class="cursor-pointer p-4 rounded-2xl ${e.color} text-white text-center hover:scale-105 transition-all"><div class="font-black text-[9px] uppercase">${e.title}</div></div>`).join('');
    window.showEloDetail(t, 0);
};

window.showEloDetail = (t, i) => {
    const elo = protocolsData[t][i];
    const content = document.getElementById('detail-content');
    if(content) content.innerHTML = `<div class="p-10 text-left"><h3 class="text-3xl font-black mb-4 uppercase">${elo.title}</h3><ul class="space-y-2">${elo.steps.map(s => `<li class="text-sm font-medium">• ${s}</li>`).join('')}</ul></div>`;
};

const flashGrid = document.getElementById('flashcards-grid');
if(flashGrid) flashGrid.innerHTML = flashcards.map(f => `<div class="flashcard-container h-64 perspective" onclick="this.classList.toggle('flipped')"><div class="flashcard-inner"><div class="flashcard-front bg-white dark:bg-slate-900 border border-slate-200 flex items-center justify-center p-4 text-center font-bold">${f.front}</div><div class="flashcard-back bg-blue-700 text-white flex flex-col items-center justify-center p-4 text-center"><h4 class="text-2xl font-black mb-2">${f.back}</h4><p class="text-[10px] uppercase opacity-70">${f.sub}</p></div></div></div>`).join('');

window.switchChain('extra');
