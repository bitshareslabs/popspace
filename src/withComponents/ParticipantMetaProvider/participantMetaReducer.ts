import { Action } from '../RoomState/RoomStateProvider';
import { EmojiData as ED } from 'emoji-mart';

export type LocationTuple = [number, number];
export type EmojiData = ED | null | string;

export interface IParticipantMeta {
  location: LocationTuple;
  emoji: EmojiData;
  avatar: string;
  activeCameraId: string;
  activeMicId: string;
  activeSpeakersId: string; // TODO selecting active speakers output not implemented yet, but is the placeholder.
}

// The key is a participant's sid
export interface IParticipantMetaState {
  [key: string]: IParticipantMeta;
}

export enum Actions {
  UpdateLocation = 'UPDATE_LOCATION',
  UpdateEmoji = 'UPDATE_EMOJI',
  UpdateAvatar = 'UPDATE_AVATAR',
  UpdateActiveCamera = 'UPDATE_ACTIVE_CAMERA',
  UpdateActiveMic = 'UPDATE_ACTIVE_MIC',
  UpdateActiveSpeakers = 'UPDATE_ACTIVE_SPEAKERS',
}

export default function reducer(state: IParticipantMetaState = {}, action: Action) {
  const { type, payload } = action;

  switch (type) {
    case Actions.UpdateLocation: {
      const newPts = { ...state, [payload.sid]: { ...state[payload.sid], location: payload.location } };

      return newPts;
    }

    case Actions.UpdateEmoji: {
      const newPts = { ...state, [payload.sid]: { ...state[payload.sid], emoji: payload.emoji } };

      return newPts;
    }

    case Actions.UpdateAvatar: {
      const newPts = { ...state, [payload.sid]: { ...state[payload.sid], avatar: payload.avatar } };

      return newPts;
    }

    case Actions.UpdateActiveCamera: {
      const newPts = { ...state, [payload.sid]: { ...state[payload.sid], activeCameraId: payload.cameraId } };

      return newPts;
    }

    case Actions.UpdateActiveMic: {
      const newPts = { ...state, [payload.sid]: { ...state[payload.sid], activeMicId: payload.micId } };

      return newPts;
    }

    case Actions.UpdateActiveSpeakers: {
      const newPts = { ...state, [payload.sid]: { ...state[payload.sid], activeSpeakersId: payload.speakersId } };

      return newPts;
    }
  }

  return state;
}

export const locationUpdate = (sid: string, location: LocationTuple) => ({
  type: Actions.UpdateLocation,
  payload: { sid, location },
});

export const emojiUpdate = (sid: string, emoji: EmojiData) => ({
  type: Actions.UpdateEmoji,
  payload: { sid, emoji },
});

export const avatarUpdate = (sid: string, avatar: string) => ({
  type: Actions.UpdateAvatar,
  payload: { sid, avatar },
});

export const activeCameraUpdate = (sid: string, cameraId: string) => ({
  type: Actions.UpdateActiveCamera,
  payload: { sid, cameraId },
  meta: {
    local: true,
  },
});

export const activeMicUpdate = (sid: string, micId: string) => ({
  type: Actions.UpdateActiveMic,
  payload: { sid, micId },
  meta: {
    local: true,
  },
});

export const activeSpeakersUpdate = (sid: string, speakersId: string) => ({
  type: Actions.UpdateActiveSpeakers,
  payload: { sid, speakersId },
  meta: {
    local: true,
  },
});
