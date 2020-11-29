// import './contextual-menu-element';
import { UIContextualMenuElement } from '../contextual-menu-element';

describe('contextual-menu', () => {
    it('renders a simple contextual menu with markup', async () => {
        const el2 = window.document.createElement('div');
        window.document.body.appendChild(el2);
        el2.innerHTML = 'test me';

        const container = window.document.createElement('div');
        window.document.body.appendChild(container);
        container.innerHTML = `<ui-contextual-menu><script type='application/json'>
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
                "enabled": false
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
</ui-contextual-menu>`;

        const el = window.document.body.getElementsByTagName(
            'ui-contextual-menu'
        )[0] as UIContextualMenuElement;

        // The following expect() is important.
        // Without it, the './contextual-menu-element' module get stripped
        // (and therefore the <ui-contextual-menu> tag fails)
        // as the "as UIContextualMenuElement" statement is not sufficient to
        // keep a reference to the module.
        expect(el instanceof UIContextualMenuElement).toBeTruthy();

        el.show();
        expect(el.shadowRoot.innerHTML).toMatchSnapshot();
        el.hide();
        expect(el.shadowRoot.innerHTML).toMatchSnapshot();
    });
});
