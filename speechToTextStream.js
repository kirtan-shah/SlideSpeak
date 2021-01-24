const recorder = require('node-record-lpcm16')
const speech = require('@google-cloud/speech')
const client = new speech.SpeechClient()


const encoding = 'LINEAR16' //'Encoding of the audio file, e.g. LINEAR16'
const sampleRateHertz = 16000
const languageCode = 'en-US' //'BCP-47 language code, e.g. en-US'

const request = {
  config: {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
    enableAutomaticPunctuation: true
  },
  interimResults: true, // If you want interim results, set this to true
}

function startStream(onReceiveData) {
    console.log("started stream")
    // Create a recognize stream
    const recognizeStream = client
    .streamingRecognize(request)
    .on('error', console.error)
    .on('data', data => {
        // process.stdout.write(
        // data.results[0] && data.results[0].alternatives[0]
        //     ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
        //     : '\n\nReached transcription time limit, press Ctrl+C\n'
        // )
        const result = (data.results[0] && data.results[0].alternatives[0]) ? 
          data.results[0].alternatives[0].transcript : 'Time limit reached'
        onReceiveData({ result, isFinal: data.results[0].isFinal })
    })

    // Start recording and send the microphone input to the Speech API.
    // Ensure SoX is installed, see https://www.npmjs.com/package/node-record-lpcm16#dependencies
    recorder
    .record({
        sampleRateHertz: sampleRateHertz,
        threshold: 0,
        // Other options, see https://www.npmjs.com/package/node-record-lpcm16#options
        verbose: false,
        recordProgram: 'rec', // Try also "arecord" or "sox"
        silence: '10.0',
    })
    .stream()
    .on('error', console.error)
    .pipe(recognizeStream)

    console.log('Listening, press Ctrl+C to stop.')
}

module.exports = startStream