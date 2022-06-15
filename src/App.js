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

import './App.css';

import Home from './Home';
import Editor from './Editor';


// import safeSpace from 'safe-space';
// import dangerSpace from 'danger-space';

var host = window.location.hostname;
const socket = io('http://' + host + ':5000');

function App() {
  const [showUserModal, setShowUserModal] = useState(false);
  const [userName, setUserName] = useState('Kevin');
  const [tempUserName, setTempUserName] = useState(userName);


  const handleUserModalClose = () => {
    setShowUserModal(false);
  }


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
            </Nav>
            <Navbar.Brand onClick={(e) => {setShowUserModal(true);}} style={{marginTop: '-1em', marginBottom: '-1em', marginRight: '0em'}}>
              <IoPersonCircleOutline size={42}/>
            </Navbar.Brand>
          </Navbar.Collapse>
          </Container>

        </Navbar>
        <Routes>
          <Route path='/' exact element={<Home />} />
        </Routes>
        <Routes>
          <Route path='/editor' element={<Editor />} />
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
    </div>
  );
}

export default App;
