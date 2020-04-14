echo "LIST OF SERVER PROCESSES" 
pm2 list
pm2 kill
pm2 start index.js --name=nodeServer
pm2 start dreamAnalyzer/analyzer_dream_wikidocs.py --name=pythonServer --interpreter /usr/bin/python3

