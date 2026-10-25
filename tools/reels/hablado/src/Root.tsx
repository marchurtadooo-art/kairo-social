import React from 'react';
import { Composition } from 'remotion';
import { Main } from './Main';
import { TOTAL } from './script';

export const Root: React.FC = () => (
  <Composition id="Hablado" component={Main} durationInFrames={TOTAL} fps={30} width={1080} height={1920} defaultProps={{ bgm: false }} />
);
