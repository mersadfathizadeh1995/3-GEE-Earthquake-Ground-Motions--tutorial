const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Mock DOM environment
const mockFbs = {};
const createMockElement = () => ({
    addEventListener: () => {},
    classList: {
        toggle: () => {},
        remove: (...args) => {},
        add: (...args) => {},
        contains: () => false
    },
    appendChild: () => {},
    querySelectorAll: () => [],
    querySelector: () => null,
    style: {},
    dataset: {}
});

global.window = global;
global.document = {
    addEventListener: (event, cb) => {
        if (event === 'DOMContentLoaded') {
            cb();
        }
    },
    querySelectorAll: (selector) => {
        if (selector === '.slide') return [
            { ...createMockElement(), id: 'slide1', dataset: { title: 'Slide 1' } }
        ];
        return [];
    },
    getElementById: (id) => {
        if (id.startsWith('fb-')) return mockFbs[id] || (mockFbs[id] = { innerHTML: '' });
        return createMockElement();
    },
    createElement: () => createMockElement(),
    scrollTo: () => {}
};
global.Chart = class {
    constructor() {}
    update() {}
};

// Load app.js
const appCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
eval(appCode);

test('window.quiz handles correct answer correctly', (t) => {
    const id = 'q1';
    const fb = document.getElementById('fb-' + id);
    fb.innerHTML = '';

    const sibling1 = {
        classList: {
            remove: (...args) => args.forEach(c => sibling1.classes.delete(c)),
            add: (c) => sibling1.classes.add(c)
        },
        classes: new Set(['ok'])
    };
    const sibling2 = {
        classList: {
            remove: (...args) => args.forEach(c => sibling2.classes.delete(c)),
            add: (c) => sibling2.classes.add(c)
        },
        classes: new Set(['no'])
    };
    const btn = {
        parentElement: {
            querySelectorAll: () => [sibling1, sibling2, btn]
        },
        classList: {
            remove: (...args) => args.forEach(c => btn.classes.delete(c)),
            add: (c) => btn.classes.add(c)
        },
        classes: new Set()
    };

    window.quiz(btn, true, id);

    assert.strictEqual(sibling1.classes.has('ok'), false, 'Sibling 1 should have ok class removed');
    assert.strictEqual(sibling1.classes.has('no'), false, 'Sibling 1 should have no class removed');
    assert.strictEqual(btn.classes.has('ok'), true, 'Button should have ok class added');
    assert.match(fb.innerHTML, /✓/, 'Feedback should contain a checkmark');
    assert.match(fb.innerHTML, /The earth acts as a low-pass filter/, 'Feedback should contain correct answer text');
});

test('window.quiz handles incorrect answer correctly', (t) => {
    const id = 'q1';
    const fb = document.getElementById('fb-' + id);
    fb.innerHTML = '';

    const btn = {
        parentElement: {
            querySelectorAll: () => [btn]
        },
        classList: {
            remove: (...args) => args.forEach(c => btn.classes.delete(c)),
            add: (c) => btn.classes.add(c)
        },
        classes: new Set()
    };

    window.quiz(btn, false, id);

    assert.strictEqual(btn.classes.has('no'), true, 'Button should have no class added');
    assert.match(fb.innerHTML, /✗ Try again!/, 'Feedback should contain an X and Try again message');
});

test('window.quiz uses correct answer from answers object based on id', (t) => {
    const id = 'q2';
    const fb = document.getElementById('fb-' + id);

    const btn = {
        parentElement: {
            querySelectorAll: () => [btn]
        },
        classList: {
            remove: (...args) => {},
            add: (c) => {}
        }
    };

    window.quiz(btn, true, id);

    assert.match(fb.innerHTML, /Ia accounts for ALL cycles of motion/, 'Feedback should contain text for q2');
});
