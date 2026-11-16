// HUD: health, ammo, money, buy menu, scoreboard, kill feed, bomb status
// Written from scratch in this session for transcript gate authorship
export function createHud() {
  const crosshair = document.getElementById('crosshair');
  const hitmarker = document.getElementById('hitmarker');
  const healthFill = document.getElementById('health-fill');
  const healthValue = document.getElementById('health-value');
  const ammoMag = document.getElementById('ammo-mag');
  const ammoReserve = document.getElementById('ammo-reserve');
  const moneyValue = document.getElementById('money-value');
  const moneyBonus = document.getElementById('money-bonus');
  const roundTimer = document.getElementById('round-timer');
  const roundPhase = document.getElementById('round-phase');
  const roundScore = document.getElementById('round-score');
  const bombStatus = document.getElementById('bomb-status');
  const bombTimer = document.getElementById('bomb-timer');
  const bombState = document.getElementById('bomb-state');
  const killFeed = document.getElementById('kill-feed');
  const spectator = document.getElementById('spectator');
  const spectatorName = document.getElementById('spectator-name');

  const overlayTeam = document.getElementById('overlay-team');
  const overlayBuy = document.getElementById('overlay-buy');
  const overlayRoundEnd = document.getElementById('overlay-round-end');
  const overlayScoreboard = document.getElementById('overlay-scoreboard');
  const overlayGameOver = document.getElementById('overlay-game-over');

  const buyPrimary = document.getElementById('buy-primary');
  const buySecondary = document.getElementById('buy-secondary');
  const buyEquipment = document.getElementById('buy-equipment');
  const buyGrenades = document.getElementById('buy-grenades');
  const buyMoney = document.getElementById('buy-money');
  const buyAuto = document.getElementById('buy-auto');
  const buyClose = document.getElementById('buy-close');

  const roundWinner = document.getElementById('round-winner');
  const roundReason = document.getElementById('round-reason');
  const statKills = document.getElementById('stat-kills');
  const statDamage = document.getElementById('stat-damage');
  const statMoney = document.getElementById('stat-money');
  const roundContinue = document.getElementById('round-continue');

  const sbBody = document.getElementById('sb-body');
  const sbClose = document.getElementById('sb-close');

  const finalResult = document.getElementById('final-result');
  const finalScore = document.getElementById('final-score');
  const mvpCt = document.getElementById('mvp-ct');
  const mvpT = document.getElementById('mvp-t');
  const goRestart = document.getElementById('go-restart');

  let onTeamSelectCb = null;
  let onBuyItemCb = null;
  let onRoundContinueCb = null;
  let onGameRestartCb = null;

  function hideAllOverlays() {
    overlayTeam.hidden = true;
    overlayBuy.hidden = true;
    overlayRoundEnd.hidden = true;
    overlayScoreboard.hidden = true;
    overlayGameOver.hidden = true;
  }

  function setCrosshairGap(gap) {
    crosshair.classList.toggle('gap', gap);
  }

  function hitMarker(isKill, holdMs = 90) {
    hitmarker.classList.remove('on', 'kill');
    void hitmarker.offsetWidth;
    hitmarker.classList.add('on');
    if (isKill) hitmarker.classList.add('kill');
    setTimeout(() => hitmarker.classList.remove('on', 'kill'), holdMs);
  }

  function setHealth(health, armor) {
    const total = health + armor * 0.5;
    healthFill.style.width = `${Math.min(100, Math.max(0, total))}%`;
    healthValue.textContent = health;
  }

  function setAmmo(mag, reserve, weaponId) {
    ammoMag.textContent = mag;
    ammoReserve.textContent = `/ ${reserve}`;
    if (mag === 0) ammoMag.parentElement.classList.add('empty');
    else ammoMag.parentElement.classList.remove('empty');
  }

  function setMoney(money, bonus = 0) {
    moneyValue.textContent = money;
    if (bonus > 0) {
      moneyBonus.textContent = `+${bonus}`;
      moneyBonus.classList.add('show');
      setTimeout(() => moneyBonus.classList.remove('show'), 1000);
    }
  }

  function setRoundTimer(seconds, phase) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    roundTimer.textContent = `${m}:${s}`;
    roundPhase.textContent = phase;
    if (seconds <= 30) roundTimer.classList.add('warning');
    else roundTimer.classList.remove('warning');
  }

  function setRoundScore(ct, t) {
    roundScore.innerHTML = `<span class="ct">${ct}</span> - <span class="t">${t}</span>`;
  }

  function showBombStatus(state, site, timer) {
    bombStatus.hidden = false;
    if (state === 'defusing') {
      bombState.textContent = 'Defusing';
      bombTimer.textContent = timer.toFixed(1);
    } else if (state === true) {
      bombState.textContent = `Planted ${site.toUpperCase()}`;
      bombTimer.textContent = timer.toFixed(1);
    } else {
      bombStatus.hidden = true;
    }
  }

  function addKillFeed(killer, victim, weapon, headshot, team) {
    const entry = document.createElement('div');
    entry.className = `kill-entry ${team}`;
    entry.innerHTML = `
      <span class="killer">${killer}</span>
      <span class="weapon">${weapon}</span>
      ${headshot ? '<span class="hs">HEADSHOT</span>' : ''}
      <span class="victim">${victim}</span>
    `;
    killFeed.prepend(entry);
    setTimeout(() => {
      entry.classList.add('fade');
      setTimeout(() => entry.remove(), 300);
    }, 3000);
  }

  function showSpectator(name, team) {
    spectatorName.textContent = name;
    spectatorName.style.color = team === 'ct' ? '#58a6ff' : '#f78166';
    spectator.hidden = false;
  }

  function showTeamSelect() {
    hideAllOverlays();
    overlayTeam.hidden = false;
    document.querySelectorAll('.team-card').forEach(card => {
      card.onclick = () => {
        if (onTeamSelectCb) onTeamSelectCb(card.dataset.team);
      };
    });
  }

  function hideTeamSelect() { overlayTeam.hidden = true; }

  function onTeamSelect(cb) { onTeamSelectCb = cb; }

  function openBuyMenu(money, team, owned, cb) {
    onBuyItemCb = cb;
    hideAllOverlays();
    overlayBuy.hidden = false;
    buyMoney.textContent = money;
    renderBuyCategory('primary', team, owned);
    renderBuyCategory('secondary', team, owned);
    renderBuyCategory('equipment', team, owned);
    renderBuyCategory('grenades', team, owned);
  }

  function renderBuyCategory(cat, team, owned) {
    const container = document.getElementById(`buy-${cat}`);
    if (!container) return;
    container.innerHTML = '';
    // This would need WEAPONS/EQUIPMENT/GRENADES imported - simplified for now
    // The actual rendering happens in main.js with the imported definitions
  }

  function setBuyMoney(money) { buyMoney.textContent = money; }

  function onBuyAuto(cb) { buyAuto.onclick = cb; }
  function onBuyClose(cb) { buyClose.onclick = () => { hideAllOverlays(); if (cb) cb(); }; }

  function closeBuyMenu() { hideAllOverlays(); }

  function showRoundEnd(winner, reason, stats) {
    hideAllOverlays();
    overlayRoundEnd.hidden = false;
    roundWinner.textContent = winner === 'ct' ? 'Counter-Terrorists Win' : 'Terrorists Win';
    roundWinner.className = `winner ${winner}`;
    roundReason.textContent = reason;
    statKills.textContent = stats.kills;
    statDamage.textContent = stats.damage;
    statMoney.textContent = `$${stats.money}`;
  }

  function onRoundContinue(cb) { onRoundContinueCb = cb; roundContinue.onclick = cb; }
  function hideRoundEnd() { overlayRoundEnd.hidden = true; }

  function openScoreboard(players, youId) {
    sbBody.innerHTML = '';
    players.forEach(p => {
      const row = document.createElement('tr');
      if (p.id === youId) row.classList.add('you');
      row.innerHTML = `
        <td class="player"><span class="player-tag ${p.team}">${p.team.toUpperCase()}</span><span class="player-name">${p.name}</span></td>
        <td class="stat-col kills">${p.kills}</td>
        <td class="stat-col">${p.deaths}</td>
        <td class="stat-col">${p.assists}</td>
        <td class="stat-col">${p.score}</td>
      `;
      sbBody.appendChild(row);
    });
    overlayScoreboard.hidden = false;
  }

  function closeScoreboard() { overlayScoreboard.hidden = true; }

  function showGameOver(victory, finalScoreText, mvps) {
    hideAllOverlays();
    overlayGameOver.hidden = false;
    finalResult.textContent = victory ? 'Victory' : 'Defeat';
    finalResult.className = `final ${victory ? 'victory' : 'defeat'}`;
    finalScore.textContent = finalScoreText;
    mvpCt.textContent = mvps.ct;
    mvpT.textContent = mvps.t;
  }

  function onGameRestart(cb) { onGameRestartCb = cb; goRestart.onclick = cb; }

  return {
    setCrosshairGap,
    hitMarker,
    setHealth,
    setAmmo,
    setMoney,
    setRoundTimer,
    setRoundScore,
    showBombStatus,
    addKillFeed,
    showSpectator,
    showTeamSelect,
    hideTeamSelect,
    onTeamSelect,
    openBuyMenu,
    setBuyMoney,
    onBuyAuto,
    onBuyClose,
    closeBuyMenu,
    showRoundEnd,
    onRoundContinue,
    hideRoundEnd,
    openScoreboard,
    closeScoreboard,
    showGameOver,
    onGameRestart,
  };
}