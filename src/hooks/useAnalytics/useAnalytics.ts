import { Analytics } from '@analytics/Analytics';
import { EventNames } from '@analytics/constants';
import client from '@api/client';

export enum IncludeData {
  roomId,
}

export function useAnalytics(include?: IncludeData[], defaultData?: { [key: string]: any }) {
  const includeData: { [key: string]: any } = {};
  debugger;

  include?.forEach((dataName) => {
    switch (dataName) {
      case IncludeData.roomId:
        includeData.roomId = client.roomId;
        break;
      default:
        break;
    }
  });

  const trackEvent = (eventName: EventNames, value?: any, eventProperties?: { [key: string]: any }) => {
    Analytics.trackEvent(eventName, value, { ...includeData, ...defaultData, ...eventProperties });
  };

  return { trackEvent };
}
