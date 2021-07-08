import * as React from 'react';
import { WidgetType } from '@api/roomState/types/widgets';
import { useWidgetContext } from '../useWidgetContext';
import { WidgetContent } from '../WidgetContent';
import { WidgetFrame } from '../WidgetFrame';
import { WidgetTitlebar } from '../WidgetTitlebar';
import { FileWidgetMenu } from './menu/FileWidgetMenu';
import { FileWidgetMedia } from './FileWidgetMedia';
import { ThemeName } from '@src/theme/theme';
import { SIZE_AUDIO_MEDIA } from './constants';

export const AudioFileWidget = () => {
  const {
    widget: { widgetState: data, widgetId },
  } = useWidgetContext<WidgetType.File>();

  return (
    <WidgetFrame
      color={ThemeName.Snow}
      minWidth={SIZE_AUDIO_MEDIA.width}
      minHeight={SIZE_AUDIO_MEDIA.height}
      maxWidth={SIZE_AUDIO_MEDIA.width}
      maxHeight={SIZE_AUDIO_MEDIA.height}
      resizeDisabled
    >
      <WidgetTitlebar title={data.fileName} disableRemove>
        <FileWidgetMenu />
      </WidgetTitlebar>
      <WidgetContent disablePadding>
        <FileWidgetMedia widgetId={widgetId} />
      </WidgetContent>
    </WidgetFrame>
  );
};
