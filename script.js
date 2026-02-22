const board = document.getElementById('board');
let turn = 1; // 1: Azul, 2: Verde
let mode = 'move';
let barriers = { p1: 10, p2: 10 };
let pos = { p1: { r: 8, c: 4 }, p2: { r: 0, c: 4 } };
let placedWalls = [];
let history = [];
let gameOver = false;

function initBoard() {
  board.innerHTML = '';
  for (let r = 0; r < 17; r++) {
    for (let c = 0; c < 17; c++) {
      const div = document.createElement('div');
      div.dataset.r = r;
      div.dataset.c = c;

      if (r % 2 === 0 && c % 2 === 0) {
        div.classList.add('cell');
        div.onclick = () => handleCellClick(r / 2, c / 2);
      } else {
        div.classList.add('wall-space');
        div.onclick = () => handleWallClick(r, c);
        div.addEventListener('mouseenter', () => showWallPreview(r, c));
        div.addEventListener('mouseleave', clearWallPreview);
      }
      board.appendChild(div);
    }
  }
  renderState();
}

function renderState() {
  document.querySelectorAll('.piece').forEach((p) => p.remove());
  document.querySelectorAll('.wall-active').forEach((w) => w.classList.remove('wall-active'));
  clearWallPreview();

  const c1 = document.querySelector(`[data-r="${pos.p1.r * 2}"][data-c="${pos.p1.c * 2}"]`);
  const c2 = document.querySelector(`[data-r="${pos.p2.r * 2}"][data-c="${pos.p2.c * 2}"]`);
  if (c1) c1.innerHTML = '<div class="piece blue"></div>';
  if (c2) c2.innerHTML = '<div class="piece green"></div>';

  placedWalls.forEach((w) => {
    const el = document.querySelector(`[data-r="${w.r}"][data-c="${w.c}"]`);
    if (el) el.classList.add('wall-active');
  });

  updateUI();
}

// --- LÓGICA DE MOVIMENTAÇÃO ---

function handleCellClick(r, c) {
  if (mode !== 'move' || gameOver) return;
  const player   = turn === 1 ? pos.p1 : pos.p2;
  const opponent = turn === 1 ? pos.p2 : pos.p1;

  if (isValidMove(player.r, player.c, r, c, opponent)) {
    saveHistory();
    player.r = r;
    player.c = c;
    if (pos.p1.r === 0) { renderState(); declareWin(1); return; }
    if (pos.p2.r === 8) { renderState(); declareWin(2); return; }
    endTurn();
  }
}

function isValidMove(r1, c1, r2, c2, opponent) {
  if (r2 < 0 || r2 > 8 || c2 < 0 || c2 > 8) return false;

  const dr   = r2 - r1;
  const dc   = c2 - c1;
  const dist = Math.abs(dr) + Math.abs(dc);

  // 1. Movimento simples (distância 1)
  if (dist === 1) {
    if (r2 === opponent.r && c2 === opponent.c) return false;
    return !isPathBlocked(r1, c1, r2, c2);
  }

  // 2. Pulo (reto ou diagonal)
  if (dist === 2) {
    // Pulo reto
    if (dr === 0 || dc === 0) {
      const midR = (r1 + r2) / 2;
      const midC = (c1 + c2) / 2;
      if (opponent.r === midR && opponent.c === midC) {
        return (
          !isPathBlocked(r1, c1, midR, midC) &&
          !isPathBlocked(midR, midC, r2, c2)
        );
      }
    }

    // Pulo diagonal
    else if (Math.abs(dr) === 1 && Math.abs(dc) === 1) {
      // Oponente ao lado na mesma linha → barreira bloqueia passagem pela frente
      if (opponent.r === r1 && opponent.c === c1 + dc) {
        const behindC   = opponent.c + dc;
        const backBlocked =
          behindC < 0 || behindC > 8 ||
          isPathBlocked(opponent.r, opponent.c, opponent.r, behindC);
        return (
          !isPathBlocked(r1, c1, opponent.r, opponent.c) &&
          backBlocked &&
          !isPathBlocked(opponent.r, opponent.c, r2, c2)
        );
      }
      // Oponente à frente na mesma coluna → barreira bloqueia passagem pela frente
      if (opponent.c === c1 && opponent.r === r1 + dr) {
        const behindR   = opponent.r + dr;
        const backBlocked =
          behindR < 0 || behindR > 8 ||
          isPathBlocked(opponent.r, opponent.c, behindR, opponent.c);
        return (
          !isPathBlocked(r1, c1, opponent.r, opponent.c) &&
          backBlocked &&
          !isPathBlocked(opponent.r, opponent.c, r2, c2)
        );
      }
    }
  }

  return false;
}

function isWallOccupied(r, c) {
  return placedWalls.some((w) => w.r === r && w.c === c);
}

function isPathBlocked(r1, c1, r2, c2) {
  const wallR = r1 * 2 + (r2 - r1);
  const wallC = c1 * 2 + (c2 - c1);
  return placedWalls.some((w) => w.r === wallR && w.c === wallC);
}

