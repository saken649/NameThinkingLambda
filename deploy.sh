#!/bin/bash

if [ -z "${CODIC_TOKEN}" ]; then
    echo -e "env 'CODIC_TOKEN' is required."
    exit 1
fi
if [ -z "${S3_BUCKET}" ]; then
    echo -e "env 'S3_BUCKET' is required."
    exit 1
fi
if [ -z "${STACK_NAME}" ]; then
    echo -e "env 'STACK_NAME' is required."
    exit 1
fi
if [ -z "${STAGE_ENV}" ]; then
    echo -e "env 'STAGE_ENV' is required."
    exit 1
fi

sam package \
    --template-file template.yaml \
    --s3-bucket ${S3_BUCKET} \
    --output-template-file package.yaml

sam deploy \
    --template-file package.yaml \
    --stack-name ${STAGE_ENV}-${STACK_NAME} \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides \
        StageEnv=${STAGE_ENV} \
        CodicToken=${CODIC_TOKEN}