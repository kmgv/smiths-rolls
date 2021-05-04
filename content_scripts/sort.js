var regexpReplaceTable = {
  'a': '[a,ą]',
  'c': '[c,ć]',
  'e': '[e,ę]',
  'l': '[l,ł]',
  'n': '[n,ń]',
  'o': '[o,ó]',
  's': '[s,ś]',
  'z': '[z,ż,ź]'
}

var inputCss = `
  position: absolute;
  left: 55px;
  height: 20px;
  width: 130px;
`;

function _toStyleString(rule) {
  return rule.split('\n').filter(function(a){
    return a.length > 0
  }).map(function(a){
    return a.trim()
  }).join('')
}

function toRegexp(input) {
  var regexp = input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  for (var letter in regexpReplaceTable) {
      regexp = regexp.replaceAll(letter, regexpReplaceTable[letter])
  }

  return new RegExp(regexp, 'i');
}

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
        var sortableText = text.slice(0, text.lastIndexOf('('));

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

  function findAbilitiesTables(_document) {
    var skillList = findSkillList(_document)

    if (skillList === null) {
      console.log('no skill list found')
      return
    }

    // we are interested in first 3 table, rest are additional skills (also in tables :/)
    var tables = skillList.querySelectorAll('table')
    tables = Array.from(tables).slice(0, 3)

    return {
      tables: tables,
      abilities: transformAbilitiesTables(tables)
    }
  }

  function sortSkillList(_document){
    var abilityTables = findAbilitiesTables(_document);
    var tables = abilityTables.tables;
    var abilities = abilityTables.abilities;

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

  function insertSearchBar(_document, inputCallback) {
    var skillHeader = _document.querySelector('[data-i18n="investigatorskills-u"]');
    if (skillHeader.querySelector('input')){
      console.log('input found, skipping')
      return
    }

    var input = _document.createElement("input");
    input.setAttribute('style', _toStyleString(inputCss));
    input.classList.add("smiths-rolls-input");
    input.addEventListener('input', function(event){
      var value = event.target.value;
      inputCallback(value);
    });

    skillHeader.appendChild(input);

    return input;
  }

  function initSearchBar(_document) {
    var abilityTables = findAbilitiesTables(_document);
    var abilities = abilityTables.abilities;

    var clearHightligh = function() {
      for (var ability of abilities) {
        ability.tr.removeAttribute('style');
      }
    }

    var input = insertSearchBar(_document, function(searchTerm){
      if (searchTerm.length == 0){
        clearHightligh();
        return
      }

      var regExp = toRegexp(searchTerm);
      for (var ability of abilities) {
        if (ability.text.match(regExp)) {
          ability.tr.setAttribute('style', 'background: yellow');
        } else {
          ability.tr.removeAttribute('style');
        }
      }
    });

    for (var ability of abilities) {
      for (var node of ability.tr.querySelectorAll('button')) {
        node.addEventListener('click', function(){
          input.value = '';
          clearHightligh();
        })
      }
    }
  }

  function run(_document){
    sortSkillList(_document);
    initSearchBar(_document)
  }

  function observeMutationsAndRun() {
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
          run(document);
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

  observeMutationsAndRun();

})();
