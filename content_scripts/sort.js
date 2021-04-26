(function() {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

  function findNodeByTagName(searchSpace, tagName) {

    for (var elem of searchSpace) {
      if (elem.tagName == tagName.toUpperCase())
        return elem
    }
  }

  function transformAbilitiesTables(tables) {
    var abilities = [];
    for (var table of tables) {
      var labelTds = table.querySelectorAll('.sheet-skill-label');
      for (var labelTd of labelTds) {
        var abilityTr = labelTd.parentElement

        var text = labelTd.textContent
        var sortableText = text.slice(0, text.indexOf('('));

        abilities.push({
          text: sortableText,
          tr: abilityTr
        })
      }
    }

    return abilities;
  }

  function findSkillList(_document){
    console.log(_document)

    // TODO: find proper skill list by checking all of them and check which is visible
    return _document.querySelector('[data-i18n-list="1920-skill-list"]');
  }

  function sortAbilities(_document){
    // faster access
    var $$ = _document.querySelector;

    var skillList = findSkillList(_document)

    // we are interested in first 3 table, rest are additional skills (also in tables :/)
    var tables = skillList.querySelectorAll('table')
    tables = Array.from(tables).slice(0, 3)

    var abilities = transformAbilitiesTables(tables);
    var sorted = abilities.sort(function(a, b){
      return a.text.localeCompare(b.text, 'pl', { sensitivity: 'base' })
    });

    var abilitiesInCol = 18;

    for (var tIndex = 0; tIndex < 3; tIndex++) {
      var table = tables[tIndex];
      var tbody = table.querySelector('tbody');

      for (var i = 0; i < abilitiesInCol; i++) {
        var tr = sorted[abilitiesInCol * tIndex + i].tr;
        if (tr) {
          tbody.appendChild(tr);
        }
      }
    }
  }

  function onSort(){
    // find character dialog
    var characterDialog = document.getElementsByClassName('characterdialog');
    if (characterDialog.length == 0) {
      console.log('Character dialog not found!')
      return
    }

    var characterIframe = findNodeByTagName(characterDialog[0].childNodes, 'iframe');
    if (!characterIframe || !characterIframe.contentWindow.document) {
      console.log('Character dialog iframe not found!')
      return
    }

    sortAbilities(characterIframe.contentWindow.document);

  }


  browser.runtime.onMessage.addListener((message) => {
    if (message.command === "sort") {
      onSort()
    }
  });

})();