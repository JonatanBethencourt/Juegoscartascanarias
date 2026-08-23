const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// Serve static client files
app.use(express.static(path.join(__dirname, 'public')));

// Global state for game rooms
const rooms = {};

// Helper: Create a standard 40-card Spanish deck
function createDeck() {
  const suits = ['oros', 'copas', 'espadas', 'bastos'];
  const numbers = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
  const deck = [];
  
  for (const suit of suits) {
    for (const number of numbers) {
      deck.push({ suit, number });
    }
  }
  return deck;
}

// Helper: Shuffle deck (Fisher-Yates)
function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Card Rank comparison helpers
function getCardRankEnvido(card, trumpSuit, ledSuit) {
  if (card.suit === trumpSuit) {
    switch (card.number) {
      case 2: return 100; // La Mala
      case 12: return 90; // Rey
      case 11: return 80; // Caballo
      case 10: return 70; // Sota
      case 1: return 60;  // As (Uno)
      case 7: return 50;
      case 6: return 40;
      case 5: return 30;
      case 4: return 20;
      case 3: return 10;
      default: return 0;
    }
  }
  if (card.suit === ledSuit) {
    switch (card.number) {
      case 12: return 9;
      case 11: return 8;
      case 10: return 7;
      case 1: return 6;
      case 7: return 5;
      case 6: return 4;
      case 5: return 3;
      case 4: return 2;
      case 3: return 1;
      case 2: return 0; // standard 2 of non-trump
      default: return 0;
    }
  }
  return -1; // Discard (different suit, not trump)
}

function getCardRankTute(card, trumpSuit, ledSuit) {
  // Raw ranks: As(1)>3>12>11>10>7>6>5>4>2
  const rawRanks = { 1: 10, 3: 9, 12: 8, 11: 7, 10: 6, 7: 5, 6: 4, 5: 3, 4: 2, 2: 1 };
  const rank = rawRanks[card.number] || 0;

  if (card.suit === trumpSuit) {
    return rank + 100;
  }
  if (card.suit === ledSuit) {
    return rank;
  }
  return -1; // Discard
}

// Points for Tute scoring
function getCardPointsTute(card) {
  switch (card.number) {
    case 1: return 11;
    case 3: return 10;
    case 12: return 4;
    case 11: return 3;
    case 10: return 2;
    default: return 0;
  }
}

// Custom 2-player Tute rank and points
function getCardRankTute2(card, trumpSuit, ledSuit) {
  // Raw ranks for 2-player Tute: As(1)>2>12>11>10>7>6>5>4>3
  const rawRanks = { 1: 10, 2: 9, 12: 8, 11: 7, 10: 6, 7: 5, 6: 4, 5: 3, 4: 2, 3: 1 };
  const rank = rawRanks[card.number] || 0;

  if (card.suit === trumpSuit) {
    return rank + 100;
  }
  if (card.suit === ledSuit) {
    return rank;
  }
  return -1; // Discard
}

function getCardPointsTute2(card) {
  switch (card.number) {
    case 1: return 11;
    case 2: return 10; // 2 is worth 10 points
    case 12: return 4;
    case 11: return 3;
    case 10: return 2;
    default: return 0;
  }
}

