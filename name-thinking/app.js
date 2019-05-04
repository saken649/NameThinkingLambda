const axios = require('axios')
exports.codic = axios.create({
    baseURL: 'https://api.codic.jp',
    headers: {
        'Authorization': `Bearer ${process.env.CODIC_TOKEN}`
    }
})
exports.slack = axios.create()

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
exports.lambdaHandler = async (event, context, callback) => {
    try {
        const [ body, isSlack ] = getBodyAndIsSlack(event)

        // Slack からの場合は、Slack API タイムアウト対策のため、まずレスポンス返しておく
        if (isSlack) {
            callback(null, {
                statusCode: 200,
                body: JSON.stringify({ text: 'NameThinking App is processing now...' })
            })
        }

        // レスポンス返したら、あとは裏で Slack に投げる処理を続行する
        const resultCodic = await exports.postCodic(body.text)
        const candidates = exports.processResults(resultCodic.words)

        if (isSlack) {
            const reqBodyForSlack = exports.processReqBodyForSlack(candidates, body, resultCodic)
            await exports.postSlack(reqBodyForSlack, body.response_url)
        } else {
            // Slack からでないので、普通の RESTful API として扱う
            return {
                statusCode: 200,
                body: JSON.stringify({
                    original_text: body.text,
                    translated_text: resultCodic.translated_text,
                    candidates: candidates
                })
            }
        }
    } catch (err) {
        const e = err.response !== undefined ? err.undefined : err
        console.log(e)
        if (!isSlack) {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: e
                })
            }
        }
    }
}

function getBodyAndIsSlack(event) {
    const body = JSON.parse(event.body)

    const _q = event.queryStringParameters
    const fromSlack = _q !== null && 'from_slack' in _q ? _q.from_slack : false
    const isSlack = fromSlack && 'response_url' in body ? true : false

    const log = isSlack ? 'Slack API Mode.' : 'RESTful API Mode.'
    console.log(log)

    return [body, isSlack]
}

exports.postCodic = async function (text) {
    try {
        const reqBody = {
            text: text,
            casing: 'lower underscore'
        }
        const result = await exports.codic.post('/v1/engine/translate.json', reqBody)
        return result.data.shift()
    } catch (e) {
        throw e
    }
}

exports.processResults = function (results) {
    return results.map(result => {
        const candidates = result.successful
            // successful = true は Codic 側で翻訳が出来た場合。整形して、カンマ区切りで返せるようにする
            ? result.candidates
                .filter(x => x.text !== null)
                .map(x => {
                    if (x.text === result.translated_text) {
                        return `*${x.text}* `
                    } else {
                        return x.text
                    }
                })
                .toString()
                .replace(/\,/g, ', ')
                .replace(/\s$/, '')
            // successful = false は Codic 側で翻訳が出来なかった場合
            : '(no translated text)'
        return {
            text: result.text,
            translated_text: result.translated_text,
            candidates: candidates
        }
    })
}

exports.processReqBodyForSlack = function (processed, reqBody, resultCodic) {
    return {
        response_type: 'in_channel',
        text: `「${reqBody.text}」の命名候補`,
        attachments: [
            {
                // 最有力候補を強調して表示
                color: '#36a64f',
                fields: [{
                    value: resultCodic.translated_text
                }]
            },
            {
                // その他の候補を表示
                fields: processed.map(word => {
                    return {
                        title: word.text,
                        value: word.candidates
                    }
                }),
                footer: `by ${reqBody.user_name}`
            }
        ]
    }
}

exports.postSlack = async function (body, url) {
    return await exports.slack.post(url, body)
}