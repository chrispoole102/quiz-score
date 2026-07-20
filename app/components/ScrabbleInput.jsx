'use client'
import {useRef, useState} from "react"
import "../css/ScrabbleInput.css"
import letterscores from "../json/letterscores.json"
import ScrabbleWordDisplay from "@/app/components/ScrabbleWordDisplay";
export default function ScrabbleInput({onChange, style, x2Location, x3Location}) {

    const MAX_LETTERS = 10;

    const hiddenInput = useRef(null);

    const [word, setWord] = useState("")

    const inputChangeOverride = function(event) {
        event.target.value = event.target.value.slice(0, MAX_LETTERS);
        onChange(event.target.value);
        setWord(event.target.value);
    }


    return (
        <div className={"scrabble-input-container"} tabIndex={-1} style={style}>
            <input
                className={"hidden-input"}
                ref={hiddenInput}
                inputMode={"text"}
                autoCapitalize={"characters"}
                autoComplete={'off'}
                onChange={inputChangeOverride}
                spellCheck={false}
            />
            <ScrabbleWordDisplay word={word} x2Location={x2Location} x3Location={x3Location}></ScrabbleWordDisplay>

        </div>
    )
}