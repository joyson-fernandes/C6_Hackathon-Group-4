## import necessary libraries and set environment variables for OpenAI and LangSmith tracing

import os
from openai import OpenAI
from langsmith import wrappers, traceable

## Set environment variables for LangSmith tracing

os.environ["LANGSMITH_TRACING"]="true"
os.environ["LANGSMITH_ENDPOINT"]="https://api.smith.langchain.com"
os.environ["LANGSMITH_API_KEY"]=os.getenv("LANGSMITH_API_KEY", "")
os.environ["LANGSMITH_PROJECT"]="OpsGPT"

## Initialize the OpenAI client with the OpenRouter API

## below needs changes

client = wrappers.wrap_openai(OpenAI(
    base_url=os.environ["OPENROUTER_BASE_URL"],
    api_key=os.environ["OPENROUTER_API_KEY"]
))