const { contextBridge, ipcRenderer } = require('electron');
const { Buffer } = require('buffer');

contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(event, ...args))
  },
  Buffer: Buffer,
  detectDevices: () => ipcRenderer.invoke('detect-devices'),
  runModel: (img, device) => ipcRenderer.invoke('run-model', img, device)
});