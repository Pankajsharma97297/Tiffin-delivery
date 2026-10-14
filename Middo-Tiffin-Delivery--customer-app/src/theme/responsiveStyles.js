import {
  Dimensions,
  PixelRatio,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';

const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
const MIN_SCALE = 0.72;
const MAX_SCALE = 1.08;
const MIN_FONT_SCALE = 0.82;
const MAX_FONT_SCALE = 1.04;

const scalableStyleKeys = new Set([
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginHorizontal',
  'marginVertical',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'paddingHorizontal',
  'paddingVertical',
  'top',
  'right',
  'bottom',
  'left',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'gap',
  'rowGap',
  'columnGap',
  'fontSize',
  'lineHeight',
  'letterSpacing',
]);

const originalCreate = StyleSheet.create.bind(StyleSheet);
const { width: windowWidth = BASE_WIDTH, height: windowHeight = BASE_HEIGHT } =
  Dimensions.get('window');
const heightAwareScale = Math.min(
  windowWidth / BASE_WIDTH,
  windowHeight / BASE_HEIGHT,
);
const sizeScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, heightAwareScale));
const fontScale = Math.min(
  MAX_FONT_SCALE,
  Math.max(MIN_FONT_SCALE, heightAwareScale),
);

function roundToPixel(value) {
  return PixelRatio.roundToNearestPixel(value);
}

function scaleNumber(key, value) {
  if (!value || !Number.isFinite(value)) {
    return value;
  }

  const scale =
    key === 'fontSize' || key === 'lineHeight' ? fontScale : sizeScale;
  return roundToPixel(value * scale);
}

function scaleStyleValue(key, value) {
  if (typeof value === 'number' && scalableStyleKeys.has(key)) {
    return scaleNumber(key, value);
  }

  if (Array.isArray(value)) {
    return value.map(item => scaleStyleObject(item));
  }

  if (value && typeof value === 'object') {
    return scaleStyleObject(value);
  }

  return value;
}

function scaleStyleObject(style) {
  if (!style || typeof style !== 'object') {
    return style;
  }

  return Object.fromEntries(
    Object.entries(style).map(([key, value]) => [
      key,
      scaleStyleValue(key, value),
    ]),
  );
}

StyleSheet.create = styles =>
  originalCreate(
    Object.fromEntries(
      Object.entries(styles).map(([key, value]) => [
        key,
        scaleStyleObject(value),
      ]),
    ),
  );

const textDefaults = Text.defaultProps || {};
Text.defaultProps = {
  ...textDefaults,
  maxFontSizeMultiplier: textDefaults.maxFontSizeMultiplier || 1.12,
};

const textInputDefaults = TextInput.defaultProps || {};
TextInput.defaultProps = {
  ...textInputDefaults,
  maxFontSizeMultiplier: textInputDefaults.maxFontSizeMultiplier || 1.12,
};
