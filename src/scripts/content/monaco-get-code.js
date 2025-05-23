(function () {
    const editor = window.monaco?.editor?.getEditors?.()[0];
    if (!editor) {
      window.postMessage({ type: 'EDITOR_CONTENT', content: '' }, '*');
      return;
    }
    const model = editor.getModel();
    if (!model) {
      window.postMessage({ type: 'EDITOR_CONTENT', content: '' }, '*');
      return;
    }
    const fullText = model.getValue();
    window.postMessage({ type: 'EDITOR_CONTENT', content: fullText }, '*');
    console.log('[Inject] Monaco get-code from external script executed. Content:', fullText);
  })();