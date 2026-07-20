// lib/daily-route.js
const questionsData = require('../json/questions.json');

// Returns YYYY-MM-DD in UTC, so the "day" boundary is consistent
// regardless of which timezone a given server instance is running in.
function getTodayKey() {
    return new Date().toISOString().slice(5, 10);
}

// Simple, fast string hash (djb2) -> stable integer
function hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0; // force unsigned 32-bit
}

// Mulberry32 PRNG - deterministic, seeded
function mulberry32(seed) {
    return function () {
        seed |= 0;
        seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function getDailyQuestion(dateKey = getTodayKey()) {
    const keys = Object.keys(questionsData);
    console.log(dateKey);
    let index = keys.indexOf(dateKey);
    if (index == -1)
        index = hashString(dateKey) % keys.length;

    const seed = hashString(dateKey);
    const rand = mulberry32(seed);

    let questionData = questionsData[keys[index]];
    questionData['x2'] = Math.floor(rand() * 6);
    let dynamicDate = dateKey;
    do {
        dynamicDate += "1";
        let dynamicSeed = hashString(dynamicDate);
        let dynamicRand = mulberry32(dynamicSeed);
        questionData['x3'] = Math.floor(dynamicRand() * 6);
    } while (questionData['x3'] == questionData['x2'])
    return questionsData[keys[index]];
}

module.exports = { getTodayKey, getDailyQuestion };