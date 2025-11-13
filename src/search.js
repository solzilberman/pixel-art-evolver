import { COLOR_PALETTE, MAX_FITNESS } from './constants.js';

function imageToString(image) {
    return image.map(row => row.join(',')).join('|');
}

export function stringToImage(str) {
    return str.split('|').map(row => row.split(',').map(Number));
}

export class GeneticAlgorithm {
    constructor(targetImage, populationSize = 150) {
        this.targetImage = targetImage;
        this.populationSize = populationSize;
        this.population = [];
        this.fitness = {};
        this.generation = 0;
        this.bestFitness = 0;
        this.bestImage = null;
        this.fitnessHistory = [];
        this.topImages = [];
        this.mutationRate = 0.05;
        this.tournamentSize = 3;

        this.initializePopulation();
    }

    initializePopulation() {
        this.population = [];
        for (let i = 0; i < this.populationSize; i++) {
            this.population.push(this.generateRandomImage());
        }
    }

    generateRandomImage() {
        const image = [];
        for (let y = 0; y < 8; y++) {
            const row = [];
            for (let x = 0; x < 8; x++) {
                row.push(Math.floor(Math.random() * COLOR_PALETTE.length));
            }
            image.push(row);
        }
        return image;
    }

    calculateFitness(image) {
        let fitness = 0;
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                if (image[y][x] === this.targetImage[y][x]) {
                    fitness += 1;
                }
            }
        }
        return fitness;
    }

    evaluatePopulation() {
        this.fitness = {};
        for (let image of this.population) {
            const key = imageToString(image);
            this.fitness[key] = this.calculateFitness(image);
        }

        for (let image of this.population) {
            const key = imageToString(image);
            if (this.fitness[key] > this.bestFitness) {
                this.bestFitness = this.fitness[key];
                this.bestImage = image;
            }
        }

        this.updateTopImages();
    }

    updateTopImages() {
        const imageFitnessPairs = [];
        const seen = new Set();

        for (let image of this.population) {
            const key = imageToString(image);
            if (!seen.has(key)) {
                seen.add(key);
                imageFitnessPairs.push([image, this.fitness[key]]);
            }
        }

        imageFitnessPairs.sort((a, b) => b[1] - a[1]);
        this.topImages = imageFitnessPairs.slice(0, 10);
    }

    tournamentSelection() {
        const tournament = [];
        for (let i = 0; i < this.tournamentSize; i++) {
            tournament.push(this.population[Math.floor(Math.random() * this.population.length)]);
        }
        return tournament.reduce((best, current) => {
            const bestKey = imageToString(best);
            const currentKey = imageToString(current);
            return this.fitness[currentKey] > this.fitness[bestKey] ? current : best;
        });
    }

    crossover(parent1, parent2) {
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
    }

    mutate(individual) {
        const mutated = individual.map(row => [...row]);
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                if (Math.random() < this.mutationRate) {
                    mutated[y][x] = Math.floor(Math.random() * COLOR_PALETTE.length);
                }
            }
        }
        return mutated;
    }

    evolve() {
        const newPopulation = [];

        const bestIndividual = this.population.reduce((best, current) => {
            const bestKey = imageToString(best);
            const currentKey = imageToString(current);
            return this.fitness[currentKey] > this.fitness[bestKey] ? current : best;
        });
        newPopulation.push(bestIndividual.map(row => [...row]));

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

export class RandomSearch {
    constructor(targetImage) {
        this.targetImage = targetImage;
        this.iterations = 0;
        this.bestFitness = 0;
        this.bestImage = null;
        this.fitnessHistory = [];
        this.topImages = [];
        this.allImages = new Map();
    }

    generateRandomImage() {
        const image = [];
        for (let y = 0; y < 8; y++) {
            const row = [];
            for (let x = 0; x < 8; x++) {
                row.push(Math.floor(Math.random() * COLOR_PALETTE.length));
            }
            image.push(row);
        }
        return image;
    }

    calculateFitness(image) {
        let fitness = 0;
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                if (image[y][x] === this.targetImage[y][x]) {
                    fitness += 1;
                }
            }
        }
        return fitness;
    }

    updateTopImages() {
        const imageFitnessPairs = Array.from(this.allImages.entries()).map(([key, fitness]) => {
            return [stringToImage(key), fitness];
        });
        imageFitnessPairs.sort((a, b) => b[1] - a[1]);
        this.topImages = imageFitnessPairs.slice(0, 10);
    }

    runIteration() {
        const randomImage = this.generateRandomImage();
        const fitness = this.calculateFitness(randomImage);

        this.allImages.set(imageToString(randomImage), fitness);

        if (fitness > this.bestFitness) {
            this.bestFitness = fitness;
            this.bestImage = randomImage;
        }

        this.iterations++;
        this.fitnessHistory.push(this.bestFitness);
        this.updateTopImages();
    }
}

