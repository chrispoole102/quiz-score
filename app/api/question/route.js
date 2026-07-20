// app/api/question/route.js
import { NextResponse } from 'next/server';
import { getTodaysQuestion } from '../../js/answer-cache';

export async function GET() {
    const question = getTodaysQuestion();

    // Only send what the frontend needs to display — not the answer list
    return NextResponse.json({
        text: question.text,
        x2: question.x2,
        x3: question.x3
    });
}