shared.test.factory.define("room_membership", "room_memberships", (params) => {
  return {
    room_id: params.room_id || shared.test.factory.assoc('room', 'id'),
    actor_id: params.actor_id || shared.test.factory.assoc('actor', 'id'),
    began_at: shared.db.time.now(),
    expires_at: params.expires_at,
    revoked_at: params.revoked_at,
  }
})
