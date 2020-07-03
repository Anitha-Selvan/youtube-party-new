import React from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter,Route,Switch} from 'react-router-dom';
import Room from './routes/room';
import createRoom from './routes/CreateRoom';

const App = (props) => {
    return(
    <BrowserRouter>
        <Switch>
            <Route path='/' exact component={createRoom}></Route>
            <Route path='/room/:roomID' component={Room}></Route>
        </Switch>
    </BrowserRouter>
    // <div>Welcome</div>
    );
}

export default App;