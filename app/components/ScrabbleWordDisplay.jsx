import {useEffect, useState} from "react";
import letterscores from "@/app/json/letterscores.json";
import "../css/ScrabbleWordDisplay.css"
export default function ScrabbleWordDisplay({word, x2Location, x3Location}) {
    const MAX_LETTERS = 10;
    const [slots, setSlots] = useState(new Array(MAX_LETTERS).fill(null))
    useEffect(() => {

        let newArray = [];
        for (let i = 0; i < MAX_LETTERS; i++) {
            newArray[i] = word[i] ?? null;
        }
        setSlots(newArray);
    }, [word])

    const getLetterScore = function (letter) {
        if (letterscores[letter.toLowerCase()])
            return letterscores[letter.toLowerCase()];
        else
            return letterscores["other"];
    }

    return (
        <div className={"scrabble-word-container"}>
            {slots.map((letter, i) =>
                <div className={"letter-position"} key={i}>
                    {
                        letter ? <div className={"letter"}>
                                <div className={"letter-text"}>{letter.toUpperCase()}</div>
                                <div className={"letter-score"}>{getLetterScore(letter)}</div>
                            </div> :
                            <div className={"letter-space"}></div>
                    }
                    {i == x2Location && <div className={"score-mult"}>x2</div>}
                    {i == x3Location && <div className={"score-mult"}>x3</div>}
                </div>
            )}
        </div>
    )
}