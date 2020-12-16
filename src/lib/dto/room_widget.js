class RoomWidget {
  constructor(roomId, pgWidget, widgetState, roomState) {
    this._roomId = roomId
    this._pgWidget = pgWidget
    this._widgetState = widgetState
    this._roomState = roomState
  }

  widgetId() {
    return this._pgWidget.id
  }

  widgetState() {
    return this._widgetState
  }

  roomState() {
    return this._roomState
  }

  roomId() {
    return this._roomId
  }

  serialize() {
    return {
      widget_id: this._pgWidget.id,
      type: this._pgWidget._type,
      /*
        Perhaps there are better names here?
        e.g. data+transform, or contents+render
      */
      widget_state: this._widgetState,
      room_state: this._roomState
    }
  }
}

RoomWidget.fromWidgetId = async (widgetId, roomId) => {
  const pgWidgets = await shared.db.pg.massive.query(`
    SELECT id, _type from widgets where id = $1
  `, parseInt(widgetId))
  if(pgWidgets.length < 1) {
    return null
  }
  return await lib.roomData.dynamo.getRoomWidget(roomId, pgWidgets[0])
}

module.exports = RoomWidget
