import { Token } from './tokens';
import { ArgumentParserGroup } from './parsers/argument-parser';
import { keysOf, values, zipObjects } from './utils';
import { Result, success, error } from './result';


export function initState<T,S extends {[K in keyof T]: any}>(argGroup: ArgumentParserGroup<T,S>): S {
  const result: Partial<S> = {};

  for (const key of keysOf(argGroup)) {
    result[key] = argGroup[key].initial;
  }

  return result as S;
}


export function coerceState<T,S extends {[K in keyof T]: any}>(state: S, argGroup: ArgumentParserGroup<T,S>): Result<T> {
  const result: Partial<T> = {};

  for (const key of keysOf(argGroup)) {
    const coerceResult = argGroup[key].coerce(state[key]);

    if (!coerceResult.success) {
      return coerceResult;
    }

    result[key] = coerceResult.value;
  }

  return success(result as T);
}


export function parseArgumentGroup<T,A extends {[K in keyof T]: any}>(state: A, tokens: Token[], argGroup: ArgumentParserGroup<T,A>): {finalState: A, newTokens: Token[]} {
  if (tokens.length === 0) {
    return {finalState: state, newTokens: tokens};
  }

  for (const key of keysOf(argGroup)) {
    const result = argGroup[key].read(state[key], tokens);

    if (result !== null) {
      const { newState, newTokens } = result;

      return parseArgumentGroup(Object.assign({}, state, {[key]: newState}), newTokens, argGroup);
    }
  }

  return {finalState: state, newTokens: tokens};
}


export function parse<T,A extends {[K in keyof T]: any}>(tokens: Token[], argGroup: ArgumentParserGroup<T,A>): Result<{args: T, tokens: Token[]}>  {
  const initialState = initState(argGroup);

  const { finalState, newTokens } = parseArgumentGroup(initialState, tokens, argGroup);

  const result = coerceState(finalState, argGroup);

  if (!result.success) {
    return result;
  }

  return success({
    args: result.value,
    tokens: newTokens
  });
}


export function suggestCompletion<T,A extends {[K in keyof T]: any}>(argGroup: ArgumentParserGroup<T,A>, preceedingTokens: Token[], partialToken: string): { newTokens: Token[], genSuggestions: () => string[] } {
  const { finalState, newTokens } = parseArgumentGroup(initState(argGroup), preceedingTokens, argGroup);

  return {
    newTokens,
    genSuggestions: () => {
      const suggestions = values(zipObjects(argGroup, finalState, (argParser, state) => ({argParser, state})))
        .map(({argParser, state}) => argParser.suggestCompletion(preceedingTokens, partialToken, state));

      const anyOverride = suggestions.some(({override}) => override);

      return (anyOverride ? suggestions.filter(({override}) => override) : suggestions)
        .reduce<string[]>((allSuggestions, {suggestions}) => allSuggestions.concat(suggestions), []);
    }
  };
}