// Validate play for Tute (obligaciones de asistir, montar, fallar, pisar)
function validateTutePlay(playerHand, playedCard, playedCardsOnTable, trumpSuit, maxPlayers, deckCount) {
  // Card must exist in player hand
  const hasCard = playerHand.some(c => c.suit === playedCard.suit && c.number === playedCard.number);
  if (!hasCard) return false;

  // First card played in trick is always valid
  if (playedCardsOnTable.length === 0) return true;

  // In 2-player Tute, play restrictions only apply when the draw pile is empty!
  if (maxPlayers === 2 && deckCount > 0) {
    return true; // Free play during Phase 1
  }

  const firstCard = playedCardsOnTable[0].card;
  const ledSuit = firstCard.suit;

  // Find the highest card played on the table so far
  let highestTableCard = null;
  let highestTableRank = -999;
  for (const p of playedCardsOnTable) {
    const r = maxPlayers === 2
      ? getCardRankTute2(p.card, trumpSuit, ledSuit)
      : getCardRankTute(p.card, trumpSuit, ledSuit);
    if (r > highestTableRank) {
      highestTableRank = r;
      highestTableCard = p.card;
    }
  }

  const isHighestTrump = (highestTableCard.suit === trumpSuit);
  const playerHasLedSuit = playerHand.some(c => c.suit === ledSuit);

  if (playerHasLedSuit) {
    // Player MUST play led suit (asistir)
    if (playedCard.suit !== ledSuit) return false;

    // Can player beat highest card of led suit on table?
    if (!isHighestTrump) {
      // Check if player has a higher led suit card
      const highestLedSuitOnTableRank = maxPlayers === 2
        ? getCardRankTute2(highestTableCard, trumpSuit, ledSuit)
        : getCardRankTute(highestTableCard, trumpSuit, ledSuit);
      const betterLedSuitCards = playerHand.filter(c => c.suit === ledSuit && (
        maxPlayers === 2
          ? getCardRankTute2(c, trumpSuit, ledSuit) > highestLedSuitOnTableRank
          : getCardRankTute(c, trumpSuit, ledSuit) > highestLedSuitOnTableRank
      ));
      
      if (betterLedSuitCards.length > 0) {
        // Player MUST play a higher led suit card (montar)
        const playedCardRank = maxPlayers === 2
          ? getCardRankTute2(playedCard, trumpSuit, ledSuit)
          : getCardRankTute(playedCard, trumpSuit, ledSuit);
        if (playedCardRank <= highestLedSuitOnTableRank) {
          return false;
        }
      }
    }
    return true;
  } else {
    // Player doesn't have led suit. Must trump if possible (fallar/pisar)
    const playerHasTrump = playerHand.some(c => c.suit === trumpSuit);
    if (playerHasTrump) {
      if (playedCard.suit !== trumpSuit) return false;

      // If highest card is a trump, player must over-trump if possible (pisar)
      if (isHighestTrump) {
        const betterTrumps = playerHand.filter(c => c.suit === trumpSuit && (
          maxPlayers === 2
            ? getCardRankTute2(c, trumpSuit, ledSuit) > highestTableRank
            : getCardRankTute(c, trumpSuit, ledSuit) > highestTableRank
        ));
        if (betterTrumps.length > 0) {
          // Must play a higher trump
          const playedCardRank = maxPlayers === 2
            ? getCardRankTute2(playedCard, trumpSuit, ledSuit)
            : getCardRankTute(playedCard, trumpSuit, ledSuit);
          if (playedCardRank <= highestTableRank) {
            return false;
          }
        }
      }
      return true;
    }
    // No led suit and no trumps: can play any card (discard)
    return true;
  }
}

// Start a new round of cards
function startNewRound(room) {
  const gs = room.gameState;
  gs.status = 'playing';
  gs.playedCards = [];
  gs.tricks = [];
  
  // Create and shuffle deck
  let deck = createDeck();
  deck = shuffle(deck);

  // Vira (Trump Card)
  // Drawn first, suit determines trump.
  gs.viraCard = deck.pop();
  gs.trumpSuit = gs.viraCard.suit;

  if (room.gameType === 'envido') {
    gs.envidoRoundScore = { teamA: 0, teamB: 0 };
    // Deal 3 cards to each player
    room.players.forEach(p => {
      gs.hands[p.socketId] = [deck.pop(), deck.pop(), deck.pop()];
    });
  } else if (room.gameType === 'tute') {
    gs.tuteRoundScores = {};
    gs.tuteCantos = {};
    const cardsToDeal = room.maxPlayers === 2 ? 3 : 13;
    room.players.forEach(p => {
      gs.tuteRoundScores[p.seat] = 0;
      gs.tuteCantos[p.seat] = [];
      
      gs.hands[p.socketId] = [];
      for (let i = 0; i < cardsToDeal; i++) {
        gs.hands[p.socketId].push(deck.pop());
      }
    });
    // Store deck for 2-player Tute drawing
    gs.deck = deck;
  }

  // Set turn to player next to dealer
  gs.dealerSeat = (gs.dealerSeat + 1) % room.maxPlayers;
  gs.currentTurn = (gs.dealerSeat + 1) % room.maxPlayers;
  gs.leadPlayerSeat = gs.currentTurn;
  
  // Set deck count
  gs.deckCount = deck.length;
}

