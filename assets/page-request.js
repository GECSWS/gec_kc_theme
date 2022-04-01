(function() {
  "use strict";

  // Submit organization form in the request page
  var requestOrganisationSelect = document.querySelector('#request-organization select');
  if (requestOrganisationSelect) {
    requestOrganisationSelect.addEventListener('change', function() {
      Util.closest(this, 'form').submit();
    });
  }

  // Do nothing if the form or comment textarea does not exist on the page
  var form = document.querySelector('form[data-form-type="comment"]');
  var textarea = document.getElementById('request_comment_body');
  if (!form || !textarea) {
    return;
  }

  // Do nothing if the Submit button does not exist on the page
  var submitButton = form.querySelector('input[type=submit]');
  if (!submitButton) {
    return;
  }

  var usesWysiwyg = textarea.dataset.helper === 'wysiwyg';
  var solvedButton = form.querySelector('button');
  var solvedCheckbox = form.querySelector('input[type="checkbox"]');

  /**
   * Returns true if a given string is empty.
   * @param s
   * @returns {boolean}
   */
  function isEmptyPlaintext(s) {
    return s.trim() === '';
  }

  /**
   * Returns true if a given HTML string is empty.
   * @param xml
   * @returns {boolean}
   */
  function isEmptyHtml(xml) {
    var doc = new DOMParser().parseFromString(`<_>${xml}</_>`, "text/xml");
    var img = doc.querySelector("img");
    return img === null && isEmptyPlaintext(doc.children[0].textContent);
  }

  var isEmpty = usesWysiwyg ? isEmptyHtml : isEmptyPlaintext;

  /**
   * Updates the Submit and Solved buttons based on the value of the textarea.
   *
   * @param value
   */
  function updateButtons(value) {
    submitButton.disabled = isEmpty(value);
    if (solvedButton) {
      var attr = 'data-solve-' + (isEmpty ? 'translation' : 'and-submit-translation');
      solvedButton.innerText = solvedButton.getAttribute(attr)
    }
  }

  /**
   * Solves the request.
   */
  function solveRequest() {
    solvedCheckbox.checked = true;
    submitButton.disabled = true;
    solvedButton.disabled = true;
    form.submit();
  }

  /**
   * Updates the Submit and Solved buttons when the textarea value changes.
   *
   * @param e
   */
  function onChange(e) {
    updateButtons(e.target.value);
  }

  textarea.addEventListener('input', onChange, false);

  if (solvedButton && solvedCheckbox) {
    solvedButton.addEventListener('click', solveRequest, false);
  }

  updateButtons(textarea.value);
})();