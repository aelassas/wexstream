export const LANGUAGES = ['en', 'fr']
export const DEFAULT_LANGUAGE = process.env.REACT_APP_WS_DEFAULT_LANGUAGE
export const DATE_FORMAT = process.env.REACT_APP_WS_DATE_FORMAT
export const JITSI_HOST = process.env.REACT_APP_WS_JITSI_HOST
export const JITSI_API = process.env.REACT_APP_WS_JITSI_API
export const API_HOST = process.env.REACT_APP_WS_API_HOST
export const PAGE_SIZE = parseInt(process.env.REACT_APP_WS_PAGE_SIZE)
export const CDN = process.env.REACT_APP_WS_CDN
export const PAGE_TOP_OFFSET = 50 + 15
export const MESSAGES_TOP_OFFSET = (50 + 15) + 68
export const PAGE_FETCH_OFFSET = 30
export const isMobile = () => window.innerWidth <= 960