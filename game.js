let currentPlayer = 'X';
let gameBoard = ['', '', '', '', '', '', '', '', ''];
let gameActive = true;
let gameMode = 'user'; // 'user' or 'computer'
let isPlayerX = true;
let moveHistory = [];
let redoStack = [];

// Sound Effects
let soundEnabled = true;

const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
];

// Get game mode from URL
function getGameMode() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('mode') || 'friends';
}

// Initialize game based on mode
function initializeGame() {
    gameMode = getGameMode();
    updatePlayerIndicator();
    document.getElementById('undoBtn').disabled = true;
    document.getElementById('redoBtn').disabled = true;
}

function updatePlayerIndicator() {
    const indicator = document.getElementById('playerIndicator');
    if (gameMode === 'computer') {
        indicator.textContent = isPlayerX ? "Your Turn (X)" : "Computer's Turn (O)";
    } else {
        indicator.textContent = `Player ${currentPlayer}'s Turn`;
    }
}

function addCellHoverEffects() {
    document.querySelectorAll('.cell').forEach(cell => {
        if (cell.textContent === '') {
            cell.classList.add(currentPlayer.toLowerCase() === 'x' ? 'x-hover' : 'o-hover');
        }
    });
}

function removeCellHoverEffects() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('x-hover', 'o-hover');
    });
}

function playSound(soundId) {
    if (!soundEnabled) return;
    const sound = document.getElementById(soundId);
    sound.currentTime = 0;
    sound.play().catch(error => console.log('Sound play failed:', error));
}

function playButtonSound() {
    playSound('buttonSound');
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const soundIcon = document.querySelector('.sound-control i');
    soundIcon.className = soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
}

function showModal(message, isWin = false) {
    const modal = document.querySelector('.winner-modal');
    const modalContent = modal.querySelector('.modal-content');
    const winnerText = document.getElementById('winner-text');
    const modalIcon = modal.querySelector('.modal-icon');

    // Set message and icon
    winnerText.textContent = message;
    modalIcon.innerHTML = isWin ? '<i class="fas fa-trophy"></i>' : '<i class="fas fa-handshake"></i>';

    // Show modal with animation
    modal.style.display = 'flex';
    modalContent.classList.add('animate__animated', 'animate__bounceIn');

    // Play appropriate sound
    playSound(isWin ? 'winSound' : 'drawSound');

    // Remove animation class after animation completes
    setTimeout(() => {
        modalContent.classList.remove('animate__bounceIn');
    }, 500);
}

function makeMove(index) {
    if (!gameActive || gameBoard[index] !== '') return;

    // Make the move
    gameBoard[index] = currentPlayer;
    const cell = document.getElementsByClassName('cell')[index];
        cell.textContent = currentPlayer;
        cell.classList.add(currentPlayer.toLowerCase());

    // Play move sound
    playSound('moveSound');

    // Add to move history
    moveHistory.push({ index, player: currentPlayer });
    document.getElementById('undoBtn').disabled = false;
    document.getElementById('redoBtn').disabled = true;
    redoStack = [];

    // Check for winner
        if (checkWinner()) {
            gameActive = false;
        showWinner();
            return;
        }

    // Check for draw
    if (gameBoard.every(cell => cell !== '')) {
            gameActive = false;
        showDraw();
            return;
        }

    // Switch player
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        updatePlayerIndicator();

    // Computer's turn
        if (gameMode === 'computer' && currentPlayer === 'O' && gameActive) {
        setTimeout(computerMove, 500);
    }
}

function computerMove() {
    if (!gameActive) return;

    // Simple AI: Choose first available cell
    const availableCells = gameBoard
        .map((cell, index) => cell === '' ? index : null)
        .filter(cell => cell !== null);

    if (availableCells.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableCells.length);
        makeMove(availableCells[randomIndex]);
    }
}

function checkWinner() {
    return winningCombinations.some(combination => {
        return combination.every(index => {
            return gameBoard[index] === currentPlayer;
        });
    });
}

function showWinner() {
    const message = gameMode === 'computer' 
        ? (currentPlayer === 'X' ? 'You Win! 🎉' : 'Computer Wins! 😔')
        : `Player ${currentPlayer} Wins! 🎉`;
    showModal(message, true);
}

function showDraw() {
    showModal("It's a Draw! 🤝", false);
}

function restartGame() {
    gameBoard = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;
    isPlayerX = true;
    moveHistory = [];
    redoStack = [];
    
    // Clear board
    document.querySelectorAll('.cell').forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o');
    });

    // Reset controls
    document.getElementById('undoBtn').disabled = true;
    document.getElementById('redoBtn').disabled = true;

    // Hide modal with animation
    const modal = document.querySelector('.winner-modal');
    const modalContent = modal.querySelector('.modal-content');
    modalContent.classList.add('animate__animated', 'animate__fadeOut');
    
    setTimeout(() => {
        modal.style.display = 'none';
        modalContent.classList.remove('animate__fadeOut');
    }, 500);

    // Update indicator
    updatePlayerIndicator();
}

function undoMove() {
    if (moveHistory.length === 0) return;
    
    const lastMove = moveHistory.pop();
    gameBoard[lastMove.index] = '';
    document.getElementsByClassName('cell')[lastMove.index].textContent = '';
    document.getElementsByClassName('cell')[lastMove.index].classList.remove(lastMove.player.toLowerCase());

    // Add to redo stack
    redoStack.push(lastMove);
    document.getElementById('redoBtn').disabled = false;

    // Update game state
    currentPlayer = lastMove.player;
    gameActive = true;
    updatePlayerIndicator();

    // Disable undo button if no more moves
    if (moveHistory.length === 0) {
        document.getElementById('undoBtn').disabled = true;
    }
}

function redoMove() {
    if (redoStack.length === 0) return;
    
    const moveToRedo = redoStack.pop();
    gameBoard[moveToRedo.index] = moveToRedo.player;
    document.getElementsByClassName('cell')[moveToRedo.index].textContent = moveToRedo.player;
    document.getElementsByClassName('cell')[moveToRedo.index].classList.add(moveToRedo.player.toLowerCase());

    // Add back to move history
    moveHistory.push(moveToRedo);
    document.getElementById('undoBtn').disabled = false;

    // Update game state
    currentPlayer = moveToRedo.player === 'X' ? 'O' : 'X';
    updatePlayerIndicator();

    // Disable redo button if no more moves
    if (redoStack.length === 0) {
        document.getElementById('redoBtn').disabled = true;
    }
}

// Initialize sound control button
function initializeSoundControl() {
    const soundControl = document.createElement('div');
    soundControl.className = 'sound-control';
    soundControl.innerHTML = '<i class="fas fa-volume-up"></i>';
    soundControl.onclick = toggleSound;
    document.body.appendChild(soundControl);
}

// Update initialization
window.onload = function() {
    initializeGame();
    initializeSoundControl();
    addCellHoverEffects();
}; 