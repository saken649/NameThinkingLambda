'use strict'

const fs = require('fs')
const app = require('../../app.js')
const chai = require('chai')
const sinon = require('sinon')
const MockAdaptor = require('axios-mock-adapter')
const assert = chai.assert

/***** 下準備 *****/

// Stub Event =====>>>>>
// RESTful API のスタブ
const _e = fs.readFileSync(`${__dirname}/../../../mocks/event.json`, 'utf8')
const stubApiEvent = JSON.parse(_e)

// Slack Slash Commands のスタブ
const stubSlackEvent = {
    body: 'token=dummytoken&team_id=dummyteam&team_domain=dummydomain&channel_id=dummychannel&channel_name=dummychannel&user_id=dummyuser&user_name=dummyuser&command=%2Fdummycommand&text=%E3%83%A6%E3%83%BC%E3%82%B6%E3%83%BC%E3%82%92%E5%8F%96%E5%BE%97%E3%81%99%E3%82%8B&response_url=http%3A%2F%2Fexample.com&trigger_id=dummytrigger',
    queryStringParameters: { from_slack: true }
}

// callback
class Callback {
    constructor() {
        this.result = {}
    }
    setResult(result) {
        this.result = result
    }
    getResult() {
        return this.result
    }
}

// Mock API Response =====>>>>>
// Codic API のモック
const _mR = fs.readFileSync(`${__dirname}/../../../mocks/response.json`, 'utf8')
const mockCodicApiResponse = JSON.parse(_mR)

const _mER = fs.readFileSync(`${__dirname}/../../../mocks/error_response.json`, 'utf8')
const mockCodicErrorResponse = JSON.parse(_mER)

// Slack API のモック
const mockSlackResponse = {
    status: 200,
    statusText: 'OK'
}
const mockSlackErrorResponse = {
    status: 500,
    statusText: 'woops'
}

// モックで本体の axios を上書き (参照だけ渡して上書き) =====>>>>>
const mockCodic = new MockAdaptor(app.codic)
const mockSlack = new MockAdaptor(app.slack)

/***** 下準備ここまで *****/

/***** ユニットテスト本体 *****/

describe('Name Thinking Unit Test', () => [
    beforeEach (() => {
        console.log('beforeEach(): sinon is reset....')
        sinon.resetHistory()
        sinon.restore()
    }),

    it ('#1: 正常系/Slack API Mode.', async () => {
        // 成功ケースを想定
        mockCodic.onPost('/v1/engine/translate.json').reply(200, [mockCodicApiResponse])
        mockSlack.onPost('http://example.com').reply(200, mockSlackResponse)

        // 呼び出し回数をカウント用 spy
        const spyCodic = sinon.spy(app, 'postCodic')
        const spySlack = sinon.spy(app, 'postSlack')

        const Clb = new Callback()
        const clb = (err, res) => {
            const result = err ? err : res
            Clb.setResult(result)
        }
        // Slack 用イベントで呼び出し
        await app.lambdaHandler(stubSlackEvent, null, clb)
        const result = Clb.getResult()
        const resBody = JSON.parse(result.body)

        /*** assert ***/

        // ステータスが 200 であること
        assert.equal(result.statusCode, 200)

        // text がタイムアウト対策の文言であること
        assert.equal(resBody.text, 'NameThinking App is processing now...')

        // Codic と Slack の API が 1 回づつ呼ばれていること
        assert.equal(1, spyCodic.callCount)
        assert.equal(1, spySlack.callCount)
    }),

    it ('#2: 正常系/RESTful API Mode.', async () => {
        // 成功ケースを想定
        mockCodic.onPost('/v1/engine/translate.json').reply(200, [mockCodicApiResponse])
        mockSlack.onPost('http://example.com').reply(200, mockSlackResponse)

        // 呼び出し回数をカウント用 spy
        const spyCodic = sinon.spy(app, 'postCodic')
        const spySlack = sinon.spy(app, 'postSlack')

        // API 用イベントで呼び出し
        const result = await app.lambdaHandler(stubApiEvent, null)
        const resBody = JSON.parse(result.body)

        /*** assert ***/

        // ステータスが 200 であること
        assert.equal(result.statusCode, 200)

        // リクエストボディと original_text が一致すること
        const reqBody = JSON.parse(stubApiEvent.body)
        assert.equal(resBody.original_text, reqBody.text)

        // candidates: no translated でなく、", " 区切りで単語を区切れているか
        assert.equal(resBody.candidates[0].candidates, "*get* , retrieve, fetch, obtain, acquire, getting")

        // Codic API = 1 回、Slack API = 0回 
        assert.equal(1, spyCodic.callCount)
        assert.equal(0, spySlack.callCount)
    })

    // it ('#2: 異常系: 適切に throw がされているか', async () => {
    //     // エラーレスポンスが返ってきたのを想定
    //     mockCodic.onPost('/v1/engine/translate.json').reply(500, [mockErrorResponse])

    //     const result = await app.lambdaHandler(event, null)
    //     const resBody = result.data[0].errors[0]
        
    //     /*** assert ***/
    //     assert.equal(result.status, 500)
    //     assert.equal(resBody.code, 500)
    // })
])
