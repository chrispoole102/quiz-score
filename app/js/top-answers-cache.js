
import { getStore } from '@netlify/blobs';
import { getTodayKey } from './daily-question';
import {getTodaysQuestion} from "./answer-cache";
import scoreAnswer from "./score-answer";


export default async function getTopAnswers(userAnswer, score) {
    let question = getTodaysQuestion();

    const store = getStore({ name: 'daily-top-answers' });
    const dateKey = getTodayKey();

    //This is an array with words. The words are arranged from highest to lowest
    let topAnswersToday;

    const entryMetadata = await store.getMetadata(dateKey)
    if (entryMetadata) {
        let netlifyBlobText = await store.get(dateKey, { consistency: 'strong', type: 'text' });
        topAnswersToday = netlifyBlobText.split("&@&");//This assumes that no valid answers will ever have &@&
    } else {
        topAnswersToday = question["top-answer-default"];
    }
    topAnswersToday.sort((a, b) => scoreAnswer(b, question['x2'], question['x3']) - scoreAnswer(a, question['x2'], question['x3']));//Sort to account for any changes from double or triple letter scores. Notable the highest is first


    /*
    if (question.text != currentQuestion) {
        topAnswersToday = question["top-answer-default"]
        topAnswersToday.sort((a, b) => scoreAnswer(b, question['x2'], question['x3']) - scoreAnswer(a, question['x2'], question['x3']));//Sort to account for any changes from double or triple letter scores. Notable the highest is first
        currentQuestion = question.text;
    }
     */
    let gotTopAnswer;
    let newTopAnswer;
    if (topAnswersToday.includes(userAnswer)) {
        gotTopAnswer = topAnswersToday.indexOf(userAnswer)+1;
        newTopAnswer = false;
        //Don't change the array, we already have the answer recorded
    }
    else {
        let spotToAdd = -1;
        for (let i = 0; i < topAnswersToday.length; i++) {
            let thisAnswersScore = scoreAnswer(topAnswersToday[i], question['x2'], question['x3']);
            if (score >= thisAnswersScore) {
                spotToAdd = i;
                break;
            }
        }
        gotTopAnswer = spotToAdd+1;
        newTopAnswer= (spotToAdd != -1);
        if (spotToAdd != -1) {
            topAnswersToday.splice(spotToAdd, 0, userAnswer);
            topAnswersToday.pop();
            console.log(topAnswersToday);
        }

    }

    let netlifyBlobText = topAnswersToday.join("&@&");
    
    await store.set(dateKey, netlifyBlobText);

    return [ gotTopAnswer, newTopAnswer, topAnswersToday ];
}
