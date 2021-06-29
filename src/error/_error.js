const ERROR_CODES = {
  // General
  UNEXPECTED_ERROR: "UNEXPECTED_ERROR",
  INVALID_API_PARAMS:'INVALID_API_PARAMS',

  // Magic codes
  INVALID_CODE: "INVALID_CODE",
  EXPIRED_CODE: "EXPIRED_CODE",
  RESOLVED_CODE: "RESOLVED_CODE",
  REVOKED_CODE: "REVOKED_CODE",
  MAGIC_CODE_INVALID_ACTION: "MAGIC_CODE_INVALID_ACTION",

  // Dealing with room logic
  JOIN_ALREADY_MEMBER: 'JOIN_ALREADY_MEMBER',
  TOO_MANY_OWNED_ROOMS: "TOO_MANY_OWNED_ROOMS",
  ALREADY_INVITED: "ALREADY_INVITED",
  UNKNOWN_ROOM: "UNKNOWN_ROOM",
  INVALID_ROOM_CLAIM: "INVALID_ROOM_CLAIM",
  UNAUTHORIZED_ROOM_ACCESS: "UNAUTHORIZED_ROOM_ACCESS",
  ALREADY_CLAIMED: "ALREADY_CLAIMED",
  INCORRECT_ROOM_PASSCODE: 'INCORRECT_ROOM_PASSCODE',
  INVALID_USER_IDENTITY: 'INVALID_USER_IDENTITY',

  // Account logic
  ALREADY_REGISTERED: "ALREADY_REGISTERED",
  UNAUTHORIZED_USER: "UNAUTHORIZED_USER",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  ADMIN_ONLY_RESTRICTED: "ADMIN_ONLY_RESTRICTED",
  NO_SUCH_ACTOR: "NO_SUCH_ACTOR",
  SESSION_REQUIRED: "SESSION_REQUIRED",

  // generic errors
  NOT_FOUND: "NOT_FOUND",

  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  OPENGRAPH_NO_DATA: "NO_OPENGRAPH_DATA",
}

module.exports = {
  code: ERROR_CODES,
  report: async (error, tag, actorId, httpCode, noodleCode) => {
    if(log && log.error) {
      log.error.info(error)
    }
    return await shared.db.pg.massive.errors.insert({
      actor_id: actorId,
      stack: error.stack,
      message: error.message,
      tag: tag,
      http_code: httpCode,
      noodle_code: noodleCode
    })
  }
}
