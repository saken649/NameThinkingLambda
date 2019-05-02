const axios = require('axios')
const codic = axios.create({
    baseURL: 'https://api.codic.jp',
    headers: {
        'Authorization': `Bearer ${process.env.CODIC_TOKEN}`
    }
})

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.lambdaHandler = async (event, context) => {
    try {
        const body = JSON.parse(event.body)
        const result = await exports.postCodic(body.word)
        const process = exports.processResults(result.words)

        return {
            statusCode: 200,
            body: JSON.stringify({
                text: body.word,
                translated_text: result.translated_text,
                words: process
            })
        }
    } catch (err) {
        console.log(err)
        return err
    }
}

exports.postCodic = async function (word) {
    try {
        const reqBody = {
            text: word,
            casing: 'lower underscore'
        }
        const result = await codic.post('/v1/engine/translate.json', reqBody)
        return result.data.shift()
    } catch (e) {
        throw e
    }
}

exports.processResults = function (results) {
    return results.map(result => {
        const candidates = result.successful
            ? result.candidates
                .filter(x => x.text !== null)
                .map(x => x.text)
                .toString()
                .replace(/\,/g, ', ')
            : '(no translated text)'
        return {
            text: result.text,
            translated_text: result.translated_text,
            candidates: candidates
        }
    })
}