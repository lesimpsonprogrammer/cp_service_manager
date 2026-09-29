<script>
(function () {
  var grid = document.getElementById('mds-gloss-grid');
  if (!grid) return;
  var input = document.getElementById('mds-gloss-search');
  var count = document.getElementById('mds-gloss-count');
  var chips = document.querySelectorAll('[data-filter]');
  var cards = grid.querySelectorAll('.mds-term');
  var active = 'all';
  function apply() {
    var q = (input && input.value || '').trim().toLowerCase(), shown = 0;
    cards.forEach(function (c) {
      var ok = (active === 'all' || c.getAttribute('data-cat') === active) && (!q || c.textContent.toLowerCase().indexOf(q) !== -1);
      c.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    if (count) count.textContent = 'Showing ' + shown + ' of ' + cards.length + ' terms';
  }
  chips.forEach(function (ch) {
    ch.addEventListener('click', function (e) {
      e.preventDefault();
      active = ch.getAttribute('data-filter');
      chips.forEach(function (o) { o.style.outline = o === ch ? '2px solid #1183f0' : ''; });
      apply();
    });
  });
  if (input) input.addEventListener('input', apply);
})();
</script>
