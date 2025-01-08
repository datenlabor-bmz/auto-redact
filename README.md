[![stability-wip](https://img.shields.io/badge/stability-wip-lightgrey.svg)](https://github.com/mkenney/software-guides/blob/master/STABILITY-BADGES.md#work-in-progress)

> ⚠️ **DISCLAIMER**: This software is currently in development and not yet ready for production use. Use at your own risk and always verify redactions manually.

# ⬛️ AutoRedact

A tool for redacting sensitive information from PDF documents using AI assistance.

## Features

- Upload and view PDF documents
- Manual redaction by highlighting text
- AI-powered detection of sensitive information
- Export redacted PDFs

For a local-first version for the privacy-paranoid, see the [SecuRedact](https://github.com/davidpomerenke/securedact) fork.

## Setup

1. Create a `.env` file with your Azure OpenAI credentials:

```env
AZURE_OPENAI_API_KEY=your_key
AZURE_OPENAI_API_BASE=your_base_url
AZURE_OPENAI_API_VERSION=your_version
```

2. Build and run with Docker:

```bash
docker build -t autoredact .
docker run -p 8000:8000 --env-file .env --rm autoredact
```

Or run locally:

```bash
# Frontend
cd frontend
npm install
npm start

# Backend
cd backend
uv run python -muvicorn main:app --reload
```

## License

MIT License (c) BMZ Data Lab / David Pomerenke

The frontend is based on an example from [react-pdf-highlighter](https://github.com/agentcooper/react-pdf-highlighter/), MIT License.
