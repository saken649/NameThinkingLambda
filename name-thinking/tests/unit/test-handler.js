'use strict'

const fs = require('fs')
const app = require('../../app.js')
const chai = require('chai')
const MockAdaptor = require('axios-mock-adapter')
const assert = chai.assert

/***** 下準備 *****/

// Stub Event
const _e = fs.readFileSync(`${__dirname}/../../../mocks/event.json`, 'utf8')
const event = JSON.parse(_e)

// Mock API Response
const _mR = fs.readFileSync(`${__dirname}/../../../mocks/response.json`, 'utf8')
const mockResponse = JSON.parse(_mR)
const _mER = fs.readFileSync(`${__dirname}/../../../mocks/error_response.json`, 'utf8')
const mockErrorResponse = JSON.parse(_mER)

// モックで本体の axios を上書き (参照だけ渡して上書き)
const mockCodic = new MockAdaptor(app.codic)

/***** 下準備ここまで *****/

/***** ユニットテスト本体 *****/

describe('Name Thinking Unit Test', () => [
    it ('#1: 正常系', async () => {
        // 成功ケースを想定
        mockCodic.onPost('/v1/engine/translate.json').reply(200, [mockResponse])

        const result = await app.lambdaHandler(event, null)
        const resBody = JSON.parse(result.body)

        /*** assert ***/

        // ステータスが 200 であること
        assert.equal(result.statusCode, 200)

        // リクエストボディと original_text が一致すること
        const reqBody = JSON.parse(event.body)
        assert.equal(resBody.original_text, reqBody.word)
    }),

    it ('#2: 異常系: 適切に throw がされているか', async () => {
        // エラーレスポンスが返ってきたのを想定
        mockCodic.onPost('/v1/engine/translate.json').reply(500, [mockErrorResponse])

        const result = await app.lambdaHandler(event, null)
        const resBody = result.data[0].errors[0]
        
        /*** assert ***/
        assert.equal(result.status, 500)
        assert.equal(resBody.code, 500)
    })
])
