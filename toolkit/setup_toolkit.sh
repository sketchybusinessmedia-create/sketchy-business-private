# setup_toolkit.sh - run once per session from the toolkit folder (npm + pip packages; fonts, paper and music code are in the repo)
set -e
cd "$(dirname "$0")"
export NO_PROXY=localhost no_proxy=localhost npm_config_noproxy=localhost
[ -d node_modules/roughjs ] || npm install --silent --no-audit --no-fund
python3 -c "import soundfile, numpy, PIL" 2>/dev/null || pip install --break-system-packages -q soundfile numpy pillow
node -e "require('./engine'); console.log('engine loads')"
echo TOOLKIT_OK
