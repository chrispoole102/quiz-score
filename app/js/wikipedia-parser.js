// lib/wikipedia-parse.js
//
// Server-side (Node) version — uses jsdom instead of the browser's
// DOMParser, so this can run inside a Next.js API route / server cache.

import { JSDOM } from 'jsdom';

/**
 * Turn a Wikipedia URL like
 *   https://en.wikipedia.org/wiki/List_of_dog_breeds
 * into { lang: 'en', title: 'List_of_dog_breeds' }
 */
function parseWikipediaUrl(url) {
    const u = new URL(url);
    const lang = u.hostname.split('.')[0]; // "en" from en.wikipedia.org
    const title = decodeURIComponent(u.pathname.replace(/^\/wiki\//, ''));
    return { lang, title };
}

/**
 * Extract plain-text item names from a Wikipedia "List of ..." article's HTML.
 * Handles the two common layouts:
 *   1. Bullet lists (<ul><li>Name<sup>[ref]</sup></li></ul>) — most common
 *   2. Wikitables (<table class="wikitable">...) — used by some list pages
 *
 * @param {string} html - raw HTML from the article's mw-parser-output
 * @param {string} type
 * @param {int} column
 * @returns {string[]} array of item names, deduped, in document order
 */
function extractListItems(html, type, column) {
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const root = doc.querySelector('.mw-parser-output') || doc.body;

    // Strip elements that are never actual list content
    root
        .querySelectorAll(
            '.reflist, .references, sup.reference, .navbox, .infobox, ' +
            '.toc, .mw-editsection, .hatnote, .thumb, style, script, ' +
            '.sistersitebox, table.metadata, .ambox'
        )
        .forEach((el) => el.remove());

    const clean = (text) =>
        text
            .replace(/\[\d+\]/g, '') // stray [1] citation markers left as text
            .replace(/\s+/g, ' ')
            .trim();

    const collect = (names) => {
        const out = [];
        const seen = new Set();
        for (let name of names) {
            name = clean(name);
            if (name && !seen.has(name)) {
                seen.add(name);
                out.push(name);
            }
        }
        return out;
    };

    let final = [];

    // --- Strategy 1: wikitables ---
    if (type === 'table' || type === 'both') {
        const tableNames = [];
        root.querySelectorAll('table.wikitable').forEach((table) => {
            const rows = Array.from(table.querySelectorAll('tr'));
            // tracks { colIndex: remainingRowspan } carried from prior rows
            const carry = {};

            rows.forEach((tr, i) => {
                const cells = Array.from(tr.querySelectorAll('td, th'));
                if (i === 0) {
                    // still need to seed carry in case header itself has rowspans (rare)
                    return;
                }

                // Build the logical row: walk physical cells, but insert
                // carried-over placeholders wherever a previous rowspan
                // still claims that column.
                const logicalCells = [];
                let physicalIdx = 0;
                let col = 0;
                while (physicalIdx < cells.length || Object.keys(carry).length) {
                    if (carry[col] && carry[col].remaining > 0) {
                        logicalCells[col] = carry[col].cell;
                        carry[col].remaining--;
                        if (carry[col].remaining === 0) delete carry[col];
                        col++;
                        continue;
                    }
                    const cell = cells[physicalIdx];
                    if (!cell) break;
                    logicalCells[col] = cell;
                    const span = parseInt(cell.getAttribute('rowspan') || '1', 10);
                    if (span > 1) carry[col] = { cell, remaining: span - 1 };
                    physicalIdx++;
                    col++;
                }

                const targetCell = logicalCells[column - 1];
                if (!targetCell) return;
                const link = targetCell.querySelector('a');
                tableNames.push(link ? link.textContent : targetCell.textContent);
            });
        });
        final.push(...collect(tableNames));
    }

    // --- Strategy 2: bullet lists ---
    if (type === 'bullets' || type === 'both') {
        const listNames = [];
        root.querySelectorAll('li').forEach((li) => {
            if (li.closest('table')) return; // skip table-nested lis
            if (li.closest('.navbox, .reflist, .references')) return;

            const link = li.querySelector('a');
            if (link) {
                listNames.push(link.textContent);
            } else {
                const clone = li.cloneNode(true);
                clone.querySelectorAll('ul, ol').forEach((el) => el.remove());
                listNames.push(clone.textContent);
            }
        });
        final.push(...collect(listNames))
    }
    console.log(final.slice(0, 20))
    return final;
}

/**
 * Fetch every item name from a Wikipedia "List of ..." article.
 * Runs server-side — CORS doesn't apply to server-to-server fetches,
 * so `origin=*` isn't strictly needed, but it's harmless to leave in.
 *
 * @param {string} pageUrl - full Wikipedia article URL
 * @param {string} type
 * @param {int|null} column
 * @param {string[]} extraAnswers
 * @returns {Promise<string[]>}
 */
export async function getWikipediaListItems(pageUrl, type, column, extraAnswers) {
    const { lang, title } = parseWikipediaUrl(pageUrl);

    const apiUrl =
        `https://${lang}.wikipedia.org/w/api.php?` +
        new URLSearchParams({
            action: 'parse',
            page: title,
            format: 'json',
            prop: 'text',
            formatversion: '2',
            redirects: 'true',
            origin: '*',
        });

    const res = await fetch(apiUrl);

    if (!res.ok) {
        throw new Error(`Wikipedia API request failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    if (data.error) {
        throw new Error(`Wikipedia API error: ${data.error.info || data.error.code}`);
    }

    let items = extractListItems(data.parse.text, type, column)
    if (extraAnswers)
        items.push(...extraAnswers)
    return items;
}
