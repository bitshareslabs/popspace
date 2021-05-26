import * as React from 'react';
import { makeStyles, Typography, useTheme } from '@material-ui/core';
import Publication from '@components/Publication/Publication';
import { useAvatar } from '@hooks/useAvatar/useAvatar';
import { SidecarStreamPreview } from './SidecarStreamPreview';
import { AudioIndicator } from '@components/AudioIndicator/AudioIndicator';
import { useSpeakingStates } from '@hooks/useSpeakingStates/useSpeakingStates';
import { MuteIconSmall } from '@components/icons/MuteIconSmall';
import { RoomUserStateShape } from '@roomState/useRoomStore';
import { Stream } from '../../../types/streams';
import { PersonBubbleFrame } from './PersonBubbleFrame';
import { PersonBubbleContent } from './PersonBubbleContent';
import { PersonBubbleBackground } from './PersonBubbleBackground';
import { PersonBubbleLabel } from './PersonBubbleLabel';
import { PersonBubbleVoiceIndicator } from './PersonBubbleVoiceIndicator';
import { PersonBubbleAvatar } from './PersonBubbleAvatar';
import { useCanvasObject } from '@providers/canvas/CanvasObject';
import { WidgetResizeHandle } from '../widgets/WidgetResizeHandle';
import { INITIAL_SIZE_VIDEO, SIZE_AVATAR } from './constants';
export interface IPersonBubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  isMe: boolean;
  person: RoomUserStateShape;
  mainStream: Stream | null;
  sidecarStreams: Stream[];
}

const useStyles = makeStyles((theme) => ({
  handle: {
    overflow: 'hidden',
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: theme.shape.borderRadius,
  },
  audio: {
    display: 'none',
  },
  screenSharePreviewContainer: {
    position: 'absolute',
    bottom: 48,
    transform: 'translateX(-50%)',
    zIndex: 1,
    minWidth: 24,
    maxWidth: 72,
    height: 40,
    overflow: 'visible',
  },
  screenSharePreview: {
    border: `2px solid ${theme.palette.background.paper}`,
    borderRadius: theme.shape.contentBorderRadius,
  },
  name: {
    fontSize: theme.typography.pxToRem(13),
    fontWeight: theme.typography.fontWeightMedium,
    textOverflow: 'ellipsis',
    margin: '0 auto',
    maxWidth: '70%',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  mutedIcon: {
    width: 16,
    height: 16,
    fontSize: theme.typography.pxToRem(16),
    color: theme.palette.brandColors.cherry.bold,
  },
  voiceWave: {
    width: 24,
    height: 24,
    position: 'relative',
    // tweak to visually align it with mute icon
    top: 7,
  },
  awayIcon: {
    width: 20,
    height: 20,
    position: 'relative',
    top: 4,
    fontSize: theme.typography.pxToRem(20),
    // TODO: better color palettes - this is blueberry vibrant
    color: '#65B2E2',
  },
}));

/**
 * Renders the 'bubble' which represents a user in the room with full interactivity.
 */
export const PersonBubble = React.forwardRef<HTMLDivElement, IPersonBubbleProps>(
  ({ isMe: isLocal, person, mainStream, sidecarStreams, ...rest }, ref) => {
    const classes = useStyles();
    const theme = useTheme();

    // some basic checks for how we should render media
    const isVideoOn = !!mainStream?.videoPublication;
    const isMicOn = !!mainStream?.audioPublication;
    const hasSidecars = !!sidecarStreams.length;

    // track speaking state for the Twilio participant represented by the main stream
    const mainStreamParticipantIdentity = mainStream?.participantIdentity;
    const isSpeaking = useSpeakingStates(
      React.useCallback(
        (store) => (mainStreamParticipantIdentity ? !!store.isSpeaking[mainStreamParticipantIdentity] : false),
        [mainStreamParticipantIdentity]
      )
    );

    // extract data from our With backend user
    const userId = person?.id;
    const displayIdentity = person?.participantState.displayName;
    const avatarName = person?.participantState.avatarName;

    // determine background color based on avatar
    const { backgroundColor } = useAvatar(avatarName) ?? { backgroundColor: theme.palette.grey[50] };

    // enforce widget sizing based on video status
    const { resize } = useCanvasObject();
    React.useEffect(() => {
      if (isVideoOn) {
        resize(INITIAL_SIZE_VIDEO, true);
      } else {
        resize(SIZE_AVATAR, true);
      }
    }, [resize, isVideoOn]);

    return (
      <PersonBubbleFrame {...rest} isVideoOn={isVideoOn} ref={ref} data-test-person={displayIdentity}>
        <PersonBubbleContent isVideoOn={isVideoOn}>
          {/* Still a typing issue with react-spring :( */}
          <PersonBubbleBackground isVideoOn={isVideoOn} backgroundColor={backgroundColor}>
            {mainStream?.videoPublication && (
              <Publication
                classNames={classes.video}
                publication={mainStream.videoPublication}
                isLocal={isLocal}
                objectId={userId}
                objectKind="user"
              />
            )}
          </PersonBubbleBackground>
          {!mainStream?.videoPublication && <PersonBubbleAvatar userId={userId} />}
          {mainStream?.audioPublication && (
            <Publication
              classNames={classes.audio}
              publication={mainStream?.audioPublication}
              isLocal={isLocal}
              objectId={userId}
              objectKind="user"
              disableAudio={isLocal}
            />
          )}
          <PersonBubbleLabel isVideoOn={isVideoOn}>
            <Typography className={classes.name}>{displayIdentity}</Typography>
          </PersonBubbleLabel>
          <PersonBubbleVoiceIndicator isVideoOn={isVideoOn}>
            {isMicOn ? (
              <AudioIndicator className={classes.voiceWave} isActive={isSpeaking} variant="sine" />
            ) : (
              <MuteIconSmall className={classes.mutedIcon} fontSize="inherit" />
            )}
          </PersonBubbleVoiceIndicator>
        </PersonBubbleContent>
        {hasSidecars && (
          <div className={classes.screenSharePreviewContainer}>
            {sidecarStreams.map((stream) => (
              <SidecarStreamPreview
                userId={userId}
                className={classes.screenSharePreview}
                stream={stream}
                key={stream.id}
              />
            ))}
          </div>
        )}
        {isLocal && isVideoOn && <WidgetResizeHandle />}
      </PersonBubbleFrame>
    );
  }
);
