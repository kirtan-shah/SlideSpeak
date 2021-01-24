const { ipcRenderer } = require('electron')
const ImageScraper = require('bing-image-scraper')
const download = require('downloadjs')

var backgroundColor = "#ffffff"
var slideObjects = []
for(let i = 0; i < 10; i++) {
    var layout = {
        top: null,
        left: null,
        right: null,
        bottom: null,
        center: null
    }
    var commandStack = []
    slideObjects.push({ layout, commandStack })
}
var recording = false
var isCreatingTextBox = false
var textboxLines = []
var textboxLoc

document.getElementById('start-btn').addEventListener('click', () => {
    console.log('Invoking startSpeechStream')
    ipcRenderer.send('startSpeechStream')
})

ipcRenderer.on('speechTranscript', (event, data) => {
    if(!recording) return
    document.getElementById('output').textContent = (isCreatingTextBox ? 'Text box: ' : 'Voice Command: ') + data.result
    document.getElementById('output').style.color = data.isFinal ? 'green' : 'red'
    //console.log(data)
    if(isCreatingTextBox) {
        console.log('creating', data.result)
        if(data.isFinal) {
            textboxLines.push(data.result.split('.').filter(str => str.trim() != '').map(text => '• ' + text.trim()))
        }
        if(data.result.toLowerCase().includes('end textbox') || data.result.toLowerCase().includes('end text box') || data.result.toLowerCase().includes('and text box') || data.result.toLowerCase().includes('and textbox')) {
            let { layout, commandStack } = slideObjects[pageNum - 1]
            let bulletPoints = textboxLines.reduce((resultArray, arr) => resultArray.concat(arr), [])
            obj = { type: 'textbox', x: 0, y: 0, width: 0, height: 0, lines: bulletPoints, fontSize: 40  }
            commandStack.push(obj)
            layout[textboxLoc] = obj
            isCreatingTextBox = false
            textboxLines = []
            update()

        }
        return
    }
    if(data.isFinal) checkCommands(data.result)
})
async function checkCommands(data) {
    let { layout, commandStack } = slideObjects[pageNum - 1]
    let results = matchings.slice().map(m => m(data))
    let matched = false
    for(let matching of results) {
        if(matching.passed) {
            matched = true
            let obj, recent
            switch(matching.name) {
                case 'addImageLeft':
                    obj = { type: 'image', object: matching.params[0], imageIndex: 0,
                        x: 0, y: 0, width: 0, height: 0, scalar: 0.8 }
                    commandStack.push(obj)
                    layout.left = obj
                    break
                case 'addImageRight':
                    obj = { type: 'image', object: matching.params[0], imageIndex: 0,
                        x: 0, y: 0, width: 0, height: 0, scalar: 0.8 }
                    commandStack.push(obj)
                    layout.right = obj
                    break
                case 'addImageTop':
                    obj = { type: 'image', object: matching.params[0], imageIndex: 0,
                        x: 0, y: 0, width: 0, height: 0, scalar: 0.8 }
                    commandStack.push(obj)
                    layout.top = obj
                    break
                case 'addImageBottom':
                    obj = { type: 'image', object: matching.params[0], imageIndex: 0,
                        x: 0, y: 0, width: 0, height: 0, scalar: 0.8 }
                    commandStack.push(obj)
                    layout.bottom = obj
                    break
                case 'addTitle':
                    obj = { type: 'title', text: matching.params[0],
                        x: 0, y: 0, width: 0, fontSize: 75, height: 80 }
                    commandStack.push(obj)
                    layout.top = obj
                    break
                case 'setBackgroundCommand':
                    backgroundColor = colourNameToHex(matching.params[0].replace(/\s/g,'').toLowerCase())
                    break
                case 'nextSlide':
                    //console.log(pageNum, editablePdf.getPageCount())
                    currentPage = editablePdf.getPage(pageNum) // page num is 1-indexed
                    onNextPage()
                    return
                case 'previousSlide':
                    currentPage = editablePdf.getPage(Math.max(pageNum - 2, 0))
                    onPrevPage()
                    return
                case 'exportCommand':
                    editablePdf.save().then(pdfBytes => download(pdfBytes, "Exported Slideshow.pdf", "application/pdf"))
                    return
                case 'addTextbox':
                    console.log('add textbox command found')
                    isCreatingTextBox = true
                    textboxLoc = matching.params[0]
                    return
                case 'makeItBigger':
                    recent = commandStack[commandStack.length - 1]
                    if(recent.type == 'textbox' || recent.type == 'title') recent.fontSize += 10
                    if(recent.type == 'image') recent.scalar += .1
                    break
                case 'makeItSmaller':
                    recent = commandStack[commandStack.length - 1]
                    if(recent.type == 'textbox' || recent.type == 'title') recent.fontSize -= 10
                    if(recent.type == 'image') recent.scalar -= .1
                    break
            }
        }
    }
    if(!matched) return
    // commandStack.sort((a, b) => {
    //     if(a.type == 'image') return -1
    //     if(b.type == 'image') return 1
    //     return 0
    // })
    update()
}

