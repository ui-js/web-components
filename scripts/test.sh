#!/bin/bash

set -e  # exit immediately on error
set -o nounset   # abort on unbound variable
set -o pipefail  # don't hide errors within pipes
# set -x    # for debuging, trace what is being executed.

cd "$(dirname "$0")/.."

# Read the first argument, set it to "test" if not set
VARIANT="${1-test}"

export TEST="true"

if [ "$VARIANT" = "coverage" ]; then
    npx jest --coverage
elif [ "$VARIANT" = "snapshot" ]; then
#    DEBUG_MODE=1 npx jest  -u
    npx jest  -u
else
    npx jest src/
fi