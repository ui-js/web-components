export const MENU_TEMPLATE = document.createElement('template');
MENU_TEMPLATE.innerHTML = `<ul></ul><slot></slot>`;
export const MENU_STYLE = document.createElement('template');
MENU_STYLE.innerHTML = `<style>
*,
::before,
::after {
    box-sizing: border-box;
}
:host {
    display: none;
    color-scheme: light dark;
    -webkit-user-select: none;  /* Important: Safari iOS doesn't respect user-select */
    user-select: none;
    cursor: default;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: rgba(0 0 0 0);
    --active-label-color: #fff;
    --label-color: #121212;
    --menu-bg: #e2e2e2;
    --active-bg: #5898ff;
    --active-bg-dimmed: #c5c5c5;
}
:host([hidden]) {
    display: none;
}
:host([disabled]) {
    pointer-events: none;
    opacity:  .5;
}
:host(:focus), :host(:focus-within) {
    outline: Highlight auto 1px;    /* For Firefox */
    outline: -webkit-focus-ring-color auto 1px;
}
:host div.scrim {
    position: fixed;
    contain: content;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    outline: none;
    background: transparent;
}
:host slot {
    display: none;
}
ul.menu-container {
    position: absolute;
    width: auto;
    height: auto;
    z-index: 10000;
    border-radius: 8px;
    background: var(--menu-bg);
    box-shadow: 0 0 2px rgba(0, 0, 0, .5), 0 0 20px rgba(0, 0, 0, .2);

    list-style: none;
    padding: 6px 0 6px 0;
    margin: 0;
    user-select: none;
    cursor: default;

    color: var(--label-color);
    font-weight: normal;
    font-style: normal;
    text-shadow: none;
    text-transform: none;
    letter-spacing: 0;
    outline: none;
    opacity: 1;
}
ul.menu-container > li {
    display: flex;
    flex-flow: row;
    align-items: center;
    padding: 1px 7px 1px 7px;
    margin-top: 0;
    margin-left: 6px;
    margin-right: 6px;
    border-radius: 4px;
    white-space: nowrap;
    position: relative;
    outline: none;
    fill: currentColor;
    user-select: none;
    cursor: default;
    text-align: left;
    color: inherit;

    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    font-size: 13px;
    line-height: 16px;
    letter-spacing: 0.007em;
}
ul.menu-container > li > .label {
    appearance: none;
    background: none;
    outline: none;
    width: 100%;
    margin: 0;
    padding: 1px 2px 1px 1px;
    overflow: visible;
    border: 1px solid transparent;
    white-space: nowrap;
}

ul.menu-container > li > .label.indent {
    margin-left: 12px;
}
ul.menu-container > li[role=divider] {
    border-bottom: 1px solid #c7c7c7;
    border-radius: 0;
    padding: 0;
    margin-left: 15px;
    margin-right: 15px;
    padding-top: 5px;
    margin-bottom: 5px;
    width: calc(100% - 30px);
}
ul.menu-container > li[aria-disabled=true] {
    opacity: .5;
}

ul.menu-container > li.active {
    background: var(--active-bg);
    background: -apple-system-control-accent;
    color: var(--active-label-color);
}

ul.menu-container > li.active.is-submenu-open {
    background: var(--active-bg-dimmed);
    color: inherit;
}

ul.menu-container > li[aria-haspopup=true]>.label {
     padding-right: 0;
}

.right-chevron {
    margin-left: 24px;
    width: 10px;
    height: 10px;
    margin-bottom: 4px;
}
.checkmark {
    margin-right: -11px;
    margin-left: -4px;
    margin-top : 2px;
    width: 16px;
    height: 16px;
}

ul.menu-container > li[aria-haspopup=true].active::after {
    color: white;
}
@media (prefers-color-scheme: dark) {
    :host {
        --label-color: #fff;
        --active-label-color: #000;
        --menu-bg: #525252;
        --active-bg: #5898ff;
        --active-bg-dimmed: #5c5c5;
    }
}
</style>`;
