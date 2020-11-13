import * as React from 'react';
import {
  Button,
  Menu,
  makeStyles,
  Divider,
  MenuItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  IconButton,
  Box,
} from '@material-ui/core';
import { DropdownIcon } from '../../../components/icons/DropdownIcon';
import { InviteIcon } from '../../../components/icons/InviteIcon';
import { RoomWallpaperMenuItem } from './RoomWallpaperMenuItem';
import { ManageMembershipMenuItem } from './ManageMembershipMenuItem';
import { ChangelogMenuItem } from './ChangelogMenuItem';
import { useRoomName } from '../../../hooks/useRoomName/useRoomName';
import { FeedbackIcon } from '../../../components/icons/FeedbackIcon';
import { EmailIcon } from '../../../components/icons/EmailIcon';
import { useTranslation } from 'react-i18next';
import { Link } from '../../../components/Link/Link';
import { Links } from '../../../constants/Links';
import { USER_SUPPORT_EMAIL } from '../../../constants/User';
import { LeaveRoomMenuItem } from './LeaveRoomMenuItem';
import { UserSettingsMenuItem } from './UserSettingsMenuItem';
import { useCurrentUserProfile } from '../../../hooks/useCurrentUserProfile/useCurrentUserProfile';
import { useDispatch } from 'react-redux';
import { actions as controlsActions } from '../roomControlsSlice';

const useStyles = makeStyles((theme) => ({
  button: {
    height: 40,
  },
}));

export const RoomMenu = () => {
  const classes = useStyles();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const onClose = () => setAnchorEl(null);

  const roomName = useRoomName();
  const currentUserProfile = useCurrentUserProfile();

  const isRoomOwner = currentUserProfile?.rooms?.owned.some((room) => room.name === roomName);

  const openMembershipModal = () => {
    dispatch(controlsActions.setIsMembershipModalOpen({ isOpen: true }));
  };

  return (
    <Box display="flex" flexDirection="row" alignItems="center">
      {isRoomOwner && (
        <IconButton onClick={openMembershipModal}>
          <InviteIcon />
        </IconButton>
      )}
      <Button
        variant="text"
        endIcon={<DropdownIcon />}
        onClick={(ev) => setAnchorEl(ev.currentTarget)}
        color="inherit"
        className={classes.button}
      >
        {t('features.roomMenu.title')}
      </Button>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={onClose}>
        <UserSettingsMenuItem onClick={onClose}>{t('features.roomMenu.userSettings')}</UserSettingsMenuItem>
        <RoomWallpaperMenuItem onClick={onClose}>{t('features.roomMenu.roomWallpaper')}</RoomWallpaperMenuItem>
        <Divider />
        {isRoomOwner && (
          <div>
            {/* disabling sticky subheaders for now since we dont have the member list showing up in it */}
            <ListSubheader disableSticky={true}>{t('features.roomMenu.roomMembersTitle')}</ListSubheader>
            <ManageMembershipMenuItem onClick={onClose}>{t('features.roomMenu.addAndManage')}</ManageMembershipMenuItem>
            <Divider />
          </div>
        )}
        <Link to={Links.FEEDBACK} disableStyling>
          <MenuItem>
            <ListItemIcon>
              <FeedbackIcon />
            </ListItemIcon>
            <ListItemText primary={t('features.roomMenu.voteOnFeatures')} />
          </MenuItem>
        </Link>
        <Link to={`mailto:${USER_SUPPORT_EMAIL}`} disableStyling>
          <MenuItem>
            <ListItemIcon>
              <EmailIcon />
            </ListItemIcon>
            <ListItemText primary={t('features.roomMenu.contactUs')} />
          </MenuItem>
        </Link>
        <LeaveRoomMenuItem>{t('features.roomMenu.goToDashboard')}</LeaveRoomMenuItem>
        <Divider />
        <ChangelogMenuItem onClick={onClose}>{t('features.roomMenu.changelog')}</ChangelogMenuItem>
        <Link to={Links.TOS} disableStyling>
          <MenuItem dense>
            <ListItemText primary={t('header.tos')} />
          </MenuItem>
        </Link>
        <Link to={Links.PRIVACY_POLICY} disableStyling>
          <MenuItem dense>
            <ListItemText primary={t('header.privacyPolicy')} />
          </MenuItem>
        </Link>
      </Menu>
    </Box>
  );
};
