'use client'

import ScrabbleInput from "./ScrabbleInput";
import {useEffect, useState} from "react";
import "../css/ScrabbleQuizQuestion.css"
import Popup from "@/app/components/Popup";

let previouslyGivenAnswers = [];
let topAnswersSeen = [];

export default function ScrabbleQuizQuestion() {
    const [score, setScore] = useState(0);

    const [questionText, setQuestionText] = useState(null);
    const [x2Location, setx2Location] = useState(-1);
    const [x3Location, setx3Location] = useState(-1);

    const [answer, setAnswer] = useState('');
    const [result, setResult] = useState(null); // 'correct' | 'incorrect' | null
    const [submitting, setSubmitting] = useState(false);

    const [popupOpen, setPopupOpen] = useState(false);
    const [popupText, setPopupText] = useState("");
    const [popupArray, setPopupArray] = useState([]);

    const [incorrect, setIncorrect] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadQuestion() {
            try {
                const res = await fetch('/api/question');
                if (!res.ok) throw new Error('Failed to load question');

                const data = await res.json();
                if (!cancelled) {
                    setQuestionText(data.text);
                    setx2Location(data.x2);
                    setx3Location(data.x3);
                }
            } catch (err) {
                setPopupText("Failed to load today's question.");
                setPopupOpen(true);
            }
        }

        loadQuestion();
        return () => {
            cancelled = true; // avoid setting state after unmount
        };
    }, []);
    const inputChanged = function (newValue) {
        setAnswer(newValue)
        //calc score
    }
    const convertNumberToPlace = function (number) {
        switch (number) {
            case 1: return "1st";
            case 2: return "2nd";
            case 3: return "3rd";
            default: return number+"th"
        }
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!answer.trim()) return;
        setResult(null);
        setScore(-1);
        if (previouslyGivenAnswers.includes(answer)) {
            setPopupText("You've already submitted that answer.");
            setPopupOpen(true);
            return;
        }
        if (topAnswersSeen.includes(answer)) {
            setPopupText("You saw that answer in the top answers list!");
            setPopupOpen(true);
            return;
        }

        setSubmitting(true);
        setResult(null);

        try {
            const res = await fetch('/api/check-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answer }),
            });

            if (!res.ok) throw new Error('Request failed');

            const data = await res.json();
            if (data.correct) {

                setResult(data);
                setScore(data.score);
                topAnswersSeen = data.topAnswers;
                console.log(data.gotTopAnswer)
                if (data.gotTopAnswer == 0)//didn't get a top answer
                {
                    setPopupText(answer.toUpperCase() + " scored " + data.score + " points!");
                }
                else
                {
                    if (data.newTopAnswer) {
                        setPopupText("You found the new #"+data.gotTopAnswer+" top answer!");
                    } else {
                        setPopupText("You found the #"+data.gotTopAnswer+" top answer!");
                    }
                }
                setPopupArray(data.topAnswers);
                setPopupOpen(true);
            }
            else {
                setIncorrect(true);
                setTimeout(() => {
                    setIncorrect(false);
                }, 1000);
            }

            previouslyGivenAnswers.push(answer);
        } catch (err) {
            console.error(err);
            setPopupText("Something went wrong when submitting. Please try again.");
            setPopupOpen(true);
        } finally {
            setSubmitting(false);
        }
    };


    return (
        <div className={"quiz-question-container"}>
            <div className={"quiz-question-text"}>
                {questionText}
            </div>
            <ScrabbleInput
                onChange={inputChanged}
                x2Location={x2Location}
                x3Location={x3Location}
                style={{width: "700px"}}
            ></ScrabbleInput>
            <div onClick={handleSubmit} className={"submit-button"}>
                Submit
            </div>

            {popupOpen && <Popup text={popupText} array={popupArray} x2Location={x2Location} x3Location={x3Location} onClose={() => setPopupOpen(false)}></Popup>}
            {incorrect && <div className={"incorrect-popup"}>Incorrect</div>}
        </div>
    )
}