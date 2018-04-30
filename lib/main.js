'use strict';

const importLazy = require('import-lazy')(require);

const fs = require('fs');
const path = require('path');
const yaml = importLazy('js-yaml');
const postcss = importLazy('postcss');
const cssDeclarationSorter = importLazy('css-declaration-sorter');
const scssSyntax = importLazy('postcss-scss');

// Use the same property order as sass-lint.
const sortOrderURL = 'https://raw.githubusercontent.com/sasstools/sass-lint/develop/lib/config/property-sort-orders/concentric.yml';

const syntaxes = {
  'CSS': undefined,
  'SCSS': scssSyntax,
};

let editorObserver;
let sorterPromise;

module.exports = {
  activate: function () {
    editorObserver = atom.workspace.observeTextEditors(handleEvents);
    sorterPromise = global
      .fetch(sortOrderURL)
      .then(res => res.text())
      .then(yaml.safeLoad)
      .then(order => {
        // "css-declaration-sorter" expects a JSON file path.
        let orderPath = path.join(__dirname, 'order.json');
        fs.writeFileSync(orderPath, JSON.stringify(order, null, 2));
        return orderPath;
      })
      .then(orderPath => postcss([
        cssDeclarationSorter({ customOrder: orderPath })
      ]));
  },
  deactivate: function () {
    if (editorObserver) {
      editorObserver.dispose();
    }
  }
};

function handleEvents (editor) {
  editor.getBuffer().onWillSave(function () {
    const syntax = syntaxes[editor.getGrammar().name];
    syntax && sorterPromise.then(sorter => {
      return sorter.process(editor.getText(), { syntax });
    }).then(function (res) {
      const pos = editor.getCursorScreenPosition();
      editor.setText(res.content);
      editor.setCursorScreenPosition(pos);
    }).catch(function (err) {
      console.error(err);
      atom.notifications.addError('CSS property sort failed.', {
        icon: 'zap',
        detail: err,
        dismissable: true,
      });
    });
  });
}
