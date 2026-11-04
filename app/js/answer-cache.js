// lib/answer-cache.js
import { getDailyQuestion, getTodayKey } from './daily-question';
import { getWikipediaListItems } from './wikipedia-parser.js';
import { getStore } from '@netlify/blobs';


const inflight = new Map(); // dedupe concurrent requests within one instance

function countingSortByLength(strings, maxLen) {
    const counts = new Array(maxLen).fill(0);
    for (const s of strings) counts[s.length - 1]++;

    const starts = new Array(maxLen).fill(-1);
    const nextSlot = new Array(maxLen).fill(0);
    let running = 0;
    for (let i = 0; i < maxLen; i++) {
        if (counts[i] > 0) starts[i] = running;
        nextSlot[i] = running;
        running += counts[i];
    }

    const sorted = new Array(strings.length);
    for (const s of strings) sorted[nextSlot[s.length - 1]++] = s;

    return [ sorted, starts ];
}

async function loadAnswers(dateKey, question) {
    console.log("load answers started")
    const store = getStore({ name: 'daily-answers' });

    const entryMetadata = await store.getMetadata(dateKey)
    if (entryMetadata) {
        return await store.get(dateKey, { type: 'json' });
    }

    console.log("checked blobs and didn't find it")

    const wikiResults = await getWikipediaListItems(
        question['wikipedia-list'],
        question.type,
        question.column,
        question['extra-answers']
    );
    let answers = [];
    //sort answers
    for (let i = 0; i < wikiResults.length; i++) {
        if (wikiResults[i]) {
            let entry = wikiResults[i].toLowerCase();
            let words = entry.split(" ");
            if (words[0] == "the")
                words.shift();
            answers.push(words[0]);
            if (words.length > 1) {
                answers.push(words[1]);
                answers.push(words[0] + " " + words[1]);
            }
        }
    }
    let lengthStarts = [];
    [ answers, lengthStarts ] = countingSortByLength(answers, 10);

    console.log("got data from wikipedia")
    await store.setJSON(dateKey, {answers, lengthStarts});
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
