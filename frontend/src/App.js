import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Navigate, Switch } from 'react-router-dom';
import Signin from './Signin';
import Signup from './Signup';
import Home from './Home';
import Conference from './Conference';
import Profile from './Profile';
import Search from './Search';
import Notifications from "./Notifications";
import Connections from './Connections';
import ToS from './ToS';
import About from './About';
import Messages from './Messages';
import Settings from './Settings';
import ResetPassword from './ResetPassword';
import Contact from './Contact';
import Donate from './Donate';
import '../assets/css/index.css';

class App extends Component {

	render() {
		return (
			<Router>
				<div className="App">
					<Switch>
						<Route exact path="/sign-in" component={Signin} />
						<Route exact path="/sign-up" component={Signup} />
						<Route exact path="/home" component={Home} />
						<Route exact path="/conference" component={Conference} />
						<Route exact path="/profile" component={Profile} />
						<Route exact path="/search" component={Search} />
						<Route exact path="/notifications" component={Notifications} />
						<Route exact path="/connections" component={Connections} />
						<Route exact path="/messages" component={Messages} />
						<Route exact path="/settings" component={Settings} />
						<Route exact path="/reset-password" component={ResetPassword} />
						<Route exact path="/tos" component={ToS} />
						<Route exact path="/about" component={About} />
						<Route exact path="/contact" component={Contact} />
						<Route exact path="/donate" component={Donate} />
						<Route path="/" element={<Navigate replace to="/sign-in" />} />
					</Switch>
				</div>
			</Router>
		);
	}
}
export default App;
