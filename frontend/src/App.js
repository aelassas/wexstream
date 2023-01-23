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
// const NoMatch = lazy(() => import('./components/NoMatch'))

const App = () => (
	<Router>
		<div className="App">
			<Suspense fallback={<></>}>
				<Routes>
					<Route exact path="/sign-in" element={<SignIn />} />
					<Route exact path="/sign-up" element={<SignUp />} />
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

					<Route path="*" element={<SignIn />} />
				</Routes>
			</Suspense>
		</div>
	</Router>
)

export default App
