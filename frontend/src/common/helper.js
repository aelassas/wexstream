import { toast } from 'react-toastify'
import { strings } from '../config/app.config'

export const info = (message) => {
    toast(message, { type: 'info' })
}

export const error = (message, err) => {
    if (err && console && console.error) console.error(err)
    if (message) {
        toast(message, { type: 'error' })
    } else {
        toast(strings.GENERIC_ERROR, { type: 'error' })
    }
}

export const isObjectId = (id) => (
    id.match(/^[0-9a-fA-F]{24}$/)
)

export const clone = (obj) => {
    return JSON.parse(JSON.stringify(obj))
}

export const cloneArray = (arr) => {
    if (typeof arr === 'undefined') return undefined
    if (arr == null) return null
    return [...arr]
}