// Clean up player state
function disconnectPlayer(socketId) {
  for (const roomId in rooms) {
    const room = rooms[roomId];
    const playerIndex = room.players.findIndex(p => p && p.socketId === socketId);
    if (playerIndex !== -1) {
      const player = room.players[playerIndex];
      room.players[playerIndex] = null; // empty the seat
      
      // Reset game if it was running
      if (room.gameState.status !== 'lobby') {
        room.gameState.status = 'lobby';
        room.gameState.hands = {};
        room.gameState.playedCards = [];
      }
      return { roomId, name: player.name };
    }
  }
  return null;
}

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // JOIN ROOM
  socket.on('join_room', ({ roomId, name }) => {
    if (!roomId || !name) return;
    
    socket.join(roomId);
    
    // Create room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = {
        id: roomId,
        gameType: 'envido', // default
        maxPlayers: 4,      // default
        players: Array(4).fill(null),
        gameState: {
          status: 'lobby',
          dealerSeat: -1,
          currentTurn: 0,
          viraCard: null,
          hands: {},
          playedCards: [],
          tricks: [],
          scores: { teamA: 0, teamB: 0 },
          tuteMatchPoints: {}
        }
      };
    }

    const room = rooms[roomId];
    
    // Notify clients of current room state
    io.to(roomId).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: room.gameState
    });
    
    socket.emit('log_message', { text: `Te has unido a la sala ${roomId}.`, type: 'system' });
    socket.to(roomId).emit('log_message', { text: `${name} se ha unido a la sala.`, type: 'system' });
  });

  // CHANGE GAME CONFIG (only in lobby)
  socket.on('change_config', ({ roomId, gameType, maxPlayers }) => {
    const room = rooms[roomId];
    if (!room || room.gameState.status !== 'lobby') return;

    room.gameType = gameType;
    room.maxPlayers = parseInt(maxPlayers);
    room.players = Array(room.maxPlayers).fill(null);
    
    // Reset scores
    if (gameType === 'envido') {
      room.gameState.scores = { teamA: 0, teamB: 0 };
    } else {
      room.gameState.tuteMatchPoints = { 0: 0, 1: 0, 2: 0 };
    }

    io.to(roomId).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: room.gameState
    });

    io.to(roomId).emit('log_message', { 
      text: `Configuracion cambiada: ${gameType === 'envido' ? 'Envido' : 'Tute'} (${maxPlayers} jugadores)`, 
      type: 'system' 
    });
  });

  // TAKE A SEAT
  socket.on('take_seat', ({ roomId, name, seatIndex }) => {
    const room = rooms[roomId];
    if (!room) return;

    const seat = parseInt(seatIndex);
    if (seat < 0 || seat >= room.maxPlayers) return;

    // Check if player is already seated elsewhere
    const currentSeatIndex = room.players.findIndex(p => p && p.socketId === socket.id);
    if (currentSeatIndex !== -1) {
      room.players[currentSeatIndex] = null; // vacate previous seat
    }

    // Check if target seat is taken
    if (room.players[seat] !== null) {
      socket.emit('log_message', { text: `El asiento ${seat + 1} ya esta ocupado.`, type: 'system' });
      return;
    }

    // Determine team (alternating)
    let team = null;
    let isDirector = false;
    if (room.gameType === 'envido') {
      team = (seat % 2 === 0) ? 'A' : 'B';
      // Default director is the last player of each team (seat 2 and 3 in 4-player, 4 and 5 in 6-player)
      const lastTeamASeat = room.maxPlayers - 2;
      const lastTeamBSeat = room.maxPlayers - 1;
      if (seat === lastTeamASeat || seat === lastTeamBSeat) {
        isDirector = true;
      }
    }

    // Place player in seat
    room.players[seat] = {
      socketId: socket.id,
      name,
      seat,
      team,
      isDirector
    };

    // Update directors if seating changed
    if (room.gameType === 'envido') {
      const teamAPlayers = room.players.filter(p => p && p.team === 'A');
      const teamBPlayers = room.players.filter(p => p && p.team === 'B');
      
      // Reset directors
      room.players.forEach(p => { if (p) p.isDirector = false; });

      // Designate director to the one with the highest seat in each team
      let maxSeatA = -1, directorA = null;
      let maxSeatB = -1, directorB = null;

      room.players.forEach(p => {
        if (!p) return;
        if (p.team === 'A' && p.seat > maxSeatA) { maxSeatA = p.seat; directorA = p; }
        if (p.team === 'B' && p.seat > maxSeatB) { maxSeatB = p.seat; directorB = p; }
      });

      if (directorA) directorA.isDirector = true;
      if (directorB) directorB.isDirector = true;
    }

    io.to(roomId).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: room.gameState
    });

    io.to(roomId).emit('log_message', { 
      text: `${name} se sento en el Asiento ${seat + 1} ${team ? `(Equipo ${team}${room.players[seat].isDirector ? ' - Director' : ''})` : ''}`, 
      type: 'system' 
    });
  });

  // START GAME
  socket.on('start_game', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.gameState.status !== 'lobby') return;

    // Check if all seats are full
    const fullSeats = room.players.filter(p => p !== null).length;
    if (fullSeats !== room.maxPlayers) {
      socket.emit('log_message', { text: `No se puede iniciar hasta que se ocupen todos los asientos.`, type: 'system' });
      return;
    }

    // Initialize scores
    if (room.gameType === 'envido') {
      room.gameState.scores = { teamA: 0, teamB: 0 };
    } else {
      room.gameState.tuteMatchPoints = {};
      room.players.forEach(p => {
        room.gameState.tuteMatchPoints[p.seat] = 0;
      });
    }

    startNewRound(room);

    io.to(roomId).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: room.gameState
    });

    io.to(roomId).emit('log_message', { text: `¡La partida ha comenzado! Distribuyendo cartas...`, type: 'system' });
    io.to(roomId).emit('log_message', { text: `La vira es el ${room.gameState.viraCard.number} de ${room.gameState.viraCard.suit.toUpperCase()}`, type: 'system' });
  });

  // PLAY CARD
  socket.on('play_card', ({ roomId, card }) => {
    const room = rooms[roomId];
    if (!room || room.gameState.status !== 'playing') return;

    const gs = room.gameState;
    
    // Find player seat
    const player = room.players.find(p => p && p.socketId === socket.id);
    if (!player) return;

    // Check if it's player's turn
    if (gs.currentTurn !== player.seat) {
      socket.emit('log_message', { text: `No es tu turno.`, type: 'system' });
      return;
    }

    const playerHand = gs.hands[socket.id];
    const cardIndex = playerHand.findIndex(c => c.suit === card.suit && c.number === card.number);
    if (cardIndex === -1) return;

    // Validate play for Tute
    if (room.gameType === 'tute') {
      const isValid = validateTutePlay(playerHand, card, gs.playedCards, gs.trumpSuit, room.maxPlayers, gs.deckCount);
      if (!isValid) {
        socket.emit('log_message', { text: `¡Jugada invalida! En el Tute debes asistir, montar o fallar segun corresponda.`, type: 'system' });
        return;
      }
    }

    // Remove card from hand
    playerHand.splice(cardIndex, 1);

    // Place card on table
    gs.playedCards.push({
      seat: player.seat,
      playerId: socket.id,
      card
    });

    io.to(roomId).emit('log_message', { text: `${player.name} jugo el ${card.number} de ${card.suit}`, type: 'chat' });

    // Sync room state
    io.to(roomId).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: gs
    });

    // Check if all players have played a card in this trick
    if (gs.playedCards.length === room.maxPlayers) {
      // Evaluate trick winner after a short delay so players can see the cards
      setTimeout(() => {
        evaluateTrick(room);
      }, 1500);
    } else {
      // Move turn to next player
      gs.currentTurn = (gs.currentTurn + 1) % room.maxPlayers;
      io.to(roomId).emit('room_state', {
        gameType: room.gameType,
        maxPlayers: room.maxPlayers,
        players: room.players,
        gameState: gs
      });
    }
  });

  // PRIVATE SIGN ROUTING (Envido only)
  socket.on('send_sign', ({ roomId, signName }) => {
    const room = rooms[roomId];
    if (!room || room.gameType !== 'envido') return;

    const sender = room.players.find(p => p && p.socketId === socket.id);
    if (!sender) return;

    // Find the Director of the same team
    const director = room.players.find(p => p && p.team === sender.team && p.isDirector);
    if (!director) return;

    // Send sign only to the Director
    io.to(director.socketId).emit('receive_sign', {
      senderName: sender.name,
      senderSeat: sender.seat,
      signName
    });

    // Acknowledge to sender
    socket.emit('team_log', { text: `Le hiciste la seña (${signName}) a tu director ${director.name}.`, type: 'secret' });
    io.to(director.socketId).emit('team_log', { text: `${sender.name} te hace seña de: ${signName.toUpperCase()}`, type: 'secret' });
  });

  // DIRECTIVE/ORDER ROUTING (Envido only)
  socket.on('send_order', ({ roomId, orderText }) => {
    const room = rooms[roomId];
    if (!room || room.gameType !== 'envido') return;

    const director = room.players.find(p => p && p.socketId === socket.id && p.isDirector);
    if (!director) return;

    // Send to all teammates
    room.players.forEach(p => {
      if (p && p.team === director.team) {
        io.to(p.socketId).emit('receive_order', {
          directorName: director.name,
          orderText
        });
        io.to(p.socketId).emit('team_log', { text: `[DIRECTOR] ${director.name} ordena: ${orderText}`, type: 'secret' });
      }
    });
  });

  // TUTE CANTOS (Declarations)
  socket.on('tute_canto', ({ roomId, cantoType, suit }) => {
    const room = rooms[roomId];
    if (!room || room.gameType !== 'tute') return;

    const player = room.players.find(p => p && p.socketId === socket.id);
    if (!player) return;

    const gs = room.gameState;
    
    // Validate that they have won at least one trick
    const playerWonTrick = gs.tricks.some(t => t.winnerSeat === player.seat);
    if (!playerWonTrick) {
      socket.emit('log_message', { text: `No puedes cantar hasta ganar una baza.`, type: 'system' });
      return;
    }

    const points = cantoType === '40' ? 40 : 20;
    
    // Register canto
    gs.tuteCantos[player.seat].push({ cantoType, suit, points });
    
    io.to(roomId).emit('log_message', { 
      text: `📢 ¡${player.name} canta las ${cantoType} en ${suit.toUpperCase()}! (+${points} puntos)`, 
      type: 'system' 
    });

    io.to(roomId).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: gs
    });
  });

  // TUTE DECLARE IMMEDIATELY (4 Kings or 4 Knights)
  socket.on('tute_declare_victory', ({ roomId, type }) => {
    const room = rooms[roomId];
    if (!room || room.gameType !== 'tute') return;

    const player = room.players.find(p => p && p.socketId === socket.id);
    if (!player) return;

    const gs = room.gameState;
    
    io.to(roomId).emit('log_message', { 
      text: `🏆 ¡${player.name} DECLARA TUTE DE ${type.toUpperCase()} Y GANA LA PARTIDA INSTANTÁNEAMENTE!`, 
      type: 'system' 
    });

    gs.status = 'game_end';
    
    io.to(roomId).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: gs
    });
  });

  // WEBRTC VOICE SIGNAL RELAY
  socket.on('webrtc_signal', ({ to, signal }) => {
    io.to(to).emit('webrtc_signal', { from: socket.id, signal });
  });

  socket.on('voice_ready', ({ roomId }) => {
    socket.to(roomId).emit('voice_player_ready', { socketId: socket.id });
  });

  // COUNT POINTS FOR TUTE (Triggered manually by players clicking "Contar")
  socket.on('count_points', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.gameType !== 'tute') return;
    const gs = room.gameState;
    if (gs.status !== 'round_end_counting') return;

    // 10 extra points for the winner of the last trick
    const lastTrickWinner = gs.tricks[gs.tricks.length - 1].winnerSeat;
    gs.tuteRoundScores[lastTrickWinner] += 10;
    
    io.to(room.id).emit('log_message', { 
      text: `✨ ${room.players.find(p=>p.seat === lastTrickWinner).name} gana las diez de últimas (+10 pts).`, 
      type: 'system' 
    });

    // Add cantos to round scores
    room.players.forEach(p => {
      const cantos = gs.tuteCantos[p.seat] || [];
      cantos.forEach(c => {
        gs.tuteRoundScores[p.seat] += c.points;
      });
    });

    // List scores
    const playerScores = room.players.map(p => ({
      seat: p.seat,
      name: p.name,
      score: gs.tuteRoundScores[p.seat]
    }));

    if (room.maxPlayers === 2) {
      io.to(room.id).emit('log_message', { 
        text: `📊 Puntuaciones de esta ronda: ${playerScores[0].name}: ${playerScores[0].score} | ${playerScores[1].name}: ${playerScores[1].score}`, 
        type: 'system' 
      });

      let loserSeat;
      let loserName;
      if (playerScores[0].score === playerScores[1].score) {
        loserSeat = lastTrickWinner === 0 ? 1 : 0;
        const loserPlayer = room.players.find(p => p.seat === loserSeat);
        loserName = loserPlayer ? loserPlayer.name : `Asiento ${loserSeat + 1}`;
        io.to(room.id).emit('log_message', { text: `¡Empate a puntos! Desempata el ganador de las diez de últimas.`, type: 'system' });
      } else {
        const sorted = [...playerScores].sort((a, b) => a.score - b.score);
        loserSeat = sorted[0].seat;
        loserName = sorted[0].name;
      }

      gs.tuteMatchPoints[loserSeat]++;
      io.to(room.id).emit('log_message', { text: `💀 ${loserName} tiene menos puntos y pierde esta ronda (Suma 1 punto de derrota).`, type: 'system' });

    } else {
      playerScores.sort((a, b) => a.score - b.score);
      const lowest = playerScores[0];
      const middle = playerScores[1];
      const highest = playerScores[2];

      io.to(room.id).emit('log_message', { 
        text: `📊 Puntuaciones de esta ronda: ${lowest.name}: ${lowest.score} | ${middle.name}: ${middle.score} | ${highest.name}: ${highest.score}`, 
        type: 'system' 
      });

      let loserSeat = middle.seat;
      let loserName = middle.name;

      if (middle.score === lowest.score && middle.score === highest.score) {
        io.to(room.id).emit('log_message', { text: `¡Empate triple de puntos! Todos los jugadores se salvan.`, type: 'system' });
      } else if (middle.score === lowest.score) {
        gs.tuteMatchPoints[middle.seat]++;
        gs.tuteMatchPoints[lowest.seat]++;
        io.to(room.id).emit('log_message', { text: `Empate en el segundo lugar: ¡Pierden ${middle.name} y ${lowest.name}!`, type: 'system' });
      } else if (middle.score === highest.score) {
        gs.tuteMatchPoints[middle.seat]++;
        gs.tuteMatchPoints[highest.seat]++;
        io.to(room.id).emit('log_message', { text: `Empate en el segundo lugar: ¡Pierden ${middle.name} y ${highest.name}!`, type: 'system' });
      } else {
        gs.tuteMatchPoints[loserSeat]++;
        io.to(room.id).emit('log_message', { text: `💀 ${loserName} es el del medio y pierde esta ronda (Suma 1 punto de derrota).`, type: 'system' });
      }
    }

    // Check match end (3 defeat points)
    let gameEnded = false;
    room.players.forEach(p => {
      if (gs.tuteMatchPoints[p.seat] >= 3) {
        gameEnded = true;
      }
    });

    if (gameEnded) {
      gs.status = 'game_end';
      io.to(room.id).emit('log_message', { 
        text: `🏆 ¡Fin de la partida! Alguien alcanzó 3 puntos de derrota.`, 
        type: 'system' 
      });
    } else {
      gs.status = 'round_results';
    }

    io.to(room.id).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: gs
    });
  });

  // GO TO NEXT ROUND (Tute)
  socket.on('next_round', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.gameType !== 'tute') return;
    const gs = room.gameState;
    if (gs.status !== 'round_results') return;

    startNewRound(room);
    
    io.to(room.id).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: gs
    });
  });

  // RESET GAME TO LOBBY (Nueva Partida)
  socket.on('reset_game', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    room.gameState = {
      status: 'lobby',
      deck: [],
      hands: {},
      playedCards: [],
      viraCard: null,
      trumpSuit: null,
      currentTurn: 0,
      leadPlayerSeat: 0,
      tricks: [],
      scores: { teamA: 0, teamB: 0 },
      envidoRoundScore: { teamA: 0, teamB: 0 },
      tuteRoundScores: room.players.map(() => 0),
      tuteMatchPoints: room.players.map(() => 0),
      tuteCantos: room.players.map(() => []),
      deckCount: 0
    };

    room.players.forEach(p => {
      if (p) {
        p.isDirector = false;
        p.team = null;
      }
    });

    io.to(roomId).emit('log_message', { text: `🔄 La partida ha sido reiniciada. Se ha vuelto al lobby.`, type: 'system' });
    
    io.to(roomId).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: room.gameState
    });
  });

  // CHAT MESSAGE
  socket.on('chat_message', ({ roomId, message }) => {
    const player = rooms[roomId]?.players.find(p => p && p.socketId === socket.id);
    const name = player ? player.name : 'Espectador';
    io.to(roomId).emit('log_message', { text: `${name}: ${message}`, type: 'chat' });
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    const data = disconnectPlayer(socket.id);
    if (data) {
      io.to(data.roomId).emit('disconnect_peer_voice', { socketId: socket.id });
      io.to(data.roomId).emit('log_message', { text: `${data.name} se ha desconectado. El juego volvera al lobby.`, type: 'system' });
      const room = rooms[data.roomId];
      if (room) {
        io.to(data.roomId).emit('room_state', {
          gameType: room.gameType,
          maxPlayers: room.maxPlayers,
          players: room.players,
          gameState: room.gameState
        });
      }
    }
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Evaluate who wins the trick
function evaluateTrick(room) {
  const gs = room.gameState;
  const trumpSuit = gs.trumpSuit;
  const firstCardPlayed = gs.playedCards[0].card;
  const ledSuit = firstCardPlayed.suit;

  let winnerSeat = -1;
  let highestRank = -999;

  gs.playedCards.forEach(p => {
    let rank;
    if (room.gameType === 'envido') {
      rank = getCardRankEnvido(p.card, trumpSuit, ledSuit);
    } else if (room.maxPlayers === 2) {
      rank = getCardRankTute2(p.card, trumpSuit, ledSuit);
    } else {
      rank = getCardRankTute(p.card, trumpSuit, ledSuit);
    }

    if (rank > highestRank) {
      highestRank = rank;
      winnerSeat = p.seat;
    }
  });

  const winnerPlayer = room.players.find(p => p && p.seat === winnerSeat);
  
  // Save trick history
  gs.tricks.push({
    winnerSeat,
    winnerName: winnerPlayer ? winnerPlayer.name : `Asiento ${winnerSeat + 1}`,
    playedCards: [...gs.playedCards]
  });

  io.to(room.id).emit('log_message', { 
    text: `✨ ${winnerPlayer ? winnerPlayer.name : `Asiento ${winnerSeat + 1}`} gana la baza.`, 
    type: 'system' 
  });

  // If Tute: count points for the winner of the trick
  if (room.gameType === 'tute') {
    let trickPoints = 0;
    gs.playedCards.forEach(p => {
      if (room.maxPlayers === 2) {
        trickPoints += getCardPointsTute2(p.card);
      } else {
        trickPoints += getCardPointsTute(p.card);
      }
    });
    gs.tuteRoundScores[winnerSeat] += trickPoints;
  }

  // Draw cards if 2-player Tute
  if (room.gameType === 'tute' && room.maxPlayers === 2) {
    if (gs.deck && gs.deck.length > 0) {
      const winnerPlayerObj = room.players.find(p => p && p.seat === winnerSeat);
      const loserPlayerObj = room.players.find(p => p && p.seat !== winnerSeat);
      
      if (winnerPlayerObj && loserPlayerObj) {
        const cardW = gs.deck.pop();
        gs.hands[winnerPlayerObj.socketId].push(cardW);
        
        if (gs.deck.length > 0) {
          const cardL = gs.deck.pop();
          gs.hands[loserPlayerObj.socketId].push(cardL);
        } else if (gs.viraCard) {
          // Winner drew the last card, loser gets the face-up Vira!
          gs.hands[loserPlayerObj.socketId].push(gs.viraCard);
          gs.viraCard = null; // Vira is drawn
        }
      }
      gs.deckCount = gs.deck.length + (gs.viraCard ? 1 : 0);
    }
  }

  // Clear table cards
  gs.playedCards = [];

  // The winner of this trick leads the next trick
  gs.currentTurn = winnerSeat;
  gs.leadPlayerSeat = winnerSeat;

  // Check if round is over (3 tricks in Envido, 20 in 2-player Tute, 13 in 3-player Tute)
  const maxTricks = room.gameType === 'envido' ? 3 : (room.maxPlayers === 2 ? 20 : 13);
  if (gs.tricks.length === maxTricks) {
    if (room.gameType === 'envido') {
      evaluateRoundEnd(room);
    } else {
      // Tute: Transition to round_end_counting. Wait for a player to click the "Contar" button.
      gs.status = 'round_end_counting';
      io.to(room.id).emit('room_state', {
        gameType: room.gameType,
        maxPlayers: room.maxPlayers,
        players: room.players,
        gameState: gs
      });
      io.to(room.id).emit('log_message', { 
        text: '🏁 ¡Ronda finalizada! Haced clic en el botón "Contar Puntos" para revelar las puntuaciones.', 
        type: 'system' 
      });
    }
  } else {
    // Sync state for next trick
    io.to(room.id).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: gs
    });
  }
}

