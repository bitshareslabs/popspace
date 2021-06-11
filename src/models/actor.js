class Actor {
  constructor(pgActor) {
    this._pgActor = pgActor
  }

  actorId() {
    return this._pgActor.id
  }

  displayName() {
    return this._pgActor.display_name
  }

  kind() {
    return this._pgActor.kind
  }

  async serialize() {
    return {
      actor_id: this.actorId(),
      display_name: this.displayName(),
      kind: this.kind(),
    }
  }
}

module.exports = Actor
