import { NonPositionalArgumentParser, Read, completionResult, CompletionResult } from './argument-parser';
import { Result, success, error } from '../result';
import { formatOptions, formatOptionsHint } from '../help';
import { Token, matchesToken } from '../tokens';
import { nonPosArgSuggestions } from './flag';
import { multiNonpositional } from './multi-nonpositional';
import { Option, some, none } from '../option';
import { ReadArgument, DefaultValue } from './common';


export interface NonpositionalOptions {
  shortName?: string;
  longName?: string;
  description?: string;
  suggestCompletion?: (partialArg: string) => string[];
  metavar: string;
}

export interface Nonpositional<T> extends NonPositionalArgumentParser<T,Array<string | null>> { }

export function nonpositional(options: NonpositionalOptions): Nonpositional<string>;
export function nonpositional<T>(options: NonpositionalOptions & ReadArgument<T>): Nonpositional<T>;
export function nonpositional<D>(options: NonpositionalOptions & DefaultValue<D>): Nonpositional<string | D>;
export function nonpositional<T,D>(options: NonpositionalOptions & ReadArgument<T> & DefaultValue<D>): Nonpositional<T | D>;
export function nonpositional<T,D>(options: NonpositionalOptions & Partial<ReadArgument<T>> & Partial<DefaultValue<D>>): Nonpositional<T | D> {
  const {
    // I hate forcing types like this, but T defaults to string and D defaults to undefined (as per overloads),
    // but the actual function signature isn't aware of these type defaults
    // (suggestions for improvement are welcome)
    readArgument = (arg: string) => success((arg as any) as T),
    defaultValue: _ = (undefined as any) as D,
    ...multiOptions
  } = options;

  const defaultValue = options.hasOwnProperty('defaultValue') ? some((options.defaultValue as any) as D) : none();

  // A multiOptionalArgument parses the tokens in exactly the same way (into an array of arguments),
  // except optionalArgument is only interested in the first one (hence maxCount 0)
  const multiNonpos = multiNonpositional<T>({
    ...multiOptions,
    readArgument,
    maxCount: 1
  });

  const coerce = (stringArgs: Array<string | null>): Result<T | D> => {
    const result = multiNonpos.coerce(stringArgs);

    if (!result.success) {
      return result;
    }

    const argumentArray = result.value;

    if (argumentArray.length === 0) {
      if (defaultValue.some) {
        return success(defaultValue.value);
      } else {
        return error(`${formatOptions(shortName, longName)} is required`);
      }
    }

    return success(argumentArray[0]);
  };

  const suggestCompletion = (preceedingTokens: Token[], partialToken: string, currentState: Array<string | null>): CompletionResult => {
    if (currentState.some(arg => typeof arg === 'string')) {
      // The option has already been defined and given an argument, so don't provide suggestions
      return completionResult([]);
    }

    return multiNonpos.suggestCompletion(preceedingTokens, partialToken, currentState);
  };

  const { shortName, longName } = multiNonpos;
  const { metavar } = options;

  const shortHint = shortName !== null ? `-${shortName} ${metavar}` : `--${longName} ${metavar}`;

  return {
    ...multiNonpos,

    coerce,
    shortHint: defaultValue.some ? `[${shortHint}]` : shortHint,
    suggestCompletion
  };
}
