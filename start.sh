echo "LIST OF SERVER PROCESSES" 
/usr/bin/pm2 list
#pm2 kill
/usr/bin/pm2 stop nodeServer
/usr/bin/pm2 stop pythonServer
/usr/bin/pm2 start ~/lottoDream/index.js --name=nodeServer
/usr/bin/pm2 start ~/lottoDream/dreamAnalyzer/analyzer_dream_wikidocs.py --name=pythonServer --interpreter /usr/bin/python3

