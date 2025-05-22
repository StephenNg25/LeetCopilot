(function () {
    const editor = window.monaco?.editor?.getEditors?.()[0];
    if (!editor) return;
    const model = editor.getModel();
    const fullRange = model.getFullModelRange();
    editor.setSelection(fullRange);
    editor.focus();
    console.log('[Inject] Monaco select-all from external script executed.');
  })();
  