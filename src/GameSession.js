import React, { useState, useEffect } from 'react';
import {
  Navbar,
  Nav,
  Container,
  Row,
  Col,
  Button,
  Dropdown,
  NavDropdown,
  InputGroup,
  FormControl,
} from 'react-bootstrap';
import Select from 'react-select';
import Konva from "konva";
import {
  Stage,
  Layer,
  Text,
  Image,
  Line,
  Rect,
  Circle,
  RegularPolygon,
} from 'react-konva';

import {
  IoPersonCircleOutline,
  IoPencil
} from 'react-icons/io5'; // MIT Licensed icons
import DatatablePage from './Table';

import 'react-toastify/dist/ReactToastify.css';
import './App.css';

import Home from './Home';
import { defaultMapNames } from './defaultMapNames';

var host = window.location.hostname;

function GameSession(props) {
  const [spaceOptions, setSpaceOptions] = useState([
    {label: '1 - Safe', value: 'safe', color: 'white', numTiles: 0, maxTiles: -1},
    {label: '2 - Dangerous', value: 'dangerous', color: 'grey', numTiles: 0, maxTiles: -1},
    {label: '3 - Human Spawn', value: 'hspawn', color: 'purple', numTiles: 0, maxTiles: 1},
    {label: '4 - Alien Spawn', value: 'aspawn', color: 'red', numTiles: 0, maxTiles: 1},
    {label: '5 - Escape Pod', value: 'escapepod', color: 'orange', numTiles: 0, maxTiles: 4},
    {label: '6 - Remove', value: 'remove', color: '', numTiles: 0, maxTiles: -1}
  ]);

  const [toggleDrawingBtnColor, setToggleDrawingBtnColor] = useState('grey');
  const [currSpace, setCurrSpace] = useState();
  const [prevSpace, setPrevSpace] = useState();
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [spaceSelector, setSpaceSelector] = useState(spaceOptions[0]);


  // document.addEventListener('keydown', function(event) {
  //   const keycode = parseInt(event.keyCode);
  //   if ((keycode >= 49 && keycode <= (48 + spaceOptions.length)) && mapEditor) {
  //     console.log('Setting space options');
  //     setSpaceSelector(spaceOptions[keycode - 49]);
  //   }
  // });

  // client-side
  useEffect(() => {
    console.log(defaultMapNames);
    props.socket.on("connect", () => {  console.log(props.socket.id); });
    props.socket.on("responseMessage", (data) => {  console.log(data); });
    props.socket.on("connect_error", (err) => {  console.log(`connect_error due to ${err.message}`);});
  }, []);


  useEffect(() => {
    if (props.playerState !== undefined) {
      setCurrSpace(props.playerState.pos);
      setPrevSpace(props.playerState.pos);
    }
  }, props.playerState);


  const XY2Tile = (x, y) => {
    return `${String.fromCharCode('A'.charCodeAt(0) + x)}${y.toString().padStart(2, '0')}`;
  }


  /**************************************************/
    class PriorityQueue {
      constructor() {
          this.elements = [];
      }

      enqueue(element, priority) {
          this.elements.push({ element, priority });
          this.elements.sort((a, b) => a.priority - b.priority);
      }

      dequeue() {
          return this.elements.shift().element;
      }

      isEmpty() {
          return this.elements.length === 0;
      }
  }

  function hexDistance(x1, y1, x2, y2) {
      // Adjust y coordinates for odd columns
      if (x1 % 2 !== 0 && x2 % 2 !== 0) {
          y1 -= 1;
          y2 -= 1;
      } else if (x1 % 2 === 0 && x2 % 2 === 0) {
          y1 += 1;
          y2 += 1;
      }

      let dx = Math.abs(x2 - x1);
      let dy = Math.abs(y2 - y1);
      let dx_dy = Math.abs(dx - dy);

      return Math.max(dx, dy, dx_dy);
  }

  function findShortestPath(startTile, endTile, grid) {
      // A* algorithm implementation
      let openSet = new PriorityQueue();
      let cameFrom = new Map();
      let gScore = new Map();
      let fScore = new Map();

      const endX = endTile.match(/\D/g)[0].charCodeAt(0) - 'A'.charCodeAt(0);
      const startX = startTile.match(/\D/g)[0].charCodeAt(0) - 'A'.charCodeAt(0);
      const endY = parseInt(endTile.match(/\d+/g)[0]);
      const startY = parseInt(startTile.match(/\d+/g)[0]);

      // Initialize scores
      gScore.set(`${startX},${startY}`, 0);
      fScore.set(`${startX},${startY}`, hexDistance(startX, startY, endX, endY));

      openSet.enqueue(`${startX},${startY}`, fScore.get(`${startX},${startY}`));

      while (!openSet.isEmpty()) {
          let current = openSet.dequeue();
          let [currentX, currentY] = current.split(',').map(Number);

          if (currentX === endX && currentY === endY) {
              // Found the end point, reconstruct path
              let path = [];
              while (cameFrom.has(`${currentX},${currentY}`)) {
                  path.unshift([currentX, currentY]);
                  [currentX, currentY] = cameFrom.get(`${currentX},${currentY}`);
              }
              path.unshift([startX, startY]);
              return path.map((tile) => {return XY2Tile(tile[0], tile[1])});
          }

          // Get neighbors
          let neighbors = getHexNeighbors(currentX, currentY, grid);

          for (let neighbor of neighbors) {
              let [neighborX, neighborY] = neighbor;

              let tentative_gScore = gScore.get(`${currentX},${currentY}`) + 1; // Assuming uniform cost

              if (!gScore.has(`${neighborX},${neighborY}`) || tentative_gScore < gScore.get(`${neighborX},${neighborY}`)) {
                  // Found a better path to the neighbor
                  cameFrom.set(`${neighborX},${neighborY}`, [currentX, currentY]);
                  gScore.set(`${neighborX},${neighborY}`, tentative_gScore);
                  fScore.set(`${neighborX},${neighborY}`, tentative_gScore + hexDistance(neighborX, neighborY, endX, endY));

                  if (!openSet.elements.some(el => el.element === `${neighborX},${neighborY}`)) {
                      openSet.enqueue(`${neighborX},${neighborY}`, fScore.get(`${neighborX},${neighborY}`));
                  }
              }
          }
      }

      // If we reach here, no path was found
      return null;
  }

  function getHexNeighbors(x, y, grid) {
      let neighbors = [];
      let directions = [];

      if (x % 2 === 1) {
        /* Adjust for even/odd columns */
        /* Odd columns share the same row number as the tiles diagonally above them */
        directions = [
            [1, 0], [1, 1], [0, 1],
            [-1, 1], [-1, 0], [0, -1]
        ];
      } else {
        directions = [
            [1, 0], [0, 1], [-1, 0],
            [-1, -1], [0, -1], [1, -1]
        ];
      }

      for (let dir of directions) {
          let nx = x + dir[0];
          let ny = y + dir[1];

          if (Object.keys(grid).includes(`${String.fromCharCode('A'.charCodeAt(0) + nx)}${ny.toString().padStart(2, '0')}`)) {
              neighbors.push([nx, ny]);
          }
      }

      return neighbors;
  }


  const hexClickHandle = (e, id) => {
    const new_x = id.match(/\D/g)[0].charCodeAt(0);
    const old_x = currSpace.match(/\D/g)[0].charCodeAt(0);
    const new_y = parseInt(id.match(/\d+/g)[0]);
    const old_y = parseInt(currSpace.match(/\d+/g)[0]);

    let path = findShortestPath(prevSpace, id, props.mapSelection.value.tiles);

    let dx = new_x - old_x;
    let dy = new_y - old_y;

    const movement_limit = props.playerState.maxMovement;

    if ((path.length - 1) <= movement_limit) {
      setCurrSpace(id);
      // props.socket.emit('tileClick', {
      //   tile: id,
      //   tileType: props.mapSelection.value.tiles[id].tileType,
      //   lobbyId: props.lobby.lobbyId,
      //   playerId: props.userName
      // });
    }
  }


  const generateMap = () => {
    let hexagons = []

    for (let row = 1; row < 15; row++) {
      for (let col = 0; col < 23; col++) {
        let id = String.fromCharCode(0x41 + col) + (row).toString().padStart(2, '0');

        if (id in props.mapSelection.value.tiles && props.mapSelection.value.tiles[id].tileType !== 'remove') {
          hexagons.push(
            <>
            <Text
              text={id}
              fontSize={12}
              x={26 + (col * (36 + 18))}
              y={31 + (row * (36 + 27)) + (col % 2)*31}
            />
            <RegularPolygon
              perfectDrawEnabled={false}
              shadow={false}
              key={id}
              id={id}
              x={36 + (col * (36 + 18))}
              y={36 + (row * (36 + 27)) + (col % 2)*31}
              sides={6}
              radius={36}
              //fill={id === currSpace ? 'green' : props.mapSelection.value.tiles[id].color}

              fillRadialGradientStartPoint={{ x: 0, y: 0 }}
              fillRadialGradientStartRadius={12}
              fillRadialGradientEndPoint= {{ x: 0, y: 0 }}
              fillRadialGradientEndRadius={50}
              fillRadialGradientColorStops= {[
                0,
                props.mapSelection.value.tiles[id].color,
                0.5,
                (id == currSpace) ?
                  '#51ff0d' :
                  (id == prevSpace && currSpace !== prevSpace) ?
                    'blue' :
                    props.mapSelection.value.tiles[id].color
              ]}

              stroke={'black'}
              //stroke={(currSpace_int === id_int + 1 || currSpace_int === id_int - 1) ? 'green' : 'black'}
              strokeWidth={1}
              //onClick={(e) => {setCurrSpace(id); props.socket.emit('tileClick', {tile: id, lobbyId: props.lobby.lobbyId, playerId: props.userName}); }}
              onClick={(e) => { hexClickHandle(e, id); }}
              onTap={(e) => {hexClickHandle(e, id); }}
              name={id}
              fillAfterStrokeEnabled={true}
              opacity={0.50}
              rotation={90}
              //filters={[Konva.Filters.HSL]}
              // shadowColor={'#8442f5'}
              // shadowBlur={id == currSpace ? 40 : 0}
              // //shadowOffset={{ x: 0, y: 0 }}
              // shadowOpacity={id == currSpace ? 0.5 : 1}
            />
            </>
          );
        }
      }
    }

    return hexagons;
  }


  const [lines, setLines] = React.useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingEnabled, setDrawingEnabled] = useState(false);

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    var transform = layerRef.current.getAbsoluteTransform().copy();
    // to detect relative position we need to invert transform
    transform.invert();
    let point = e.target.getStage().getPointerPosition();
    point = transform.point(point);
    setLines([...lines, { points: [point.x, point.y] }]);
  };

  const layerRef = React.useRef();
  const handleMouseMove = (e) => {
    // no drawing - skipping
    if ((!(isDrawing && drawingEnabled)) || lines.length === 0) {
      return;
    }
    const stage = e.target.getStage();
    var transform = layerRef.current.getAbsoluteTransform().copy();
    // to detect relative position we need to invert transform
    transform.invert();
    let point = stage.getPointerPosition();
    point = transform.point(point);
    let lastLine = {points: []};
    if (lines.length !== 0) {
      lastLine = lines[lines.length - 1];
    }
    // add point
    lastLine.points = lastLine.points.concat([point.x, point.y]);

    // replace last
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };


  const handleMouseUp = () => {
    setIsDrawing(false);
  };


  const primarySelectStyles = {
    control: base => ({
      ...base,
      borderColor: 'grey !important',
      boxShadow: 'none',
      marginBottom: '1em',
    })
  };

  const getRow = (id) => {
    return (id.match('[A-Z]')[0].charCodeAt(0) - 'A'.charCodeAt(0));
  };

  const getCol = (id) => {
    var ret = parseInt(id.match('[0-9]+')[0])

    return ret;
  };

  const [stageScaleX, setStageScaleX] = useState(1.5);
  const [stageScaleY, setStageScaleY] = useState(1.5);
  if (props.playerState === undefined) {
    return (<div />);
  } else {
    return (
      <>
        <Container fluid>
        <Row className='align-items-center d-flex' style={{height: '75vh'}}>
          <Col sm='10' md='10' className='align-items-center justify-content-center d-flex' style={{height: '75vh'}}>
            <Stage
              pixelRatio={1.5}
              style={{marginTop: '1em', display: 'flex', justifyContent: 'center'}}
              width={window.innerWidth * 0.84}  // 10/12 col width
              height={window.innerHeight * 0.95}
              onWheel={(e) => {
                e.evt.preventDefault();
                if (e.evt.deltaY > 15 || e.evt.deltaY < 15) {
                  setStageScaleX(stageScaleX - (e.evt.deltaY/250));
                  setStageScaleY(stageScaleX - (e.evt.deltaY/250));
                }
              }}
              // scaleY={viewMode === 'viewOnly' ? 0.45 : stageScaleY}
              // scaleX={viewMode === 'viewOnly' ? 0.45 : stageScaleX}
              scaleY={stageScaleY}
              scaleX={stageScaleX}
              onMouseDown={handleMouseDown}
              onMousemove={handleMouseMove}
              onTouchStart={handleMouseDown}
              onTouchmove={handleMouseMove}
              onMouseup={handleMouseUp}
              draggable={!drawingEnabled}
              offsetX={window.innerWidth / 10}
              //offsetX={window.innerWidth / 10}
            >
              <Layer>
              {
                generateMap()
              }
              </Layer>
              <Layer listening={false}>
              { currSpace !== undefined ?

                <Circle
                  x={36 + (getRow(currSpace) * (36 + 18))}
                  y={36 + (getCol(currSpace) * (36 + 27)) + (getRow(currSpace) % 2)*31}
                  // (3+(1))*(1-((1)/10)) funky math to scale down radius to match as kills increase. No kills starts at -1
                  radius={72*(props.playerState.role === 'alien' ? (2+(props.playerState.kills))*(1-((props.playerState.kills)/10)) : 1.30)}
                  strokeWidth={3}
                  stroke={props.playerState.role === 'alien' ? 'red' : 'green'}
                  fill={'rgba(66, 245, 245, 0.0)'}
                  //fill={'green'}
                />
                // <Circle
                //   x={36 + (getRow(currSpace) * (36 + 18))}
                //   y={36 + (getCol(currSpace) * (36 + 27)) + (getRow(currSpace) % 2)*31}
                //   radius={72*(props.playerState.role === 'alien' ? 2.1 : 1.25)}
                //   strokeWidth={3}
                //   stroke={props.playerState.role === 'alien' ? 'red' : 'green'}
                //   fill={''}
                //   opacity={1}
                //   //fill={'green'}
                // />
                :
                <div />
              }
              </Layer>
              <Layer ref={layerRef}>
                {lines.map((line, i) => (
                  <Line
                    key={i}
                    points={line.points}
                    stroke="#df4b26"
                    strokeWidth={5}
                    tension={0.5}
                    lineCap="round"
                    globalCompositeOperation={'source-over'}
                  />
                ))}
              </Layer>
            </Stage>
          </Col>
          <Col xs='2'>
            <Row xs='12'>
              <Col xs='12'>
            {/*<div style={{position: 'absolute', top: '5em'}}>*/}
                <DatatablePage
                  keyField='player'
                  columns={[
                    {dataField: 'player', text: 'Player'}
                  ]}
                  data={props.lobby.players.map((player) => { return {'player': player.playerName}})}
                />
{/*            </div>*/}
              </Col>
            </Row>
            <Row xs='12'>
              <Col xs='12'>
                <Button
                  className='primaryButton'
                  onClick={(e) => {
                    setPrevSpace(currSpace);
                    props.socket.emit('turnSubmit', {
                      tile: currSpace,
                      tileType: props.mapSelection.value.tiles[currSpace].tileType,
                      lobbyId: props.lobby.lobbyId,
                      playerId: props.userName
                    });
                  }}
                  style={{width: '100%', marginTop: '0em', marginLeft: '0em'}}
                >
                  End Turn
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row className='align-items-center d-flex'>
          <Col xs='12' style={{opacity: '0.8', position: 'fixed', bottom: '2.5em', backgroundColor: props.playerState.role === 'alien' ? 'red' : 'green'}}>
            <h2 style={{align: 'center', flex: 'display'}}>
             ROLE: {props.playerState.role.toUpperCase()}
            </h2>
          </Col>
        </Row>
        <Row className='align-items-center d-flex'>
          <Col xs='12' style={{position: 'fixed', bottom: '0em'}}>
            <h4 style={{align: 'center', flex: 'display'}}>
             Max Movement: {props.playerState.maxMovement}
            </h4>
          </Col>
        </Row>
      </Container>
      </>
    );
  }
}

export default GameSession;
