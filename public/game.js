// Game Client for Canary Card Games (Envido & Tute)
const socket = io();

// Client State
let myName = '';
let mySeat = null;
let myTeam = null;
let myRole = ''; // 'director' or 'teammate' (for Envido)
let selectedCard = null;
let selectedSuit = null;
let selectedDiscardCard = null;
let wantsMonte = null; // null, true, or false
let isHandSortedBySuit = false;
let activeChoiceCardIndex = null;
let roomState = null;
let roomId = '';

// DOM Elements
const lobbyScreen = document.getElementById('lobby-screen');
const gameScreen = document.getElementById('game-screen');
const playerNameInput = document.getElementById('player-name');
const roomLinkInput = document.getElementById('room-link');
const btnCopyLink = document.getElementById('btn-copy-link');
const selectGameType = document.getElementById('select-game-type');
const selectEnvidoPlayers = document.getElementById('select-envido-players');
const envidoPlayersGroup = document.getElementById('envido-players-group');
const seatsContainer = document.getElementById('seats-container');
const btnStartGame = document.getElementById('btn-start-game');

// Game screen elements
const btnLeaveRoom = document.getElementById('btn-leave-room');
const infoGameType = document.getElementById('info-game-type');
const teamBadge = document.getElementById('team-badge');
const infoTeam = document.getElementById('info-team');
const turnIndicator = document.getElementById('turn-indicator');
const viraCardSlot = document.getElementById('vira-card');
const viraLabel = document.getElementById('vira-label');
const playNineDrawnContainer = document.getElementById('playnine-drawn-container');
const playNineDrawnCard = document.getElementById('playnine-drawn-card');
const deckCountLabel = document.getElementById('deck-count');
const deckPile = document.querySelector('.deck-pile');
const tableSeatsContainer = document.getElementById('table-seats');
const pokerTable = document.querySelector('.poker-table');

// Scores
const scoreboardEnvido = document.getElementById('scoreboard-envido');
const scoreEnvidoA = document.getElementById('score-envido-a');
const scoreEnvidoB = document.getElementById('score-envido-b');
const scoreboardTute = document.getElementById('scoreboard-tute');
const tuteScoresList = document.getElementById('tute-scores-list');
const scoreboardPlayNine = document.getElementById('scoreboard-playnine');
const playNineCurrentHoleLabel = document.getElementById('playnine-current-hole-label');
const playNineScoresList = document.getElementById('playnine-scores-list');

// Signs Panel
const signsPanel = document.getElementById('signs-panel');
const directorNameLabel = document.getElementById('director-name');
const isDirectorLabel = document.getElementById('is-director-label');
const playerSignsControls = document.getElementById('player-signs-controls');
const directorControls = document.getElementById('director-controls');
const teamSecretLog = document.getElementById('team-secret-log');

// Tute Panel
const tuteDeclarationsPanel = document.getElementById('tute-declarations-panel');
const btnTute40 = document.getElementById('btn-tute-40');
const btnTute20 = document.getElementById('btn-tute-20');
const btnTuteDeclare = document.getElementById('btn-tute-declarar');
const btnSwapVira = document.getElementById('btn-swap-vira');

// Tute Subastado Panels
const auctionPanel = document.getElementById('auction-panel');
const auctionInfo = document.getElementById('auction-info');
const auctionHistory = document.getElementById('auction-history');
const auctionBidInput = document.getElementById('auction-bid-input');
const btnAuctionBid = document.getElementById('btn-auction-bid');
const btnAuctionPass = document.getElementById('btn-auction-pass');
const auctionStatus = document.getElementById('auction-status');

const selectionPanel = document.getElementById('selection-panel');
const btnConfirmSelection = document.getElementById('btn-confirm-selection');
const selectionDiscardInfo = document.getElementById('selection-discard-info');
const btnTakeMonte = document.getElementById('btn-take-monte');
const btnLeaveMonte = document.getElementById('btn-leave-monte');
const monteOptions = document.getElementById('monte-options');

const discardPanel = document.getElementById('discard-panel');
const discardTrumpLabel = document.getElementById('discard-trump-label');
const discardSelectedInfo = document.getElementById('discard-selected-info');
const btnConfirmDiscard = document.getElementById('btn-confirm-discard');
const btnSortSuit = document.getElementById('btn-sort-suit');

// Chat & Log
const gameLog = document.getElementById('game-log');
const chatInput = document.getElementById('chat-input');
const btnSendChat = document.getElementById('btn-send-chat');

// Player Hand
const playerHandContainer = document.getElementById('player-hand');
const btnPlayCard = document.getElementById('btn-play-card');
const btnPlayNinePass = document.getElementById('btn-playnine-pass');
const playerRoleIndicator = document.getElementById('player-role-indicator');

// INITIALIZE ROOM ID FROM URL
function initRoom() {
  const urlParams = new URLSearchParams(window.location.search);
  let room = urlParams.get('room');
  if (!room) {
    // Generate a random 5-letter room code
    room = Math.random().toString(36).substring(2, 7).toUpperCase();
    window.history.replaceState({}, '', '?room=' + room);
  }
  roomId = room.toUpperCase();
  roomLinkInput.value = window.location.href;

  // Retrieve saved name
  const savedName = localStorage.getItem('cartas_player_name');
  if (savedName) {
    playerNameInput.value = savedName;
    myName = savedName;
  } else {
    // Generate a guest name
    myName = `Jugador_${Math.floor(Math.random() * 900) + 100}`;
    playerNameInput.value = myName;
  }

  // Join Room via websocket
  socket.emit('join_room', { roomId, name: myName });
}

// SAVE NAME AND UPDATE LOBBY
playerNameInput.addEventListener('change', () => {
  const name = playerNameInput.value.trim();
  if (name.length > 0) {
    myName = name;
    localStorage.setItem('cartas_player_name', name);
    // If sitting down, re-announce seat
    if (mySeat !== null) {
      socket.emit('take_seat', { roomId, name: myName, seatIndex: mySeat });
    }
  }
});

// COPY LINK TO CLIPBOARD
btnCopyLink.addEventListener('click', () => {
  roomLinkInput.select();
  roomLinkInput.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(roomLinkInput.value)
    .then(() => {
      btnCopyLink.innerText = 'Copiado';
      setTimeout(() => btnCopyLink.innerText = 'Copiar', 2000);
    });
});

function updateLobbyConfigUI(gameType, maxPlayers) {
  selectGameType.value = gameType;
  
  // Re-populate player count options dynamically
  selectEnvidoPlayers.innerHTML = '';
  if (gameType === 'envido') {
    selectEnvidoPlayers.innerHTML = `
      <option value="4">4 Jugadores (2 vs 2)</option>
      <option value="6">6 Jugadores (3 vs 3)</option>
    `;
  } else if (gameType === 'tute') {
    selectEnvidoPlayers.innerHTML = `
      <option value="2">2 Jugadores</option>
      <option value="3">3 Jugadores</option>
    `;
  } else if (gameType === 'playnine') {
    selectEnvidoPlayers.innerHTML = `
      <option value="2">2 Jugadores</option>
      <option value="3">3 Jugadores</option>
      <option value="4">4 Jugadores</option>
      <option value="5">5 Jugadores</option>
      <option value="6">6 Jugadores</option>
    `;
  }
  
  selectEnvidoPlayers.value = maxPlayers;
}

// CONFIG CHANGE HANDLERS
selectGameType.addEventListener('change', () => {
  const gameType = selectGameType.value;
  let maxPlayers;
  if (gameType === 'envido') maxPlayers = 4;
  else if (gameType === 'tute') maxPlayers = 2;
  else if (gameType === 'playnine') maxPlayers = 4;
  
  updateLobbyConfigUI(gameType, maxPlayers);
  socket.emit('change_config', { 
    roomId, 
    gameType, 
    maxPlayers 
  });
});

selectEnvidoPlayers.addEventListener('change', () => {
  const gameType = selectGameType.value;
  const maxPlayers = selectEnvidoPlayers.value;
  
  socket.emit('change_config', { 
    roomId, 
    gameType, 
    maxPlayers 
  });
});

