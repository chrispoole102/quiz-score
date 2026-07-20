import letterscores from "../json/letterscores.json";

export default function scoreAnswer(answer, x2Location, x3Location) {
    let score = 0;
    answer = answer.toLowerCase();
    for (let i = 0; i < answer.length; i++) {
        let mult = 1;
        if (x2Location == i)
            mult = 2;
        if (x3Location == i)
            mult = 3;

        if (letterscores[answer[i]]) {
            score += letterscores[answer[i]] * mult;
        }
        else {
            score += letterscores["other"] * mult;
        }
    }
    return score;
}