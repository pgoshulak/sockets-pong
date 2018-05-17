import React, { Component } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';
import Konva from 'konva';

class Game extends Component {
  constructor(props) {
    super(props);
    this.state = {  }
  }
  render() { 
    const surfaceWidth = window.innerWidth;
    const surfaceHeight = window.innerHeight - 100;
    const scaleX = surfaceWidth / 100;
    const scaleY = surfaceHeight / 100;
    return ( 
      <div>
        ball speed = {this.props.ball.speed}
        <Stage width={surfaceWidth} height={surfaceHeight}>
          <Layer width={100} height={100} scale={{x: scaleX, y: scaleY}}>
            <Rect x={0} y={0} width={100} height={100} fill={'grey'}/>
            <Rect x={0} y={this.props.playerPos[0] - this.props.playerSize[0]/2} width={1} height={this.props.playerSize[0]} fill={'black'}/>
            <Rect x={99} y={this.props.playerPos[1] - this.props.playerSize[1]/2} width={1} height={this.props.playerSize[1]} fill={'black'}/>
            <Rect x={this.props.ball.x-0.5} y={this.props.ball.y-0.5} width={10/scaleX} height={10/scaleY} fill={'black'} />
          </Layer>
        </Stage>
      </div>
     )
  }
}
 
export default Game;