// RENDER SEATS IN LOBBY
function renderLobbySeats(maxPlayers, players) {
  seatsContainer.innerHTML = '';
  for (let i = 0; i < maxPlayers; i++) {
    const player = players[i];
    const seatBtn = document.createElement('button');
    seatBtn.className = 'seat-btn';
    
    let label = `Asiento ${i + 1}`;
    let sub = 'Vacío - Haz clic para sentarte';
    let teamName = '';

    if (player) {
      seatBtn.classList.add('taken');
      label = player.name;
      sub = player.socketId === socket.id ? 'Tú (Listo)' : 'Listo';
      
      if (player.team) {
        seatBtn.classList.add(player.team === 'A' ? 'team-a' : 'team-b');
        teamName = `Equipo ${player.team}`;
        if (player.isDirector) {
          teamName += ' - Director';
        }
      }

      if (player.socketId === socket.id) {
        seatBtn.classList.add('my-seat');
        mySeat = i;
        myTeam = player.team;
        myRole = player.isDirector ? 'director' : 'teammate';
      }
    }

    seatBtn.innerHTML = `
      <span class="seat-label">${label}</span>
      <span class="role-desc">${sub}</span>
      ${teamName ? `<span class="team-name">${teamName}</span>` : ''}
    `;

    // Click to sit
    if (!player) {
      seatBtn.addEventListener('click', () => {
        const name = playerNameInput.value.trim() || myName;
        socket.emit('take_seat', { roomId, name, seatIndex: i });
      });
    }

    seatsContainer.appendChild(seatBtn);
  }

  // Manage Start Game button
  const fullSeats = players.filter(p => p !== null).length;
  btnStartGame.disabled = (fullSeats !== maxPlayers);
  if (fullSeats === maxPlayers) {
    btnStartGame.innerText = 'Comenzar Partida';
    btnStartGame.classList.add('ready');
  } else {
    btnStartGame.innerText = `Esperando jugadores (${fullSeats}/${maxPlayers})...`;
    btnStartGame.classList.remove('ready');
  }
}

// START GAME BUTTON CLICK
btnStartGame.addEventListener('click', () => {
  socket.emit('start_game', { roomId });
});

// PLAY NINE DECK / DISCARD ACTIONS
deckPile.addEventListener('click', () => {
  if (roomState && roomState.gameType === 'playnine' && roomState.gameState.status === 'playing_nine' && roomState.gameState.currentTurn === mySeat && roomState.gameState.turnPhase === 'draw') {
    socket.emit('playnine_draw_deck', { roomId });
  }
});

viraCardSlot.addEventListener('click', () => {
  if (roomState && roomState.gameType === 'playnine' && roomState.gameState.status === 'playing_nine' && roomState.gameState.currentTurn === mySeat && roomState.gameState.turnPhase === 'draw') {
    socket.emit('playnine_take_discard', { roomId });
  }
});

// LEAVE GAME ROOM
btnLeaveRoom.addEventListener('click', () => {
  window.location.reload();
});

// LOG MESSAGE PRINTER
function logMsg(text, type = 'chat') {
  const msgDiv = document.createElement('div');
  msgDiv.className = `log-msg ${type}`;
  msgDiv.innerText = text;
  gameLog.appendChild(msgDiv);
  gameLog.scrollTop = gameLog.scrollHeight;
}

// TEAM SECRET LOG MESSAGE PRINTER
function teamLogMsg(text, type = 'secret') {
  const msgDiv = document.createElement('div');
  msgDiv.className = `log-msg ${type}`;
  msgDiv.innerText = text;
  teamSecretLog.appendChild(msgDiv);
  teamSecretLog.scrollTop = teamSecretLog.scrollHeight;
}

// WEBSOCKET LISTENERS FOR CHAT LOGS
socket.on('log_message', (msg) => {
  logMsg(msg.text, msg.type);
});

socket.on('team_log', (msg) => {
  teamLogMsg(msg.text, msg.type);
});

// SEND PUBLIC CHAT
function sendChat() {
  const message = chatInput.value.trim();
  if (message.length > 0) {
    socket.emit('chat_message', { roomId, message });
    chatInput.value = '';
  }
}
btnSendChat.addEventListener('click', sendChat);
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendChat();
});

// RECEIVING SIGNS & ORDERS (Envido only)
socket.on('receive_sign', ({ senderName, signName }) => {
  // Visual splash or alert for director
  alertFlash(`👀 Seña de ${senderName}: ¡${signName.toUpperCase()}!`);
});

socket.on('receive_order', ({ directorName, orderText }) => {
  // Visual banner for teammates
  alertFlash(`⚠️ Orden del Director (${directorName}): "${orderText.toUpperCase()}"`);
});

// Visual flash/notification alert overlay
function alertFlash(text) {
  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.top = '10%';
  overlay.style.left = '50%';
  overlay.style.transform = 'translate(-50%, -50%)';
  overlay.style.background = 'rgba(0,0,0,0.85)';
  overlay.style.color = '#ffeb3b';
  overlay.style.padding = '12px 24px';
  overlay.style.borderRadius = '8px';
  overlay.style.border = '2px solid #ffeb3b';
  overlay.style.boxShadow = '0 0 15px rgba(255,235,59,0.5)';
  overlay.style.zIndex = '999';
  overlay.style.fontSize = '1.1rem';
  overlay.style.fontWeight = 'bold';
  overlay.style.pointerEvents = 'none';
  overlay.style.transition = 'all 0.3s';
  overlay.innerText = text;
  
  document.body.appendChild(overlay);
  
  setTimeout(() => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 300);
  }, 2500);
}

// Get readable Spanish card name (with point values for Tute)
function getCardNameSpanish(card) {
  if (!card) return '';
  const suitNames = {
    oros: 'Oros',
    copas: 'Copas',
    espadas: 'Espadas',
    bastos: 'Bastos'
  };
  const numberNames = {
    1: 'As',
    2: 'Dos',
    3: 'Tres',
    4: 'Cuatro',
    5: 'Cinco',
    6: 'Seis',
    7: 'Siete',
    10: 'Sota',
    11: 'Caballo',
    12: 'Rey'
  };
  
  let ptsStr = '';
  if (roomState && roomState.gameType === 'tute') {
    let pts = 0;
    if (roomState.maxPlayers === 2) {
      if (card.number === 1) pts = 11;
      else if (card.number === 2) pts = 10;
      else if (card.number === 12) pts = 4;
      else if (card.number === 11) pts = 3;
      else if (card.number === 10) pts = 2;
    } else {
      if (card.number === 1) pts = 11;
      else if (card.number === 3) pts = 10;
      else if (card.number === 12) pts = 4;
      else if (card.number === 11) pts = 3;
      else if (card.number === 10) pts = 2;
    }
    ptsStr = ` (${pts} pts)`;
  }
  
  const numName = numberNames[card.number] || card.number;
  const suitName = suitNames[card.suit.toLowerCase()] || card.suit;
  return `${numName} de ${suitName}${ptsStr}`;
}

// MAIN ROOM STATE SYNCHRONIZATION
socket.on('room_state', ({ gameType, maxPlayers, players, gameState }) => {
  roomState = { gameType, maxPlayers, players, gameState };
  activeChoiceCardIndex = null;
  
  // Find self seat in players array
  const me = players.find(p => p && p.socketId === socket.id);
  if (me) {
    mySeat = me.seat;
    myTeam = me.team;
    myRole = me.isDirector ? 'director' : 'teammate';
  } else {
    mySeat = null;
    myTeam = null;
    myRole = '';
  }

  // LOBBY VS GAME SCREEN
  if (gameState.status === 'lobby') {
    lobbyScreen.classList.remove('hidden');
    gameScreen.classList.add('hidden');
    
    // Config elements editable
    selectGameType.disabled = false;
    selectEnvidoPlayers.disabled = false;
    updateLobbyConfigUI(gameType, maxPlayers);

    renderLobbySeats(maxPlayers, players);
  } else {
    // IN GAME!
    lobbyScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    renderGameBoard(gameType, maxPlayers, players, gameState);
  }
});

