const ws = require('ws');
let count = 0

class Client {
  constructor(serverUrl) {
    this.id = count++
    this.ready = false
    this.serverUrl = serverUrl
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.client = new ws(this.serverUrl)
      this.client.on('message', (message) => {
        log.dev.debug(`Received ${message}`)
      })
      this.client.on('open', () => {
        this.ready = true
        resolve(this)
      })
    })
  }

  authenticate(token) {
    this.sendEvent("auth", { token })
  }

  sendEvent(kind, payload) {
    this.send(JSON.stringify({
      kind: kind,
      payload: payload
    }))
  }

  send(message) {
    this.client.send(message)
  }

  disconnect() {
    this.client.close()
  }

  on(event, fn) {
    this.client.on(event, fn)
  }
}

module.exports = Client
