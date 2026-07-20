// app/api/check-answer/route.js
import { NextResponse } from 'next/server';
import {getTodaysAnswers, getTodaysQuestion} from '../../js/answer-cache';
import letterscores from "../../json/letterscores.json"
import getTopAnswers from "../../js/top-answers-cache";
import scoreAnswer from "../../js/score-answer";

function checkAnswer(answer, acceptableAnswers) {
    for (let a = 0; a < acceptableAnswers.length; a++) {
        let words = acceptableAnswers[a].split(" ");

        if (answer == words[0].toLowerCase())
            return true;
        if (words.length > 1 && answer == words[1].toLowerCase())
            return true;
        if (words.length > 1 && answer == words[0].toLowerCase() + " " + words[1].toLowerCase())
            return true;
        if (words[0].toLowerCase() == "the")
        {
            words.unshift();//remove "the" and try some more
            //words[0] used to be words[1] which we already checked
            if (words.length > 1 && answer == words[1].toLowerCase())
                return true;
            if (words.length > 1 && answer == words[0].toLowerCase() + " " + words[1].toLowerCase())
                return true;
            //this catches answers like "The East Ender" -> we want to check "East Ender"
        }
        //Anything 3 words or more doesn't fit in the 10 letter restriction anyway so just ignore it.
    }
    return false;
}

export async function POST(req) {
    const { answer } = await req.json();

    if (answer === undefined || answer === null || answer === '') {
        return NextResponse.json({ error: 'Missing answer' }, { status: 400 });
    }

    try {
        let question = getTodaysQuestion();
        const validAnswers = await getTodaysAnswers();

        const normalizedAnswer = String(answer).trim().toLowerCase();
        const isCorrect = checkAnswer(normalizedAnswer, validAnswers);
        let score = 0;
        let topAnswers = [];
        let gotTopAnswer = 0;
        let newTopAnswer = false;
        if (isCorrect)
        {
            score = scoreAnswer(normalizedAnswer, question['x2'], question['x3']);
            [ gotTopAnswer, newTopAnswer, topAnswers ] = getTopAnswers(normalizedAnswer, score);
        }


        return NextResponse.json({
            correct: isCorrect,
            score: score,    //send score
            topAnswers: topAnswers,
            gotTopAnswer: gotTopAnswer,
            newTopAnswer: newTopAnswer
        });
    } catch (err) {
        console.error('Error checking answer:', err);
        return NextResponse.json(
            { error: 'Failed to load answer data' },
            { status: 500 }
        );
    }
}