// RENDERING GAMEPLAY BOARD
function renderGameBoard(gameType, maxPlayers, players, gameState) {
  // 1. Setup Header labels
  if (gameType === 'envido') {
    infoGameType.innerText = `Envido Canario (${maxPlayers} jug.)`;
  } else if (gameType === 'tute') {
    infoGameType.innerText = `Tute (${maxPlayers} jugadores)`;
  } else if (gameType === 'playnine') {
    infoGameType.innerText = `Play Nine (Golf) (${maxPlayers} jug.)`;
  }
  
  if (myTeam) {
    teamBadge.style.display = 'inline-block';
    infoTeam.innerText = `Equipo ${myTeam} - ${myRole === 'director' ? 'Director' : 'Jugador'}`;
  } else {
    teamBadge.style.display = 'none';
  }

  // 2. Scoreboards
  if (gameType === 'envido') {
    scoreboardEnvido.style.display = 'flex';
    scoreboardTute.style.display = 'none';
    scoreboardPlayNine.style.display = 'none';
    scoreEnvidoA.innerText = gameState.scores.teamA;
    scoreEnvidoB.innerText = gameState.scores.teamB;
  } else if (gameType === 'tute') {
    scoreboardEnvido.style.display = 'none';
    scoreboardTute.style.display = 'flex';
    scoreboardPlayNine.style.display = 'none';
    
    tuteScoresList.innerHTML = '';
    players.forEach(p => {
      if (!p) return;
      const scoreItem = document.createElement('div');
      scoreItem.className = 'tute-score-item';
      
      const matchDeafeats = gameState.tuteMatchPoints[p.seat] || 0;
      const roundScore = gameState.tuteRoundScores[p.seat] || 0;
      const showScores = (gameState.status === 'round_results' || gameState.status === 'game_end');
      const scoreDisplay = showScores ? `${roundScore} pts` : '❓ pts';
      
      // Draw red dots/crosses for defeat points (porotos) or points for Tute Subastado
      let defeatsStr = '';
      if (maxPlayers === 2) {
        let dots = '⚪⚪⚪';
        if (matchDeafeats === 1) dots = '🔴⚪⚪';
        if (matchDeafeats === 2) dots = '🔴🔴⚪';
        if (matchDeafeats >= 3) dots = '🔴🔴🔴';
        defeatsStr = `Derrotas: ${dots}`;
      } else {
        defeatsStr = `Puntos: ${matchDeafeats}/300`;
      }

      scoreItem.innerHTML = `
        <span class="tute-score-name">${p.name}</span>
        <span class="tute-score-pts">${scoreDisplay}</span>
        <span style="font-size: 0.65rem; color: #ffb74d;">${defeatsStr}</span>
      `;
      tuteScoresList.appendChild(scoreItem);
    });
  } else if (gameType === 'playnine') {
    scoreboardEnvido.style.display = 'none';
    scoreboardTute.style.display = 'none';
    scoreboardPlayNine.style.display = 'flex';
    
    playNineScoresList.innerHTML = '';
    playNineCurrentHoleLabel.innerText = gameState.currentHole;
    players.forEach(p => {
      if (!p) return;
      const scoresArray = (gameState.playNineScores && gameState.playNineScores[p.seat]) || [];
      const totalScore = scoresArray.reduce((a, b) => a + b, 0);
      const scoreItem = document.createElement('div');
      scoreItem.style.display = 'flex';
      scoreItem.style.flexDirection = 'column';
      scoreItem.style.alignItems = 'center';
      scoreItem.innerHTML = `
        <span style="font-weight: bold; color: white;">${p.name}</span>
        <span style="font-size: 1.1rem; font-weight: bold; color: var(--accent-color);">${totalScore}</span>
      `;
      playNineScoresList.appendChild(scoreItem);
    });
  }

  // 3. Turn Indicator
  const currentTurnPlayer = players[gameState.currentTurn];
  if (gameState.status === 'game_end') {
    turnIndicator.innerText = 'Partida Finalizada';
    turnIndicator.style.background = '#d84315';
  } else if (gameState.status === 'playing_nine_setup') {
    turnIndicator.innerText = '⛳ Selecciona 2 cartas para empezar';
    turnIndicator.style.background = '#0288d1';
  } else {
    if (gameState.currentTurn === mySeat) {
      turnIndicator.innerText = '★ ¡TU TURNO! ★';
      turnIndicator.style.background = '#e65100';
    } else {
      turnIndicator.innerText = currentTurnPlayer ? `Turno de: ${currentTurnPlayer.name}` : 'Esperando...';
      turnIndicator.style.background = '#1b5e20';
    }
  }

  // 4. Center Cards (Deck & Vira)
  deckCountLabel.innerText = gameState.deckCount || 0;

  const centerCards = document.querySelector('.center-cards');

  if (gameState.status === 'auction') {
    if (centerCards) centerCards.style.display = 'none';
    auctionPanel.style.display = 'flex';
    selectionPanel.style.display = 'none';

    // Populate auction details
    const minBid = Math.max(60, (gameState.auctionHighestBid || 0) + 5);
    auctionBidInput.min = minBid;
    if (parseInt(auctionBidInput.value) < minBid) {
      auctionBidInput.value = minBid;
    }

    auctionInfo.innerText = gameState.auctionHighestBid > 0 
      ? `Puja máxima: ${gameState.auctionHighestBid} pts por ${players.find(p=>p && p.seat === gameState.auctionHighestBidder)?.name || "Nadie"}`
      : `Sin apuestas todavía (Mínimo: 60)`;

    auctionHistory.innerHTML = (gameState.auctionBidHistory || []).map(h => {
      const pName = players.find(p => p && p.seat === h.seat)?.name || `Asiento ${h.seat+1}`;
      return h.action === 'pass' 
        ? `<div>❌ ${pName} pasa.</div>` 
        : `<div>🙋‍♂️ ${pName} puja ${h.value} pts.</div>`;
    }).join('');

    const isMyBidTurn = (gameState.auctionCurrentTurn === mySeat && mySeat !== null);
    btnAuctionBid.disabled = !isMyBidTurn;
    btnAuctionPass.disabled = !isMyBidTurn;
    auctionBidInput.disabled = !isMyBidTurn;

    if (isMyBidTurn) {
      auctionStatus.innerText = "★ ¡TU TURNO DE PUJAR! ★";
      auctionStatus.style.color = "#ffb74d";
      auctionPanel.classList.add('pulse-action');
      auctionStatus.classList.add('text-pulsing');
    } else {
      const turnPlayerName = players.find(p => p && p.seat === gameState.auctionCurrentTurn)?.name || `Asiento ${gameState.auctionCurrentTurn + 1}`;
      auctionStatus.innerText = `Turno de: ${turnPlayerName}...`;
      auctionStatus.style.color = "#aaa";
      auctionPanel.classList.remove('pulse-action');
      auctionStatus.classList.remove('text-pulsing');
    }
  } else if (gameState.status === 'selection') {
    if (centerCards) centerCards.style.display = 'none';
    auctionPanel.style.display = 'none';
    selectionPanel.style.display = 'flex';
    discardPanel.style.display = 'none';

    const isSubastador = (gameState.auctionHighestBidder === mySeat && mySeat !== null);
    if (isSubastador) {
      selectionPanel.classList.add('pulse-action');
      selectionDiscardInfo.classList.add('text-pulsing');
      selectionPanel.querySelector('h5').innerText = "Elección de Triunfo";
      selectionPanel.querySelector('p').style.display = 'block';
      selectionPanel.querySelector('.suit-selector').style.display = 'grid';
      selectionDiscardInfo.style.display = 'block';
      btnConfirmSelection.style.display = 'block';
      monteOptions.style.display = 'flex';

      if (wantsMonte === true) {
        btnTakeMonte.classList.add('active');
        btnLeaveMonte.classList.remove('active');
        selectionDiscardInfo.innerText = "Decisión: Coger Monte (descartarás tras confirmar)";
      } else if (wantsMonte === false) {
        btnTakeMonte.classList.remove('active');
        btnLeaveMonte.classList.add('active');
        selectionDiscardInfo.innerText = "Decisión: Dejar Monte (sin descarte)";
      } else {
        btnTakeMonte.classList.remove('active');
        btnLeaveMonte.classList.remove('active');
        selectionDiscardInfo.innerText = "Decisión: Elegir coger o dejar monte";
      }
      
      updateConfirmSelectionState();
    } else {
      selectionPanel.classList.remove('pulse-action');
      selectionDiscardInfo.classList.remove('text-pulsing');
      const subastadorName = players.find(p => p && p.seat === gameState.auctionHighestBidder)?.name || "El subastador";
      selectionPanel.querySelector('h5').innerText = `${subastadorName} elige triunfo...`;
      selectionPanel.querySelector('p').style.display = 'none';
      selectionPanel.querySelector('.suit-selector').style.display = 'none';
      selectionDiscardInfo.style.display = 'none';
      btnConfirmSelection.style.display = 'none';
      monteOptions.style.display = 'none';
    }
  } else if (gameState.status === 'discard') {
    if (centerCards) centerCards.style.display = 'none';
    auctionPanel.style.display = 'none';
    selectionPanel.style.display = 'none';
    discardPanel.style.display = 'flex';

    const isSubastador = (gameState.auctionHighestBidder === mySeat && mySeat !== null);
    if (isSubastador) {
      discardPanel.classList.add('pulse-action');
      discardSelectedInfo.classList.add('text-pulsing');
      discardPanel.querySelector('h5').innerText = "Descarte del Tute";
      discardTrumpLabel.innerText = gameState.trumpSuit.toUpperCase();
      discardSelectedInfo.innerText = selectedDiscardCard
        ? `Descarte: ${getCardNameSpanish(selectedDiscardCard)}`
        : "Descarte: Ninguno seleccionado";
      
      btnConfirmDiscard.style.display = 'block';
      btnConfirmDiscard.disabled = !selectedDiscardCard;
    } else {
      discardPanel.classList.remove('pulse-action');
      discardSelectedInfo.classList.remove('text-pulsing');
      const subastadorName = players.find(p => p && p.seat === gameState.auctionHighestBidder)?.name || "El subastador";
      discardPanel.querySelector('h5').innerText = `${subastadorName} realiza el descarte...`;
      btnConfirmDiscard.style.display = 'none';
    }
  } else {
    if (centerCards) centerCards.style.display = 'flex';
    auctionPanel.style.display = 'none';
    selectionPanel.style.display = 'none';
    discardPanel.style.display = 'none';
    auctionPanel.classList.remove('pulse-action');
    selectionPanel.classList.remove('pulse-action');
    discardPanel.classList.remove('pulse-action');
    auctionStatus.classList.remove('text-pulsing');
    selectionDiscardInfo.classList.remove('text-pulsing');
    discardSelectedInfo.classList.remove('text-pulsing');
  }
  
  if (gameType === 'playnine') {
    const isMyTurnToDraw = (gameState.currentTurn === mySeat && gameState.status === 'playing_nine' && gameState.turnPhase === 'draw');

    // Render deck pile with Play Nine card back
    deckPile.innerHTML = window.createPlayNineCardSVG(null, false) + `<span class="card-count" id="deck-count">${gameState.deckCount || 0}</span>`;
    
    // Glowing border for deck if drawable
    if (isMyTurnToDraw) {
      deckPile.style.cursor = 'pointer';
      deckPile.style.boxShadow = '0 0 15px #ffd54f';
      deckPile.style.border = '2px solid #ffd54f';
    } else {
      deckPile.style.cursor = 'default';
      deckPile.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.5)';
      deckPile.style.border = '2px solid rgba(255,255,255,0.2)';
    }

    // Render discard pile top card in viraCardSlot
    viraLabel.innerText = 'Descarte';
    if (gameState.discardPile && gameState.discardPile.length > 0) {
      const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];
      viraCardSlot.innerHTML = window.createPlayNineCardSVG(topDiscard.value, true);
      
      const discardSvg = viraCardSlot.firstElementChild;
      const canDrawDiscard = isMyTurnToDraw;

      if (canDrawDiscard) {
        viraCardSlot.style.cursor = 'pointer';
        viraCardSlot.style.boxShadow = '0 0 15px #ffd54f';
        viraCardSlot.style.border = '2px solid #ffd54f';
        viraCardSlot.style.opacity = '1.0';
      } else {
        viraCardSlot.style.cursor = 'default';
        viraCardSlot.style.boxShadow = 'none';
        viraCardSlot.style.border = 'none';
        viraCardSlot.style.opacity = '1.0';
      }
    } else {
      viraCardSlot.innerHTML = '';
      viraCardSlot.style.boxShadow = 'none';
      viraCardSlot.style.border = 'none';
      viraCardSlot.style.opacity = '1.0';
    }
    btnSwapVira.style.display = 'none';

    // Render drawn card if any
    if (gameState.drawnCard) {
      playNineDrawnContainer.style.display = 'block';
      playNineDrawnCard.innerHTML = window.createPlayNineCardSVG(gameState.drawnCard.value, true);
    } else {
      playNineDrawnContainer.style.display = 'none';
      playNineDrawnCard.innerHTML = '';
    }
  } else {
    // Normal Envido/Tute Vira logic
    viraLabel.innerText = 'Vira';
    playNineDrawnContainer.style.display = 'none';
    playNineDrawnCard.innerHTML = '';
    
    // Reset deck-pile representation if it was modified
    deckPile.style.cursor = 'default';
    deckPile.style.boxShadow = 'none';
    deckPile.style.border = 'none';
    deckPile.innerHTML = `<div class="card-back-icon"></div><span class="card-count" id="deck-count">${gameState.deckCount || 0}</span>`;
    
    viraCardSlot.style.opacity = '1.0';
    viraCardSlot.style.boxShadow = 'none';
    viraCardSlot.style.border = 'none';

    if (gameState.viraCard) {
      viraCardSlot.innerHTML = window.createCardSVG(gameState.viraCard.suit, gameState.viraCard.number);
      const viraSvg = viraCardSlot.firstElementChild;
      if (viraSvg) {
        viraSvg.style.cursor = 'pointer';
        viraSvg.addEventListener('click', () => {
          alertFlash(`📢 Triunfo (Vira): ${getCardNameSpanish(gameState.viraCard)}`);
        });
      }

      // Check swap eligibility
      let canSwap = false;
      if (gameType === 'tute' && maxPlayers === 2 && gameState.status === 'playing' && mySeat !== null && (gameState.deckCount || 0) > 0) {
        const wonTricks = (gameState.tricks || []).filter(t => t.winnerSeat === mySeat).length;
        if (wonTricks > 0) {
          const hand = gameState.hands[socket.id] || [];
          const trumpSuit = gameState.trumpSuit;
          const viraNum = gameState.viraCard.number;
          const hasSeven = hand.some(c => c.suit === trumpSuit && c.number === 7);
          const hasTwo = hand.some(c => c.suit === trumpSuit && c.number === 2);
          const hasThree = hand.some(c => c.suit === trumpSuit && c.number === 3);

          // Standard: Vira is high card [1, 3, 10, 11, 12], player can swap with 7
          if ([1, 3, 10, 11, 12].includes(viraNum) && hasSeven) {
            canSwap = true;
          }
          // Vira is 7 or lower [7, 6, 5, 4, 2], player can swap with 2 or 3
          if ([7, 6, 5, 4, 2].includes(viraNum) && (hasTwo || hasThree)) {
            canSwap = true;
          }
        }
      }

      if (canSwap) {
        btnSwapVira.style.display = 'block';
      } else {
        btnSwapVira.style.display = 'none';
      }
    } else {
      viraCardSlot.innerHTML = '';
      btnSwapVira.style.display = 'none';
    }
  }

  // 5. Render Seating spots and played cards
  pokerTable.className = `poker-table players-${maxPlayers}`;
  tableSeatsContainer.innerHTML = '';

  for (let i = 0; i < maxPlayers; i++) {
    const player = players[i];
    if (!player) continue;

    const isTurn = (gameState.currentTurn === i && (gameState.status === 'playing' || gameState.status === 'playing_nine'));
    const played = gameState.playedCards.find(pc => pc.seat === i);

    const spotDiv = document.createElement('div');
    spotDiv.className = `player-spot spot-${i}`;
    if (isTurn) spotDiv.classList.add('current-turn');
    if (player.team) spotDiv.classList.add(player.team === 'A' ? 'team-a' : 'team-b');

    // Initials
    const initials = player.name.substring(0, 2).toUpperCase();
    
    // Director/team role badge text
    let roleBadge = '';
    if (gameType === 'envido' && player.team) {
      roleBadge = player.isDirector ? `<span class="role-tag">Dir</span>` : `<span class="role-tag">Jug</span>`;
    }

    // Check if player has won any tricks in this round (helpful for Tute cantos)
    const wonTricksCount = gameState.tricks ? gameState.tricks.filter(t => t.winnerSeat === i).length : 0;
    const trickWinsBadge = wonTricksCount > 0 ? `<div style="font-size:0.65rem; color:#ffd54f;">Bazas: ${wonTricksCount}</div>` : '';

    // Play Nine mini card grid and scores
    let playNineGridHTML = '';
    let scoreText = '';
    if (gameType === 'playnine' && gameState.hands[player.socketId]) {
      const hand = gameState.hands[player.socketId];
      let playNineHoleScore = 0;
      for (let col = 0; col < 4; col++) {
        const topCard = hand[col];
        const bottomCard = hand[col + 4];
        if (topCard && bottomCard && topCard.revealed && bottomCard.revealed && topCard.value === bottomCard.value) {
          playNineHoleScore += 0; // vertical pair cancels
        } else {
          if (topCard && topCard.revealed) playNineHoleScore += topCard.value;
          if (bottomCard && bottomCard.revealed) playNineHoleScore += bottomCard.value;
        }
      }
      scoreText = `<div style="font-size: 0.75rem; font-weight: bold; color: var(--accent-color); margin-top: 2px;">Golpes: ${playNineHoleScore}</div>`;
      
      playNineGridHTML = `<div class="playnine-mini-grid" style="display: grid; grid-template-columns: repeat(4, 25px); gap: 2px; margin-top: 5px; justify-content: center; pointer-events: none;">`;
      hand.forEach((card, idx) => {
        const cardSVG = window.createPlayNineCardSVG(card.value, card.revealed, { class: 'mini-card' });
        playNineGridHTML += `<div style="width: 25px; height: 37px; border-radius: 2px; overflow: hidden; background: #2e7d32;">${cardSVG}</div>`;
      });
      playNineGridHTML += `</div>`;
    }

    spotDiv.innerHTML = `
      <div class="player-avatar">
        ${initials}
        ${roleBadge}
      </div>
      <div class="player-name">${player.name}</div>
      ${gameType === 'playnine' ? scoreText : trickWinsBadge}
      ${gameType === 'playnine' ? playNineGridHTML : `
        <div class="played-card-slot" id="played-card-seat-${i}">
          <!-- Played card rendered here -->
        </div>
      `}
    `;

    tableSeatsContainer.appendChild(spotDiv);

    // If player played a card in this trick, render it
    if (gameType !== 'playnine' && played) {
      const slot = document.getElementById(`played-card-seat-${i}`);
      if (slot) {
        slot.innerHTML = window.createCardSVG(played.card.suit, played.card.number);
        const playedSvg = slot.firstElementChild;
        if (playedSvg) {
          playedSvg.style.cursor = 'pointer';
          playedSvg.addEventListener('click', () => {
            alertFlash(`🃏 Carta de ${player.name}: ${getCardNameSpanish(played.card)}`);
          });
        }
      }
    }
  }

  // 6. Sidebar Panels toggle
  // Envido signs
  if (gameType === 'envido' && myTeam !== null) {
    signsPanel.classList.remove('hidden');
    
    const partnerDirector = players.find(p => p && p.team === myTeam && p.isDirector);
    directorNameLabel.innerText = partnerDirector ? partnerDirector.name : 'Ninguno';

    if (myRole === 'director') {
      isDirectorLabel.classList.remove('hidden');
      directorControls.classList.remove('hidden');
      playerSignsControls.classList.add('hidden');
    } else {
      isDirectorLabel.classList.add('hidden');
      directorControls.classList.add('hidden');
      playerSignsControls.classList.remove('hidden');
    }
  } else {
    signsPanel.classList.add('hidden');
  }

  // Tute declarations
  if (gameType === 'tute' && mySeat !== null && gameState.status === 'playing') {
    tuteDeclarationsPanel.classList.remove('hidden');
    checkTuteCantoOptions(gameState);
  } else {
    tuteDeclarationsPanel.classList.add('hidden');
  }

  // Round Actions Panel (Control de Partida)
  const roundActionsPanel = document.getElementById('round-actions-panel');
  const btnCountPoints = document.getElementById('btn-count-points');
  const btnNextRound = document.getElementById('btn-next-round');
  const btnNewGame = document.getElementById('btn-new-game');

  let showRoundActionsPanel = false;

  // 1. Contar Puntos button: Tute only, during round_end_counting status
  if (gameType === 'tute' && gameState.status === 'round_end_counting') {
    btnCountPoints.style.display = 'block';
    showRoundActionsPanel = true;
  } else {
    btnCountPoints.style.display = 'none';
  }

  // 2. Siguiente Ronda / Hoyo button
  if (gameType === 'playnine' && gameState.status === 'playing_nine_score') {
    btnNextRound.innerText = '⛳ Siguiente Hoyo';
    btnNextRound.style.display = 'block';
    showRoundActionsPanel = true;
  } else if (gameType === 'tute' && gameState.status === 'round_results') {
    btnNextRound.innerText = '🔁 Siguiente Ronda';
    btnNextRound.style.display = 'block';
    showRoundActionsPanel = true;
  } else {
    btnNextRound.style.display = 'none';
  }

  // 3. Nueva Partida / Reiniciar Torneo button
  if (gameType === 'playnine' && gameState.status === 'playing_nine_end') {
    btnNewGame.innerText = '⛳ Reiniciar Torneo';
    btnNewGame.style.display = 'block';
    showRoundActionsPanel = true;
  } else if (gameState.status === 'game_end') {
    btnNewGame.innerText = '🎮 Nueva Partida';
    btnNewGame.style.display = 'block';
    showRoundActionsPanel = true;
  } else {
    btnNewGame.style.display = 'none';
  }

  if (showRoundActionsPanel) {
    roundActionsPanel.classList.remove('hidden');
  } else {
    roundActionsPanel.classList.add('hidden');
  }

  // 7. Render Player Hand
  renderPlayerHand(gameState);
}

