// lib/answer-cache.js
import { getDailyQuestion, getTodayKey } from './daily-question';
import { getWikipediaListItems } from './wikipedia-parser.js';
import { getStore } from '@netlify/blobs';


const inflight = new Map(); // dedupe concurrent requests within one instance

async function loadAnswers(dateKey, question) {
    console.log("load answers started")
    const store = getStore({ name: 'daily-answers' });

    const entryMetadata = await store.getMetadata(dateKey)
    if (entryMetadata) {
        return await store.get(dateKey, { type: 'json' });
    }

    console.log("checked blobs and didn't find it")

    const answers = await getWikipediaListItems(
        question['wikipedia-list'],
        question.type,
        question.column,
        question['extra-answers']
    );
    console.log("got data from wikipedia")
    await store.setJSON(dateKey, answers);
    console.log("wrote to blobs")
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
