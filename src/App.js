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

// import safeSpace from 'safe-space';
// import dangerSpace from 'danger-space';

var host = window.location.hostname;
const socket = io('http://' + host + ':5069');

function App() {
  const [showUserModal, setShowUserModal] = useState(false);
  const [userName, setUserName] = useState('Kevin');
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
  const [lobbyMapSelection, setLobbyMapSelection] = useState(mapOptions[0]);


  const handleUserModalClose = () => {
    setShowUserModal(false);
  }

  /**
   *  Pagge load useEffect
   */
  useEffect(() => {
    socket.on("emitMapList", (data) => {
      let _mapOptions = [...mapOptions];
      setMapOptions([{label: 'New', value: {tiles: [], meta: {safe: 0, dangerous: 0, hspawn: 0, aspawn: 0, escapepod: 0, remove: 0}}}, ...data]);
    });
    socket.on('lobbiesList', (data) => {
      console.log(data);
      setLobbies(data);
    });

    socket.emit('getLobbies', {});
    socket.emit('getMapList', {});
  }, []);


  useEffect(() => {
    if (lobbyId !== '') {
      setLobby(lobbies.filter((lobby) => lobby.lobbyId === lobbyId)[0]);
    }
  }, [lobbies]);


  useEffect(() => {
    console.log(lobby);
  }, [lobby]);


  return (
    <div className="App">
      <Router>
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
              socket={socket}
            />
          }/>
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

        <SlidingPanel
          type='bottom'
          isOpen={openLobbyPanel}
          backdropClicked={() => setOpenLobbyPanel(false)}
          noBackdrop={false}
          size={ 85 }
        >
          <div style={{overflow: 'scroll', backgroundColor: `var(--color-seconday)`, height: '100%', paddingBottom: '5em', opacity: '100%'}}>
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
              socket={socket}
            /> 
          </div>
        </SlidingPanel>

    </div>
  );
}

export default App;
