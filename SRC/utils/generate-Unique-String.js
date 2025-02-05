


import { customAlphabet } from 'nanoid'

const generateUniqueString = (length) => {

    const nanoid = customAlphabet('12345asdfgh', length || 13)
    return nanoid()
}


export default generateUniqueString