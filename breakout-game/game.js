const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game objects
const ball = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    radius: 7,
    speed: 4, // Slower initial speed
    dx: 0,
    dy: 0,
    color: '#0095DD',
    maxSpeed: 8 // Lower max speed
};

const paddle = {
    width: 75, // Wider paddle
    height: 12,
    x: (canvas.width - 75) / 2,
    y: canvas.height - 20,
    speed: 8
};

const brickConfig = {
    rows: 5,
    cols: 8,
    width: 48,
    height: 20,
    padding: 10,
    offsetTop: 30,
    offsetLeft: 25,
    colors: [
        '#FF0000', // Red
        '#FF7F00', // Orange
        '#FFFF00', // Yellow
        '#00FF00', // Green
        '#0000FF', // Blue
        '#4B0082', // Indigo
        '#9400D3'  // Violet
    ],
    patterns: [
        'standard',
        'pyramid',
        'checkerboard',
        'random',
        'zigzag'
    ]
};

let currentLevel = 0;
let currentPattern = '';

// Initialize bricks with random pattern
function initBricks() {
    bricks = [];
    currentPattern = brickConfig.patterns[Math.floor(Math.random() * brickConfig.patterns.length)];
    
    for(let c = 0; c < brickConfig.cols; c++) {
        bricks[c] = [];
        for(let r = 0; r < brickConfig.rows; r++) {
            const brickX = (c * (brickConfig.width + brickConfig.padding)) + brickConfig.offsetLeft;
            const brickY = (r * (brickConfig.height + brickConfig.padding)) + brickConfig.offsetTop;
            
            let status = 0;
            switch(currentPattern) {
                case 'pyramid':
                    // Create pyramid shape
                    if (r <= brickConfig.rows/2 && 
                        c >= (brickConfig.cols/2 - r) && 
                        c <= (brickConfig.cols/2 + r)) {
                        status = 1;
                    }
                    break;
                    
                case 'checkerboard':
                    // Alternating pattern
                    if ((r + c) % 2 === 0) {
                        status = 1;
                    }
                    break;
                    
                case 'zigzag':
                    // Zigzag pattern
                    if ((r % 2 === 0 && c < brickConfig.cols - 2) || 
                        (r % 2 === 1 && c > 1)) {
                        status = 1;
                    }
                    break;
                    
                case 'random':
                    // Random pattern with 70% chance of brick
                    if (Math.random() < 0.7) {
                        status = 1;
                    }
                    break;
                    
                default: // 'standard'
                    status = 1;
                    break;
            }
            
            if (status === 1) {
                // Random color for each brick
                const color = brickConfig.colors[Math.floor(Math.random() * brickConfig.colors.length)];
                // Random strength (1-3)
                const strength = Math.ceil(Math.random() * 3);
                
                bricks[c][r] = {
                    x: brickX,
                    y: brickY,
                    status: strength,
                    color: color
                };
            } else {
                bricks[c][r] = { x: brickX, y: brickY, status: 0 };
            }
        }
    }
}

// Game state
let score = 0;
let lives = 3;
let gameStarted = false;
let ballOnPaddle = true;
let rightPressed = false;
let leftPressed = false;
let highScore = localStorage.getItem('highScore') || 0;
let isPaused = false;

// Event listeners
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);
document.addEventListener('mousemove', mouseMoveHandler);

function keyDownHandler(e) {
    if(e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
    } else if(e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
    } else if(e.key === ' ' && ballOnPaddle) {
        launchBall();
    } else if(e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        togglePause();
    }
}

function keyUpHandler(e) {
    if(e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = false;
    } else if(e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = false;
    }
}