// Evaluate round end and update scores
function evaluateRoundEnd(room) {
  const gs = room.gameState;

  if (room.gameType === 'envido') {
    // Count how many tricks each team won
    let teamATricks = 0;
    let teamBTricks = 0;
    
    gs.tricks.forEach(t => {
      if (t.winnerSeat % 2 === 0) {
        teamATricks++;
      } else {
        teamBTricks++;
      }
    });

    let roundWinnerTeam = '';
    if (teamATricks > teamBTricks) {
      roundWinnerTeam = 'A';
      gs.scores.teamA++;
    } else {
      roundWinnerTeam = 'B';
      gs.scores.teamB++;
    }

    io.to(room.id).emit('log_message', { 
      text: `🎉 Equipo ${roundWinnerTeam} gana la ronda (${teamATricks} vs ${teamBTricks} bazas) y suma 1 piedra.`, 
      type: 'system' 
    });

    // Check if match is won (first to 3 rounds)
    if (gs.scores.teamA >= 3 || gs.scores.teamB >= 3) {
      gs.status = 'game_end';
      const winningTeam = gs.scores.teamA >= 3 ? 'A' : 'B';
      io.to(room.id).emit('log_message', { 
        text: `🏆 ¡EL EQUIPO ${winningTeam} HA GANADO LA PARTIDA AL GANAR 3 RONDAS!`, 
        type: 'system' 
      });
    } else {
      // Setup for next round
      startNewRound(room);
    }
  }

  // Broadcast state
  io.to(room.id).emit('room_state', {
    gameType: room.gameType,
    maxPlayers: room.maxPlayers,
    players: room.players,
    gameState: gs
  });
}

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