// RENDER PLAYER HAND CARDS
let playNineSelectedInitial = []; // Tracker for initial setup reveals (max 2 cards)

function renderPlayNineHand(gameState) {
  playerHandContainer.innerHTML = '';
  
  if (mySeat !== null) {
    playerRoleIndicator.innerText = `Tu Asiento: ${mySeat + 1}`;
  } else {
    playerRoleIndicator.innerText = 'Espectador';
  }

  // Hide Tute/Envido controls
  btnPlayCard.disabled = true;
  btnPlayCard.style.display = 'none';
  const btnSortSuit = document.getElementById('btn-sort-suit');
  if (btnSortSuit) btnSortSuit.style.display = 'none';

  const hand = gameState.hands[socket.id];
  if (!hand || hand.length === 0) {
    playerHandContainer.innerHTML = '<span style="color:#666;">Sin cartas en mano</span>';
    btnPlayNinePass.style.display = 'none';
    return;
  }

  // Toggle playnine pass button if player has exactly 1 hidden card left on their turn
  const isMyTurnToDraw = (gameState.currentTurn === mySeat && gameState.status === 'playing_nine' && gameState.turnPhase === 'draw');
  const hiddenCount = hand.filter(c => !c.revealed).length;
  if (isMyTurnToDraw && hiddenCount === 1) {
    btnPlayNinePass.style.display = 'block';
  } else {
    btnPlayNinePass.style.display = 'none';
  }

  // Grid styles for 2x4 cards layout
  playerHandContainer.style.display = 'grid';
  playerHandContainer.style.gridTemplateColumns = 'repeat(4, minmax(70px, 90px))';
  playerHandContainer.style.gap = '8px';
  playerHandContainer.style.justifyContent = 'center';
  playerHandContainer.style.padding = '5px 10px';
  playerHandContainer.style.overflow = 'visible';

  hand.forEach((card, index) => {
    const cardWrapper = document.createElement('div');
    cardWrapper.style.width = '100%';
    cardWrapper.style.aspectRatio = '2/3';
    cardWrapper.style.borderRadius = '6px';
    cardWrapper.style.overflow = 'hidden';
    cardWrapper.style.cursor = 'pointer';
    cardWrapper.style.position = 'relative';

    const isSelected = playNineSelectedInitial.includes(card.id);

    cardWrapper.innerHTML = window.createPlayNineCardSVG(card.value, card.revealed, { selected: isSelected });

    // Interactive actions choice overlay if this card is currently selected for replace/flip decision
    if (gameState.status === 'playing_nine' && gameState.currentTurn === mySeat && gameState.turnPhase === 'place' && gameState.drawnFrom === 'deck' && index === activeChoiceCardIndex) {
      const overlay = document.createElement('div');
      overlay.style.position = 'absolute';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.background = 'rgba(0,0,0,0.85)';
      overlay.style.display = 'flex';
      overlay.style.flexDirection = 'column';
      overlay.style.justifyContent = 'center';
      overlay.style.alignItems = 'center';
      overlay.style.gap = '5px';
      overlay.style.zIndex = '10';
      overlay.style.padding = '4px';
      overlay.style.boxSizing = 'border-box';

      // Reemplazar button
      const btnReplace = document.createElement('button');
      btnReplace.className = 'btn btn-warning';
      btnReplace.style.width = '95%';
      btnReplace.style.fontSize = '9px';
      btnReplace.style.padding = '4px 0';
      btnReplace.style.lineHeight = '1';
      btnReplace.style.fontWeight = 'bold';
      btnReplace.innerText = 'Reemplazar';
      btnReplace.addEventListener('click', (e) => {
        e.stopPropagation();
        socket.emit('playnine_place_card', { roomId, cardIndex: index });
        activeChoiceCardIndex = null;
      });

      // Girar button
      const btnFlip = document.createElement('button');
      btnFlip.className = 'btn btn-primary';
      btnFlip.style.width = '95%';
      btnFlip.style.fontSize = '9px';
      btnFlip.style.padding = '4px 0';
      btnFlip.style.lineHeight = '1';
      btnFlip.style.fontWeight = 'bold';
      btnFlip.innerText = 'Girar';
      btnFlip.addEventListener('click', (e) => {
        e.stopPropagation();
        socket.emit('playnine_discard_and_reveal', { roomId, cardIndex: index });
        activeChoiceCardIndex = null;
      });

      // Cancelar button
      const btnCancel = document.createElement('button');
      btnCancel.className = 'btn btn-xs';
      btnCancel.style.width = '95%';
      btnCancel.style.fontSize = '8px';
      btnCancel.style.padding = '2px 0';
      btnCancel.style.lineHeight = '1';
      btnCancel.style.background = '#444';
      btnCancel.style.color = '#ccc';
      btnCancel.style.border = 'none';
      btnCancel.innerText = 'Cancelar';
      btnCancel.addEventListener('click', (e) => {
        e.stopPropagation();
        activeChoiceCardIndex = null;
        renderPlayNineHand(gameState);
      });

      overlay.appendChild(btnReplace);
      overlay.appendChild(btnFlip);
      overlay.appendChild(btnCancel);
      cardWrapper.appendChild(overlay);
    }

    // Interactive actions
    cardWrapper.addEventListener('click', () => {
      if (gameState.status === 'playing_nine_setup') {
        if (card.revealed) return; // already face up
        
        const isSel = playNineSelectedInitial.indexOf(card.id);
        if (isSel !== -1) {
          playNineSelectedInitial.splice(isSel, 1);
        } else {
          if (playNineSelectedInitial.length < 2) {
            playNineSelectedInitial.push(card.id);
          }
        }
        
        renderPlayNineHand(gameState); // redraw local setup highlight
        
        // Autocompletes initial reveal once 2 are selected
        if (playNineSelectedInitial.length === 2) {
          socket.emit('playnine_reveal_initial', { roomId, cardIds: playNineSelectedInitial });
          playNineSelectedInitial = []; // clear
        }
      } else if (gameState.status === 'playing_nine') {
        if (gameState.currentTurn !== mySeat) {
          alertFlash("No es tu turno.");
          return;
        }

        if (gameState.turnPhase !== 'place' || !gameState.drawnCard) {
          alertFlash("Primero roba del mazo o de la pila de descarte.");
          return;
        }

        // Place drawn card logic
        if (!card.revealed && gameState.drawnFrom === 'deck') {
          // Instead of confirm popup, set index to show action buttons overlay
          activeChoiceCardIndex = index;
          renderPlayNineHand(gameState);
        } else {
          // Forced replacement (clicked revealed card, or drawn from discard)
          socket.emit('playnine_place_card', { roomId, cardIndex: index });
          activeChoiceCardIndex = null;
        }
      }
    });

    playerHandContainer.appendChild(cardWrapper);
  });
}

