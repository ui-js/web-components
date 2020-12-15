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
    }

    /**
     * Declare that an attribute should be reflected as a property
     */
    reflectStringAttribute(attrName: string, propName = attrName): void {
        // Attributes should be all lower case, kebab-case.
        console.assert(attrName.toLowerCase() === attrName);
        Object.defineProperty(this, propName, {
            enumerable: true,
            get(): string {
                return this.getAttribute(attrName);
            },
            set(value: string) {
                this.setAttribute(attrName, value);
            },
        });
    }
    /**
     * Declare that an attribute should be reflected as a property
     */
    reflectBooleanAttribute(attrName: string, propName = attrName): void {
        // Attributes should be all lower case, kebab-case.
        console.assert(attrName.toLowerCase() === attrName);
        Object.defineProperty(this, propName, {
            enumerable: true,
            get(): boolean {
                return this.hasAttribute(attrName);
            },
            set(value: boolean) {
                if (value) {
                    this.setAttribute(attrName, '');
                } else {
                    this.removeAttribute(attrName);
                }
            },
        });
    }

    /**
     * Declare that an attribute should be reflected as a property
     */
    reflectEnumAttribute(
        attrName: string,
        attrValues: string[],
        propName = attrName
    ): void {
        // Attributes should be all lower case, kebab-case.
        console.assert(attrName.toLowerCase() === attrName);
        Object.defineProperty(this, propName, {
            enumerable: true,
            get(): string {
                let value: string;
                attrValues.forEach((x) => {
                    if (this.hasAttribute(x)) {
                        console.assert(
                            typeof value === 'undefined',
                            `inconsistent ${attrName} attributes on ${this}`
                        );
                        value = x;
                    }
                });
                if (typeof value === 'string') return value;
                return this.getAttribute(attrName);
            },
            set(value: string) {
                this.setAttribute(attrName, value);
                this.setAttribute(value, '');
                attrValues.forEach((x) => {
                    if (x !== value) {
                        this.removeAttribute(x);
                    }
                });
            },
        });
    }

    reflectBooleanAttributes(
        attrNames: (string | [attrName: string, propName: string])[]
    ): void {
        attrNames.forEach((x) => {
            if (typeof x === 'string') {
                this.reflectBooleanAttribute(x);
            } else {
                this.reflectBooleanAttribute(x[0], x[1]);
            }
        });
    }
    reflectStringAttributes(
        attrNames: (string | [attrName: string, propName: string])[]
    ): void {
        attrNames.forEach((x) => {
            if (typeof x === 'string') {
                this.reflectStringAttribute(x);
            } else {
                this.reflectStringAttribute(x[0], x[1]);
            }
        });
    }

    get computedDir(): 'rtl' | 'ltr' {
        return getComputedDir(this);
    }

    /**
     * @internal
     */
    connectedCallback(): void {
        return;
    }
    /**
     * @internal
     */
    disconnectedCallback(): void {
        return;
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

    /** If there is an embedded <style> tag in the slot
     *  "import" it in the shadow dom
     */
    importStyle(): void {
        if (this.importedStyle) {
            const style = document.createElement('style');
            style.textContent = this.importedStyle;
            this.shadowRoot.append(style);
        }
    }
}

/**
 * An element can have multiple 'parts', which function as a kind of
 * parallel classList.
 *
 * Add a part name to the part list of this element.
 */
export function addPart(el: HTMLElement, part: string): void {
    if (!el) return;
    const current = el.getAttribute('part') ?? '';
    if (!current.includes(part)) {
        el.setAttribute('part', `${current} ${part}`);
    }
}

/**
 * Remove a part name from the part list of this element.
 */
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

export function getComputedDir(el: HTMLElement): 'ltr' | 'rtl' {
    if (el.dir && el.dir !== 'auto') return el.dir as 'ltr' | 'rtl';
    if (el.parentElement) return getComputedDir(el.parentElement);
    return 'ltr';
}

export function getOppositeEdge(
    bounds: DOMRectReadOnly,
    position: 'leading' | 'trailing' | 'left' | 'end',
    direction: 'ltr' | 'rtl'
): number {
    if (
        position === 'left' ||
        (position === 'leading' && direction === 'ltr') ||
        (position === 'trailing' && direction === 'rtl')
    ) {
        return bounds.right;
    }
    return bounds.left;
}

export function getEdge(
    bounds: DOMRectReadOnly,
    position: 'leading' | 'trailing' | 'left' | 'end',
    direction: 'ltr' | 'rtl'
): number {
    if (
        position === 'left' ||
        (position === 'leading' && direction === 'ltr') ||
        (position === 'trailing' && direction === 'rtl')
    ) {
        return bounds.left;
    }
    return bounds.right;
}
