import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, useNavigate } from 'react-router-dom';
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

import io from 'socket.io-client';
import {
  IoPersonCircleOutline,
  IoPencil
} from 'react-icons/io5'; // MIT Licensed icons
import SlidingPanel from 'react-sliding-side-panel';


import './App.css';
import 'react-sliding-side-panel/lib/index.css';

import Home from './Home';
import Editor from './Editor';
import Lobbies from './Lobbies';
import Lobby from './Lobby';
import GameSession from './GameSession';

// import safeSpace from 'safe-space';
// import dangerSpace from 'danger-space';
  
var host = window.location.hostname;
const socket = io('http://' + host + ':5069');


function App() {
  const [showUserModal, setShowUserModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [tempUserName, setTempUserName] = useState(userName);
  const [lobbySearchInput, setLobbySearchInput] = useState('');
  const [lobbyId, setLobbyId] = useState('');
  const [lobby, setLobby] = useState();
  const [lobbies, setLobbies] = useState([]); 
  const [openLobbyPanel, setOpenLobbyPanel] = useState(false);
  const [newMap, setNewMap] = useState({tiles: {}, meta: {}});
  const [mapOptions, setMapOptions] = useState([
    {label: 'New', value: newMap}
  ]);
  const [mapEditorSelection, setMapEditorSelection] = useState(mapOptions[0]);
  const [lobbyMapSelection, setLobbyMapSelection] = useState(null);
  const [gameCodeId, setGameCodeId] = useState('');
  //const [role, setRole] = useState('');
  const [playerState, setPlayerState] = useState();
  const [newUsernameUnavailable, setNewUsernameUnavailable] = useState(false);


  const lobbyRef = useRef(lobby);
  const tempUserNameRef = useRef(tempUserName);

  const navigate = useNavigate();


  const handleUserModalClose = () => {
    setNewUsernameUnavailable(false);
    setShowUserModal(false);
  }

  const handleUnload = (e) => {
    e.preventDefault();
  }

  /**
   *  Pagge load useEffect
   */
  useEffect(() => {
    var cached_username = window.localStorage.getItem('username');
    if (cached_username !== 'null') {
      socket.emit('registerUsername', {username: cached_username});
      setTempUserName(cached_username);
    }
    //setUserName(window.localStorage.getItem('username'));

    socket.on('emitMapList', (data) => {
      let _mapOptions = [...mapOptions];
      setMapOptions([{label: 'New', value: {tiles: [], meta: {safe: 0, dangerous: 0, hspawn: 0, aspawn: 0, escapepod: 0, remove: 0}}}, ...data]);
    });
    socket.on('lobbiesList', (data) => {
      setLobbies(data);
    });

    socket.on('playerEvent', (data) => {
      console.log(data);
    });

    socket.on('roomEvent', (data) => {
      console.log(data);
    });

    // socket.on('lobbyPlayerJoin', (data) => {
    //   let updated_lobby = {...lobbyRef.current};
    //   updated_lobby.players.push({playerName: data.playerName, playerReady: false});
    //   setLobby(updated_lobby);
    // });

    // socket.on('lobbyPlayerReadyUpdate', (data) => {
    //   let updated_lobby = {...lobbyRef.current};
    //   updated_lobby.players[data.playerIdx].playerReady = data.playerReady;
    //   setLobby(updated_lobby);
    // });

    socket.on('roleAssignment', (data) => {
      setPlayerState(data.player);
    });

    socket.on('joinCreatorToLobby', (data) => {
      setLobby(lobbies.filter((lobby) => lobby.lobbyId === lobbyId)[0]);
    })

    socket.on('usernameRegistered', (data) => {
      setUserName(tempUserNameRef.current);
      window.localStorage.setItem('username', tempUserNameRef.current);
      handleUserModalClose();
    });

    socket.on('usernameUnavailable', (data) => {
      setNewUsernameUnavailable(true);
    });

    socket.on("gameStartResp", (data) => {
      setOpenLobbyPanel(false);
      navigate(`/gamesession/${lobbyRef.current.lobbyId}`, {replace: true});
    });

    socket.on('connect', (data) => {
      socket.emit('getLobbies', {});
      socket.emit('getMapList', {});
    });

    // Apparently can't send socket events in this event handler
    //window.addEventListener("beforeunload", handleUnload);
  }, []);


  useEffect(() => {
    if (lobbyId !== '') {
      setLobby(lobbies.filter((lobby) => lobby.lobbyId === lobbyId)[0]);
    }
  }, [lobbies]);


  useEffect(() => {
    lobbyRef.current = lobby;

    if (lobby !== undefined) {
      let map = mapOptions.filter((map) => map.label === lobby.mapLabel);

      if (map.length === 1) {
        setLobbyMapSelection(map[0]);        
      }
    }
  }, [lobby]);


  useEffect(() => {
    tempUserNameRef.current = tempUserName;

    // window.addEventListener("beforeunload", handleUnload);
    // return () => window.removeEventListener("beforeunload", handleUnload);
  }, [tempUserName]);


  const handleUsernameSave = () => {
    // Query for existing usernames
    console.log('Registering username: ' + tempUserName);
    socket.emit('registerUsername', {username: tempUserName});
    // setUserName(tempUserName);
    // handleUserModalClose();
  }


  return (
    <div className="App">
{/*      <Router>*/}
        <Navbar collapseOnSelect expand='sm' bg='dark' variant='dark' sticky='top'>
          <Container className="me-auto">
            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            <Navbar.Collapse id="responsive-navbar-nav">
            <Nav activeKey={window.location.pathname} fill className="me-auto">
              <Nav.Link as={NavLink} style={{color: 'orange'}} activeStyle={{textDecoration: 'underline', textDecorationThickness: '0.2em', textUnderlineOffset: '0.5em'}} exact to="/">| Home | </Nav.Link>
              <Nav.Link as={NavLink} style={{color: 'orange'}} activeStyle={{textDecoration: 'underline', textDecorationThickness: '0.2em', textUnderlineOffset: '0.5em'}} to="/editor">| Map Editor | </Nav.Link>
              <Nav.Link as={NavLink} style={{color: 'orange'}} activeStyle={{textDecoration: 'underline', textDecorationThickness: '0.2em', textUnderlineOffset: '0.5em'}} to="/lobbies">| Lobbies | </Nav.Link>
            </Nav>
            <Navbar.Brand style={{marginTop: '-1em', marginBottom: '-1em', marginRight: '0em'}}>
              {
                lobbyId.length > 0 ?
                  <span style={{color: 'orange', fontSize: '0.8em', marginRight: '1em', cursor: 'pointer'}} onClick={() => {setOpenLobbyPanel(true)}}>
                    | Current Lobby |
                  </span> :
                  <div />
              }
              <IoPersonCircleOutline size={42} style={{cursor: 'pointer'}} onClick={(e) => {setShowUserModal(true);}} />
            </Navbar.Brand>
          </Navbar.Collapse>
          </Container>
        </Navbar>
        <Routes>
          <Route path='/' exact element={<Home />} />
        </Routes>
        <Routes>
          <Route path='/editor' element={
            <Editor
              userName={userName}
              newMap={newMap}
              setNewMap={setNewMap}
              mapOptions={mapOptions}
              setMapOptions={setMapOptions}
              mapSelection={mapEditorSelection}
              setMapSelection={setMapEditorSelection}
              socket={socket}
            />
          }/>
        </Routes>
        <Routes>
          <Route path='/lobbies' element={
            <Lobbies
              userName={userName}
              searchInput={lobbySearchInput}
              lobbies={lobbies}
              lobby={lobby}
              setLobby={setLobby}
              setSearchInput={setLobbySearchInput}
              lobbyId={lobbyId}
              setLobbyId={setLobbyId}
              setOpenLobbyPanel={setOpenLobbyPanel}
              setShowUserModal={setShowUserModal}
              socket={socket}
            />
          }/>
        </Routes>
        <Routes>
          <Route path='/gamesession/:id' element={
            <GameSession
              userName={userName}
              searchInput={lobbySearchInput}
              lobbies={lobbies}
              lobby={lobby}
              setLobby={setLobby}
              setSearchInput={setLobbySearchInput}
              lobbyId={lobbyId}
              setLobbyId={setLobbyId}
              setOpenLobbyPanel={setOpenLobbyPanel}
              socket={socket}
              mapSelection={lobbyMapSelection}
              gameCodeId={gameCodeId}
              playerName={tempUserName}
              playerState={playerState}
            />
          }/>
        </Routes>
{/*      </Router>*/}

      <Modal show={showUserModal} onHide={handleUserModalClose} onKeyDown={(e) => {if(e.key === 'Enter') {handleUsernameSave();}}}>
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
          {
            newUsernameUnavailable ?
              <Row className='align-items-center'>
                <Col className='align-items-center d-flex'>
                  <span style={{color: 'red'}}> UNAVAILABLE </span>
                </Col>
              </Row> :
              <div />
            }
          </Container>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={(e) => {setTempUserName(userName); handleUserModalClose();}}>
            Close
          </Button>
          <Button variant="primary" onClick={(e) => {handleUsernameSave();}}>
            Save Changes
          </Button
>        </Modal.Footer>
      </Modal>

        <SlidingPanel
          type='bottom'
          isOpen={openLobbyPanel}
          backdropClicked={() => setOpenLobbyPanel(false)}
          noBackdrop={false}
          size={ 85 }
        >
          <div style={{overflow: 'scroll', backgroundColor: '#B5BEC6', height: '100%', paddingBottom: '5em', opacity: '100%'}}>
            <Lobby
              setOpenLobbyPanel={setOpenLobbyPanel}
              lobbyId={lobbyId}
              setLobbyId={setLobbyId}
              lobby={lobby}
              setLobby={setLobby}
              mapOptions={mapOptions}
              setMapOptions={setMapOptions}
              newMap={newMap}
              setNewMap={setNewMap}
              lobbyMapSelection={lobbyMapSelection}
              setLobbyMapSelection={setLobbyMapSelection}
              gameCodeId={gameCodeId}
              setGameCodeId={setGameCodeId}
              userName={userName}
              //navigate={navigate}
              socket={socket}
            /> 
          </div>
        </SlidingPanel>

    </div>
  );
}

export default App;
