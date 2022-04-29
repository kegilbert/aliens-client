import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import {
  Modal,
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

// import safeSpace from 'safe-space';
// import dangerSpace from 'danger-space';

var host = window.location.hostname;
const socket = io('http://' + host + ':5000');

function App() {
  const [spaceOptions, setSpaceOptions] = useState([
    {label: '1 - Safe', value: 'safe', color: 'white', numTiles: 0, maxTiles: -1},
    {label: '2 - Dangerous', value: 'dangerous', color: 'grey', numTiles: 0, maxTiles: -1},
    {label: '3 - Human Spawn', value: 'hspawn', color: 'purple', numTiles: 0, maxTiles: 1},
    {label: '4 - Alien Spawn', value: 'aspawn', color: 'red', numTiles: 0, maxTiles: 1},
    {label: '5 - Escape Pod', value: 'escapepod', color: 'orange', numTiles: 0, maxTiles: 4},
    {label: '6 - Remove', value: 'remove', color: '', numTiles: 0, maxTiles: -1}
  ]);

  const [showUserModal, setShowUserModal] = useState(false);
  const [userName, setUserName] = useState('Kevin');
  const [tempUserName, setTempUserName] = useState(userName);
  const [toggleDrawingBtnColor, setToggleDrawingBtnColor] = useState('grey');
  const [currSpace, setCurrSpace] = useState();
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [newMap, setNewMap] = useState({tiles: {}, meta: {}});
  const [mapEditor, setMapEditor] = useState(false);
  const [spaceSelector, setSpaceSelector] = useState(spaceOptions[0]);
  const [mapOptions, setMapOptions] = useState([
    {label: 'New', value: newMap}
  ]);
  const [mapSelection, setMapSelection] = useState(mapOptions[0]);
  //const [mapEditorMap, setMapEditorMap] = useState([]);

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
    //setMapEditorMap(generateMapEditor());
    socket.on("connect", () => {  console.log(socket.id); });
    socket.on("responseMessage", (data) => {  console.log(data); });
    socket.on("emitMapList", (data) => {
      let _mapOptions = [...mapOptions];
      for (let [key, value] of Object.entries(data)) {
        _mapOptions.push({label: key, value: value});
      }
      console.log(data);
      setMapOptions(_mapOptions);
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
      //spaceSelector.numTiles += 1;
      //spaceOptions.map(space => space.value === spaceSelector.value).numTiles = spaceSelector.numTiles;
      const updatedSpaceOptions = [...spaceOptions];
      // const space_id = updatedSpaceOptions.map((space, idx) => {
      //   if (space.value === spaceSelector.value) {
      //     return idx;
      //   }
      // })[0];
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
    // setNewMap({
    //   ...newMap,
    //   [id]: {
    //     tileType: spaceSelector.value,
    //     color: spaceSelector.color,
    //   }
    // });
    updatedMap.tiles[id] = {
        tileType: spaceSelector.value,
        color: spaceSelector.color,
    };
    setNewMap(updatedMap);
    setUnsavedChanges(true);
  }


  const generateMap = () => {
    let hexagons = []

    console.log(mapSelection.value);

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


  const handleUserModalClose = () => {
    setShowUserModal(false);
  }

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
    <div className="App">
      <Router>
        <Navbar collapseOnSelect expand='sm' bg='dark' variant='dark' sticky='top'>
          <Container className="me-auto">
            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            <Navbar.Collapse id="responsive-navbar-nav">
            <Nav activeKey={window.location.pathname} fill className="me-auto">
              <Nav.Link as={NavLink} style={{color: 'orange'}} activeStyle={{textDecoration: 'underline', textDecorationThickness: '0.2em', textUnderlineOffset: '0.5em'}} exact to="/">Home</Nav.Link>
            </Nav>
            <Navbar.Brand onClick={(e) => {setShowUserModal(true);}} style={{marginTop: '-1em', marginBottom: '-1em', marginRight: '0em'}}>
              <IoPersonCircleOutline size={42}/>
            </Navbar.Brand>
          </Navbar.Collapse>
          </Container>

        </Navbar>
        <Routes>
          <Route path='/' exact component={Home} />
{/*          <Route path='/gui/i2c'>
            <BusTools
              devices={fullBusmap}
              setDevices={setFullBusmap}
            />
          </Route>*/}
        </Routes>
      </Router>

      <Modal show={showUserModal} onHide={handleUserModalClose}>
        <Modal.Header>
          <Modal.Title >User Info</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Container>
          <Row className='align-items-center'>
            <Col xs={12} className='align-items-center' style={{display: 'flex', justifyContent: 'center'}}>
              <InputGroup>
                <FormControl
                  aria-label="User Name"
                  value={tempUserName}
                  style={{boxShadow: 'none', borderColor: 'grey'}}
                  onChange={(e) => { setTempUserName(e.target.value); }}
                  // onKeyPress={(e) => {if(e.key === 'Enter') { handleSubmit(e); };}}
                />
                <InputGroup.Text><IoPencil/></InputGroup.Text>
              </InputGroup>
            </Col>
          </Row>
{/*          <Row className='align-items-center'>
            <Col xs={12} className='align-items-center' style={{display: 'flex', justifyContent: 'center'}}>
              <Button>
                Update User Name
              </Button>
            </Col>
          </Row>*/}
          </Container>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={(e) => {setTempUserName(userName); handleUserModalClose();}}>
            Close
          </Button>
          <Button variant="primary" onClick={(e) => {setUserName(tempUserName); handleUserModalClose();}}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

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
              setMapSelection(e);
              setNewMap({...e.value});
              const updatedSpaceOptions = [...spaceOptions];
              updatedSpaceOptions.map((space) => {
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
          <Button
            style={{
              backgroundColor: 'grey',
              boxShadow: 'None',
              borderColor: 'grey',
              width: '100%',
              marginTop: '1em'
            }}
            onClick={(e) => {
              const newMapName = prompt('Save new map as: ', `Map${mapOptions.length}`);
              let meta = {};
              spaceOptions.map((space) => { meta[space.value] = space.numTiles});
              console.log(meta);
              // const newMapObj = {
              //   [newMapName]: {
              //     tiles: newMap,
              //     meta: meta
              //   }};
              mapOptions.push(
                {label: newMapName, value: newMap}
              );
              setMapOptions(mapOptions);
              setMapSelection(mapOptions.at(-1));
              socket.emit('save', {[newMapName]: newMap});
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
              socket.emit('update', newMap);
              // let options = ;
              // options[mapOptions.indexOf(mapSelection)] = {
              //   ...mapSelection,
              //   value: newMap
              // }
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
              // setMapOptions([
              //   ...mapOptions,
              //   [mapOptions.indexOf(mapSelection)]: {label: mapSelection.label, value: newMap}
              // ]);
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
            }}
          >
              Reset
          </Button>
        </Col>
      </Row>
      </Container>
    </div>
  );
}

export default App;
