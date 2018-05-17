import React, { Component } from 'react';
import './App.css';
import Game from './Game';

const SOCKET_ADDRESS = 'ws://localhost:3001'
const X_MIN = 2, X_MAX = 98;
const Y_MIN = 0, Y_MAX = 100;
const BALL_SPEED_INCREMENT = 1.05;
const singlePlayer = true

const PlayerCounter = ({count}) => {
  return <div>Count is {count}</div>
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      playerPos: [50,50],
      playerSize: [10, 10],
      currentPlayer: -1,
      playerScore: [0,0],
      ball: {
        x: 50,
        y: 50,
        dx: 2,
        dy: 0.5,
        speed: 1.0
      },
      upArrowPressed: false,
      downArrowPressed: false
    }
  }

  handleServerMessage = (message) => {
    const data = JSON.parse(message.data)
    if (data.type === 'ASSIGN_PLAYER') {
      this.setState({ currentPlayer: data.content })
    } else if (data.type === 'P0') {
      this.setPlayerPos(0, data.content)
    } else if (data.type === 'P1') {
      this.setPlayerPos(1, data.content)
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

  incrementPlayerPos = (player, inc, cb) => {
    if (player === 0) {
      this.setState({
        playerPos: [
          this.state.playerPos[0] + inc,
          this.state.playerPos[1]
        ]
      }, cb)
    } else if (player === 1) {
      this.setState({
        playerPos: [
          this.state.playerPos[0],
          this.state.playerPos[1] + inc
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
    if (event.key === 'ArrowUp') {
      this.setState({upArrowPressed: true})
      // Keyboard Down arrow
    } else if (event.key === 'ArrowDown') {
      this.setState({downArrowPressed: true})
    }
  }
  onKeyUp = (event) => {
    // Keyboard Up arrow
    if (event.key === 'ArrowUp') {
      this.setState({upArrowPressed: false})
      // Keyboard Down arrow
    } else if (event.key === 'ArrowDown') {
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
    const ball = {...this.state.ball}
    const playerPos = this.state.playerPos;
    const playerSize = this.state.playerSize
    // Check along x=0 side
    if (ball.x < X_MIN) {
      // Check if ball is within the player's paddle
      if (Math.abs(ball.y - playerPos[0]) <= playerSize[0]/2) {
        // Reflect the ball (TODO: calculate new angle)
        ball.dx *= -1
        // Increase the speed
        ball.speed *= BALL_SPEED_INCREMENT
      } else {
        // Reset score here
        this.setWinner(1)
        return
      }
    }
    if (ball.x > X_MAX) {
      // Check if ball is within the player's paddle
      if (singlePlayer || Math.abs(ball.y - playerPos[1]) <= playerSize[1]/2) {
        // Reflect the ball (TODO: calculate new angle)
        ball.dx *= -1
        // Increase the speed
        ball.speed *= BALL_SPEED_INCREMENT
      } else {
        // Reset score here
        this.setWinner(0)
        return
      }
    }
    // Reflect ball along top/bottom borders
    if (ball.y > Y_MAX || ball.y < Y_MIN) {
      ball.dy *= -1
    }

        // Increment ball location
    ball.x += ball.dx * ball.speed
    ball.y += ball.dy * ball.speed
    this.setState({ ball })
  }

  setWinner(playerNum) {
    // Get and increment the winner's score
    const playerScore = [...this.state.playerScore]
    playerScore[playerNum]++
    this.setState({playerScore})
    // Reset the ball position
    this.resetBall();
  }

  resetBall = () => {
    let ball = {
      x: 50,
      y: 50,
      dx: 0,
      dy: 0,
      speed: 1.0
    }
    this.setState({ ball });
    ball = {
      x: 50,
      y: 50,
      dx: 2.0,
      dy: 0.5,
      speed: 1.0
    }
    setTimeout(() => {
      this.setState({ ball })
    }, 1000)
  }


  sendNewServerMessage = (data) => {
    this.socket.send(JSON.stringify(data));
  }
  
  componentDidMount() {
    this.socket = new WebSocket(SOCKET_ADDRESS)
    this.socket.onmessage = this.handleServerMessage

    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('keyup', this.onKeyUp)

    this.gameTick();
  }

  gameTick = () => {
    setInterval(() => {
      this.updateKeys()
      this.updateBall()
    }, 33)
  }

  render() {
    return (
      <div className="App">
        Hello player { this.state.currentPlayer } <br/>
        Player 0: {this.state.playerScore[0]} /// Player 1: {this.state.playerScore[1]}
        <PlayerCounter count={ this.state.playerPos[0] } />
        <PlayerCounter count={ this.state.playerPos[1] } />
        <Game playerPos={this.state.playerPos} playerSize={this.state.playerSize} ball={this.state.ball}/>
      </div>
    );
  }
}

export default App;