function renderPlayerHand(gameState) {
  if (roomState && roomState.gameType === 'playnine') {
    renderPlayNineHand(gameState);
    return;
  }

  // Restore standard Envido/Tute hand container styles
  playerHandContainer.style.display = 'flex';
  playerHandContainer.style.gridTemplateColumns = 'none';
  playerHandContainer.style.gap = '0px';
  playerHandContainer.style.justifyContent = 'flex-start';
  playerHandContainer.style.padding = '0px';
  
  btnPlayCard.style.display = 'block';
  btnPlayNinePass.style.display = 'none';
  const btnSortSuit = document.getElementById('btn-sort-suit');
  if (btnSortSuit) btnSortSuit.style.display = 'block';

  playerHandContainer.innerHTML = '';
  
  let hand = [...(gameState.hands[socket.id] || [])];
  
  if (mySeat !== null) {
    playerRoleIndicator.innerText = `Tu Asiento: ${mySeat + 1}`;
  } else {
    playerRoleIndicator.innerText = 'Espectador';
  }

  if (hand.length === 0 && gameState.status === 'playing') {
    playerHandContainer.innerHTML = '<span style="color:#666;">Sin cartas en mano</span>';
    btnPlayCard.disabled = true;
    return;
  }

  // Sort hand if requested
  if (isHandSortedBySuit) {
    const suitOrder = { oros: 1, copas: 2, espadas: 3, bastos: 4 };
    const rankOrder = { 1: 10, 2: 9, 12: 8, 11: 7, 10: 6, 7: 5, 6: 4, 5: 3, 4: 2, 3: 1 };
    
    hand.sort((a, b) => {
      if (a.suit !== b.suit) {
        return suitOrder[a.suit] - suitOrder[b.suit];
      }
      return rankOrder[b.number] - rankOrder[a.number]; // Descending rank order
    });
  }

  hand.forEach((card, index) => {
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'card-wrapper';
    cardWrapper.style.zIndex = index + 1;
    
    const isSelected = (gameState.status === 'discard')
      ? (selectedDiscardCard && selectedDiscardCard.suit === card.suit && selectedDiscardCard.number === card.number)
      : (selectedCard && selectedCard.suit === card.suit && selectedCard.number === card.number);
    
    cardWrapper.innerHTML = window.createCardSVG(card.suit, card.number, { selected: isSelected });
    
    const svgEl = cardWrapper.firstElementChild;
    if (svgEl) {
      svgEl.classList.add('card-svg');
    }
    
    // Select Card Click
    svgEl.addEventListener('click', () => {
      if (gameState.status === 'discard' && gameState.auctionHighestBidder === mySeat) {
        selectedDiscardCard = card;
        renderPlayerHand(gameState);
        discardSelectedInfo.innerText = `Descarte: ${getCardNameSpanish(card)}`;
        btnConfirmDiscard.disabled = false;
        alertFlash(`🃏 Descarte seleccionado: ${getCardNameSpanish(card)}`);
        return;
      }

      if (gameState.status !== 'playing') return;
      selectedCard = card;
      renderPlayerHand(gameState); // Redraw hand to show selection border
      alertFlash(`🃏 Has seleccionado: ${getCardNameSpanish(card)}`);
    });

    // Play Card Double-Click
    svgEl.addEventListener('dblclick', () => {
      if (gameState.status !== 'playing' || gameState.currentTurn !== mySeat) return;
      selectedCard = card;
      playSelectedCard();
    });

    playerHandContainer.appendChild(cardWrapper);
  });

  // Enable/Disable Play Card button
  const isMyTurn = (gameState.currentTurn === mySeat && gameState.status === 'playing');
  btnPlayCard.disabled = (!isMyTurn || !selectedCard);
}

