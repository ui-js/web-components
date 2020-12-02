import { UIContextMenuElement } from '../context-menu-element';

describe('contextual-menu', () => {
    it('renders a simple contextual menu with markup', async () => {
        const el2 = window.document.createElement('div');
        window.document.body.appendChild(el2);
        el2.innerHTML = 'test me';

        const container = window.document.createElement('div');
        window.document.body.appendChild(container);
        container.innerHTML = `<ui-context-menu><script type='application/json'>
        [
            { "label": "Cut"},
            { "label": "Copy"},
            { "label": "Paste"},
            { 
                "label": "Not Visible", 
                "visible": false 
            },
            {
                "label": "Paste as Graphic",
                "disabled": true
            },
            { "type": "separator" },
            {
                "label": "Fence",
                "submenu": [
                    {"label": "Brackets" },
                    {"label": "Square Brackets" },
                    {"label": "Braces" }
                ]
            },
            { "type": "separator" },
            { "label": "Insert Row Before" },
            { "label": "Insert Row After" },
            { "label": "Insert Column Before" },
            { "label": "Insert Column After" }
        ]
    </script>
</ui-context-menu>`;

        const el = window.document.body.getElementsByTagName(
            'ui-context-menu'
        )[0] as UIContextMenuElement;

        // The following expect() is important.
        // Without it, the './context-menu-element' module get stripped
        // (and therefore the <ui-context-menu> tag fails)
        // as the "as UIContextMenuElement" statement is not sufficient to
        // keep a reference to the module.
        expect(el instanceof UIContextMenuElement).toBeTruthy();

        el.show();
        expect(el.shadowRoot.innerHTML).toMatchSnapshot();
        el.hide();
        expect(el.shadowRoot.innerHTML).toMatchSnapshot();
    });
});
