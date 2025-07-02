import React, { useState, useEffect, useRef } from 'react';
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
  Arrow,
  RegularPolygon,
} from 'react-konva';

import {
  IoPersonCircleOutline,
  IoPencil,
  IoCaretUp,
  IoCaretDown
} from 'react-icons/io5'; // MIT Licensed icons
import DatatablePage from './Table';
import SlidingPanel from 'react-sliding-side-panel';

import 'react-toastify/dist/ReactToastify.css';
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.css';
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
  const [itemTrayPanelOpen, setItemTrayPanelOpen] = useState(false);
  const [pathViewPlayer, setPathViewPlayer] = useState('');
  const [sharedAngle, setSharedAngle] = useState(0);
  const [radarAnimationEn, setRadarAnimationEn] = useState(false);

  const uncertaintyCircleRef      = useRef();
  const uncertaintyCircleRefOuter = useRef();
  const sharedAngleRef = useRef(sharedAngle);

  // const animateCircle = () => {
  //   if (uncertaintyCircleRef.current) {
  //     const currentX = uncertaintyCircleRef.current.x();
  //     const currentY = uncertaintyCircleRef.current.y();
  //     const currentR = uncertaintyCircleRefOuter.current.radius();

  //     uncertaintyCircleRef.current.radius = currentR;

  //     new Konva.Tween({
  //       node: uncertaintyCircleRef.current,
  //       duration: 1, // seconds
  //       x: currentX,      // target x position
  //       y: currentY,
  //       radius: 0,
  //       fill: 'pink', // target fill color
  //       opacity: 0.5,
  //       easing: Konva.Easings.StrongEaseOut, // easing function
  //       onFinish: animateCircle
  //     }).play();
  //   }
  // };

  // document.addEventListener('keydown', function(event) {
  //   const keycode = parseInt(event.keyCode);
  //   if ((keycode >= 49 && keycode <= (48 + spaceOptions.length)) && mapEditor) {
  //     console.log('Setting space options');
  //     setSpaceSelector(spaceOptions[keycode - 49]);
  //   }
  // });

  // client-side
  useEffect(() => {
    props.socket.on("connect", () => {  console.log(props.socket.id); });
    props.socket.on("responseMessage", (data) => {  console.log(data); });
    props.socket.on("connect_error", (err) => {  console.log(`connect_error due to ${err.message}`);});

    if (radarAnimationEn) {
      const intervalId = window.setInterval(() => {setSharedAngle(sharedAngleRef.current + 5)}, 30);
    }
  }, []);

  useEffect(() => {
    sharedAngleRef.current = sharedAngle;
  }, [sharedAngle]);


  useEffect(() => {
    if (props.playerState !== undefined) {
      setCurrSpace(props.playerState.pos);
      setPrevSpace(props.playerState.pos);
    }
  }, [props.playerState]);


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

  const hexDistance = (x1, y1, x2, y2) => {
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

  const findShortestPath = (startTile, endTile, grid) => {
      // A* algorithm implementation
      let openSet = new PriorityQueue();
      let cameFrom = new Map();
      let gScore = new Map();
      let fScore = new Map();

      const endX = endTile.match(/\D/g)[0].charCodeAt(0) - 'A'.charCodeAt(0);
      const startX = startTile.match(/\D/g)[0].charCodeAt(0) - 'A'.charCodeAt(0);
      const endY = parseInt(endTile.match(/\d+/g)[0]);
      const startY = parseInt(startTile.match(/\d+/g)[0]);

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

          let neighbors = getHexNeighbors(currentX, currentY, grid);

          for (let neighbor of neighbors) {
              let [neighborX, neighborY] = neighbor;

              let tentative_gScore = gScore.get(`${currentX},${currentY}`) + 1;

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

      // No path found
      return null;
  }

  const getHexNeighbors = (x, y, grid) => {
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

          let tile = `${String.fromCharCode('A'.charCodeAt(0) + nx)}${ny.toString().padStart(2, '0')}`;

          if (Object.keys(grid).includes(tile) && props.mapSelection.value.tiles[tile].status !== 'inaccessible') {
            neighbors.push([nx, ny]);
          }
      }

      return neighbors;
  }


  const generateInaccessibleTile = (tile) => {
    let x = getRow(tile);
    let y = getCol(tile);

    let pointOffsetX = -32; //(x % 2 === 0) ? -32 : -30;
    let pointOffsetY = -6; //(y % 2 === 0) ? -6   : -6;
    let rotation     = 27; //(x % 2 === 0) ? 27 : 27;

    return (
      <>
       <Line
        points = {[pointOffsetX, pointOffsetY, 28, 0]}
         // points={[pointOffsetX, pointOffsetY, 32 + pointOffsetY, 0]} // Start at center, end calculated based on angle
          stroke={'black'}
          x={x}
          y={y}
          rotation={rotation}
          opacity={0.6}
          strokeWidth={2}
        /> 
{/*        <Line
          points = {[pointOffsetX+4, pointOffsetY, 30, 0]}
        //  points={[pointOffsetX - pointOffsetY, pointOffsetY, pointOffsetX*(-1), 0]} // Start at center, end calculated based on angle
          stroke={'black'}
          x={x}
          y={y}
          rotation={360-rotation}
          opacity={0.6}
          strokeWidth={2}
        /> */}
      </>
    );
  }


  const hexClickHandle = (e, id) => {
    if (props.noiseTileSelectEn) {
      props.setNoiseTile(id);
    } else {
      const new_x = id.match(/\D/g)[0].charCodeAt(0);
      const old_x = currSpace.match(/\D/g)[0].charCodeAt(0);
      const new_y = parseInt(id.match(/\d+/g)[0]);
      const old_y = parseInt(currSpace.match(/\d+/g)[0]);

      let path = findShortestPath(prevSpace, id, props.mapSelection.value.tiles);

      let dx = new_x - old_x;
      let dy = new_y - old_y;

      const movement_limit = props.playerState.maxMovement;

      if (path !== null && ((path.length - 1) <= movement_limit)) {
        setCurrSpace(id);
      }
    }
  }


  const generateMap = () => {
    if (prevSpace === undefined) { return []; } 
    let hexagons = []

    for (let row = 1; row < 15; row++) {
      for (let col = 0; col < 23; col++) {
        let id = String.fromCharCode(0x41 + col) + (row).toString().padStart(2, '0');

        if (id in props.mapSelection.value.tiles && props.mapSelection.value.tiles[id].tileType !== 'remove') {
          let pathLength = findShortestPath(prevSpace, id, props.mapSelection.value.tiles);
          pathLength = (pathLength === null) ? 0 : pathLength.length - 1;
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
                (id === currSpace) ?
                  '#51ff0d' :
                  (id === prevSpace && currSpace !== prevSpace) ?
                    'blue' :
                    (pathLength > 0 && pathLength <= props.playerState.maxMovement) ? 'yellow' :
                    props.mapSelection.value.tiles[id].color
              ]}

              stroke={'black'}
              strokeWidth={1}
              onClick={(e) => { hexClickHandle(e, id); }}
              onTap={(e) => {hexClickHandle(e, id); }}
              name={id}
              fillAfterStrokeEnabled={true}
              opacity={0.50}
              rotation={90}
            />
            {
              //props.mapSelection.value.tiles[id].tileType === 'escapepod' ?
              props.mapSelection.value.tiles[id].status === 'inaccessible' ?
                generateInaccessibleTile(id)
              // <>
              //  <Line
              //     points={[-34, -3, 29, 0]} // Start at center, end calculated based on angle
              //     stroke={'black'}
              //     x={getRow(id)}
              //     y={getCol(id)}
              //     rotation={33}
              //     strokeWidth={2}
              //   /> 
              //   <Line
              //     points={[-29, -4, 34, 0]} // Start at center, end calculated based on angle
              //     stroke={'black'}
              //     x={getRow(id)}
              //     y={getCol(id)}
              //     rotation={360-33}
              //     strokeWidth={2}
              //   /> 
              // </>
                :
                <div/>
            }
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
 

  const generatePlayerPath = () => {
    var path = [];
    var tile_history = [];
    let uncertainty_r = 0;

    props.turnHistory.filter(function(turn) {return turn.player === pathViewPlayer}).forEach((turn) => {
      if (turn.tile !== '-') {
        if (tile_history.length > 0) { 
          let prevSpace = tile_history[tile_history.length - 1];
          path.push(
            <Arrow
              points={[getRow(prevSpace), getCol(prevSpace), getRow(turn.tile), getCol(turn.tile)]}
              pointerLength={10}
              pointerWidth={4}
              fill='cyan'
              stroke='cyan'
              strokeWidth={2}
              opacity={0.7}
            />
          );
        }

        tile_history.push(turn.tile);
        uncertainty_r = 0;
      } else if (tile_history.length > 0) {
        let prevSpace = tile_history[tile_history.length - 1];

        uncertainty_r += 1;

        if (uncertainty_r > 1) {
          path.pop();
        }

        path.push(
          <>
          <Circle
            x={getRow(prevSpace)}
            y={getCol(prevSpace)}
            radius={72 * uncertainty_r}
            strokeWidth={3}
            stroke={'pink'}
            // ref={uncertaintyCircleRefOuter}
            // fill={'rgba(66, 245, 245, 0.0)'}
          />
          { radarAnimationEn ?
             <Line
                points={[0, 0, 72 * uncertainty_r, 0]} // Start at center, end calculated based on angle
                stroke={'pink'}
                x={getRow(prevSpace)}
                y={getCol(prevSpace)}
                rotation={sharedAngle}
                strokeWidth={2}
                shadowOffset={15}
                shadowBlur={30}
              /> :
              <div />
          }
          </>
        );
      //  animateCircle();
      }
    });

    return path;
  }


  const primarySelectStyles = {
    control: base => ({
      ...base,
      borderColor: 'grey !important',
      boxShadow: 'none',
      marginBottom: '1em',
    })
  };

  const playerTableSelectRow = {
    mode: 'radio',
    hideSelectColumn: true,
    clickToSelect: true,
    clickToEdit: false,
    onSelect: (row, isSelect, rowIndex, e) => {
      if (row.player === pathViewPlayer) {
        setPathViewPlayer('');
      } else {
        setPathViewPlayer(row.player);
      }
    }
  };

  const getRow = (id) => {
    var col = (id.match('[A-Z]')[0].charCodeAt(0) - 'A'.charCodeAt(0));
    return 36 + (col*(36+18));
  };

  const getCol = (id) => {    
    var row = parseInt(id.match('[0-9]+')[0]);
    var col = (id.match('[A-Z]')[0].charCodeAt(0) - 'A'.charCodeAt(0));
    console.log(col);
    var col_adjust_const = (col % 2 === 0) ? 3 : 36;
    var ret = 36 + (row * (36+27)) + col_adjust_const;

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
        <Row className='d-flex' style={{height: '60vh'}}>
          <Col xs='8' xl='8' className='align-items-center d-flex' style={{height: '75vh'}}>
            <Stage
              pixelRatio={1.5}
              style={{marginTop: '1em', display: 'flex', justifyContent: 'center'}}
              width={window.innerWidth * 0.65}  // 10/12 col width
              height={window.innerWidth > 1400 ? window.innerHeight * 0.85 : window.innerHeight * 0.60}
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
              {currSpace !== prevSpace ?
                  <Arrow
                    points={[getRow(prevSpace), getCol(prevSpace), getRow(currSpace), getCol(currSpace)]}
                    pointerLength={10}
                    pointerWidth={4}
                    fill='black'
                    stroke='black'
                    strokeWidth={2}
                    opacity={0.7}
                  /> :
                  <div />
                }
              </Layer>
              <Layer listening={false}>
              {generatePlayerPath()}
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
          <Col xs='4' xl='4'>
            <Row xs='12'>
              <Col xs='12'>
            {/*<div style={{position: 'absolute', top: '5em'}}>*/}
                <DatatablePage
                  keyField='player'
                  rowStyle={(row, rowIndex) => {
                    // let bgColor = 'inherit';

                    // if (props.players)
                    return {backgroundColor: row.player === props.currPlayer ? `var(--color-primary)` : 'inherit'}; 
                  }}
                  columns={[
                    {dataField: 'player', text: 'Player'
                  }]}
                  //data={props.lobby.players.map((player) => { return {'player': player.playerName}})}
                  data={props.playerTurnOrder.map((player) => { return {'player': player}; })}
                />
{/*            </div>*/}
              </Col>
            </Row>
            <Row xs='12'>
              <Col xs='12'>
              { props.currPlayer === props.userName ?
                  <Button
                    className='primaryButton'
                    onClick={(e) => {
                      if (props.turnHistory.filter(function(turn) {return turn.player === props.currPlayer}).length === 0) {
                        // This was turn one, disable access to spawn point from here on out
                        let updatedLobbyMap = {...props.mapSelection};
                       // updatedLobbyMap.value.tiles[prevSpace].status = 'inaccessible'; 

                        Object.keys(updatedLobbyMap.value.tiles).forEach((tile, idx) => {
                          let tileType = updatedLobbyMap.value.tiles[tile].tileType;
                          if (tileType === 'aspawn' || tileType === 'hspawn') {
                            updatedLobbyMap.value.tiles[tile].status = 'inaccessible';
                          }
                          if (tileType === 'escapepod' && props.playerState.role === 'alien') {
                            updatedLobbyMap.value.tiles[tile].status = 'inaccessible';
                          }
                        });
                        props.setMapSelection(updatedLobbyMap);
                      }
                      setPrevSpace(currSpace);
                      props.socket.emit('turnSubmit', {
                        tile: currSpace,
                        tileType: props.mapSelection.value.tiles[currSpace].tileType,
                        lobbyId: props.lobby.lobbyId,
                        playerId: props.userName
                      });
                    }}
                    disabled={currSpace === prevSpace}
                    style={{width: '90%', marginTop: '0em', marginLeft: '0em', borderColor: 'grey', backgroundColor: currSpace === prevSpace ?  `var(--color-warning)` : `var(--color-primary)`}}
                  >
                    {currSpace === prevSpace ? "Must Move" : "End Turn"}
                  </Button> :
                  <div />
              }
              </Col>
            </Row>
            { (window.innerWidth > 1400) ? 
              <Row xs='12'>
                <Col xs='12' style={{overflowY: 'auto', height: '45vh'}}>
                  <DatatablePage
                    keyField='turn'
                    rowStyle={(row, rowIndex) => {
                      let bgColor = 'inherit';

                      if (row.event === 'attack') {
                        bgColor = `var(--color-danger)`;
                      } else if (row.player === pathViewPlayer) { // Attack bgColor takes precedence
                        bgColor = `var(--color-info)`;
                      }
                      return {backgroundColor: bgColor};
                    }}
                    selectRow={playerTableSelectRow}
                    columns={[
                      {dataField: 'turn', text: 'Turn', sort: true, editable: false},
                      { dataField: 'player',
                        text: 'Player',
                        sort: true,
                        // sortFunc: (a, b, order, dataField, rowA, rowB) => {
                        //   // Your custom sorting logic here
                        //   // let playerA = a.split(' -> ')[0];
                        //   // let playerB = b.split(' -> ')[0];
                        //   a = a.split(' -> ')[0];
                        //   b = b.split(' -> ')[0];
                        //   console.log(a);
                        //   console.log(b);

                        //   if (order === 'asc') {
                        //     return b - a;
                        //   }
                        //   return a - b; 
                        // },
                        editable: false,
                        style: {overflow: 'hidden', whiteSpace: 'nowrap'}
                      },
                      {dataField: 'tile', text: 'tile', editable: false},
                      {dataField: 'event', text: 'Event', editable: false, style: {overflow: 'hidden'}}
                    ]}
                    data={props.turnHistory}
                  />
                </Col>
              </Row>:
                <div />
            }
          </Col>
        </Row> 
        { (window.innerWidth <= 1400) ?  
              <Row xs='12'>
                <Col xs='12' style={{overflowY: 'auto', height: '25vh'}}>
                  <DatatablePage
                    keyField='turn'
                    rowStyle={(row, rowIndex) => {return {backgroundColor: row.event === 'attack' ? `var(--color-danger)` : 'inherit'}; }}
                    columns={[
                      {
                        dataField: 'turn',
                        text: 'Turn',
                        sort: true, 
                        editable: false
                      },
                      {dataField: 'player', text: 'Player', sort: true, editable: false, style: {overflow: 'hidden', whiteSpace: 'nowrap'}},
                      {dataField: 'tile', text: 'tile', editable: false},
                      {dataField: 'event', text: 'Event', editable: false}
                    ]}
                    data={props.turnHistory}
                  />
                </Col>
              </Row>
              :
              <div />
        }
        <Row className='align-items-center d-flex'>
          <Col xs='12' style={{position: 'fixed', bottom: '6em'}}>
            <Button className='warningButton' style={{width: '100%', height: '2.5em'}} onClick={(e)=>{setItemTrayPanelOpen(!itemTrayPanelOpen)}}>
              Items: 0
            </Button>
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
        <SlidingPanel
          type='bottom'
          isOpen={itemTrayPanelOpen}
          backdropClicked={() => setItemTrayPanelOpen(false)}
          noBackdrop={false}
          size={ 30 }
        >
          <div style={{overflow: 'hidden', backgroundColor: '#B5BEC6', height: '100%', paddingBottom: '5em', opacity: '90%'}}>
            Balls 
          </div>
        </SlidingPanel>
      </Container>
      </>
    );
  }
}

export default GameSession;
