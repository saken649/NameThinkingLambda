#!/bin/bash

if [ -z "${CODIC_TOKEN}" ]; then
    echo -e "env 'CODIC_TOKEN' is required."
    exit 1
fi

IS_DEBUG=false
while getopts d OPT
do
    case $OPT in
        "d" ) IS_DEBUG=true ;;
    esac
done

if [ ${IS_DEBUG} = true ]; then
    echo -e ">>> Debug mode is enabled."
    sam local start-api \
        --debug-port 5858 \
        --parameter-overrides \
            ParameterKey=StageEnv,ParameterValue=local \
            && ParameterKey=CodicToken,ParameterValue=${CODIC_TOKEN}
else
    sam local start-api \
        --parameter-overrides \
            ParameterKey=StageEnv,ParameterValue=local \
            && ParameterKey=CodicToken,ParameterValue=${CODIC_TOKEN}
fi