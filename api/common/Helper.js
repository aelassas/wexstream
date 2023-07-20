import fs from 'fs'

export const escapeRegex = (string) => string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')

export const fileExists = (path) => new Promise((resolve) => fs.access(path, fs.constants.F_OK, (err) => resolve(!err)))