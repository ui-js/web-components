export type KeyboardModifiers = {
    alt: boolean;
    control: boolean;
    shift: boolean;
    meta: boolean;
};

// We use a class to encapsulate the state that needs to be tracked and,
// more importantly, to avoid memory leaks by using the `handleEvent()` hook
// to ensure proper disposal of event handlers
export class LongPressDetector {
    private onLongPress: () => void;
    private startPoint: [x: number, y: number];
    private lastPoint: [x: number, y: number];

    private timer: number;

    static DELAY = 300; // in ms
    constructor(triggerEvent: Event, onLongPress: () => void) {
        this.onLongPress = onLongPress;
        this.startPoint = eventLocation(triggerEvent);
        this.lastPoint = this.startPoint;

        this.timer = setTimeout(() => {
            this.dispose();
            if (distance(this.lastPoint, this.startPoint) < 10) {
                this.onLongPress();
            }
        }, LongPressDetector.DELAY);
        ['pointermove', 'pointerup', 'pointercancel'].forEach((x) =>
            window.addEventListener(x, this, { passive: true })
        );
    }

    dispose(): void {
        clearTimeout(this.timer);
        this.timer = undefined;

        ['pointermove', 'pointerup', 'pointercancel'].forEach((x) =>
            window.removeEventListener(x, this)
        );
    }

    handleEvent(event: Event): void {
        if (event.type === 'pointerup') {
            this.dispose();

            event.stopPropagation();
        } else if (event.type === 'pointermove') {
            this.lastPoint = eventLocation(event);

            event.stopPropagation();
        } else if (event.type === 'pointercancel') {
            this.dispose();
            event.stopPropagation();
        }
    }
}

function distance(
    p1: [x: number, y: number],
    p2: [x: number, y: number]
): number {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    return Math.sqrt(dx * dx + dy * dy);
}

export function eventLocation(evt: Event): [x: number, y: number] {
    if (evt instanceof MouseEvent) {
        return [evt.clientX, evt.clientY];
    } else if (evt instanceof TouchEvent) {
        const result = Array.from(evt.touches).reduce(
            (acc, x) => [acc[0] + x.clientX, acc[1] + x.clientY],
            [0, 0]
        );
        const l = evt.touches.length;
        return [result[0] / l, result[1] / l];
    }

    return undefined;
}

export function eventPointerCount(evt: Event): number {
    if (evt instanceof MouseEvent) {
        return 1;
    } else if (evt instanceof TouchEvent) {
        return evt.touches.length;
    }
    return 0;
}
/**
 * When the potential start of a long press event (`pointerdown`)
 * event is detected, this function will invoke the `fn` callback if the
 * user performs a long press.
 */
export function onLongPress(triggerEvent: Event, fn: () => void): void {
    new LongPressDetector(triggerEvent, fn);
}

export function keyboardModifiersFromEvent(ev: Event): KeyboardModifiers {
    const result = {
        alt: false,
        control: false,
        shift: false,
        meta: false,
    };
    if (
        ev instanceof MouseEvent ||
        ev instanceof TouchEvent ||
        ev instanceof KeyboardEvent
    ) {
        if (ev.altKey) result.alt = true;
        if (ev.ctrlKey) result.control = true;
        if (ev.metaKey) result.meta = true;
        if (ev.shiftKey) result.shift = true;
    }
    return result;
}

export function equalKeyboardModifiers(
    a: KeyboardModifiers,
    b: KeyboardModifiers
): boolean {
    if ((!a && b) || (a && !b)) return false;
    return (
        a.alt === b.alt &&
        a.control === b.control &&
        a.shift === b.shift &&
        a.meta === b.meta
    );
}

const PRINTABLE_KEYCODE = [
    'Backquote', // Japanese keyboard: hankaku/zenkaku/kanji key, which is non-printable
    'Digit0',
    'Digit1',
    'Digit2',
    'Digit3',
    'Digit4',
    'Digit5',
    'Digit6',
    'Digit7',
    'Digit8',
    'Digit9',
    'Minus',
    'Equal',
    'IntlYen', // Japanese Keyboard. Russian keyboard: \/

    'KeyQ', // AZERTY keyboard: labeled 'a'
    'KeyW', // AZERTY keyboard: labeled 'z'
    'KeyE',
    'KeyR',
    'KeyT',
    'KeyY', // QWERTZ keyboard: labeled 'z'
    'KeyU',
    'KeyI',
    'KeyO',
    'KeyP',
    'BracketLeft',
    'BracketRight',
    'Backslash', // May be labeled #~ on UK 102 keyboard
    'KeyA', // AZERTY keyboard: labeled 'q'
    'KeyS',
    'KeyD',
    'KeyF',
    'KeyG',
    'KeyH',
    'KeyJ',
    'KeyK',
    'KeyL',
    'Semicolon',
    'Quote',
    'IntlBackslash', // QWERTZ keyboard '><'
    'KeyZ', // AZERTY: 'w', QWERTZ: 'y'
    'KeyX',
    'KeyC',
    'KeyV',
    'KeyB',
    'KeyN',
    'KeyM',
    'Comma',
    'Period',
    'Slash',
    'IntlRo', // Japanse keyboard '\ろ'

    'Space',

    'Numpad0',
    'Numpad1',
    'Numpad2',
    'Numpad3',
    'Numpad4',
    'Numpad5',
    'Numpad6',
    'Numpad7',
    'Numpad8',
    'Numpad9',
    'NumpadAdd',
    'NumpadComma',
    'NumpadDecimal',
    'NumpadDivide',
    'NumpadEqual',
    'NumpadHash',
    'NumpadMultiply',
    'NumpadParenLeft',
    'NumpadParenRight',
    'NumpadStar',
    'NumpadSubstract',
];

export function mightProducePrintableCharacter(evt: KeyboardEvent): boolean {
    if (evt.ctrlKey || evt.metaKey) {
        // ignore ctrl/cmd-combination but not shift/alt-combinations
        return false;
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
    if (evt.key === 'Dead') return false;

    // When issued via a composition, the `code` field is empty
    if (evt.code === '') return true;

    return PRINTABLE_KEYCODE.indexOf(evt.code) >= 0;
}
