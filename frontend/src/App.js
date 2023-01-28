import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

const SignIn = lazy(() => import('./pages/SignIn'))
const SignUp = lazy(() => import('./pages/SignUp'))
const Home = lazy(() => import('./pages/Home'))
const Conference = lazy(() => import('./pages/Conference'))
const Profile = lazy(() => import('./pages/Profile'))
const Search = lazy(() => import('./pages/Search'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Connections = lazy(() => import('./pages/Connections'))
const ToS = lazy(() => import('./pages/ToS'))
const About = lazy(() => import('./pages/About'))
const Messages = lazy(() => import('./pages/Messages'))
const Settings = lazy(() => import('./pages/Settings'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Contact = lazy(() => import('./pages/Contact'))
const NoMatch = lazy(() => import('./pages/NoMatch'))

const App = () => (
	<Router>
		<div className="App">
			<Suspense fallback={<></>}>
				<Routes>
					<Route exact path="/sign-in" element={<SignIn />} />
					<Route exact path="/sign-up" element={<SignUp />} />
					<Route exact path="/" element={<Home />} />
					<Route exact path="/home" element={<Home />} />
					<Route exact path="/conference" element={<Conference />} />
					<Route exact path="/profile" element={<Profile />} />
					<Route exact path="/search" element={<Search />} />
					<Route exact path="/notifications" element={<Notifications />} />
					<Route exact path="/connections" element={<Connections />} />
					<Route exact path="/messages" element={<Messages />} />
					<Route exact path="/settings" element={<Settings />} />
					<Route exact path="/reset-password" element={<ResetPassword />} />
					<Route exact path="/tos" element={<ToS />} />
					<Route exact path="/about" element={<About />} />
					<Route exact path="/contact" element={<Contact />} />

					<Route path="*" element={<NoMatch />} />
				</Routes>
			</Suspense>
		</div>
	</Router>
)

export default App