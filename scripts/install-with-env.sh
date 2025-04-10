#! /bin/bash
set -e
export $(grep -v '^#' .env.local | xargs)
npm install