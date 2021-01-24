pdfjsLib.GlobalWorkerOptions.workerSrc = './pdfjs-build/pdf.worker.js'
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib')
const fontkit = require('@pdf-lib/fontkit') 

// rendered pdf
var pdfDoc = null,
    pageNum = 1,
    pageRendering = false,
    pageNumPending = null,
    scale = 1,
    canvas = document.getElementById('pdf'),
    ctx = canvas.getContext('2d')

// editable pdf (pdf-lib)
var editablePdf = null,
    ogBytes = null,
    currentPage = null,
    timesRomanFont = null,
    customFont = null

/**
 * Get page info from document, resize canvas accordingly, and render page.
 * @param num Page number.
 */
function renderPage(num) {
  pageRendering = true
  // Using promise to fetch the page
  pdfDoc.getPage(num).then(function(page) {
    var viewport = page.getViewport({scale: scale})
    let scalar = Math.min(window.innerWidth / viewport.width * 0.9, window.innerHeight / viewport.height * 0.9)
    var scaledViewport = page.getViewport({scale: scalar})
    canvas.height = scaledViewport.height
    canvas.width = scaledViewport.width


    // Render PDF page into canvas context
    var renderContext = {
      canvasContext: ctx,
      viewport: scaledViewport
    }
    var renderTask = page.render(renderContext)

    // Wait for rendering to finish
    renderTask.promise.then(function() {
      pageRendering = false
      if (pageNumPending !== null) {
        // New page rendering is pending
        renderPage(pageNumPending)
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
        }
        pageNumPending = null
      }
    })
  })
}

/**
 * If another page rendering in progress, waits until the rendering is
 * finised. Otherwise, executes rendering immediately.
 */
function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num
  } else {
    renderPage(num)
  }
}

/**
 * Displays previous page.
 */
function onPrevPage() {
  if (pageNum <= 1) {
    return
  }
  pageNum--
  queueRenderPage(pageNum)
}

/**
 * Displays next page.
 */
function onNextPage() {
  if (pageNum >= pdfDoc.numPages) {
    return
  }
  pageNum++
  queueRenderPage(pageNum)
}
document.getElementById('next-slide').addEventListener('click', onNextPage)

async function createPdf() {
    const fontBytes = await fetch('./Roboto_Condensed/RobotoCondensed-Light.ttf').then(res => res.arrayBuffer())
    editablePdf = await PDFDocument.create()
    editablePdf.registerFontkit(fontkit)

    customFont = await editablePdf.embedFont(fontBytes)
    timesRomanFont = await editablePdf.embedFont(StandardFonts.TimesRoman)

    for(let i = 0; i < 10; i++) editablePdf.addPage([1600, 900])
    currentPage = editablePdf.getPage(0)
    // const { width, height } = currentPage.getSize()
    // const fontSize = 30
    // currentPage.drawText('Creating PDFs in JavaScript is awesome!', {
    //     x: 50,
    //     y: height - 4 * fontSize,
    //     size: fontSize,
    //     font: timesRomanFont,
    //     color: rgb(0, 0.53, 0.71),
    // })

    const pdfBytes = await editablePdf.save()
    ogBytes = pdfBytes
    return pdfBytes
}

createPdf().then(pdfBytes => {
    renderBytes(pdfBytes)
})

async function resetPdf() {
    editablePdf = await PDFDocument.load(ogBytes)
    currentPage = editablePdf.getPage(pageNum - 1)
    refreshPdf()
}

function refreshPdf() {
    return editablePdf.save().then(pdfBytes => renderBytes(pdfBytes))
}

function renderBytes(pdfBytes) {
    if (pdfDoc) {
        pdfDoc.destroy()
    }
    pdfjsLib.getDocument({data: pdfBytes}).promise.then(function(pdfDoc_) {
        pdfDoc = pdfDoc_
      
        // Initial/first page rendering
        queueRenderPage(pageNum)
    })
}

let start = 0
window.addEventListener('resize', function () {
    let mil = performance.now()
    console.log(mil, start)
    if(mil - start > 1000) {
        refreshPdf()
        start = mil
    }
})

 /*
pdfjsLib.getDocument('./SlideSpeak.pdf').promise.then(function(pdfDoc_) {
  pdfDoc = pdfDoc_

  // Initial/first page rendering
  renderPage(pageNum)
})*/