# NameThinking Lambda Version

https://github.com/saken649/NameThinking の AWS Lambda 版です。  
2019 年 5 月時点で、概ね同等の機能を有しています。 (ケース選択機能は未実装)  
追加機能として、クエリパラメータで Slack へ投稿せずレスポンスとして返す機能があります。

## NameThinking とは

※ https://github.com/saken649/NameThinking の README を参照。

- 変数名やメソッド名の命名に困った際に、[Codic](https://codic.jp/) の API を用いて、その候補を提示するアプリ。
- Slack の Slash コマンドから実行することを前提としています。
- 元々は Cloud Functions for Firebase で動かすことを前提に実装していました。

![command](https://user-images.githubusercontent.com/13757996/53863960-b7553a00-402e-11e9-9374-0c319376c479.png)

↓↓↓

![result](https://user-images.githubusercontent.com/13757996/53863980-c4722900-402e-11e9-8459-6b2cafdb30ff.png)

## NameThinking API

RESTful API モードを搭載。  

### Endpoint

(POST) `/name_thinking`

※ query として `?from_slack=true` を渡すと、Slack モードになります。

### RequestBody

```json
{
    "text": "ユーザーを取得する"
}
```

### ResponseBody

```json
{
    "original_text": "ユーザーを取得する",
    "translated_text": "get_user",
    "candidates": [
        {
            "text": "取得する",
            "translated_text": "get",
            "candidates": "*get* , retrieve, fetch, obtain, acquire, getting"
        },
        {
            "text": "ユーザー",
            "translated_text": "user",
            "candidates": "*user*"
        },
        {
            "text": "を",
            "translated_text": null,
            "candidates": "that, to, for, from, is, of"
        }
    ]
}
```

## Lambda 版での違い

元の NameThinking との違いは以下の通りです。

- ケース選択 (camelCase か、UpperCase か、kebab-case か etc...) が未実装。
    - lower_snake_case で固定になっています。
- RESTful API モードを追加実装。

## Requirements

- AWS CLI が設定済みであること
- [Node.js 8.10+](https://nodejs.org/ja/)
- [Docker](https://www.docker.com/community-edition)
- [direnv](https://github.com/direnv/direnv) (optional)
    - あると便利。

## Setup

### npm packages

```bash
$ cd name-thinking
$ npm install
```

### AWS S3

デプロイ時に必要となるため、予め作成。

```bash
$ aws s3 mb s3://{YOUR S3 BUCKET}
```

### Env

`.envrc.template` と `env.json.template` に、予め必要な値を設定した上で実行してください。

```bash
$ cat .envrc.template > .envrc
$ direnv allow .
$ cat env.json.template > env.json
```

direnv を使用しない場合、 `.envrc.template` に記載の 4 つの環境変数を、予めセットしておいてください。  
その場合でも、 `env.json` のセットアップは忘れずに実施してください。

### Local environment
 
**ローカル実行環境の起動**

```bash
$ sh start_local_api.sh
```

**デバッガーを有効化して実行したい場合**

```bash
$ sh start_local_api.sh -d
```

実行後は `http://localhost:3000/name_thinking` で実行可。  
Slack モードをローカルで動かす場合は、 `http://localhost:3000/name_thinking?from_slack=true` で実行してください。

#### 制約

- ローカルで Slack モードを実行した場合、Slack API は必ずタイムアウトします。
    - SAM CLI のローカルエミュレーターの起動が遅いため、起動中にタイムアウト時間が経過してしまいます。
    - ただし、[response_url](https://api.slack.com/slash-commands#responding_response_url) に対して POST を行う仕様のため、タイムアウト後でも、POST 自体は行なえます。

## ユニットテスト

[mocha](https://mochajs.org/) によるユニットテストを実装しています。

```bash
$ cd name-thinking
$ npm run test
```

**デバッガーを有効化しながらユニットテストを行う場合**

```bash
$ npm run test-d
```

## デプロイ

SAM CLI (CloudFormation) による自動デプロイを行えます。  
`.envrc.template` 記載の 4 つの環境変数に依存します。

- `$CODIC_TOKEN`
    - Codic の API トークンを指定します。
    - 予め、Codic のアカウントを取得し、トークンを取得してください。
- `$S3_BUCKET`
    - デプロイする資材を置くためのバケット名。
- `$STAGE_ENV`
    - dev, stg, prod といったステージ別のデプロイを行うことが出来ます。
    - また、URL にも反映されます。
    - e.g. `/dev/name_thinking`
- `$STACK_NAME`
    - CloudFormation の Stack 名。
    - 実際反映される Stack 名は、`$STAGE_ENV` を接頭辞 (ハイフン繋ぎ) にした名前となります。
    - e.g. `dev-name_thinking`

Lambda 関数だけでなく、API Gateway, IAM Role といった関連するサービスの設定も行われます。

### デプロイ用コマンド

```bash
$ sh deploy.sh
```

### アプリケーション削除

CloudFormation のコマンドで削除可能です。

```bash
aws cloudformation delete-stack --stack-name {YOUR CFN STACK NAME}
```

## Slack との連携

Slack Bot User を作成の上、Slash Commands を設定してください。  
`Request URL` の設定時には、URLの末尾を `?from_slack=true` として、Slack モードにするのを忘れないでください。

**Let's NameThinking!**