async function update() {
    computeLayout()
    await resetPdf()
    setTimeout(renderStack, 200)
}

let padding = 10
let applyPadding = (p, obj) => (
    {
        x: obj.x + p,
        y: obj.y + p,
        width: obj.width - 2*p,
        height: obj.height - 2*p
    }
)
async function renderStack() {
    let { layout, commandStack } = slideObjects[pageNum - 1]
    //let promises = []
    drawBackColor()
    for(let obj of commandStack) {
        let { x, y, width, height } = applyPadding(padding, obj)
        console.log(x, y, width, height, obj)
        switch(obj.type) {
            case 'image':
                await drawImageOf(obj.object, x, y, width, height, obj.scalar)
                break
            case 'title':
                drawTitle(obj.text, obj.fontSize, x, y, width, height)
                break
            case 'textbox':
                drawTextbox(obj.lines, obj.fontSize, x, y, width, height)
                break
        }
    }
    refreshPdf()
}

function computeLayout() {
    let { layout, commandStack } = slideObjects[pageNum - 1]
    let size = currentPage.getSize()
    let content = [layout.left, layout.center, layout.right]
    let divisionsX = 3 - content.count(null)
    let ind = 0
    for(let loc of content) {
        if(loc && divisionsX > 0) {
            loc.x = ind * size.width / divisionsX
            loc.width = size.width / divisionsX
            ind++
        }
    }
    let totalH = size.height
    let divisions = [layout.top != null && layout.top.type != 'title', !!(layout.left || layout.center || layout.right), layout.bottom != null && layout.bottom.type != 'title']
    if(layout.top && layout.top.type == 'title') {
        totalH -= layout.top.height
    }
    if(layout.bottom && layout.bottom.type == 'footer') {
        totalH -= layout.bottom.height
    }
    let divisionsY = divisions.count(true)
    let subH = divisionsY == 0 ? 0 : totalH / divisionsY
    if(divisions[0]) layout.top.height = subH
    if(divisions[1]) {
        if(layout.left) {
            layout.left.height = subH
        }
        if(layout.center) {
            layout.center.height = subH
        }
        if(layout.right) {
            layout.right.height = subH
        }
    }
    if(divisions[2]) layout.bottom.height = subH
    if(layout.bottom) {
        layout.bottom.y = 0
        layout.bottom.width = size.width
    }
    if(layout.left) layout.left.y = layout.bottom ? layout.bottom.height : 0
    if(layout.right) layout.right.y = layout.bottom ? layout.bottom.height : 0
    if(layout.center) layout.center.y = layout.bottom ? layout.bottom.height : 0
    if(layout.top) {
        layout.top.y = size.height - layout.top.height
        layout.top.width = size.width
    }
}

var bing = new ImageScraper()

async function fetchImage(object) {
    return await (
        bing.list({
            keyword: object,
            num: 3
        })
        .then(async (res) => {
            let imageBytes = await fetch(res[0].url).then(bytes => bytes.arrayBuffer())
            let image
            if(res[0].format.toLowerCase() == 'png' && editablePdf) {
                image = editablePdf.embedPng(imageBytes)
            }
            else if(res[0].format.toLowerCase() == 'jpeg' || res[0].format.toLowerCase() == 'jpg' && editablePdf) {
                image = editablePdf.embedJpg(imageBytes)
            }
            return image
        })
        
    )
}

async function drawImageOf(object, x, y, width, height, scalar=1) {
    const image = await fetchImage(object)
    const imageDims = image.scale(Math.min(width / image.width * scalar, height / image.height * scalar))
    currentPage.drawImage(image, {
        x: Math.round(x + (width - imageDims.width) / 2),
        y: Math.round(y + (height - imageDims.height) / 2),
        width: Math.round(imageDims.width),
        height: Math.round(imageDims.height),
    })
    return
}

function drawTitle(text, fontSize, x, y, width, height) {
    currentPage.drawText(toTitleCase(text), {
        x: x + 70, y: y - 20,
        size: fontSize,
        font: customFont,
        color: rgb(0, 0, 0)
    })
}

function drawTextbox(lines, fontSize, x, y, width, height) {
    let maxWidth = Math.max(...lines.map(line => customFont.widthOfTextAtSize(line, fontSize)))
    let spacing = 10
    let offY = (customFont.heightAtSize(fontSize) + spacing)
    let totalHeight = offY * lines.length
    let ind = 0
    for(let line of lines.slice().reverse()) {
        currentPage.drawText(line, {
            x: x + (width - maxWidth)/2, y: y + offY*ind + (height - totalHeight)/2,
            size: fontSize,
            font: customFont,
            color: rgb(0, 0, 0)
        })
        ind++
    }
    
}

function drawBackColor() {
    let { width, height } = currentPage.getSize()
    let { r, g, b } = hexToRgb(backgroundColor)
    currentPage.drawRectangle({ x: 0, y: 0, width, height, color: rgb(r / 255, g / 255, b / 255) })
}

window.addEventListener('keydown', event => {
    if(event.key == ' ') {
        recording = !recording;
    }
})