/**
 * @internal
 */
export class UIElement extends HTMLElement {
    private _json: any;
    private _style: string;

    constructor(options?: {
        template: string | HTMLTemplateElement;
        style: string | HTMLTemplateElement;
    }) {
        super();

        this.attachShadow({ mode: 'open' });

        if (options?.template instanceof HTMLTemplateElement) {
            this.shadowRoot.appendChild(
                options.template.content.cloneNode(true)
            );
        } else if (typeof options?.template === 'string') {
            this.shadowRoot.innerHTML = options.template;
        }

        if (options?.style instanceof HTMLTemplateElement) {
            this.shadowRoot.appendChild(options.style.content.cloneNode(true));
        } else if (typeof options?.style === 'string') {
            const style = document.createElement('style');
            style.textContent = options.style;
            this.shadowRoot.append(style);
        }

        // If there is an embedded <style> tag in the slot
        // "import" it in the shadow dom
        if (this.importedStyle) {
            const style = document.createElement('style');
            style.textContent = this.importedStyle;
            this.shadowRoot.append(style);
        }
    }

    /**
     * @internal
     */
    protected get json(): any {
        if (typeof this._json === 'undefined') {
            this._json = null;
            const json = this.shadowRoot
                .querySelector<HTMLSlotElement>('slot')
                .assignedElements()
                .filter(
                    (x) =>
                        x.tagName === 'SCRIPT' &&
                        x['type'] === 'application/json'
                )
                .map((x) => x.textContent)
                .join('');
            if (json) {
                try {
                    this._json = JSON.parse(json);
                } catch (e) {
                    // There was an error parsing the JSON.
                    // Display a helpful message.
                    const msg = e.toString();
                    const m = msg.match(/position ([0-9]+)/);
                    if (m) {
                        const index = parseInt(m[1]);
                        const extract = json.substring(
                            Math.max(index - 40, 0),
                            index
                        );
                        throw new Error(msg + '\n' + extract.trim());
                    } else {
                        throw e;
                    }
                }
            }
        }
        return this._json;
    }

    /**
     * @internal
     */
    protected get importedStyle(): any {
        if (typeof this._style === 'undefined') {
            this._style = this.shadowRoot
                .querySelector<HTMLSlotElement>('slot')
                .assignedElements()
                .filter((x) => x.tagName === 'STYLE')
                .map((x) => x.textContent)
                .join('');
        }
        return this._style;
    }
}

export function addPart(el: HTMLElement, part: string): void {
    if (!el) return;
    const current = el.getAttribute('part') ?? '';
    if (!current.includes(part)) {
        el.setAttribute('part', `${current} ${part}`);
    }
}

export function removePart(el: HTMLElement, part: string): void {
    if (!el) return;
    const current = el.getAttribute('part') ?? '';
    if (current.includes(part)) {
        el.setAttribute(
            'part',
            current.replace(new RegExp('\\bs*' + part + 's*\\b', 'g'), '')
        );
    }
}