function mouseMoveHandler(e) {
    const relativeX = e.clientX - canvas.offsetLeft;
    if(relativeX > 0 && relativeX < canvas.width) {
        paddle.x = relativeX - paddle.width / 2;
        if(paddle.x < 0) paddle.x = 0;
        if(paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
    }
}

function launchBall() {
    if(ballOnPaddle) {
        ballOnPaddle = false;
        ball.dy = -ball.speed;
        // Launch at a random angle between -60 and 60 degrees
        const angle = (Math.random() * Math.PI / 1.5) - Math.PI / 3;
        ball.dx = ball.speed * Math.sin(angle);
        ball.dy = -ball.speed * Math.cos(angle);
        gameStarted = true;
    }
}

function togglePause() {
    isPaused = !isPaused;
    if (!isPaused) {
        // Resume game loop
        requestAnimationFrame(draw);
    }
}

function drawBricks() {
    for(let c = 0; c < brickConfig.cols; c++) {
        for(let r = 0; r < brickConfig.rows; r++) {
            const brick = bricks[c][r];
            if(brick.status > 0) {
                ctx.beginPath();
                ctx.rect(brick.x, brick.y, brickConfig.width, brickConfig.height);
                ctx.fillStyle = brick.color;
                ctx.fill();
                ctx.closePath();
                
                // Draw strength indicator dots
                if (brick.status > 1) {
                    const dotSpacing = 6;
                    const startX = brick.x + brickConfig.width - 10;
                    const centerY = brick.y + brickConfig.height / 2;
                    
                    for (let i = 0; i < brick.status; i++) {
                        ctx.beginPath();
                        ctx.arc(startX - (i * dotSpacing), centerY, 2, 0, Math.PI * 2);
                        ctx.fillStyle = 'white';
                        ctx.fill();
                        ctx.closePath();
                    }
                }
            }
        }
    }
}

function collisionDetection() {
    for(let c = 0; c < brickConfig.cols; c++) {
        for(let r = 0; r < brickConfig.rows; r++) {
            const b = bricks[c][r];
            if(b.status > 0) {
                if(ball.x + ball.radius > b.x && 
                   ball.x - ball.radius < b.x + brickConfig.width && 
                   ball.y + ball.radius > b.y && 
                   ball.y - ball.radius < b.y + brickConfig.height) {
                    
                    // Determine collision side and bounce accordingly
                    const hitX = ball.x >= b.x && ball.x <= b.x + brickConfig.width;
                    const hitY = ball.y >= b.y && ball.y <= b.y + brickConfig.height;
                    
                    if (!hitX) { // Hit from sides
                        ball.dx = -ball.dx;
                    }
                    if (!hitY) { // Hit from top/bottom
                        ball.dy = -ball.dy;
                    }
                    
                    // Decrease brick strength
                    b.status--;
                    
                    // Only score point when brick is destroyed
                    if (b.status === 0) {
                        score++;
                        document.getElementById('score').textContent = score;
                        
                        // Slight speed increase
                        const speedIncrease = 0.1;
                        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                        if (currentSpeed < ball.maxSpeed) {
                            const factor = (currentSpeed + speedIncrease) / currentSpeed;
                            ball.dx *= factor;
                            ball.dy *= factor;
                        }
                        
                        if(score > highScore) {
                            highScore = score;
                            localStorage.setItem('highScore', highScore);
                            document.getElementById('highScore').textContent = highScore;
                        }
                        
                        // Check if level is complete
                        if(checkLevelComplete()) {
                            currentLevel++;
                            alert('Level ' + currentLevel + ' Complete!');
                            // Start new level
                            initBricks();
                            ballOnPaddle = true;
                            ball.dx = 0;
                            ball.dy = 0;
                            paddle.x = (canvas.width - paddle.width) / 2;
                        }
                    }
                    return;
                }
            }
        }
    }
}

function checkLevelComplete() {
    for(let c = 0; c < brickConfig.cols; c++) {
        for(let r = 0; r < brickConfig.rows; r++) {
            if(bricks[c][r].status > 0) {
                return false;
            }
        }
    }
    return true;
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();
}

function drawStartMessage() {
    if(!gameStarted) {
        ctx.font = '20px Arial';
        ctx.fillStyle = '#0095DD';
        ctx.textAlign = 'center';
        ctx.fillText('Press SPACE to Start', canvas.width/2, canvas.height/2);
    }
}

function drawPauseScreen() {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Pause text
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', canvas.width/2, canvas.height/2 - 30);
    
    // Instructions
    ctx.font = '20px Arial';
    ctx.fillText('Press P or ESC to Resume', canvas.width/2, canvas.height/2 + 20);
    
    // Controls reminder
    ctx.font = '16px Arial';
    ctx.fillText('← → : Move Paddle', canvas.width/2, canvas.height/2 + 60);
    ctx.fillText('SPACE : Launch Ball', canvas.width/2, canvas.height/2 + 85);
}

function draw() {
    if (!isPaused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBricks();
        drawBall();
        drawPaddle();
        collisionDetection();
        
        if (!gameStarted) {
            drawStartMessage();
        }
        
        if(ballOnPaddle) {
            ball.x = paddle.x + paddle.width/2;
            ball.y = paddle.y - ball.radius;
        } else {
            // Ball movement and collision logic
            const nextX = ball.x + ball.dx;
            const nextY = ball.y + ball.dy;
            
            // Wall collisions
            if(nextX + ball.radius > canvas.width || nextX - ball.radius < 0) {
                ball.dx = -ball.dx;
            }
            
            if(nextY - ball.radius < 0) {
                ball.dy = -ball.dy;
            }
            
            // Paddle collision
            if(nextY + ball.radius > paddle.y) {
                if(nextX > paddle.x && nextX < paddle.x + paddle.width) {
                    // Calculate hit position relative to paddle center (-1 to 1)
                    const hitPoint = (nextX - (paddle.x + paddle.width/2)) / (paddle.width/2);
                    
                    // Calculate new angle (maximum 75 degrees)
                    const maxAngle = Math.PI * 0.75;
                    const angle = hitPoint * maxAngle;
                    
                    // Set new velocity based on angle
                    const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                    ball.dx = Math.sin(angle) * speed;
                    ball.dy = -Math.abs(Math.cos(angle) * speed);
                    
                    // Ensure ball is above paddle
                    ball.y = paddle.y - ball.radius;
                } else if(nextY + ball.radius > canvas.height) {
                    lives--;
                    document.getElementById('lives').textContent = lives;
                    if(!lives) {
                        alert('GAME OVER! Final Score: ' + score);
                        document.location.reload();
                    } else {
                        ballOnPaddle = true;
                        ball.dx = 0;
                        ball.dy = 0;
                        paddle.x = (canvas.width - paddle.width) / 2;
                    }
                }
            }
            
            ball.x += ball.dx;
            ball.y += ball.dy;
        }
        
        // Paddle movement
        if(rightPressed && paddle.x < canvas.width - paddle.width) {
            paddle.x += paddle.speed;
        }
        if(leftPressed && paddle.x > 0) {
            paddle.x -= paddle.speed;
        }
        
        requestAnimationFrame(draw);
    } else {
        drawPauseScreen();
    }
}

// Initialize game
initBricks();
document.getElementById('score').textContent = '0';
document.getElementById('lives').textContent = lives;
document.getElementById('highScore').textContent = highScore;
draw();
