#!/bin/bash

if [ -z "${CODIC_TOKEN}" ]; then
    echo -e "env 'CODIC_TOKEN' is required."
    exit 1
fi

sam local start-api \
    --env-vars env.json \
    --parameter-overrides \
        ParameterKey=StageEnv,ParameterValue=local \
        && ParameterKey=CodicToken,ParameterValue=${CODIC_TOKEN}