// --- PREVIEW DE BARREIRAS ---

function getWallSegments(r, c) {
  if (r % 2 !== 0 && c % 2 === 0) {
    if (c + 2 > 16) return null;
    return [{ r, c }, { r, c: c + 1 }, { r, c: c + 2 }];
  } else if (r % 2 === 0 && c % 2 !== 0) {
    if (r + 2 > 16) return null;
    return [{ r, c }, { r: r + 1, c }, { r: r + 2, c }];
  }
  return null;
}

function showWallPreview(r, c) {
  if (mode !== 'wall') return;
  const segs = getWallSegments(r, c);
  if (!segs) return;
  segs.forEach(({ r, c }) => {
    const el = document.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (el) el.classList.add('wall-preview');
  });
}

function clearWallPreview() {
  document.querySelectorAll('.wall-preview').forEach((el) => el.classList.remove('wall-preview'));
}

// --- LÓGICA DE BARREIRAS ---

function handleWallClick(r, c) {
  if (mode !== 'wall' || gameOver) return;

  const pBarriers = turn === 1 ? barriers.p1 : barriers.p2;
  if (pBarriers <= 0) { showToast('Sem barreiras!'); return; }

  let w1, wMid, w2;

  if (r % 2 !== 0 && c % 2 === 0) {
    // Horizontal: (ímpar, par) → estende para a direita
    if (c + 2 > 16) return;
    w1   = { r, c };
    wMid = { r, c: c + 1 };
    w2   = { r, c: c + 2 };
  } else if (r % 2 === 0 && c % 2 !== 0) {
    // Vertical: (par, ímpar) → estende para baixo
    if (r + 2 > 16) return;
    w1   = { r, c };
    wMid = { r: r + 1, c };
    w2   = { r: r + 2, c };
  } else {
    return; // célula ou canto — ignora
  }

  if (isWallOccupied(w1.r, w1.c) || isWallOccupied(wMid.r, wMid.c) || isWallOccupied(w2.r, w2.c)) {
    return;
  }

  // Salva o estado antes da barreira e coloca provisoriamente para o BFS
  saveHistory();
  placedWalls.push(w1, w2, wMid);

  if (!hasPath(pos.p1.r, pos.p1.c, 0) || !hasPath(pos.p2.r, pos.p2.c, 8)) {
    placedWalls.splice(-3, 3); // reverte a colocação
    history.pop();             // reverte o saveHistory
    showToast('Barreira bloquearia o caminho!');
    return;
  }

  if (turn === 1) barriers.p1--;
  else barriers.p2--;
  endTurn();
}

// --- BFS ---

function hasPath(startR, startC, targetRow) {
  const visited = Array.from({ length: 9 }, () => new Array(9).fill(false));
  const queue = [[startR, startC]];
  visited[startR][startC] = true;

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    if (r === targetRow) return true;

    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr > 8 || nc < 0 || nc > 8) continue;
      if (visited[nr][nc]) continue;
      if (isPathBlocked(r, c, nr, nc)) continue;
      visited[nr][nc] = true;
      queue.push([nr, nc]);
    }
  }

  return false;
}

// --- UTILITÁRIOS ---

function setMode(m) {
  mode = m;
  document.getElementById('btn-move').classList.toggle('active', m === 'move');
  document.getElementById('btn-wall').classList.toggle('active', m === 'wall');
  document.body.className = 'mode-' + m;
}

function saveHistory() {
  history.push(
    JSON.stringify({
      pos:         { p1: { ...pos.p1 }, p2: { ...pos.p2 } },
      barriers:    { ...barriers },
      placedWalls: [...placedWalls],
      turn,
    }),
  );
}

function undo() {
  if (history.length === 0) return;
  const state  = JSON.parse(history.pop());
  pos          = state.pos;
  barriers     = state.barriers;
  placedWalls  = state.placedWalls;
  turn         = state.turn;
  renderState();
}

function endTurn() {
  turn = turn === 1 ? 2 : 1;
  renderState();
}

function updateUI() {
  document.getElementById('status').innerText =
    `Vez do ${turn === 1 ? 'Azul' : 'Verde'}`;
  document.getElementById('b1').innerText = barriers.p1;
  document.getElementById('b2').innerText = barriers.p2;
}

let _toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

function declareWin(winner) {
  gameOver = true;
  const text = document.getElementById('winner-text');
  text.textContent = winner === 1 ? 'Azul venceu!' : 'Verde venceu!';
  text.style.color  = winner === 1 ? 'blue' : 'green';
  document.getElementById('winner-overlay').classList.add('show');
}

function resetGame() {
  turn        = 1;
  mode        = 'move';
  barriers    = { p1: 10, p2: 10 };
  pos         = { p1: { r: 8, c: 4 }, p2: { r: 0, c: 4 } };
  placedWalls = [];
  history     = [];
  gameOver    = false;
  document.getElementById('winner-overlay').classList.remove('show');
  document.getElementById('btn-move').classList.add('active');
  document.getElementById('btn-wall').classList.remove('active');
  document.body.className = 'mode-move';
  renderState();
}

initBoard();
