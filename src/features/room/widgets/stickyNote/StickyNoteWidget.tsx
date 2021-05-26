import { makeStyles, Typography } from '@material-ui/core';
import * as React from 'react';
import { WidgetFrame } from '../WidgetFrame';
import { WidgetTitlebar } from '../WidgetTitlebar';
import { EditStickyNoteWidgetForm } from './EditStickyNoteWidgetForm';
import { WidgetContent } from '../WidgetContent';
import { useTranslation } from 'react-i18next';
import { WidgetResizeHandle } from '../WidgetResizeHandle';
import { Markdown } from '@components/Markdown/Markdown';
import { WidgetScrollPane } from '../WidgetScrollPane';
import { WidgetType } from '@roomState/types/widgets';
import { useCurrentUserProfile } from '@hooks/api/useCurrentUserProfile';
import { WidgetAuthor } from '../WidgetAuthor';
import { useWidgetContext } from '../useWidgetContext';
import { WidgetTitlebarButton } from '../WidgetTitlebarButton';
import { EditIcon } from '@components/icons/EditIcon';
import { DoneIcon } from '@components/icons/DoneIcon';
import { ThemeName } from '../../../../theme/theme';
import { ColorPickerMenu } from './ColorPickerMenu';
import { Analytics } from '@analytics/Analytics';
import { EventNames } from '@analytics/constants';
import { useRoomStore } from '@roomState/useRoomStore';
import { MIN_SIZE, MAX_SIZE, INITIAL_SIZE } from './constants';

export interface IStickyNoteWidgetProps {}

const useStyles = makeStyles((theme) => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
  },
  scrollContainer: {
    flex: 1,
  },
  text: {
    whiteSpace: 'pre-wrap',
    '& pre': {
      overflowX: 'auto',
    },
  },
  author: {
    flex: '0 0 auto',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: theme.palette.grey[900],
  },
  typingPlaceholder: {
    color: theme.palette.grey[900],
    fontStyle: 'italic',
  },
}));

export const StickyNoteWidget: React.FC<IStickyNoteWidgetProps> = () => {
  const { t } = useTranslation();
  const roomId = useRoomStore((store) => store.id);

  const { widget: state, save } = useWidgetContext<WidgetType.StickyNote>();

  const { user } = useCurrentUserProfile();
  const localUserId = user?.id;

  const isOwnedByLocalUser = state.ownerId === localUserId;

  const [editing, setEditing] = React.useState(!state.widgetState.text && isOwnedByLocalUser);

  const startEditing = () => {
    setEditing(true);
  };

  const stopEditing = () => {
    setEditing(false);
  };

  const onColorPicked = (color: ThemeName) => {
    save({
      color,
    });
    Analytics.trackEvent(EventNames.CHANGE_WIDGET_COLOR, {
      color,
      widgetId: state.widgetId,
      type: state.type,
      roomId,
    });
  };

  return (
    <WidgetFrame
      color={state.widgetState.color ?? ThemeName.Mandarin}
      minWidth={MIN_SIZE.width}
      minHeight={editing ? INITIAL_SIZE.height : MIN_SIZE.height}
      maxWidth={MAX_SIZE.width}
      maxHeight={MAX_SIZE.height}
    >
      <WidgetTitlebar title={editing ? t('widgets.stickyNote.addWidgetTitle') : t('widgets.stickyNote.publishedTitle')}>
        <ColorPickerMenu setActiveColor={onColorPicked} activeColor={state.widgetState.color ?? ThemeName.Mandarin} />
        {isOwnedByLocalUser && !editing && (
          <WidgetTitlebarButton onClick={startEditing} aria-label={t('widgets.stickyNote.edit')}>
            <EditIcon />
          </WidgetTitlebarButton>
        )}
        {isOwnedByLocalUser && editing && (
          <WidgetTitlebarButton onClick={stopEditing} aria-label={t('widgets.stickyNote.save')}>
            <DoneIcon />
          </WidgetTitlebarButton>
        )}
      </WidgetTitlebar>
      <StickyNoteContent editing={editing} setEditing={setEditing} isOwnedByLocalUser={isOwnedByLocalUser} />
      <WidgetResizeHandle />
    </WidgetFrame>
  );
};

const StickyNoteContent: React.FC<{
  editing: boolean;
  setEditing: (val: boolean) => void;
  isOwnedByLocalUser: boolean;
}> = ({ editing, setEditing, isOwnedByLocalUser }) => {
  const classes = useStyles();
  const { t } = useTranslation();

  const { widget: state } = useWidgetContext<WidgetType.StickyNote>();

  const onCloseEditing = () => {
    setEditing(false);
  };

  const onDoubleClick = () => {
    if (isOwnedByLocalUser) {
      setEditing(true);
    }
  };

  if (editing) {
    return (
      <WidgetContent>
        <EditStickyNoteWidgetForm onClose={onCloseEditing} />
      </WidgetContent>
    );
  }

  return (
    <WidgetContent enableTextSelection>
      <WidgetScrollPane
        className={classes.scrollContainer}
        onDoubleClick={onDoubleClick}
        title={isOwnedByLocalUser ? (t('widgets.stickyNote.doubleClickEdit') as string) : undefined}
      >
        <Typography paragraph variant="body1" component="div" className={classes.text}>
          {state.widgetState.text ? (
            <Markdown>{state.widgetState.text}</Markdown>
          ) : isOwnedByLocalUser ? (
            <span className={classes.typingPlaceholder}>{t('widgets.stickyNote.doubleClickEdit')}</span>
          ) : (
            <span className={classes.typingPlaceholder}>
              <WidgetAuthor disableYou />
              {t('widgets.stickyNote.userIsTyping')}
            </span>
          )}
        </Typography>
      </WidgetScrollPane>
      <Typography variant="caption">
        {t('widgets.stickyNote.addedBy')}
        <WidgetAuthor />
      </Typography>
    </WidgetContent>
  );
};
