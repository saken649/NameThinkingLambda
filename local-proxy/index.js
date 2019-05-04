const express = require('express')
const app = express()
const axios = require('axios')
const parser = require('body-parser')
const proxy = axios.create({
    baseURL: 'http://localhost:3000'
})

/**
 * Allow CORS
 */
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin)
    res.header('Access-Control-Allow-Headers', 'access-control-allow-origin')
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Credentials', true)
    res.header('Access-Control-Max-Age', '86400')
    next()
})
app.options('*', (req, res) => {
    res.sendStatus(200)
})

app.use(parser.json())
app.use(parser.urlencoded({ extended: true }))

/**
 * ローカルデバッグ用プロキシ
 * 直接 SAM CLI のローカルエミュレーターに投げると、
 * 起動が遅くて Slack API がタイムアウトするので、間に噛ませる用
 */
app.post('/name_thinking', async (req, res) => {
    // タイムアウト対策
    res.status(200).send()
    try {
        const isSlack = false
        const query = isSlack ? '?from_slack=true' : ''
        const result = await proxy.post(`/name_thinking${query}`, req.body)
        console.log('OK')
        if (!isSlack) {
            console.log(result.data)
        }
    } catch (e) {
        console.log('ERROR!!!')
        console.log(e)
    }
})

app.listen(3001, () => console.log('Example app listening on port 3001!'))