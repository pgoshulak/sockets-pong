import React, { Component } from 'react';
import './App.css';
import Game from './Game';

const SOCKET_ADDRESS = 'ws://localhost:3001'
// const 

const PlayerCounter = ({count}) => {
  return <div>Count is {count}</div>
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      playerPos: [50,50],
      currentPlayer: -1,
      playerScore: [0,0],
      ball: {
        x: 0,
        y: 0,
        dx: 2,
        dy: 0.5
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
      this.incrementPlayerPos(this.state.currentPlayer, 1, this.sendCurrentPlayerPos)
    }
    if (this.state.downArrowPressed) {
      this.incrementPlayerPos(this.state.currentPlayer, -1, this.sendCurrentPlayerPos)
    }
  }

  updateBall = () => {
    const ball = {...this.state.ball}
    if (ball.x > 100 || ball.x < 0) {
      ball.dx *= -1
    }
    if (ball.y > 100 || ball.y < 0) {
      ball.dy *= -1
    }

    ball.x += ball.dx
    ball.y += ball.dy
    this.setState({ ball })
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
        Hello player { this.state.currentPlayer }
        <PlayerCounter count={ this.state.playerPos[0] } />
        <PlayerCounter count={ this.state.playerPos[1] } />
        <Game p0Position={this.state.playerPos[0]} p1Position={this.state.playerPos[1]} ball={this.state.ball}/>
      </div>
    );
  }
}

export default App;
