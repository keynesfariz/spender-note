import { flag } from 'flags/next';

export const customParserFlag = flag({
  key: 'custom-parser',
  decide: () => process.env.ENABLE_CUSTOM_PARSER === 'true',
});
