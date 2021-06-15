class AuthProcessor {
  async process(hermesEvent, participants) {
    switch(hermesEvent.kind()) {
      case "auth":
        return this.authenticate(hermesEvent, participants)
      default:
        return hermesEvent.senderParticipant().sendError(
          hermesEvent,
          lib.ErrorCodes.EVENT_TYPE_INVALID,
          `Unrecognized event type: ${hermesEvent.kind()}`
        )
    }
  }

  async authenticate(hermesEvent, participants) {
    const payload = hermesEvent.payload()
    const room = await shared.db.room.core.roomByRoute(payload.room_route)
    const sender = hermesEvent.senderParticipant()

    if(!room) {
      return sender.sendError(
        hermesEvent,
        shared.error.code.UNKNOWN_ROOM,
        `No such room`,
        {room_route: payload.room_route}
      )
    }

    const socketGroup = participants.getSocketGroup(room.id)
    if(socketGroup && socketGroup.hasExceededMaxParticipantsLimit()) {
      return sender.sendError(
        hermesEvent,
        lib.ErrorCodes.TOO_MANY_PARTICIPANTS,
        `The current participant limit has been exceeded.`,
        {limit: socketGroup.getMaxParticipants()}
      )
    }
    const success = await sender.authenticate(payload.token, payload.room_route)
    if(success) {
      /*
        TODO: it'd be nice to get rid of this participants reference.
        Some options:
        1. sender emits an event that participants listen on and handle room joining
        2. HermesEvent has the relevant socket group
        3. socket groups or participants available globally
      */
      await participants.joinRoom(sender)
      const authData = await this.getAuthData(hermesEvent)
      sender.sendResponse(hermesEvent, authData)
      sender.broadcastPeerEvent("participantJoined", sender.serialize())
    } else {
      return sender.sendError(
        hermesEvent,
        lib.ErrorCodes.AUTH_FAILED,
        "Invalid credentials"
      )
    }
  }

  async getAuthData(hermesEvent) {
    const roomData = new shared.models.RoomData(hermesEvent.room())
    const participant = hermesEvent.senderParticipant()

    const peers = participant.listPeersIncludingSelf()
    const serializedParticipants = peers.map((p) => (p.serialize()))
    return {
      roomData: (await roomData.serialize()),
      self: participant.serialize(),
      participants: serializedParticipants
    }
  }

}

module.exports = AuthProcessor
