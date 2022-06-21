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
import {
  Stage,
  Layer,
  Text,
  Image,
  Line,
  Rect,
  Circle,
  RegularPolygon
} from 'react-konva';
import io from 'socket.io-client';
import {
  IoPersonCircleOutline,
  IoPencil
} from 'react-icons/io5'; // MIT Licensed icons

import './App.css';

import Home from './Home';
import { defaultMapNames } from './defaultMapNames';

// import safeSpace from 'safe-space';
// import dangerSpace from 'danger-space';

var host = window.location.hostname;
const socket = io('http://' + host + ':5000');

function Editor(props) {
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
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [newMap, setNewMap] = useState({tiles: {}, meta: {}});
  const [mapEditor, setMapEditor] = useState(true);
  const [spaceSelector, setSpaceSelector] = useState(spaceOptions[0]);
  const [mapOptions, setMapOptions] = useState([
    {label: 'New', value: newMap}
  ]);
  const [mapSelection, setMapSelection] = useState(mapOptions[0]);


  document.addEventListener('keydown', function(event) {
    const keycode = parseInt(event.keyCode);
    console.log(keycode);
    if ((keycode >= 49 && keycode <= (48 + spaceOptions.length)) && mapEditor) {
      console.log('Setting space options');
      setSpaceSelector(spaceOptions[keycode - 49]);
    }
  });

  // client-side
  useEffect(() => {
    console.log(defaultMapNames);
    //setMapEditorMap(generateMapEditor());
    socket.on("connect", () => {  console.log(socket.id); });
    socket.on("responseMessage", (data) => {  console.log(data); });
    socket.on("emitMapList", (data) => {
      let _mapOptions = [...mapOptions];
      setMapOptions([{label: 'New', value: {tiles: [], meta: {safe: 0, dangerous: 0, hspawn: 0, aspawn: 0, escapepod: 0, remove: 0}}}, ...data]);
    });

    socket.on("connect_error", (err) => {  console.log(`connect_error due to ${err.message}`);});
    socket.emit('getMapList', {});
  }, []);


  const hexClickHandle = (e, id) => {
    setCurrSpace(id);
    socket.emit('incoming', {test: id});
    let updatedMap = {...newMap};
    console.log(spaceSelector.numTiles);
    console.log(spaceSelector.maxTiles);
    if (spaceSelector.numTiles === spaceSelector.maxTiles) {
      const oldTile = Object.keys(newMap.tiles).find(tile => newMap.tiles[tile].tileType === spaceSelector.value);
      console.log(oldTile);
      console.log(e);
      e.target.getStage().findOne(`#${oldTile}`).setAttrs({
        fill: 'cyan'
      });
      delete updatedMap.tiles[oldTile];
      delete mapSelection.value.tiles[oldTile];
    } else {
      const updatedSpaceOptions = [...spaceOptions];
      const space_id = Object.keys(updatedSpaceOptions).find(space => updatedSpaceOptions[space].value === spaceSelector.value);
      spaceSelector.numTiles += 1;
      updatedSpaceOptions[space_id].numTiles = spaceSelector.numTiles;
      setSpaceOptions(updatedSpaceOptions);
      console.log(spaceOptions);
      console.log(spaceSelector);
    }
    e.currentTarget.setAttrs({
      fill: spaceSelector.color
    });

    updatedMap.tiles[id] = {
        tileType: spaceSelector.value,
        color: spaceSelector.color,
    };
    setNewMap(updatedMap);
    setUnsavedChanges(true);
  }


  const generateMap = () => {
    let hexagons = []

    for (let row = 1; row < 15; row++) {
      for (let col = 0; col < 23; col++) {
        let id = String.fromCharCode(0x41 + col) + (row).toString().padStart(2, '0');

        if (id in mapSelection.value.tiles && mapSelection.value.tiles[id].tileType !== 'remove') {
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
              fill={id === currSpace ? 'green' : mapSelection.value.tiles[id].color}
              stroke='black'
              strokeWidth={1}
              onClick={(e) => {console.log(e.currentTarget.attrs); setCurrSpace(id); socket.emit('incoming', {test: id}); }}
              onTap={(e) => {console.log(e.currentTarget.attrs); setCurrSpace(id); socket.emit('incoming', {test: id}); }}
              //dash={[16, 10]} // apply dashed stroke that is 10px long and 5 pixels apart
              name={id}
              fillAfterStrokeEnabled={true}
              opacity={0.4}
              rotation={90}
            />
            </>
          );
        }
      }
    }

    return hexagons;
  }


  const generateMapEditor = () => {
    let hexagons = [];

    for (let row = 1; row < 15; row++) {
      for (let col = 0; col < 23; col++) {
        let id = String.fromCharCode(0x41 + col) + (row).toString().padStart(2, '0');

        //if (!(id in Object.values(newMap).filter(tile => tile.tileType === 'remove'))) {
        if (!(id in newMap.tiles && newMap.tiles[id].tileType === 'remove')) {
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
              fill={id in mapSelection.value.tiles ?
                mapSelection.value.tiles[id].color :
                'cyan'
              }
              stroke='black'
              strokeWidth={1}
              onClick={(e) => {hexClickHandle(e, id)}}
              onTap={(e) => {hexClickHandle(e, id)}}
              //dash={[16, 10]} // apply dashed stroke that is 10px long and 5 pixels apart
              name={id}
              fillAfterStrokeEnabled={true}
              opacity={0.4}
              rotation={90}
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
    console.log('Mouse Down');
    setIsDrawing(true);
    //const pos = e.target.getStage().getPointerPosition();
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
    console.log('Mouse Up');
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

  const [stageScaleX, setStageScaleX] = useState(window.innerWidth < 1000 ? 0.6 : 1);
  const [stageScaleY, setStageScaleY] = useState(window.innerWidth < 1000 ? 0.6 : 1);
  return (
     <Container fluid>
      <Row>
        <Button
          variant='secondary'
          style={{boxShadow: 'None'}}
          onClick={() => {
            if (mapEditor && unsavedChanges) {
              if (window.confirm('WARNING: Unsaved changes will be lost. Proceed?')) {
                setMapEditor(!mapEditor);
              }
            } else {
              setMapEditor(!mapEditor);
            }
          }}
        >
          {
            mapEditor ?
              <span> View Map </span> :
              <span> Map Editor </span> 
          }
        </Button>
      </Row>
      <Row className='align-items-center'>
        <Col sm='12' md='9' className='align-items-center'>
          <Stage
            pixelRatio={1.5}
            style={{marginTop: '1em', display: 'flex', justifyContent: 'center'}}
            width={window.innerWidth * (window.innerWidth < 1000 ? 1 : 0.75)}
            height={window.innerHeight * (window.innerHeight < 700 ? 0.55 : 0.85)}
            onWheel={(e) => {
              e.evt.preventDefault();
              if (e.evt.deltaY > 15 || e.evt.deltaY < 15) {
                setStageScaleX(stageScaleX + (e.evt.deltaY/250));
                setStageScaleY(stageScaleX + (e.evt.deltaY/250));
              }
            }}
            scaleX={stageScaleX}
            scaleY={stageScaleY}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onTouchStart={handleMouseDown}
            onTouchmove={handleMouseMove}
            onMouseup={handleMouseUp}
            draggable={!drawingEnabled}
          >
            <Layer>
              {
                mapEditor ? 
                  generateMapEditor() :
                  //mapEditorMap :
                  generateMap()
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
        <Col sm='3' className='align-items-center' style={{paddingLeft: '1em'}}>
          <Select
            options={mapOptions}
            value={mapSelection}
            onChange={(e) => {
              console.log(e);
              setMapSelection(e);
              setNewMap({...e.value});
              const updatedSpaceOptions = [...spaceOptions];
              updatedSpaceOptions.map((space) => {
                console.log(space);
                space.numTiles = e.value.meta[space.value];
              });
              console.log('UPDATED SPACE OPTS META: ');
              console.log(updatedSpaceOptions);
              setSpaceOptions(updatedSpaceOptions);
            }}
            styles={primarySelectStyles}
          />
          <Select
            options={spaceOptions}
            value={spaceSelector}
            onChange={(e) => {setSpaceSelector(e);}}
            styles={primarySelectStyles}
            isSearchable={false}
          />
          <Row>
            <Col>
              <Button
                style={{
                  backgroundColor: toggleDrawingBtnColor,
                  borderColor: toggleDrawingBtnColor,
                  boxShadow: 'None',
                  width: '100%',
                }}
                onClick={(e) => { setDrawingEnabled(!drawingEnabled); setToggleDrawingBtnColor(toggleDrawingBtnColor === 'grey' ? '#ff6961' : 'grey')}}
              >
                  Toggle Drawing
              </Button>
            </Col>
            <Col>
              <Button
                style={{
                  backgroundColor: 'grey',
                  borderColor: 'grey',
                  boxShadow: 'None',
                  width: '100%',
                }}
                onClick={(e) => { setLines([]); }}
              >
                  Clear Drawing
              </Button>
            </Col>
          </Row>
          <Button
            style={{
              backgroundColor: 'grey',
              boxShadow: 'None',
              borderColor: 'grey',
              width: '100%',
              marginTop: '1em'
            }}
            onClick={(e) => {
              //const newMapName = prompt('Save new map as: ', `Map${mapOptions.length}`);
              const currentMapNames = mapOptions.map((_map) => { return _map.label; } );
              let defaultMapName = defaultMapNames.filter(_map => currentMapNames.indexOf(_map) === -1);
              let nameLoopCount = 1;
              let defaultMapNamesUpdated = defaultMapNames;
              while (defaultMapName.length === 0) {
                nameLoopCount += 1;
                defaultMapNamesUpdated = defaultMapNames.map((_map) => { return `${_map}-${nameLoopCount}` });
                defaultMapName = defaultMapNamesUpdated.filter(_map => currentMapNames.indexOf(_map) === -1);
              }
              const newMapName = prompt('Save new map as: ', `${defaultMapName[0]}`);
              let meta = {};
              spaceOptions.map((space) => { meta[space.value] = space.numTiles});
              console.log(meta);
              mapOptions.push(
                {label: newMapName, value: newMap}
              );
              setMapOptions(mapOptions);
              setMapSelection(mapOptions.at(-1));
              //socket.emit('save', {[newMapName]: {...newMap, meta: meta}});
              socket.emit('save', {'mapName': newMapName, ...newMap, meta: meta, user: props.userName});
              setUnsavedChanges(false);
            }}
          >
                Save New
          </Button>
          <Button
            style={{
              backgroundColor: 'grey',
              boxShadow: 'None',
              borderColor: 'grey',
              width: '100%',
              marginTop: '1em'
            }}
            onClick={(e) => {
              socket.emit('save', {mapName: mapSelection.label, ...newMap, user: props.userName});
              setMapOptions(mapOptions.map((map => {
                if (mapSelection.label === map.label) {
                  return {label: mapSelection.label, value: newMap}
                } else {
                  return map;
                }
              })));
              setMapSelection({
                ...mapSelection,
                value: newMap
              })
              setUnsavedChanges(false);
            }}
          >
              Update
          </Button>
          <Button
            style={{
              backgroundColor: 'grey',
              boxShadow: 'None',
              borderColor: 'grey',
              width: '100%',
              marginTop: '1em'
            }}
            onClick={(e) => {
              setNewMap({tiles: {}, meta: {}});
              const updatedSpaceOptions = [...spaceOptions];
              updatedSpaceOptions.map((space) => {
                space.numTiles = 0;
              });
              setSpaceOptions(updatedSpaceOptions);
              setUnsavedChanges(false);
            }}
          >
              Reset
          </Button>
        </Col>
      </Row>
    </Container>
  );
}

export default Editor;
