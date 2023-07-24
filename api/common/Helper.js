import fs from 'fs/promises'

export const escapeRegex = (string) => string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')

export const exists = async (path) => {
    try {
        await fs.access(path)
        return true
    } catch {
        return false
    }
}