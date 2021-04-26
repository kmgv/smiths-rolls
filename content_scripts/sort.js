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
    // TODO: find proper skill list by checking all of them and check which is visible
    return _document.querySelector('[data-i18n-list="1920-skill-list"]');
  }

  function sortAbilities(_document){
    var skillList = findSkillList(_document)

    if (skillList === null) {
      console.log('no skill list found')
      return
    }

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
        var el = sorted[abilitiesInCol * tIndex + i];
        if (el) {
          tbody.appendChild(el.tr);
        }
      }
    }
  }

  function observeMutationsAndFireSorting() {
    var fired = false;
    var debounceTimeout = null;
    var debounceTimeoutTime = 100;

    var mutationObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(_) {
        if (fired)
          return

        if (debounceTimeout != null) {
          clearTimeout(debounceTimeout)
        }

        debounceTimeout = setTimeout(function(){
          fired = true;
          mutationObserver.disconnect()
          sortAbilities(document);
        }, debounceTimeoutTime)
      });
    });

    mutationObserver.observe(document.documentElement, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
      attributeOldValue: true,
      characterDataOldValue: true
    });
  }

  observeMutationsAndFireSorting();

})();
