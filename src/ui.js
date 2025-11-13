import { COLOR_PALETTE, MAX_FITNESS } from './constants.js';

export function drawPixelArt(canvas, imageData) {
    const ctx = canvas.getContext('2d');
    const pixelSize = canvas.width / 8;
    
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const colorIndex = imageData[y][x];
            ctx.fillStyle = COLOR_PALETTE[colorIndex];
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
    }
}

export function initializeCharts() {
    const ecCtx = document.getElementById('ecChart').getContext('2d');
    const ecChart = new Chart(ecCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Best Fitness',
                data: [],
                borderColor: '#2c5aa0',
                backgroundColor: 'rgba(44, 90, 160, 0.1)',
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
                    max: MAX_FITNESS
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    const rsCtx = document.getElementById('rsChart').getContext('2d');
    const rsChart = new Chart(rsCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Best Fitness',
                data: [],
                borderColor: '#8b0000',
                backgroundColor: 'rgba(139, 0, 0, 0.1)',
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
                    max: MAX_FITNESS
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    return { ecChart, rsChart };
}

export function initializeAceEditors() {
    const defaultCode = {
        parameters: `{
    "populationSize": 150,
    "mutationRate": 0.05,
    "tournamentSize": 3
}`,
        crossover: `function crossover(parent1, parent2) {
        const crossoverPoint = Math.floor(Math.random() * 64);
        const parent11d = parent1.flat();
        const parent21d = parent2.flat();

        const child11d = parent11d.slice(0, crossoverPoint).concat(parent21d.slice(crossoverPoint));
        const child21d = parent21d.slice(0, crossoverPoint).concat(parent11d.slice(crossoverPoint));

        const child1 = [];
        const child2 = [];
        while (child11d.length) child1.push(child11d.splice(0, 8));
        while (child21d.length) child2.push(child21d.splice(0, 8));

        return [child1, child2];
}`,
        mutation: `function mutate(individual, mutationRate) {
    const mutated = individual.map(row => [...row]); // deep copy
    const numColors = COLOR_PALETTE.length; 
    
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            if (Math.random() < mutationRate) {
                mutated[y][x] = Math.floor(Math.random() * numColors);
            }
        }
    }
    
    return mutated;
}`,
        selection: `function tournamentSelection(population, fitness, tournamentSize) {
    const tournament = [];
    
    for (let i = 0; i < tournamentSize; i++) {
        tournament.push(population[Math.floor(Math.random() * population.length)]);
    }
    
    const imageToString = (img) => img.map(row => row.join(',')).join('|');
    
    return tournament.reduce((best, current) => {
        const bestKey = imageToString(best);
        const currentKey = imageToString(current);
        return fitness[currentKey] > fitness[bestKey] ? current : best;
    });
}`,
        'random-search': `function randomSearch(target, iterations) {
    let bestImage = null;
    let bestFitness = 0;
    const numColors = ${COLOR_PALETTE.length};
    
    for (let i = 0; i < iterations; i++) {
        const randomImage = [];
        for (let y = 0; y < 8; y++) {
            const row = [];
            for (let x = 0; x < 8; x++) {
                row.push(Math.floor(Math.random() * numColors));
            }
            randomImage.push(row);
        }
        
        let fitness = 0;
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                if (randomImage[y][x] === target[y][x]) {
                    fitness += 1;
                }
            }
        }
        
        if (fitness > bestFitness) {
            bestFitness = fitness;
            bestImage = randomImage;
        }
    }
    
    return { bestImage, bestFitness };
}`
    };

    const aceEditors = {};
    const editorIds = ['parameters', 'crossover', 'mutation', 'selection', 'random-search'];
    
    editorIds.forEach(id => {
        const editorElement = document.getElementById(id + '-editor');
        const editor = ace.edit(editorElement);
        editor.setTheme("ace/theme/monokai");
        
        if (id === 'parameters') {
            editor.session.setMode("ace/mode/json");
        } else {
            editor.session.setMode("ace/mode/javascript");
        }
        
        editor.setValue(defaultCode[id], -1);
        console.log(editor.OptionsProvider);
        editor.setOptions({
            fontSize: "12px",
            showPrintMargin: false,
            wrap: true,
            maxLines: Infinity,
            minLines: 3,
        });
        
        const resizeEditor = () => {
            const newHeight = editor.getSession().getScreenLength() * 
                editor.renderer.lineHeight + editor.renderer.scrollBar.getWidth();
            editor.container.style.height = `${newHeight}px`;
            editor.resize();
        };
        
        editor.on('change', resizeEditor);
        resizeEditor();
        
        aceEditors[id] = editor;
    });

    return aceEditors;
}

export function updateECDisplay(ecAlgorithm, ecChart, elements) {
    const { ecGeneration, ecBestFitness, ecBestImage, ecTopImages } = elements;
    
    ecGeneration.textContent = ecAlgorithm.generation;
    const fitnessRatio = (ecAlgorithm.bestFitness / MAX_FITNESS).toFixed(3);
    ecBestFitness.textContent = `${fitnessRatio} (${ecAlgorithm.bestFitness}/${MAX_FITNESS})`;
    
    if (ecAlgorithm.bestImage) {
        drawPixelArt(ecBestImage, ecAlgorithm.bestImage);
    }
    
    ecChart.data.labels.push(ecAlgorithm.generation);
    ecChart.data.datasets[0].data.push(ecAlgorithm.bestFitness);
    ecChart.update('none');
    
    ecTopImages.innerHTML = '';
    ecAlgorithm.topImages.forEach(([image, fitness]) => {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 40;
        drawPixelArt(canvas, image);
        
        const fitnessSpan = document.createElement('span');
        fitnessSpan.className = 'image-fitness';
        const itemRatio = (fitness / MAX_FITNESS).toFixed(3);
        fitnessSpan.textContent = `${itemRatio} (${fitness}/${MAX_FITNESS})`;
        
        imageItem.appendChild(canvas);
        imageItem.appendChild(fitnessSpan);
        ecTopImages.appendChild(imageItem);
    });
}

export function updateRSDisplay(rsAlgorithm, rsChart, elements) {
    const { rsIterations, rsBestFitness, rsBestImage, rsTopImages } = elements;
    
    rsIterations.textContent = rsAlgorithm.iterations;
    const fitnessRatio = (rsAlgorithm.bestFitness / MAX_FITNESS).toFixed(3);
    rsBestFitness.textContent = `${fitnessRatio} (${rsAlgorithm.bestFitness}/${MAX_FITNESS})`;
    
    if (rsAlgorithm.bestImage) {
        drawPixelArt(rsBestImage, rsAlgorithm.bestImage);
    }
    
    rsChart.data.labels.push(rsAlgorithm.iterations);
    rsChart.data.datasets[0].data.push(rsAlgorithm.bestFitness);
    rsChart.update('none');
    
    rsTopImages.innerHTML = '';
    rsAlgorithm.topImages.forEach(([image, fitness]) => {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 40;
        drawPixelArt(canvas, image);
        
        const fitnessSpan = document.createElement('span');
        fitnessSpan.className = 'image-fitness';
        const itemRatio = (fitness / MAX_FITNESS).toFixed(3);
        fitnessSpan.textContent = `${itemRatio} (${fitness}/${MAX_FITNESS})`;
        
        imageItem.appendChild(canvas);
        imageItem.appendChild(fitnessSpan);
        rsTopImages.appendChild(imageItem);
    });
}

export function resetDisplays(charts, elements) {
    const { ecChart, rsChart } = charts;
    const { 
        ecGeneration, ecBestFitness, ecBestImage, ecTopImages,
        rsIterations, rsBestFitness, rsBestImage, rsTopImages 
    } = elements;
    
    const ecCtx = ecBestImage.getContext('2d');
    ecCtx.clearRect(0, 0, ecBestImage.width, ecBestImage.height);
    const rsCtx = rsBestImage.getContext('2d');
    rsCtx.clearRect(0, 0, rsBestImage.width, rsBestImage.height);
    
    ecGeneration.textContent = '0';
    ecBestFitness.textContent = '0';
    ecTopImages.innerHTML = '';
    
    rsIterations.textContent = '0';
    rsBestFitness.textContent = '0';
    rsTopImages.innerHTML = '';
    
    ecChart.data.labels = [];
    ecChart.data.datasets[0].data = [];
    rsChart.data.labels = [];
    rsChart.data.datasets[0].data = [];
    ecChart.update();
    rsChart.update();
}