// PLAY SELECTED CARD TRIGGER
function playSelectedCard() {
  if (selectedCard && roomState) {
    socket.emit('play_card', { roomId: roomId, card: selectedCard });
    selectedCard = null;
  }
}
btnPlayCard.addEventListener('click', playSelectedCard);

// SWAP VIRA TRIGGER
btnSwapVira.addEventListener('click', () => {
  if (roomState) {
    socket.emit('swap_vira', { roomId: roomId });
  }
});

// TUTE SUBASTADO EVENT LISTENERS
btnAuctionBid.addEventListener('click', () => {
  const bidVal = parseInt(auctionBidInput.value);
  if (roomState && bidVal) {
    socket.emit('tute_bid', { roomId, value: bidVal });
  }
});

btnAuctionPass.addEventListener('click', () => {
  if (roomState) {
    socket.emit('tute_pass', { roomId });
  }
});

document.querySelectorAll('.suit-selector .btn-suit').forEach(btn => {
  const suit = btn.getAttribute('data-suit');
  if (window.getSuitSVG) {
    btn.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 4px 0;">
        ${window.getSuitSVG(suit, 32)}
        <span style="font-size: 0.8rem; font-weight: bold; text-transform: uppercase;">${suit}</span>
      </div>
    `;
  }
  btn.addEventListener('click', () => {
    document.querySelectorAll('.suit-selector .btn-suit').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedSuit = suit;
    updateConfirmSelectionState();
  });
});

btnTakeMonte.addEventListener('click', () => {
  wantsMonte = true;
  btnTakeMonte.classList.add('active');
  btnLeaveMonte.classList.remove('active');
  selectionDiscardInfo.innerText = "Decisión: Coger Monte (descartarás tras confirmar)";
  updateConfirmSelectionState();
});

btnLeaveMonte.addEventListener('click', () => {
  wantsMonte = false;
  btnTakeMonte.classList.remove('active');
  btnLeaveMonte.classList.add('active');
  selectionDiscardInfo.innerText = "Decisión: Dejar Monte (sin descarte)";
  updateConfirmSelectionState();
});

btnConfirmSelection.addEventListener('click', () => {
  if (roomState && selectedSuit && wantsMonte !== null) {
    socket.emit('select_trump_discard', {
      roomId,
      suit: selectedSuit,
      wantsMonte: wantsMonte
    });
    selectedSuit = null;
    selectedDiscardCard = null;
    document.querySelectorAll('.suit-selector .btn-suit').forEach(b => b.classList.remove('active'));
    updateConfirmSelectionState();
  }
});

btnConfirmDiscard.addEventListener('click', () => {
  if (roomState && selectedDiscardCard) {
    socket.emit('confirm_discard', {
      roomId,
      card: selectedDiscardCard
    });
    selectedDiscardCard = null;
    btnConfirmDiscard.disabled = true;
  }
});

function updateConfirmSelectionState() {
  if (selectedSuit && wantsMonte !== null) {
    btnConfirmSelection.disabled = false;
  } else {
    btnConfirmSelection.disabled = true;
  }
}

// SORT HAND TRIGGER
btnSortSuit.addEventListener('click', () => {
  isHandSortedBySuit = !isHandSortedBySuit;
  if (isHandSortedBySuit) {
    btnSortSuit.style.background = 'var(--accent-color)';
    btnSortSuit.style.color = 'black';
  } else {
    btnSortSuit.style.background = 'transparent';
    btnSortSuit.style.color = 'var(--accent-color)';
  }
  if (roomState) {
    renderPlayerHand(roomState.gameState);
  }
});

// SIGN SEND TRIGGERS (Envido)
document.querySelectorAll('.btn-sign').forEach(button => {
  button.addEventListener('click', () => {
    const sign = button.getAttribute('data-sign');
    socket.emit('send_sign', { roomId, signName: sign });
  });
});

// ORDER SEND TRIGGERS (Envido Director)
document.querySelectorAll('.btn-order').forEach(button => {
  button.addEventListener('click', () => {
    const orderText = button.getAttribute('data-order');
    socket.emit('send_order', { roomId, orderText });
  });
});

// TUTE CANTOS VALIDATION & TRIGGERS
function checkTuteCantoOptions(gameState) {
  btnTute40.disabled = true;
  btnTute20.disabled = true;
  btnTuteDeclare.disabled = true;

  const hand = gameState.hands[socket.id] || [];
  if (hand.length === 0) return;

  const mySeatIndex = mySeat;
  if (mySeatIndex === null) return;

  // Has player won at least one trick?
  const wonTrick = gameState.tricks.some(t => t.winnerSeat === mySeatIndex);
  if (!wonTrick) return;

  const trumpSuit = gameState.trumpSuit;

  // Analyze hand for Kings (12) and Knights (11)
  const kings = hand.filter(c => c.number === 12);
  const knights = hand.filter(c => c.number === 11);

  // Check if player has King & Knight of same suit
  const pairSuits = [];
  kings.forEach(k => {
    if (knights.some(kn => kn.suit === k.suit)) {
      pairSuits.push(k.suit);
    }
  });

  // Check already declared suits
  const declaredCantos = gameState.tuteCantos[mySeatIndex] || [];
  const declaredSuits = declaredCantos.map(c => c.suit);

  pairSuits.forEach(suit => {
    if (!declaredSuits.includes(suit)) {
      if (suit === trumpSuit) {
        btnTute40.disabled = false;
        btnTute40.onclick = () => socket.emit('tute_canto', { roomId, cantoType: '40', suit });
      } else {
        btnTute20.disabled = false;
        btnTute20.onclick = () => socket.emit('tute_canto', { roomId, cantoType: '20', suit });
      }
    }
  });

  // Check for Tute (4 Kings or 4 Knights) - only check at start, but can be checked as long as they hold them
  const allKings = hand.filter(c => c.number === 12).length;
  const allKnights = hand.filter(c => c.number === 11).length;

  if (allKings === 4) {
    btnTuteDeclare.disabled = false;
    btnTuteDeclare.onclick = () => socket.emit('tute_declare_victory', { roomId, type: 'reyes' });
  } else if (allKnights === 4) {
    btnTuteDeclare.disabled = false;
    btnTuteDeclare.onclick = () => socket.emit('tute_declare_victory', { roomId, type: 'caballos' });
  }
}

// WEBRTC PEER-TO-PEER VOICE CHAT LOGIC
let voiceStream = null;
const peerConnections = {};
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

const btnLobbyVoice = document.getElementById('btn-lobby-voice');
const btnGameVoice = document.getElementById('btn-game-voice');

// Helper to resolve player names for voice status logs
function getPlayerNameBySocketId(socketId) {
  if (roomState && roomState.players) {
    const p = roomState.players.find(player => player && player.socketId === socketId);
    return p ? p.name : 'Jugador';
  }
  return 'Jugador';
}

async function connectVoiceChat() {
  if (voiceStream) return;
  try {
    // Request both camera and microphone
    voiceStream = await navigator.mediaDevices.getUserMedia({ 
      audio: true, 
      video: { width: 240, height: 180, frameRate: 15 } 
    });
    logMsg("🎙️/📷 Cámara y micrófono activados. Te has unido al canal de video.", "system");
    setupLocalVideo();
    
    // Show toggle buttons controls
    const controls = document.getElementById('video-controls');
    if (controls) controls.classList.remove('hidden');
    isAudioEnabled = true;
    isVideoEnabled = true;
    updateMediaButtonsUI();
    
    // Update button visual status
    const buttons = [btnLobbyVoice, btnGameVoice];
    buttons.forEach(btn => {
      if (btn) {
        btn.innerText = '🎙️/📷 Conectado';
        btn.style.background = '#4caf50';
        btn.style.color = 'white';
        btn.disabled = true;
      }
    });

    // Add local tracks to existing peer connections
    for (const peerId in peerConnections) {
      const pc = peerConnections[peerId];
      voiceStream.getTracks().forEach(track => {
        const senders = pc.getSenders();
        const alreadyAdded = senders.some(s => s.track === track);
        if (!alreadyAdded) {
          pc.addTrack(track, voiceStream);
        }
      });
      // Trigger renegotiation
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc_signal', { to: peerId, signal: { type: 'offer', sdp: offer.sdp } });
      } catch (e) {
        console.error("Error al renegociar tracks:", e);
      }
    }
    
    socket.emit('voice_ready', { roomId });
  } catch (err) {
    console.warn("Cámara no disponible, intentando solo micrófono:", err);
    try {
      // Fallback: request only microphone
      voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      logMsg("🎙️ Micrófono activado. Te has unido al canal de voz.", "system");
      setupLocalVideo(); // Displays a placeholder/avatar in the video box instead of raw feed
      
      // Show toggle buttons controls
      const controls = document.getElementById('video-controls');
      if (controls) controls.classList.remove('hidden');
      isAudioEnabled = true;
      isVideoEnabled = false; // No video available
      updateMediaButtonsUI();
      
      const buttons = [btnLobbyVoice, btnGameVoice];
      buttons.forEach(btn => {
        if (btn) {
          btn.innerText = '🎙️ Voz Conectada';
          btn.style.background = '#4caf50';
          btn.style.color = 'white';
          btn.disabled = true;
        }
      });
      
      for (const peerId in peerConnections) {
        const pc = peerConnections[peerId];
        voiceStream.getTracks().forEach(track => {
          const senders = pc.getSenders();
          const alreadyAdded = senders.some(s => s.track === track);
          if (!alreadyAdded) {
            pc.addTrack(track, voiceStream);
          }
        });
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc_signal', { to: peerId, signal: { type: 'offer', sdp: offer.sdp } });
        } catch (e) {
          console.error("Error al renegociar tracks:", e);
        }
      }
      
      socket.emit('voice_ready', { roomId });
    } catch (err2) {
      console.error("Error al activar micrófono:", err2);
      logMsg("⚠️ Error de permisos: No se pudo acceder al micrófono ni a la cámara.", "system");
    }
  }
}

function setupLocalVideo() {
  const container = document.getElementById('video-container');
  if (!container) return;
  
  const existing = document.getElementById('local-video-wrapper');
  if (existing) existing.remove();
  
  const wrapper = document.createElement('div');
  wrapper.id = 'local-video-wrapper';
  wrapper.className = 'video-wrapper local-video';
  
  const video = document.createElement('video');
  video.autoplay = true;
  video.muted = true; // Mute self to prevent echo feedback!
  video.setAttribute('playsinline', 'true');
  video.srcObject = voiceStream;
  
  const label = document.createElement('div');
  label.className = 'video-label';
  label.innerText = `${myName} (Tú)`;
  
  wrapper.appendChild(video);
  wrapper.appendChild(label);
  container.appendChild(wrapper);
}

if (btnLobbyVoice) btnLobbyVoice.addEventListener('click', connectVoiceChat);
if (btnGameVoice) btnGameVoice.addEventListener('click', connectVoiceChat);

// Create peer connection with another client
function createPeerConnection(peerId, isInitiator) {
  const pc = new RTCPeerConnection(rtcConfig);
  pc.iceQueue = [];

  if (voiceStream) {
    voiceStream.getTracks().forEach(track => pc.addTrack(track, voiceStream));
  }
  
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('webrtc_signal', { to: peerId, signal: { type: 'candidate', candidate: event.candidate } });
    }
  };
  
  pc.ontrack = (event) => {
    let wrapper = document.getElementById(`video-wrapper-${peerId}`);
    let videoEl = document.getElementById(`video-peer-${peerId}`);
    const isNew = !wrapper;
    
    if (isNew) {
      const container = document.getElementById('video-container');
      if (container) {
        wrapper = document.createElement('div');
        wrapper.id = `video-wrapper-${peerId}`;
        wrapper.className = 'video-wrapper';
        
        videoEl = document.createElement('video');
        videoEl.id = `video-peer-${peerId}`;
        videoEl.autoplay = true;
        videoEl.setAttribute('playsinline', 'true');
        
        const label = document.createElement('div');
        label.className = 'video-label';
        label.innerText = getPlayerNameBySocketId(peerId);
        
        wrapper.appendChild(videoEl);
        wrapper.appendChild(label);
        container.appendChild(wrapper);
        
        const peerName = getPlayerNameBySocketId(peerId);
        logMsg(`🔊 Conexión multimedia establecida con ${peerName}.`, "system");
      }
    }
    
    if (videoEl) {
      if (event.streams && event.streams[0]) {
        videoEl.srcObject = event.streams[0];
      } else {
        if (!videoEl.srcObject) {
          videoEl.srcObject = new MediaStream();
        }
        videoEl.srcObject.addTrack(event.track);
      }
      
      // Explicitly trigger playback and handle browser restrictions
      videoEl.play().catch(err => {
        console.warn("Autoplay bloqueado por el navegador. Se reproducira al hacer click.", err);
        const playOnInteraction = () => {
          videoEl.play().catch(e => console.error("Fallo de reproduccion manual:", e));
        };
        document.body.addEventListener('click', playOnInteraction, { once: true });
      });
    }
  };
  
  if (isInitiator) {
    setTimeout(async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc_signal', { to: peerId, signal: { type: 'offer', sdp: offer.sdp } });
      } catch (err) {
        console.error("Error al crear oferta SDP:", err);
      }
    }, 150);
  }
  
  return pc;
}

// Signaling socket events
socket.on('voice_player_ready', async ({ socketId }) => {
  if (socketId === socket.id) return;
  if (voiceStream) {
    const pc = createPeerConnection(socketId, true);
    peerConnections[socketId] = pc;
  }
});

socket.on('webrtc_signal', async ({ from, signal }) => {
  let pc = peerConnections[from];
  
  if (signal.type === 'offer') {
    if (!pc) {
      pc = createPeerConnection(from, false);
      peerConnections[from] = pc;
    }
    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('webrtc_signal', { to: from, signal: { type: 'answer', sdp: answer.sdp } });
    
    // Process queued candidates
    if (pc.iceQueue && pc.iceQueue.length > 0) {
      for (const cand of pc.iceQueue) {
        await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(e => console.error("Error al añadir candidato en cola:", e));
      }
      pc.iceQueue = [];
    }
    
  } else if (signal.type === 'answer') {
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
      
      // Process queued candidates
      if (pc.iceQueue && pc.iceQueue.length > 0) {
        for (const cand of pc.iceQueue) {
          await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(e => console.error("Error al añadir candidato en cola:", e));
        }
        pc.iceQueue = [];
      }
    }
  } else if (signal.type === 'candidate') {
    if (pc) {
      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(e => console.error("Error al añadir candidato ICE:", e));
      } else {
        pc.iceQueue.push(signal.candidate);
      }
    }
  }
});

socket.on('disconnect_peer_voice', ({ socketId }) => {
  if (peerConnections[socketId]) {
    peerConnections[socketId].close();
    delete peerConnections[socketId];
  }
  const wrapper = document.getElementById(`video-wrapper-${socketId}`);
  if (wrapper) wrapper.remove();
});

socket.on('webrtc_config', ({ iceServers }) => {
  if (iceServers) {
    rtcConfig.iceServers = iceServers;
    console.log("Configuración de WebRTC cargada desde el servidor:", iceServers);
  }
});

// Toggle buttons for camera/mic
let isAudioEnabled = true;
let isVideoEnabled = true;

function updateMediaButtonsUI() {
  const btnMic = document.getElementById('btn-toggle-mic');
  const btnCam = document.getElementById('btn-toggle-cam');
  
  if (btnMic) {
    btnMic.innerText = isAudioEnabled ? '🎤 On' : '🔇 Off';
    btnMic.style.backgroundColor = isAudioEnabled ? '#4caf50' : '#f44336';
  }
  if (btnCam) {
    btnCam.innerText = isVideoEnabled ? '📷 On' : '📷 Off';
    btnCam.style.backgroundColor = isVideoEnabled ? '#4caf50' : '#f44336';
  }
}

function toggleMic() {
  if (!voiceStream) return;
  const audioTracks = voiceStream.getAudioTracks();
  if (audioTracks.length === 0) return;
  
  isAudioEnabled = !isAudioEnabled;
  audioTracks.forEach(track => track.enabled = isAudioEnabled);
  updateMediaButtonsUI();
  logMsg(isAudioEnabled ? "🎙️ Micrófono activado." : "🔇 Micrófono silenciado.", "system");
}

function toggleCam() {
  if (!voiceStream) return;
  const videoTracks = voiceStream.getVideoTracks();
  if (videoTracks.length === 0) return;
  
  isVideoEnabled = !isVideoEnabled;
  videoTracks.forEach(track => track.enabled = isVideoEnabled);
  updateMediaButtonsUI();
  logMsg(isVideoEnabled ? "📷 Cámara activada." : "📷 Cámara desactivada.", "system");
}

const elToggleMic = document.getElementById('btn-toggle-mic');
if (elToggleMic) elToggleMic.addEventListener('click', toggleMic);

const elToggleCam = document.getElementById('btn-toggle-cam');
if (elToggleCam) elToggleCam.addEventListener('click', toggleCam);

// Bind click events for Partida control panel
const elCountPoints = document.getElementById('btn-count-points');
if (elCountPoints) {
  elCountPoints.addEventListener('click', () => {
    socket.emit('count_points', { roomId });
  });
}

const elNextRound = document.getElementById('btn-next-round');
if (elNextRound) {
  elNextRound.addEventListener('click', () => {
    if (roomState && roomState.gameType === 'playnine') {
      socket.emit('playnine_next_hole', { roomId });
    } else {
      socket.emit('next_round', { roomId });
    }
  });
}

const elNewGame = document.getElementById('btn-new-game');
if (elNewGame) {
  elNewGame.addEventListener('click', () => {
    if (roomState && roomState.gameType === 'playnine') {
      socket.emit('playnine_restart', { roomId });
    } else {
      socket.emit('reset_game', { roomId });
    }
  });
}

if (btnPlayNinePass) {
  btnPlayNinePass.addEventListener('click', () => {
    socket.emit('playnine_pass', { roomId });
  });
}

// JOIN INITIAL ROOM ON LOAD
window.onload = () => {
  initRoom();
};
