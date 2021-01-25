import { UIContextMenu } from '../context-menu-element';

describe('contextual-menu', () => {
  it('renders a simple contextual menu with markup', async () => {
    const element2 = window.document.createElement('div');
    window.document.body.append(element2);
    element2.innerHTML = 'test me';

    const container = window.document.createElement('div');
    window.document.body.append(container);
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
            { "type": "divider" },
            {
                "label": "Fence",
                "submenu": [
                    {"label": "Brackets" },
                    {"label": "Square Brackets" },
                    {"label": "Braces" }
                ]
            },
            { "type": "divider" },
            { "label": "Insert Row Before" },
            { "label": "Insert Row After" },
            { "label": "Insert Column Before" },
            { "label": "Insert Column After" }
        ]
    </script>
</ui-context-menu>`;

    const element = window.document.body.getElementsByTagName(
      'ui-context-menu'
    )[0] as UIContextMenu;

    // The following expect() is important.
    // Without it, the './context-menu-element' module get stripped
    // (and therefore the <ui-context-menu> tag fails)
    // as the "as UIContextMenu" statement is not sufficient to
    // keep a reference to the module.
    expect(element instanceof UIContextMenu).toBeTruthy();

    element.show();
    expect(element.shadowRoot?.innerHTML).toMatchSnapshot();
    element.hide();
    expect(element.shadowRoot?.innerHTML).toMatchSnapshot();
  });
});
