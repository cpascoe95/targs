import { Token } from '../tokens';
import { Result } from '../result';
import { entries } from '../utils';


type ReadResult<S> = {newState: S, newTokens: Token[]} | null;


/**
  * Takes the previous parsing state and the current list of tokens,
  * and returns `null` if the state is unchanged or returns the new state and tokens
  */
export type Read<S> = (state: S, tokens: Token[]) => ReadResult<S>;


export interface CompletionResult {
  override: boolean;
  suggestions: string[];
}


export function completionResult(suggestions: string[], override: boolean = false): CompletionResult {
  return {
    override,
    suggestions
  };
}

export type SuggestionCompleter<S> = (preceedingTokens: Token[], partialToken: string, currentState: S) => CompletionResult;


export interface ArgumentDocumentation {
  /**
   * The hint to show in the first line of help
   */
  shortHint: string;

  /**
   * The prefix to show before the description when printing help
   */
  hintPrefix: string;

  /**
   * The description of this argument
   */
  description: string;
}


export interface NonPositionalArgument {
  shortName: string | null;
  longName: string | null;
}


export interface TokenParser<T,S> {
  /**
   * The initial parsing state for this argument
   */
  initial: S;

  /**
   * Takes the previous parsing state and the current list of tokens,
   * and returns `null` if the state is unchanged or returns the new state and tokens
   */
  read: Read<S>;

  /**
   * Converts the final state into the value that gets used by the program
   */
  coerce: (state: S) => Result<T>;

  /**
   * Returns a list of autocomplete suggestions for a partial token
   */
  suggestCompletion: SuggestionCompleter<S>;
}

export type ArgumentParser<T,S> = TokenParser<T,S> & ArgumentDocumentation;
export type NonPositionalArgumentParser<T,S> = TokenParser<T,S> & ArgumentDocumentation & NonPositionalArgument;
