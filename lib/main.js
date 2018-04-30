'use strict';

const importLazy = require('import-lazy')(require);

const postcss = importLazy('postcss');
const cssDeclarationSorter = importLazy('css-declaration-sorter');
const scssSyntax = importLazy('postcss-scss');

const syntaxes = {
  'CSS': undefined,
  'SCSS': scssSyntax,
};

let editorObserver;

module.exports = {
  activate: function () {
    editorObserver = atom.workspace.observeTextEditors(handleEvents);
  },
  deactivate: function () {
    if (editorObserver) {
      editorObserver.dispose();
    }
  }
};

function sort (sortOrder) {
  const editor = atom.workspace.getActiveTextEditor();
  const syntax = syntaxes[editor.getGrammar().name];

  return postcss([cssDeclarationSorter({ order: sortOrder })])
    .process(editor.getText(), { syntax: syntax, from: undefined })
    .then(function (result) {
      const cursorPosition = editor.getCursorScreenPosition();
      editor.setText(result.content);
      editor.setCursorScreenPosition(cursorPosition);
    })
    .catch(function (error) {
      atom.notifications.addError('Sorting CSS parsing error.', {
        detail: error,
        icon: 'zap',
        dismissable: true,
      });
    });
}

function handleEvents (editor) {
  editor.getBuffer().onWillSave(function () {
    if (Object.keys(syntaxes).includes(editor.getGrammar().name)) {
      return sort('concentric-css');
    }
  });
}
