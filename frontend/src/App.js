import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

const SignIn = lazy(() => import('./components/SignIn'))
const SignUp = lazy(() => import('./components/SignUp'))
const Home = lazy(() => import('./components/Home'))
const Conference = lazy(() => import('./components/Conference'))
const Profile = lazy(() => import('./components/Profile'))
const Search = lazy(() => import('./components/Search'))
const Notifications = lazy(() => import('./components/Notifications'))
const Connections = lazy(() => import('./components/Connections'))
const ToS = lazy(() => import('./components/ToS'))
const About = lazy(() => import('./components/About'))
const Messages = lazy(() => import('./components/Messages'))
const Settings = lazy(() => import('./components/Settings'))
const ResetPassword = lazy(() => import('./components/ResetPassword'))
const Contact = lazy(() => import('./components/Contact'))
const Donate = lazy(() => import('./components/Donate'))
const NoMatch = lazy(() => import('./components/NoMatch'))

const App = () => (
	<Router>
		<div className="App">
			<Suspense fallback={<></>}>
				<Routes>
					<Route exact path="/sign-in" component={SignIn} />
					<Route exact path="/sign-up" component={SignUp} />
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

					<Route path="*" element={<NoMatch />} />
				</Routes>
			</Suspense>
		</div>
	</Router>
)

export default App
