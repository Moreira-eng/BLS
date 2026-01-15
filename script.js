// O código JavaScript começa aqui diretamente
window.toggleAccordion = (button) => {
    const item = button.parentElement;
    const isActive = item.classList.contains('active');
    document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));
    if (!isActive) item.classList.add('active');
};

window.toggleTheme = () => {
    const html = document.documentElement;
    html.classList.toggle('dark');
    const isDark = html.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('moon-icon').classList.toggle('hidden', isDark);
    document.getElementById('sun-icon').classList.toggle('hidden', !isDark);
};

window.toggleSidebar = () => {
    document.getElementById('sidebar').classList.toggle('-translate-x-full');
    document.getElementById('sidebar-overlay').classList.toggle('active');
};

window.showView = (v) => {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`view-${v}`);
    if(target) target.classList.add('active');
    window.scrollTo(0,0);
};

// Lógica simples do Metrônomo para teste
let metroInterval;
window.toggleMetronome = () => {
    const btn = document.getElementById('metro-toggle');
    if (btn.innerText.includes("Iniciar")) {
        btn.innerText = "Parar Batida";
        metroInterval = setInterval(() => {
            const visual = document.getElementById('metro-visual');
            visual.classList.add('scale-105');
            setTimeout(() => visual.classList.remove('scale-105'), 100);
        }, 545); // Aprox 110 BPM
    } else {
        btn.innerText = "Iniciar Batida";
        clearInterval(metroInterval);
    }
};
