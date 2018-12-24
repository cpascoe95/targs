import { ArgumentParser, Read } from './argument-parser';
import { matchesToken } from '../tokens';
import { formatOptions, formatOptionsHint } from '../formatting';
import { Result, success, error } from '../result';


export interface FlagOptions {
  shortName?: string;
  longName?: string;
  defaultValue?: boolean;
  description?: string;
}


export interface Flag extends ArgumentParser<boolean,number> { }


export function flag(options: FlagOptions): Flag {
  const {
    shortName = null,
    longName = null,
    defaultValue = false,
    description = ''
  } = options;

  if (shortName === null && longName === null) {
    throw new Error('At least one of shortName or longName must be defined');
  }

  const read: Read<number> = (count, tokens) => {
    if (tokens.length > 0) {
      const head = tokens[0];

      if (matchesToken(head, shortName, longName)) {
        return {newValue: count + 1, newTokens: tokens.slice(1)};
      }
    }

    return null;
  };

  const coerce = (count: number): Result<boolean> => {
    if (count === 0) {
      return success(defaultValue);
    }

    if (count === 1) {
      return success(!defaultValue);
    }

    return error(`Can't set ${formatOptions(shortName, longName)} flag more than once`);
  }

  return {
    initial: 0,
    read,
    coerce,

    hintPrefix: formatOptionsHint(shortName, longName),
    description
  };
}
