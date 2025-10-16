// Genetic Algorithm Demo - EC vs Random Search
class GeneticAlgorithm {
    constructor(targetWord, populationSize = 50) {
        this.targetWord = targetWord.toUpperCase();
        this.populationSize = populationSize;
        this.population = [];
        this.fitness = {};
        this.generation = 0;
        this.bestFitness = 0;
        this.bestWord = '';
        this.fitnessHistory = [];
        this.topWords = [];
        this.mutationRate = 0.1;
        this.tournamentSize = 3;
        
        this.initializePopulation();
    }
    
    initializePopulation() {
        this.population = [];
        for (let i = 0; i < this.populationSize; i++) {
            this.population.push(this.generateRandomWord(this.targetWord.length));
        }
    }
    
    generateRandomWord(length) {
        let word = '';
        for (let i = 0; i < length; i++) {
            word += String.fromCharCode(65 + Math.floor(Math.random() * 26));
        }
        return word;
    }
    
    calculateFitness(word) {
        let fitness = 0;
        for (let i = 0; i < word.length; i++) {
            if (word[i] === this.targetWord[i]) {
                fitness += 1;
            }
        }
        return fitness;
    }
    
    evaluatePopulation() {
        this.fitness = {};
        for (let word of this.population) {
            this.fitness[word] = this.calculateFitness(word);
        }
        
        // Update best
        for (let word of this.population) {
            if (this.fitness[word] > this.bestFitness) {
                this.bestFitness = this.fitness[word];
                this.bestWord = word;
            }
        }
        
        // Update top words
        this.updateTopWords();
    }
    
    updateTopWords() {
        const wordFitnessPairs = Object.entries(this.fitness);
        wordFitnessPairs.sort((a, b) => b[1] - a[1]);
        this.topWords = wordFitnessPairs.slice(0, 10);
    }
    
    tournamentSelection() {
        const tournament = [];
        for (let i = 0; i < this.tournamentSize; i++) {
            tournament.push(this.population[Math.floor(Math.random() * this.population.length)]);
        }
        return tournament.reduce((best, current) => 
            this.fitness[current] > this.fitness[best] ? current : best
        );
    }
    
    crossover(parent1, parent2) {
        const point = Math.floor(Math.random() * parent1.length);
        const child1 = parent1.slice(0, point) + parent2.slice(point);
        const child2 = parent2.slice(0, point) + parent1.slice(point);
        return [child1, child2];
    }
    
    mutate(individual) {
        let mutated = individual.split('');
        for (let i = 0; i < mutated.length; i++) {
            if (Math.random() < this.mutationRate) {
                mutated[i] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            }
        }
        return mutated.join('');
    }
    
    evolve() {
        const newPopulation = [];
        
        // Keep best individual (elitism)
        const bestIndividual = this.population.reduce((best, current) => 
            this.fitness[current] > this.fitness[best] ? current : best
        );
        newPopulation.push(bestIndividual);
        
        // Generate rest of population
        while (newPopulation.length < this.populationSize) {
            const parent1 = this.tournamentSelection();
            const parent2 = this.tournamentSelection();
            const [child1, child2] = this.crossover(parent1, parent2);
            
            newPopulation.push(this.mutate(child1));
            if (newPopulation.length < this.populationSize) {
                newPopulation.push(this.mutate(child2));
            }
        }
        
        this.population = newPopulation;
        this.generation++;
    }
    
    runGeneration() {
        this.evaluatePopulation();
        this.fitnessHistory.push(this.bestFitness);
        this.evolve();
    }
}

class RandomSearch {
    constructor(targetWord) {
        this.targetWord = targetWord.toUpperCase();
        this.iterations = 0;
        this.bestFitness = 0;
        this.bestWord = '';
        this.fitnessHistory = [];
        this.topWords = [];
        this.allWords = new Map(); // Store all generated words and their fitness
    }
    
    generateRandomWord(length) {
        let word = '';
        for (let i = 0; i < length; i++) {
            word += String.fromCharCode(65 + Math.floor(Math.random() * 26));
        }
        return word;
    }
    
    calculateFitness(word) {
        let fitness = 0;
        for (let i = 0; i < word.length; i++) {
            if (word[i] === this.targetWord[i]) {
                fitness += 1;
            }
        }
        return fitness;
    }
    
    updateTopWords() {
        const wordFitnessPairs = Array.from(this.allWords.entries());
        wordFitnessPairs.sort((a, b) => b[1] - a[1]);
        this.topWords = wordFitnessPairs.slice(0, 10);
    }
    
    runIteration() {
        const randomWord = this.generateRandomWord(this.targetWord.length);
        const fitness = this.calculateFitness(randomWord);
        
        this.allWords.set(randomWord, fitness);
        
        if (fitness > this.bestFitness) {
            this.bestFitness = fitness;
            this.bestWord = randomWord;
        }
        
        this.iterations++;
        this.fitnessHistory.push(this.bestFitness);
        this.updateTopWords();
    }
}

// Application state
let ecAlgorithm = null;
let rsAlgorithm = null;
let isRunning = false;
let animationId = null;

// Chart instances
let ecChart = null;
let rsChart = null;

