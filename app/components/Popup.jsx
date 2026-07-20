import "../css/Popup.css"
import scoreAnswer from "@/app/js/score-answer";
import ScrabbleWordDisplay from "@/app/components/ScrabbleWordDisplay";
export default function Popup({text, array, onClose, x2Location, x3Location}) {

    return (
        <div className={"popup-container"}>
            {array.length > 0 && <h2 className={"popup-header"}>Great Answer!</h2>}
            <div className={"popup-close"} onClick={onClose}><div>X</div></div>
            <div className={"popup-text"}>{text}</div>
            {array.length > 0 && <div className={"popup-list-header"}>Top Answers</div>}

            <div className={"popup-list"}>
                {array.map((word, index) => {
                    return <span key={word} className={"popup-list-item"}>
                        <ScrabbleWordDisplay word={word} x3Location={x3Location} x2Location={x2Location}></ScrabbleWordDisplay>
                        <span className={"score-text"}>{"- "+scoreAnswer(word, x2Location, x3Location)}</span>
                    </span>
                })}
            </div>
            {array.length > 0 && <div className={"popup-close-button"} onClick={onClose}><div>Submit Another Word</div></div>}
        </div>
    )
}