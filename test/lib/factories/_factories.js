global.FactoryGirl = require("factory-girl");
global.factory = FactoryGirl.factory;


class MassiveJsAdapter {
  constructor() {
    if(process.env.NODE_ENV != 'test') {
      throw "Refusing to connect to non-test database"
    }
  }
  build(tableName, props) {
    return props
  }
  async save(props, tableName) {
    // https://massivejs.org/docs/options-objects#onconflict
    return shared.db.pg.massive[tableName].insert(props, {
      onConflict: {
        target: "id",
        action: "update"
      }
    })
  }
  async destroy(model, tableName) {
    return shared.db.pg.massive[tableName].destroy(model)
  }
  get(model, attr, tableName) {
    return model[attr]
  }
  set(props, model, tableName) {
    return Object.assign(model, props)
  }
}

factory.setAdapter(new MassiveJsAdapter());

require("./factory_user")
require("./factory_session")

module.exports = factory;
