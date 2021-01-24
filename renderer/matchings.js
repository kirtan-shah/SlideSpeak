
const addImageLeft = /add *(?:a|an)? *(?:image|picture|photo) *(?:of) *(?:a|an)?(.+?) *(?:on|to|onto|at)? *(?:the)? *left *(?:side)*/
const addImageRight = /add *(?:a|an)? *(?:image|picture|photo) *(?:of) *(?:a|an)?(.+?) *(?:on|to|onto|at)? *(?:the)? *right *(?:side)*/
const addImageTop = /add *(?:a|an)? *(?:image|picture|photo) *(?:of) *(?:a|an)?(.+?) *(?:on|to|onto|at)? *(?:the)? *(?:top|above) *(?:side)*/
const addImageBottom = /add *(?:a|an)? *(?:image|picture|photo) *(?:of) *(?:a|an)?(.+?) *(?:on|to|onto|at)? *(?:the)? *(?:below|bottom) *(?:side)*/
const addTitle = /(?:make|add|create) *(?:a|an|the)? *title *(?:containing|saying|that says|with the text)?(.+?)$/
const setBackgroundCommand = /(?:set|make) *(?:the)? *background *(?:color)? *(?:to)? *(.+?)$/
const nextSlide = /next *(?:slide|page)/
const previousSlide = /previous *(?:slide|page)/
const exportCommand = /export/
const addTextbox = /(?:make|add|create) *a? *(?:text\-box|textbox|text box) *(?:on|to|onto|at)? *(?:the)? *(.+?)$/
const makeItBigger = /make it bigger/
const makeItSmaller = /make it smaller/

let commands = {addImageLeft, addImageRight, addImageTop, addImageBottom, addTitle, setBackgroundCommand, nextSlide, previousSlide, exportCommand, addTextbox, makeItBigger, makeItSmaller}
let names = Object.keys(commands)

const matchings = names.map(name => ((str) => {
    let re = commands[name]
    let results = str.toLowerCase().replace(/\./g, '').match(re)
    let passed = results != null
    let params = passed && results.length >= 2 && results.slice(1).map(param => param.trim())
    return { name, passed, params }
}))