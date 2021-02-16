import { Box, Button, makeStyles, Paper, Typography } from '@material-ui/core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import awayHeaderImg from './images/away_header_no_avatar.png';
import { PseudoUserBubble } from '../../room/people/PseudoUserBubble';
import { useRoomStore } from '../../../roomState/useRoomStore';
import { useIsAway } from './useIsAway';

export interface IAwayExplainerProps {}

const useStyles = makeStyles(() => ({
  userBubble: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
  },
}));

export const AwayExplainer: React.FC<IAwayExplainerProps> = (props) => {
  const { t } = useTranslation();
  const classes = useStyles();
  const [, set] = useIsAway();
  const userId = useRoomStore((room) => room.sessionLookup[room.sessionId || '']);

  return (
    <Box component={Paper} maxWidth={360} overflow="hidden" {...props}>
      <Box position="relative">
        <img
          style={{ maxHeight: 200, height: 'auto', width: '100%' }}
          alt={t('features.away.explainerImgAlt')}
          src={awayHeaderImg}
        />
        <PseudoUserBubble userId={userId} className={classes.userBubble} isAway />
      </Box>
      <Box p={4}>
        <Typography variant="h2" gutterBottom>
          {t('features.away.explainerTitle')}
        </Typography>
        <Typography paragraph>{t('features.away.explainerText')}</Typography>
        <Button onClick={() => set(false)}>{t('features.away.return')}</Button>
      </Box>
    </Box>
  );
};
