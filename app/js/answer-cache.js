// lib/answer-cache.js
import { getDailyQuestion, getTodayKey } from './daily-question';
import { getWikipediaListItems } from './wikipedia-parser.js';
import { getStore } from '@netlify/blobs';


const inflight = new Map(); // dedupe concurrent requests within one instance

async function loadAnswers(dateKey, question) {
    const store = getStore({ name: 'daily-answers' });

    const cached = await store.get(dateKey, { type: 'json' });
    if (cached) return cached;

    const answers = await getWikipediaListItems(
        question['wikipedia-list'],
        question.type,
        question.column,
        question['extra-answers']
    );
    await store.setJSON(dateKey, answers);
    return answers;
}

export function getTodaysQuestion() {
    return getDailyQuestion();
}

export async function getTodaysAnswers() {
    const dateKey = getTodayKey();
    if (!inflight.has(dateKey)) {
        const p = loadAnswers(dateKey, getDailyQuestion(dateKey)).catch((err) => {
            inflight.delete(dateKey);
            throw err;
        });
        inflight.set(dateKey, p);
    }
    return inflight.get(dateKey);
}
