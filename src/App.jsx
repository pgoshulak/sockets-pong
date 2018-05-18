import React, { Component } from 'react';
import './App.css';
import Game from './Game';
require('dotenv').config();

const SOCKET_ADDRESS = process.env.PONG || 'ws://pong-server-pgosh.herokuapp.com'

const X_MIN = 2, X_MAX = 98;
const Y_MIN = 0, Y_MAX = 100;
const BALL_SPEED_INCREMENT = 1.05;
const BALL_SPEED_INITIAL = 1.0
const BALL_SPEED_MAX = 2.0
const PLAYER_SPEED = 1.5;
const PADDLE_FORGIVENESS = 1.5;
const PLAYER_SIZE_INCREMENT = 1;
// AI will move to within this proportion of paddle size 
// eg. 1.0 -> AI aligns paddle edge to ball
// eg. 0.0 -> AI aligns paddle middle to ball
const AI_THRESHOLD = 0.8;

const singlePlayer = true

const PlayerCounter = ({count}) => {
  return <div>Count is {count}</div>
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      playerPos: [50,50],
      playerSize: [20, 20],
      currentPlayer: -1,
      playerScore: [0,0],
      ball: {
        test: -1
      },
      upArrowPressed: false,
      downArrowPressed: false
    }
    // Ball is removed from state because the async nature of setState() is too unreliable
    this.ball = {
      x: 50,
      y: 50,
      dx: 1.0,
      dy: 0.0,
      speed: BALL_SPEED_INITIAL
    }
  }

  handleServerMessage = (message) => {
    const data = JSON.parse(message.data)
    const currentPlayer = this.state.currentPlayer
    if (data.type === 'ASSIGN_PLAYER') {
      this.setState({ currentPlayer: data.content })

      // Update player 0 data from server ONLY IF the client is not player 0 (ie. preserve local client as source-of-truth)
    } else if (data.type === 'P0' && currentPlayer !== 0) {
      this.setPlayerPos(0, data.content)

      // Update player 1 data from server ONLY IF the client is not player 1
    } else if (data.type === 'P1' && currentPlayer !== 1) {
      this.setPlayerPos(1, data.content)

    } else if (data.type === 'BALL') {
      this.setBall(data.content)
    } else if (data.type === 'WIN') {
      this.setState ({ ...data.content })
    }
  }

  setPlayerPos = (player, pos, cb) => {
    if (player === 0) {
      this.setState({
        playerPos: [
          pos,
          this.state.playerPos[1]
        ]
      }, cb)
    } else if (player === 1) {
      this.setState({
        playerPos: [
          this.state.playerPos[0],
          pos
        ]
      }, cb)
    }
  }

  setBall = (newBall) => {
    this.ball = {...this.ball, ...newBall}
  }

  incrementPlayerPos = (player, inc, cb) => {
    if (player === 0) {
      this.setState({
        playerPos: [
          this.state.playerPos[0] + inc * PLAYER_SPEED,
          this.state.playerPos[1]
        ]
      }, cb)
    } else if (player === 1) {
      this.setState({
        playerPos: [
          this.state.playerPos[0],
          this.state.playerPos[1] + inc * PLAYER_SPEED
        ]
      }, cb)
    }
  }

  sendCurrentPlayerPos = () => {
    const player = this.state.currentPlayer
    this.sendNewServerMessage({
      type: `P${player}`,
      content: this.state.playerPos[player]
    })
  }

  onKeyDown = (event) => {
    // Keyboard Up arrow
    if (event.key === 'ArrowUp' || event.code === 'ArrowUp') {
      this.setState({upArrowPressed: true})
      // Keyboard Down arrow
    } else if (event.key === 'ArrowDown' || event.code === 'ArrowDown') {
      this.setState({downArrowPressed: true})
    }
  }
  onKeyUp = (event) => {
    // Keyboard Up arrow
    if (event.key === 'ArrowUp' || event.code === 'ArrowUp') {
      this.setState({upArrowPressed: false})
      // Keyboard Down arrow
    } else if (event.key === 'ArrowDown' || event.code === 'ArrowDown') {
      this.setState({downArrowPressed: false})
    }
  }

  updateKeys = () => {
    if (this.state.upArrowPressed) {
      this.incrementPlayerPos(this.state.currentPlayer, -1, this.sendCurrentPlayerPos)
    }
    if (this.state.downArrowPressed) {
      this.incrementPlayerPos(this.state.currentPlayer, +1, this.sendCurrentPlayerPos)
    }
  }

  updateBall = () => {
    let ball = {...this.ball}
    const playerPos = this.state.playerPos;
    const playerSize = this.state.playerSize
    const currentPlayer = this.state.currentPlayer
    let flagToSendBall = false
    // Check along x=0 side
    // TODO: refactor out into separate function
    if (ball.x < X_MIN) {
      // Check if ball is within the player's paddle
      if (Math.abs(ball.y - playerPos[0]) <= playerSize[0] * PADDLE_FORGIVENESS / 2) {
        // Reflect the ball
        ball = {...ball, ...this.bounceBallOffPaddle(ball, playerPos[0], playerSize[0])}
        // Increase the speed
        ball.speed *= BALL_SPEED_INCREMENT
        // Send updated ball position after paddle bounce
        if (currentPlayer === 0) {
          flagToSendBall = true;
        }
      } else {
        // Reset score here
        this.setLoser(0)
        return
      }
    }
    if (ball.x > X_MAX) {
      // Check if ball is within the player's paddle
      if (Math.abs(ball.y - playerPos[1]) <= playerSize[1] * PADDLE_FORGIVENESS / 2) {
        // Reflect the ball
        ball = {...ball, ...this.bounceBallOffPaddle(ball, playerPos[1], playerSize[1])}
        // Increase the speed
        ball.speed *= BALL_SPEED_INCREMENT
        // Send updated ball position after paddle bounce
        if (currentPlayer === 1) {
          flagToSendBall = true
        }
      } else {
        // Reset score here
        this.setLoser(1)
        return
      }
    }
    // Reflect ball along top/bottom borders
    if (ball.y > Y_MAX || ball.y < Y_MIN) {
      ball.dy *= -1
    }

    if (ball.speed > BALL_SPEED_MAX) ball.speed = BALL_SPEED_MAX
        // Increment ball location
    ball.x += ball.dx * ball.speed
    ball.y += ball.dy * ball.speed
    this.setBall(ball)
    if (flagToSendBall) this.sendBall(ball)
  }

  bounceBallOffPaddle(ball, paddlePos, paddleSize) {
    // Dist from paddle midline
    // eg. ball = 47, paddle = 50 -> dist = -3
    let distFromPaddleMidline = ball.y - paddlePos
    // Percent from paddle midline
    // eg. dist = -3, paddleSize = 10 (halfsize=5) -> percent = -0.6
    let percentFromPaddleMidline = distFromPaddleMidline / (paddleSize / 2)

    // Simplified angle changer - maintains dx but changes dy
    let dy = percentFromPaddleMidline;
    let dx = ball.dx * -1;

    return {dx, dy}
  }

  setLoser = (loserPlayer) => {
    console.log('setting loser as ' + loserPlayer)
    let winnerPlayer = 0
    if (loserPlayer === 0) winnerPlayer = 1
    // Get and increment the winner's score
    const playerScore = [...this.state.playerScore]
    playerScore[winnerPlayer]++
    // Get and adjust the players' sizes
    const playerSize = [...this.state.playerSize]
    playerSize[winnerPlayer] -= PLAYER_SIZE_INCREMENT
    playerSize[loserPlayer] += PLAYER_SIZE_INCREMENT

    this.sendNewServerMessage({
      type: 'WIN',
      content: { playerScore, playerSize }
    })
    this.setState({playerScore, playerSize})
    // Reset the ball position
    this.resetBall();
  }

  resetBall = () => {
    let ball = {
      x: 50,
      y: 50,
      dx: 0,
      dy: 0,
      speed: BALL_SPEED_INITIAL
    }
    this.setBall(ball)
    this.sendBall(ball)
    ball = {
      x: 50,
      y: 50,
      dx: 1.0,
      dy: 0.0,
      speed: BALL_SPEED_INITIAL
    }
    setTimeout(() => {
      this.setBall(ball)
      this.sendBall(ball)
    }, 1000)
  }


  sendNewServerMessage = (data) => {
    this.socket.send(JSON.stringify(data));
  }

  sendBall = (ball) => {
    this.sendNewServerMessage({
      type: 'BALL',
      content: ball || this.ball
    });
  }
  
  componentDidMount() {
    this.socket = new WebSocket(SOCKET_ADDRESS)
    this.socket.onmessage = this.handleServerMessage

    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('keyup', this.onKeyUp)

    this.gameTick();
  }

  moveAi() {
    const aiPos = this.state.playerPos[1]
    const aiSize = this.state.playerSize[1]
    const thresholdDist = (aiSize / 2) * AI_THRESHOLD

    // if (this.ball.y - aiPos)

    if (this.ball.y - aiPos > thresholdDist) {
      this.incrementPlayerPos(1, 1)
    } else if (this.ball.y - aiPos < -thresholdDist) {
      this.incrementPlayerPos(1, -1)
    }
  }

  gameTick = () => {
    setInterval(() => {
      if (singlePlayer) {
        this.moveAi()
      }
      this.updateKeys()
      this.updateBall()
      this.forceUpdate()
    }, 16)
  }

  render() {
    return (
      <div className="App">
        Hello player { this.state.currentPlayer } <br/>
        Player 0: {this.state.playerScore[0]} /// Player 1: {this.state.playerScore[1]}
        <Game playerPos={this.state.playerPos} playerSize={this.state.playerSize} ball={this.ball}/>
      </div>
    );
  }
}

export default App;
