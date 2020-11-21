global.tlib = require("../../lib/_testlib")

module.exports = {
  "authenticate": tlib.TestTemplate.testServerClients(1, async (clients) => {
    const testEnvironment = new tlib.TestEnvironment()
    const { user, session, token, room } = await testEnvironment.createLoggedInUser()

    const beforeAuth = await clients[0].sendEventWithPromise("room/addWidget", {})
    const auth = await clients[0].authenticate(token, room.id)
    const afterAuth = await clients[0].sendEventWithPromise("room/addWidget", {})

    return {
      beforeAuth,
      afterAuth
    }
  }),

  "authenticate_fail": tlib.TestTemplate.testServerClients(1, async (clients) => {
    const testEnvironment = new tlib.TestEnvironment()
    const { user, session, token, room } = await testEnvironment.createLoggedInUser()
    const auth = await clients[0].authenticate("{}", "2")
    const afterAuth = await clients[0].sendEventWithPromise("room/addWidget", {})
    return {
      auth,
      afterAuth
    }
  }),

  "create_a_widget": tlib.TestTemplate.authenticatedUser(async (testEnvironment) => {
    const client = testEnvironment.loggedInUsers[0].client
    const response = await client.sendEventWithPromise("room/addWidget", {})
    return response
  })
}
