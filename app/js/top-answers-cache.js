
import {getTodaysQuestion} from "./answer-cache";
import scoreAnswer from "./score-answer";

//This is an array with words. The words are arranged from highest to lowest
let topAnswersToday = null;
let currentQuestion = null;

export default function getTopAnswers(userAnswer, score) {
    let question = getTodaysQuestion();
    if (question.text != currentQuestion) {
        topAnswersToday = question["top-answer-default"]
        topAnswersToday.sort((a, b) => scoreAnswer(b, question['x2'], question['x3']) - scoreAnswer(a, question['x2'], question['x3']));//Sort to account for any changes from double or triple letter scores. Notable the highest is first
        currentQuestion = question.text;
    }
    let gotTopAnswer;
    let newTopAnswer;
    if (topAnswersToday.includes(userAnswer)) {
        gotTopAnswer = true;//Don't change the array, we already have the answer recorded
        newTopAnswer = false;
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
    return [ gotTopAnswer, newTopAnswer, topAnswersToday ];
}
