import fs from 'fs'

export const escapeRegex = (string) => string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')

export const fileExists = s => new Promise(resolve => fs.access(s, fs.constants.F_OK, e => resolve(!e)))