// DOM elements
const targetWordInput = document.getElementById('targetWord');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');

// EC elements
const ecGeneration = document.getElementById('ecGeneration');
const ecBestFitness = document.getElementById('ecBestFitness');
const ecBestWord = document.getElementById('ecBestWord');
const ecTopWords = document.getElementById('ecTopWords');

// RS elements
const rsIterations = document.getElementById('rsIterations');
const rsBestFitness = document.getElementById('rsBestFitness');
const rsBestWord = document.getElementById('rsBestWord');
const rsTopWords = document.getElementById('rsTopWords');

function initializeCharts() {
    // EC Chart
    const ecCtx = document.getElementById('ecChart').getContext('2d');
    ecChart = new Chart(ecCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Best Fitness',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    // RS Chart
    const rsCtx = document.getElementById('rsChart').getContext('2d');
    rsChart = new Chart(rsCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Best Fitness',
                data: [],
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function updateECDisplay() {
    if (!ecAlgorithm) return;
    
    ecGeneration.textContent = ecAlgorithm.generation;
    ecBestFitness.textContent = ecAlgorithm.bestFitness;
    ecBestWord.textContent = ecAlgorithm.bestWord;
    
    // Update chart
    ecChart.data.labels.push(ecAlgorithm.generation);
    ecChart.data.datasets[0].data.push(ecAlgorithm.bestFitness);
    ecChart.update('none');
    
    // Update top words
    ecTopWords.innerHTML = '';
    ecAlgorithm.topWords.forEach(([word, fitness], index) => {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        wordItem.innerHTML = `
            <span class="word-text">${word}</span>
            <span class="word-fitness">${fitness}/${ecAlgorithm.targetWord.length}</span>
        `;
        ecTopWords.appendChild(wordItem);
    });
}

function updateRSDisplay() {
    if (!rsAlgorithm) return;
    
    rsIterations.textContent = rsAlgorithm.iterations;
    rsBestFitness.textContent = rsAlgorithm.bestFitness;
    rsBestWord.textContent = rsAlgorithm.bestWord;
    
    // Update chart
    rsChart.data.labels.push(rsAlgorithm.iterations);
    rsChart.data.datasets[0].data.push(rsAlgorithm.bestFitness);
    rsChart.update('none');
    
    // Update top words
    rsTopWords.innerHTML = '';
    rsAlgorithm.topWords.forEach(([word, fitness], index) => {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        wordItem.innerHTML = `
            <span class="word-text">${word}</span>
            <span class="word-fitness">${fitness}/${rsAlgorithm.targetWord.length}</span>
        `;
        rsTopWords.appendChild(wordItem);
    });
}

function startEvolution() {
    const targetWord = targetWordInput.value.trim().toUpperCase();
    if (!targetWord) {
        alert('Please enter a target word');
        return;
    }
    
    // Initialize algorithms
    ecAlgorithm = new GeneticAlgorithm(targetWord);
    rsAlgorithm = new RandomSearch(targetWord);
    
    // Reset charts
    ecChart.data.labels = [];
    ecChart.data.datasets[0].data = [];
    rsChart.data.labels = [];
    rsChart.data.datasets[0].data = [];
    
    // Update chart max based on target length
    const maxFitness = targetWord.length;
    ecChart.options.scales.y.max = maxFitness;
    rsChart.options.scales.y.max = maxFitness;
    
    isRunning = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    
    runEvolution();
}

function runEvolution() {
    if (!isRunning) return;
    
    // Run one generation/iteration for each algorithm
    ecAlgorithm.runGeneration();
    rsAlgorithm.runIteration();
    
    // Update displays
    updateECDisplay();
    updateRSDisplay();
    
    // Check if target is found
    if (ecAlgorithm.bestFitness === ecAlgorithm.targetWord.length || 
        rsAlgorithm.bestFitness === rsAlgorithm.targetWord.length) {
        stopEvolution();
        return;
    }
    
    // Continue evolution
    animationId = requestAnimationFrame(() => {
        setTimeout(runEvolution, 100); // Small delay for visualization
    });
}

function stopEvolution() {
    isRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

function resetEvolution() {
    stopEvolution();
    
    // Reset algorithms
    ecAlgorithm = null;
    rsAlgorithm = null;
    
    // Reset displays
    ecGeneration.textContent = '0';
    ecBestFitness.textContent = '0';
    ecBestWord.textContent = '-';
    ecTopWords.innerHTML = '';
    
    rsIterations.textContent = '0';
    rsBestFitness.textContent = '0';
    rsBestWord.textContent = '-';
    rsTopWords.innerHTML = '';
    
    // Reset charts
    ecChart.data.labels = [];
    ecChart.data.datasets[0].data = [];
    rsChart.data.labels = [];
    rsChart.data.datasets[0].data = [];
    ecChart.update();
    rsChart.update();
}

function toggleCode(codeId) {
    const codeContent = document.getElementById(codeId + '-code');
    codeContent.classList.toggle('active');
}

// Event listeners
startBtn.addEventListener('click', startEvolution);
stopBtn.addEventListener('click', stopEvolution);
resetBtn.addEventListener('click', resetEvolution);

targetWordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        startEvolution();
    }
});

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
});
