'use strict';

const importLazy = require('import-lazy')(require);

const fs = require('fs');
const path = require('path');
const yaml = importLazy('js-yaml');
const postcss = importLazy('postcss');
const cssDeclarationSorter = importLazy('css-declaration-sorter');
const scssSyntax = importLazy('postcss-scss');
const { CompositeDisposable } = require('atom');

// Use the same property order as sass-lint.
const sortOrderURL = 'https://raw.githubusercontent.com/sasstools/sass-lint/develop/lib/config/property-sort-orders/concentric.yml';

const syntaxes = {
  'CSS': undefined,
  'SCSS': scssSyntax,
};

let subs;
let sorterPromise;

module.exports = {
  activate: function () {
    subs = new CompositeDisposable();
    subs.add(atom.workspace.observeTextEditors(observeTextEditors));

    sorterPromise = global
      .fetch(sortOrderURL)
      .then(res => res.text())
      .then(yaml.safeLoad)
      .then(({ order }) => {
        // Extra properties are not included by sass-lint,
        // but they still need to be ordered properly.
        const extras = require('./extras');
        extras.forEach(extra => {
          // Insert extra[0] right before extra[1].
          const idx = order.indexOf(extra[1]);
          if (idx >= 0) order.splice(idx, 0, extra[0]);
        });

        // "css-declaration-sorter" expects a JSON file path.
        let orderPath = path.join(__dirname, 'order.json');
        fs.writeFileSync(orderPath, JSON.stringify(order, null, 2));
        return orderPath;
      })
      .then(orderPath => postcss([
        cssDeclarationSorter({
          customOrder: orderPath,
        })
      ]));
  },
  deactivate: function () {
    sorterPromise = null;
    subs.dispose();
  }
};

function observeTextEditors (editor) {
  subs.add(editor.getBuffer().onWillSave(function () {
    const syntax = syntaxes[editor.getGrammar().name];
    syntax && sorterPromise.then(sorter => {
      return sorter.process(editor.getText(), {
        from: undefined,
        syntax,
      });
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
  }));
}
