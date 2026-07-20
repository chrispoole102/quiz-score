// lib/answer-cache.js
import { getDailyQuestion, getTodayKey } from './daily-question';
import { getWikipediaListItems } from './wikipedia-parser.js';

async function parseWikipediaList(article, type, column, extraAnswers) {
    return getWikipediaListItems(article, type, column, extraAnswers);
}

let cachedDay = null;

function loadDay(dateKey) {
    const question = getDailyQuestion(dateKey);
    const answersPromise = parseWikipediaList(
        question['wikipedia-list'],
        question.type,
        question.column,
        question['extra-answers']
    ).catch((err) => {
        if (cachedDay?.dateKey === dateKey) cachedDay = null;
        throw err;
    });

    return { dateKey, question, answersPromise };
}

function getCurrentDay() {
    const todayKey = getTodayKey();
    if (!cachedDay || cachedDay.dateKey !== todayKey) {
        cachedDay = loadDay(todayKey);
    }
    return cachedDay;
}

export function getTodaysQuestion() {
    return getCurrentDay().question;
}

export async function getTodaysAnswers() {
    return getCurrentDay().answersPromise;
}
