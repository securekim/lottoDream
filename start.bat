@echo off
echo "LIST OF SERVER PROCESSES" 
echo "pm2 home : C:\Users\secureKim\.pm2" 
::pm2 list&
pm2 stop nodeServer&
pm2 stop pythonServer&
ping 0.0.0.0 -n 2
pm2 start D:\workspace\lottoDream\index.js --name=nodeServer&
pm2 start D:\workspace\lottoDream\dreamAnalyzer\analyzer_dream_wikidocs.py --name=pythonServer --interpreter "C:\Program Files\WindowsApps\PythonSoftwareFoundation.Python.3.8_3.8.752.0_x64__qbz5n2kfra8p0\python3.8.exe" &
:: npm install pm2-windows-startup -g
:: pm2 save
:: pm2-startup install
