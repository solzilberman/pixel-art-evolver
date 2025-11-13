import { TARGET_IMAGES, MAX_FITNESS } from './constants.js';
import { GeneticAlgorithm, RandomSearch } from './search.js';
import { 
    drawPixelArt, 
    initializeCharts, 
    initializeAceEditors,
    updateECDisplay,
    updateRSDisplay,
    resetDisplays 
} from './ui.js';

let ecAlgorithm = null;
let rsAlgorithm = null;
let isRunning = false;
let isPaused = false;
let animationId = null;
let currentTarget = null;

let ecChart = null;
let rsChart = null;
let aceEditors = {};

const elements = {
    targetImageSelect: document.getElementById('targetImage'),
    targetCanvas: document.getElementById('targetCanvas'),
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    stopBtn: document.getElementById('stopBtn'),
    resetBtn: document.getElementById('resetBtn'),
    ecGeneration: document.getElementById('ecGeneration'),
    ecBestFitness: document.getElementById('ecBestFitness'),
    ecBestImage: document.getElementById('ecBestImage'),
    ecTopImages: document.getElementById('ecTopImages'),
    rsIterations: document.getElementById('rsIterations'),
    rsBestFitness: document.getElementById('rsBestFitness'),
    rsBestImage: document.getElementById('rsBestImage'),
    rsTopImages: document.getElementById('rsTopImages')
};

function getParametersFromEditor() {
    const params = { populationSize: 150, mutationRate: 0.05, tournamentSize: 3 };
    
    try {
        const paramsEditor = aceEditors['parameters'];
        const editorParams = JSON.parse(paramsEditor.getValue());
        return { ...params, ...editorParams };
    } catch (e) {
        return params;
    }
}

function applyParameters(operatorType) {
    const editor = aceEditors[operatorType];
    const code = editor.getValue();
    
    if (operatorType === 'parameters') {
        const params = JSON.parse(code);
        const validationMessages = [];
        
        if (params.populationSize !== undefined) {
            if (!(params.populationSize > 0 && Number.isInteger(params.populationSize))) {
                throw new Error('Population size must be a positive integer');
            }
            validationMessages.push(`✓ Population size: ${params.populationSize}`);
        }
        
        if (params.mutationRate !== undefined) {
            if (!(params.mutationRate >= 0 && params.mutationRate <= 1)) {
                throw new Error('Mutation rate must be between 0 and 1');
            }
            validationMessages.push(`✓ Mutation rate: ${params.mutationRate}`);
        }
        
        if (params.tournamentSize !== undefined) {
            if (!(params.tournamentSize > 0 && Number.isInteger(params.tournamentSize))) {
                throw new Error('Tournament size must be a positive integer');
            }
            validationMessages.push(`✓ Tournament size: ${params.tournamentSize}`);
        }
        
        if (ecAlgorithm) {
            if (params.mutationRate !== undefined) ecAlgorithm.mutationRate = params.mutationRate;
            if (params.tournamentSize !== undefined) ecAlgorithm.tournamentSize = params.tournamentSize;
            alert('Parameters validated and applied!\n\n' + validationMessages.join('\n') + '\n\nNote: Population size will apply on next evolution run.');
        } else {
            alert('Parameters validated!\n\n' + validationMessages.join('\n') + '\n\nThese will be applied when you start evolution.');
        }
        
        return;
    }
    
    const func = new Function('return ' + code)();
    
    if (operatorType === 'crossover' && ecAlgorithm) {
        ecAlgorithm.crossover = func;
    } else if (operatorType === 'mutation' && ecAlgorithm) {
        ecAlgorithm.mutate = function(individual) {
            return func(individual, this.mutationRate);
        };
    } else if (operatorType === 'selection' && ecAlgorithm) {
        ecAlgorithm.tournamentSelection = function() {
            return func(this.population, this.fitness, this.tournamentSize);
        };
    } else if (operatorType === 'random-search' && rsAlgorithm) {
        rsAlgorithm.randomSearch = func;
    }
}

function startEvolution() {
    const targetKey = elements.targetImageSelect.value;
    currentTarget = TARGET_IMAGES[targetKey];
    
    const params = getParametersFromEditor();
    
    ecAlgorithm = new GeneticAlgorithm(currentTarget, params.populationSize);
    rsAlgorithm = new RandomSearch(currentTarget);
    
    ecAlgorithm.mutationRate = params.mutationRate;
    ecAlgorithm.tournamentSize = params.tournamentSize;
    
    ecChart.data.labels = [];
    ecChart.data.datasets[0].data = [];
    rsChart.data.labels = [];
    rsChart.data.datasets[0].data = [];
    
    isRunning = true;
    isPaused = false;
    elements.startBtn.disabled = true;
    elements.pauseBtn.disabled = false;
    elements.stopBtn.disabled = false;
    
    runEvolution();
}

function runEvolution() {
    if (!isRunning) return;
    
    if (isPaused) {
        animationId = requestAnimationFrame(() => {
            setTimeout(runEvolution, 100);
        });
        return;
    }
    
    ecAlgorithm.runGeneration();
    rsAlgorithm.runIteration();
    
    updateECDisplay(ecAlgorithm, ecChart, elements);
    updateRSDisplay(rsAlgorithm, rsChart, elements);
    
    if (ecAlgorithm.bestFitness === MAX_FITNESS || rsAlgorithm.bestFitness === MAX_FITNESS) {
        stopEvolution();
        return;
    }
    
    animationId = requestAnimationFrame(() => {
        setTimeout(runEvolution, 100);
    });
}

function stopEvolution() {
    isRunning = false;
    isPaused = false;
    elements.startBtn.disabled = false;
    elements.pauseBtn.disabled = true;
    elements.stopBtn.disabled = true;
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

function pauseEvolution() {
    if (!isRunning) return;
    
    isPaused = !isPaused;
    
    if (isPaused) {
        elements.pauseBtn.textContent = 'Resume';
        elements.pauseBtn.style.background = '#d4edda';
    } else {
        elements.pauseBtn.textContent = 'Pause';
        elements.pauseBtn.style.background = '#fff3cd';
    }
}

function resetEvolution() {
    stopEvolution();
    
    ecAlgorithm = null;
    rsAlgorithm = null;
    
    resetDisplays({ ecChart, rsChart }, elements);
    
    elements.pauseBtn.textContent = 'Pause';
    elements.pauseBtn.style.background = '#fff3cd';
}

function updateTargetDisplay() {
    const targetKey = elements.targetImageSelect.value;
    const targetImage = TARGET_IMAGES[targetKey];
    drawPixelArt(elements.targetCanvas, targetImage);
}

window.applyCode = function(operatorType) {
    try {
        applyParameters(operatorType);
    } catch (error) {
        alert(`Error in ${operatorType} code: ${error.message}`);
    }
};

elements.startBtn.addEventListener('click', startEvolution);
elements.pauseBtn.addEventListener('click', pauseEvolution);
elements.stopBtn.addEventListener('click', stopEvolution);
elements.resetBtn.addEventListener('click', resetEvolution);
elements.targetImageSelect.addEventListener('change', updateTargetDisplay);

document.addEventListener('DOMContentLoaded', () => {
    const charts = initializeCharts();
    ecChart = charts.ecChart;
    rsChart = charts.rsChart;
    
    aceEditors = initializeAceEditors();
    updateTargetDisplay();
});
